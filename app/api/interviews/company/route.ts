import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/interviews/company
 * Fetches all interviews for the logged-in company.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "COMPANY") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const company = await prisma.company.findUnique({ where: { userId: session.user.id } });
    if (!company) {
      return NextResponse.json({ message: "Company profile not found" }, { status: 404 });
    }

    const interviews = await prisma.interview.findMany({
      where: { companyId: company.id },
      orderBy: { scheduledAt: 'desc' },
      include: {
        jobSeeker: {
          include: {
            user: { select: { name: true, image: true, email: true } },
          },
        },
        application: {
          include: {
            job: { select: { id: true, title: true } },
          },
        },
      },
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error("[COMPANY_INTERVIEWS_GET]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/interviews
 * Creates a new interview. Only accessible by COMPANY users.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "COMPANY") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const company = await prisma.company.findUnique({ where: { userId: session.user.id } });
    if (!company) {
      return NextResponse.json({ message: "Company profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { applicationId, jobSeekerId, title, scheduledAt, duration, meetingUrl, description } = body;

    if (!applicationId || !jobSeekerId || !title || !scheduledAt || !duration || !meetingUrl) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const newInterview = await prisma.interview.create({
      data: {
        companyId: company.id,
        jobSeekerId,
        applicationId,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(duration, 10),
        meetingUrl,
        status: "SCHEDULED",
      },
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "INTERVIEW" },
    });

    // Create a notification for the job seeker
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { id: jobSeekerId },
      select: { userId: true },
    });

    if (jobSeeker?.userId) {
      await prisma.notification.create({
        data: {
          userId: jobSeeker.userId,
          type: "INTERVIEW_SCHEDULED",
          message: `You have been invited to an interview for the position: ${title}.`,
          link: `/dashboard/job-seeker/interviews`,
        },
      });
    }

    return NextResponse.json(newInterview, { status: 201 });
  } catch (error) {
    console.error("[INTERVIEWS_POST]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT /api/interviews/company
 * Updates (reschedules) an existing interview.
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "COMPANY") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const company = await prisma.company.findUnique({ where: { userId: session.user.id } });
    if (!company) {
      return NextResponse.json({ message: "Company profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { interviewId, title, scheduledAt, duration, meetingUrl, description } = body;

    if (!interviewId || !title || !scheduledAt || !duration || !meetingUrl) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const updatedInterview = await prisma.interview.update({
      where: {
        id: interviewId,
        companyId: company.id, // Ensure company owns this interview
      },
      data: {
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(duration, 10),
        meetingUrl,
        status: "RESCHEDULED",
      },
    });

    // Create a notification for the job seeker about the update
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { id: updatedInterview.jobSeekerId },
      select: { userId: true },
    });

    if (jobSeeker?.userId) {
      await prisma.notification.create({
        data: {
          userId: jobSeeker.userId,
          type: "INTERVIEW_UPDATED",
          message: `Your interview for "${updatedInterview.title}" has been updated.`,
          link: `/dashboard/job-seeker/interviews`,
        },
      });
    }

    return NextResponse.json(updatedInterview);
  } catch (error: any) {
    if (error.code === 'P2025') { // Record to update not found
      return NextResponse.json({ message: "Interview not found or you do not have permission to edit it." }, { status: 404 });
    }
    console.error("[INTERVIEWS_PUT]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}