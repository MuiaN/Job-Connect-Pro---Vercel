import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const updateStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'JOB_SEEKER') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!jobSeeker) {
      return NextResponse.json({ message: 'Job seeker profile not found' }, { status: 404 });
    }

    const invitations = await prisma.jobInvitation.findMany({
      where: { jobSeekerId: jobSeeker.id, status: 'PENDING' },
      include: {
        job: { include: { skills: { include: { skill: true } } } },
        company: { select: { name: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('[JOB_SEEKER_INVITATIONS_GET]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'JOB_SEEKER') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!jobSeeker) {
      return NextResponse.json({ message: 'Job seeker profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { status, invitationId } = updateStatusSchema.extend({ invitationId: z.string() }).parse(body);

    const invitation = await prisma.jobInvitation.findFirst({
      where: {
        id: invitationId,
        jobSeekerId: jobSeeker.id,
        status: 'PENDING',
      },
    });

    if (!invitation) {
      return NextResponse.json({ message: 'Invitation not found or already actioned' }, { status: 404 });
    }

    // Use a transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      const updatedInvitation = await tx.jobInvitation.update({
        where: { id: invitation.id },
        data: { status },
      });

      if (status === 'ACCEPTED') {
        // If accepted, create an application
        await tx.application.create({
          data: {
            jobSeekerId: invitation.jobSeekerId,
            jobId: invitation.jobId,
            companyId: invitation.companyId,
            status: 'REVIEWING', // Mark as reviewing since the company initiated
          },
        });
      }

      return updatedInvitation;
    });

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request body', issues: error.issues }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'You have already applied for this job.' }, { status: 409 });
    }
    console.error('[INVITATION_UPDATE]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}