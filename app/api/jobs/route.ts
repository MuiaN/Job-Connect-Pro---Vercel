import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/jobs
 * Fetches all active jobs for public job listings.
 */
export async function GET(req: Request) {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
        skills: {
          select: {
            skill: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ message: 'Error fetching jobs' }, { status: 500 });
  }
}