import { streamObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { gemini } from '@/lib/ai/gemini';
import { prisma } from '@/lib/prisma';

const searchCriteriaSchema = z.object({
  keywords: z.array(z.string()).max(5).optional().describe("An array of up to 5 relevant keywords extracted from the query, including job titles, technologies, and concepts. e.g., ['React', 'frontend', 'engineer']."),
  skills: z.array(z.string()).max(5).optional().describe("A list of up to 5 specific skills to filter by, extracted from the query and matched against the available skills list."),
  location: z.string().optional().describe("A string representing the desired job location (e.g., 'New York, NY')."),
  experienceLevels: z.array(z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"])).optional().describe("A list of experience levels to filter by. Map terms like '5+ years' or 'senior' to these."),
  employmentTypes: z.array(z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"])).optional().describe("A list of employment types to filter by."),
  minSalary: z.number().optional().describe("The minimum desired salary."),
  maxSalary: z.number().optional().describe("The maximum desired salary."),
  remotePreference: z.array(z.enum(["REMOTE", "ONSITE", "HYBRID"])).optional().describe("Job's work location preference."),
}).describe("The structured search criteria extracted from the user's query for jobs.");

const systemInstruction = `You are an expert job search assistant. Your task is to analyze a user's natural language query and convert it into a structured JSON object for a database search. You must search through the job title, description, requirements, and benefits.

1.  **Analyze the user's query**: Identify key concepts, job titles, technologies, locations, experience levels, and employment types.
2.  **Expand Keywords**: For the 'keywords' field, break down the query into individual, meaningful terms. For example, if the user searches for "senior software engineer", you should generate keywords like ["senior", "software", "engineer", "developer", "backend", "frontend"]. This ensures a wider net is cast across multiple fields like title and description.
3.  **Extract Structured Data**: Populate other fields like \`skills\`, \`location\`, \`experienceLevels\`, etc., if they are explicitly mentioned.
    - For the \`skills\` array, only include terms that are an exact match from the available skills list.
    - Also, infer skills from the job title, description, and requirements. For example, a "React Native developer" query implies the "React Native" skill.
    - For \`experienceLevels\`, map terms like "5+ years" or "lead" to the appropriate enum values.
4.  **Constraints**: Limit the 'keywords' and 'skills' arrays to a maximum of 5 items each.
5.  **Return ONLY JSON**: Your final output must be only a valid JSON object with no extra text or explanations.

Analyze the user's query and return ONLY a valid JSON object with the extracted fields. If a field is not mentioned, omit it from the JSON.

Example Query: "Find me a senior React developer in Nairobi for a full-time role"
Example JSON Output:
{
  "keywords": ["senior", "React", "developer", "frontend", "software engineer"],
  "location": "Nairobi",
  "experienceLevels": ["SENIOR"],
  "employmentTypes": ["FULL_TIME"]
}

Example Query: "part-time data science internships in SF"
Example JSON Output:
{
  "keywords": ["data science", "data scientist", "intern", "internship", "machine learning"],
  "location": "SF",
  "employmentTypes": ["INTERNSHIP"]
}`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ message: 'Search query is required' }, { status: 400 });
  }

  try {
    const { partialObjectStream } = await streamObject({
      model: gemini,
      schema: searchCriteriaSchema,
      prompt: query,
      system: systemInstruction,
    });

    let searchCriteria: z.infer<typeof searchCriteriaSchema> = {};

    // Iterate through the stream to get the final object
    for await (const partialObject of partialObjectStream) {
      searchCriteria = partialObject as z.infer<typeof searchCriteriaSchema>;
    }

    const where: any = {
      status: 'ACTIVE',
      AND: [],
    };

    // Ensure we only get jobs that are not past their deadline
    where.AND.push({
      OR: [
        { applicationDeadline: { gte: new Date() } },
        { applicationDeadline: null },
      ],
    });

    if (searchCriteria.skills && searchCriteria.skills.length > 0) {
      const skillConditions = searchCriteria.skills.map(skill => ({
        skills: {
          some: {
            skill: { name: { contains: skill, mode: 'insensitive' } }
          }
        }
      }));
      where.AND.push(...skillConditions);
    }

    if (searchCriteria.keywords && searchCriteria.keywords.length > 0) {
      where.AND.push({
        OR: searchCriteria.keywords.map((keyword: string) => ({
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { requirements: { contains: keyword, mode: 'insensitive' } },
            { skills: { some: { skill: { name: { contains: keyword, mode: 'insensitive' } } } } },
            { company: { industry: { contains: keyword, mode: 'insensitive' } } },
          ],
        })),
      });
    }

    if (searchCriteria.location) {
      where.AND.push({
        location: { contains: searchCriteria.location, mode: 'insensitive' },
      });
    }

    if (searchCriteria.experienceLevels && searchCriteria.experienceLevels.length > 0) {
      where.experienceLevel = { in: searchCriteria.experienceLevels };
    }

    if (searchCriteria.employmentTypes && searchCriteria.employmentTypes.length > 0) {
      where.employmentType = { in: searchCriteria.employmentTypes };
    }

    if (searchCriteria.minSalary) {
      where.salaryMax = { gte: searchCriteria.minSalary };
    }

    if (searchCriteria.maxSalary) {
      where.salaryMin = { lte: searchCriteria.maxSalary };
    }

    if (searchCriteria.remotePreference && searchCriteria.remotePreference.length > 0) {
      where.remoteType = { in: searchCriteria.remotePreference };
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
            industry: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('AI search error:', error);
    return NextResponse.json({ message: 'Failed to perform AI-powered search' }, { status: 500 });
  }
}