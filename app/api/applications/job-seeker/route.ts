import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
/**
 * GET /api/applications/job-seeker
 * Fetches all applications for the logged-in job seeker.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) { // 'req' is defined but never used.
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (session.user.role !== "JOB_SEEKER") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const applications = await prisma.application.findMany({
      where: {
        jobSeeker: {
          userId: session.user.id,
        },
      },
      include: {
        // Company info for the application card
        company: { select: { name: true, logoUrl: true } },
        // Job details for both the card and the dialog
        job: {
          // When using `include`, all scalar fields are fetched by default.
          // This is the correct way to fetch all job fields AND its relations.
          include: {
            company: {
              select: {
                name: true,
                logoUrl: true,
              },
            },
            skills: {
              include: {
                skill: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching job seeker applications:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
