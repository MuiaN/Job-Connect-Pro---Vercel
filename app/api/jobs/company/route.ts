import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, JobStatus, ExperienceLevel, EmploymentType, RemotePreference, SkillLevel } from "@prisma/client";
import { z } from "zod";

const jobCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  department: z.string().optional(),
  employmentType: z.preprocess((val) => (val === "" ? undefined : val), z.nativeEnum(EmploymentType).optional()),
  remoteType: z.preprocess((val) => (val === "" ? undefined : val), z.nativeEnum(RemotePreference)),
  experienceLevel: z.preprocess((val) => (val === "" ? undefined : val), z.nativeEnum(ExperienceLevel).optional()),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  applicationDeadline: z.preprocess((val) => (val === "" ? null : val), z.string().optional().nullable()),
  skills: z.array(z.object({ name: z.string(), level: z.nativeEnum(SkillLevel) })).optional(),
  status: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.nativeEnum(JobStatus).optional()
  ),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as JobStatus | null;
  const fields = searchParams.get('fields');

  if (!session || session.user.role !== "COMPANY") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
    });

    if (!company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    // --- Proactive Job Status Update ---
    // Before fetching, update the status of any active jobs where the deadline has passed.
    // This ensures the data is always fresh, even if the cron job hasn't run yet.
    await prisma.job.updateMany({
      where: {
        companyId: company.id,
        status: JobStatus.ACTIVE,
        applicationDeadline: {
          // A job expires if its deadline is before the start of today.
          // This ensures a job with today's date as a deadline is active for the whole day.
          lt: new Date(new Date().setUTCHours(0, 0, 0, 0)),
        },
      },
      data: {
        status: JobStatus.CLOSED,
      },
    });

    const whereClause: any = {
      companyId: company.id,
    };

    if (status) {
      whereClause.status = status;
    }

    const queryArgs: Prisma.JobFindManyArgs = {
      where: whereClause,
      orderBy: { createdAt: "desc" },
    };

    if (fields === 'status') {
      queryArgs.select = { status: true };
    } else {
      queryArgs.include = {
        skills: { include: { skill: true } },
        _count: { select: { applications: true } },
      };
    }

    const jobs = await prisma.job.findMany(queryArgs);

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("[COMPANY_JOBS_GET]", error)
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

interface SkillInput {
  name: string;
  level: SkillLevel;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "COMPANY") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
    });

    if (!company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const body = await req.json();
    const parsedData = jobCreateSchema.parse(body);
    const { skills, applicationDeadline, status, ...jobData } = parsedData;

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        ...jobData,
        status: status || JobStatus.DRAFT, // Default to DRAFT if no status is provided
        salaryMin: jobData.salaryMin ? parseInt(jobData.salaryMin, 10) : null,
        salaryMax: jobData.salaryMax ? parseInt(jobData.salaryMax, 10) : null,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      },
    });

    if (skills && skills.length > 0) {
      const skillConnectOrCreate = (skills as SkillInput[]).map(skillData => ({
        level: skillData.level,
        required: true,
        skill: {
          connectOrCreate: {
            where: { name: skillData.name },
            create: { name: skillData.name },
          },
        },
      }));

      await prisma.job.update({ where: { id: job.id }, data: { skills: { create: skillConnectOrCreate } } });
    }

    return NextResponse.json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation failed", issues: error.issues }, { status: 400 });
    }
    console.error("[JOBS_POST]", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}