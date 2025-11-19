import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "JOB_SEEKER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  
    try {
      // Find the job seeker associated with the user
      const jobSeeker = await prisma.jobSeeker.findUnique({
        where: { userId: session.user.id },
      });
  
      if (!jobSeeker) {
        return NextResponse.json({ message: "Job seeker profile not found" }, { status: 404 });
      }
  
      // Fetch interviews for the job seeker
      const interviews = await prisma.interview.findMany({
        where: { jobSeekerId: jobSeeker.id },
        include: {
          company: {
            select: { name: true, logoUrl: true },
          },
          application: {
            include: {
              job: { select: { title: true } },
            },
          },
        },
      });
  
      // Return the interviews
      return NextResponse.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      return NextResponse.json(
        { message: "Could not fetch interviews" },
        { status: 500 }
      );
    }
  }
  