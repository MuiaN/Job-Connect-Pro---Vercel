import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'COMPANY') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const jobSeekerId = searchParams.get('jobSeekerId');

  if (!jobSeekerId) {
    return NextResponse.json({ message: 'Job Seeker ID is required' }, { status: 400 });
  }

  try {
    const invitations = await prisma.jobInvitation.findMany({
      where: { jobSeekerId },
      select: { jobId: true },
    });
    return NextResponse.json(invitations);
  } catch (error) {
    console.error('[INVITATIONS_GET]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'COMPANY') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json({ message: 'Company profile not found' }, { status: 404 });
    }

    const { jobId, jobSeekerId, message } = await req.json();

    if (!jobId || !jobSeekerId) {
      return NextResponse.json({ message: 'Job ID and Job Seeker ID are required' }, { status: 400 });
    }

    // Verify the job belongs to the company and is active
    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId: company.id, status: 'ACTIVE' },
    });

    if (!job) {
      return NextResponse.json({ message: 'Active job not found or access denied' }, { status: 404 });
    }

    // Check if an invitation or application already exists
    const existingInvitation = await prisma.jobInvitation.findUnique({
      where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
    });

    if (existingInvitation) {
      return NextResponse.json({ message: 'An invitation for this job has already been sent to this candidate.' }, { status: 409 });
    }

    const newInvitation = await prisma.jobInvitation.create({
      data: {
        companyId: company.id,
        jobId,
        jobSeekerId,
        message,
      },
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
          type: "JOB_INVITATION",
          message: `You have been invited to apply for the position: ${job.title}.`,
          link: `/dashboard/job-seeker/invitations`,
        },
      });
    }

    return NextResponse.json(newInvitation, { status: 201 });
  } catch (error) {
    console.error('[INVITATIONS_POST]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}