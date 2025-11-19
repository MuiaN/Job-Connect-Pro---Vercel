import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { gemini } from '@/lib/ai/gemini';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const searchCriteriaSchema = z.object({
  keywords: z.array(z.string()).optional().describe("An array of relevant keywords extracted from the query, including job titles, technologies, and concepts. e.g., ['React', 'frontend', 'engineer']."),
  skills: z.array(z.string()).optional().describe("A list of specific skills to filter by, extracted from the query and matched against the available skills list."),
  location: z.string().optional().describe("The desired location of the candidate."),
  experienceLevels: z.array(z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"])).optional().describe("A list of experience levels to filter by. Map terms like '5+ years' or 'senior' to these."),
  minSalary: z.number().optional().describe("The minimum desired salary."),
  maxSalary: z.number().optional().describe("The maximum desired salary."),
  availability: z.array(z.enum(["OPEN", "ACTIVELY_SEARCHING", "NOT_LOOKING"])).optional().describe("Candidate's job-seeking availability. 'available immediately' implies 'ACTIVELY_SEARCHING'."),
  remotePreference: z.array(z.enum(["REMOTE", "ONSITE", "HYBRID"])).optional().describe("Candidate's work location preference."),
}).describe("The structured search criteria extracted from the user's query. This will be used to filter candidates from a database.");

/**
 * Uses an LLM to parse a natural language query into structured search criteria.
 * @param query The natural language query from the user.
 * @returns A structured object with search criteria.
 */
async function parseQueryWithLLM(query: string): Promise<z.infer<typeof searchCriteriaSchema>> {
  const allSkills = await prisma.skill.findMany({ select: { name: true } });
  const skillNames = allSkills.map(s => s.name);

  const systemPrompt = `You are an expert recruitment assistant. Your task is to parse a user's natural language query for finding job candidates and convert it into a structured JSON object.
1.  **Analyze the user's query**: Identify key concepts, job titles, technologies, locations, experience levels, and other criteria.
2.  **Expand Keywords**: For the 'keywords' field, break down the query into individual, meaningful terms. For example, if the user searches for "senior software engineer", you should generate keywords like ["senior", "software", "engineer", "developer", "backend", "frontend"]. This ensures a wider net is cast across multiple fields like title and bio.
3.  **Extract Structured Data**: Populate other fields like \`skills\`, \`location\`, \`experienceLevels\`, etc., if they are explicitly mentioned.
    - For the \`skills\` array, only include terms that are an exact match from the available skills list.
    - For \`experienceLevels\`, map terms like "5+ years" or "lead" to the appropriate enum values.
4.  **Return ONLY JSON**: Your final output must be only a valid JSON object with no extra text or explanations.

**Available skills for the 'skills' array**: ${skillNames.join(', ')}.

**Example Query**: "Find me a senior software engineer in Nairobi"
**Example JSON Output**:
{
  "keywords": ["senior", "software", "engineer", "developer"],
  "location": "Nairobi",
  "experienceLevels": ["SENIOR"]
}`;

  try {
    const { object } = await generateObject({
      model: gemini,
      schema: searchCriteriaSchema,
      prompt: query,
      system: systemPrompt,
    });
    return object;
  } catch (error) {
    console.error("Error parsing query with LLM:", error);
    // Fallback to a simple parser or return an empty object on error
    return {};
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'COMPANY') {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    // Step 1: Parse the natural language query to get structured criteria.
    const criteria = await parseQueryWithLLM(query);

    // Step 2: Build the Prisma query based on the parsed criteria.
    const where: any = {
      profileVisibility: 'PUBLIC',
      AND: [],
    };

    if (criteria.skills && criteria.skills.length > 0) {
      where.skills = {
        some: {
          skill: {
            name: { in: criteria.skills, mode: 'insensitive' }
          }
        }
      };
    }

    if (criteria.keywords && criteria.keywords.length > 0) {
      where.AND.push({
        OR: criteria.keywords.map((keyword: string) => ({
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { bio: { contains: keyword, mode: 'insensitive' } },
            { skills: { some: { skill: { name: { contains: keyword, mode: 'insensitive' } } } } },
            { experiences: { some: { OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } }
            ]}}}
          ],
        })),
      });
    }

    if (criteria.experienceLevels && criteria.experienceLevels.length > 0) {
      where.experienceLevel = {
        in: criteria.experienceLevels,
      };
    }

    if (criteria.location) { // Simple location search
      where.AND.push({
        location: {
          contains: criteria.location,
          mode: 'insensitive',
        }
      });
    }

    if (criteria.minSalary) {
      where.salaryMax = { gte: criteria.minSalary };
    }

    if (criteria.maxSalary) {
      where.salaryMin = { lte: criteria.maxSalary };
    }

    if (criteria.availability && criteria.availability.length > 0) {
      where.availability = { in: criteria.availability };
    }

    if (criteria.remotePreference && criteria.remotePreference.length > 0) {
      where.remotePreference = { in: criteria.remotePreference };
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Step 3: Fetch candidates from the database.
    const candidates = await prisma.jobSeeker.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        skills: { include: { skill: true } },
        experiences: true,
        educations: true,
        applications: { where: { companyId: (session.user as any).companyId } },
      },
      take: 50, // Limit results for performance
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("[CANDIDATE_AI_SEARCH_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}