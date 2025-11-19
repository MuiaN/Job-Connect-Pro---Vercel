import { JobStatus, ExperienceLevel, EmploymentType, RemotePreference, SkillLevel } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic"; // Ensures the route is always dynamic

// const emptyStringToUndefined = z.literal('').transform(() => undefined);

const jobUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  department: z.string().optional(),
  employmentType: z.preprocess((val) => (val === "" ? undefined : val), z.nativeEnum(EmploymentType).optional()),
  remoteType: z.preprocess((val) => (val === "" ? undefined : val), z.nativeEnum(RemotePreference).optional()),
  experienceLevel: z.preprocess((val) => (val === "" ? undefined : val), z.nativeEnum(ExperienceLevel).optional()),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  applicationDeadline: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().optional().nullable()
  ),
  skills: z.array(z.object({ name: z.string(), level: z.nativeEnum(SkillLevel) })).optional(),
  status: z.nativeEnum(JobStatus).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'COMPANY') {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Await params before using its properties
    const { jobId } = await params;
    
    // Fetch job and verify ownership in a single query
    const jobWithSkills = await prisma.job.findFirst({
      where: {
        id: jobId,
        company: {
          userId: session.user.id,
        },
      },
      include: { skills: { include: { skill: true } } },
    });

    if (!jobWithSkills) {
      return new NextResponse("Job not found or you do not have permission to access it", { status: 404 });
    }

    return NextResponse.json(jobWithSkills);
  } catch (error) {
    console.error("[COMPANY_JOB_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'COMPANY') {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Await params before using its properties
    const { jobId } = await params;
    
    // Verify ownership before proceeding
    const jobOwnerCheck = await prisma.job.findFirst({
      where: {
        id: jobId,
        company: {
          userId: session.user.id,
        },
      },
    });

    if (!jobOwnerCheck) {
      return new NextResponse("Job not found or you do not have permission to delete it", { status: 404 });
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("[COMPANY_JOB_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'COMPANY') {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Await params before using its properties
    const { jobId } = await params;
    
    // Verify ownership before proceeding
    const jobOwnerCheck = await prisma.job.findFirst({
      where: {
        id: jobId,
        company: {
          userId: session.user.id,
        },
      },
    });

    if (!jobOwnerCheck) {
      return new NextResponse("Job not found or you do not have permission to edit it", { status: 404 });
    }

    const body = await req.json();
    console.log("Received update data:", body); // Add logging

    const { skills, applicationDeadline, ...jobData } = jobUpdateSchema.parse(body);

    console.log("Parsed job data:", { jobData, skills, applicationDeadline }); // Add logging

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...jobData,
        salaryMin: jobData.salaryMin ? parseInt(jobData.salaryMin, 10) : null,
        salaryMax: jobData.salaryMax ? parseInt(jobData.salaryMax, 10) : null,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        skills: {
          deleteMany: {}, // Clear existing skills for this job
          create: skills?.map(skillData => ({
            level: skillData.level,
            required: true,
            skill: {
              connectOrCreate: {
                where: { name: skillData.name },
                create: { name: skillData.name },
              },
            },
          })),
        },
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.issues); // Add detailed logging
      return new NextResponse(JSON.stringify({ 
        message: "Validation failed", 
        issues: error.issues 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.error("[COMPANY_JOB_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}