import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
/**
 * GET /api/applications
 * Fetches applications based on query parameters.
 * A company can fetch applications for a specific job seeker.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "COMPANY") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const company = await prisma.company.findUnique({ where: { userId: session.user.id } });
    if (!company) {
        return NextResponse.json({ message: "Company profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const jobSeekerUserId = searchParams.get("jobSeekerId");

    if (!jobSeekerUserId) {
        return NextResponse.json({ message: "jobSeekerId is required" }, { status: 400 });
    }

    const applications = await prisma.application.findMany({
      where: { companyId: company.id, jobSeeker: { userId: jobSeekerUserId } },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("[APPLICATIONS_GET]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/applications
 * Creates a new job application for the logged-in job seeker.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== 'JOB_SEEKER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobId, companyId } = await req.json();

    if (!jobId || !companyId) {
      return NextResponse.json({ message: 'Missing jobId or companyId' }, { status: 400 });
    }

    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!jobSeeker) {
      return NextResponse.json({ message: 'Job seeker profile not found. Please complete your profile.' }, { status: 404 });
    }

    const newApplication = await prisma.application.create({
      data: {
        jobId,
        companyId,
        jobSeekerId: jobSeeker.id,
        status: 'PENDING',
      },
    });

    // Create a notification for the company
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true, company: { select: { userId: true } } },
    });

    if (job?.company?.userId) {
      await prisma.notification.create({
        data: {
          userId: job.company.userId,
          type: "NEW_APPLICATION",
          message: `${
            session.user.name || "A candidate"
          } applied for the position: ${job.title}.`,
          link: `/dashboard/company/jobs?viewApplication=${newApplication.id}`,
        },
      });
    }

    return NextResponse.json(newApplication, { status: 201 });
  } catch (error: any) {
    console.error('Error creating application:', error);
    if (error.code === 'P2002') { // Unique constraint failed
      return NextResponse.json({ message: 'You have already applied for this job.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error creating application' }, { status: 500 });
  }
}