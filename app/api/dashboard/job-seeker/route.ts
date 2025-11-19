import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "JOB_SEEKER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true, // Needed for stats counts
        title: true,
        location: true,
        bio: true,
        availability: true,
        salaryMin: true,
        salaryMax: true,
        profileVisibility: true,
        skills: {
          select: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        experiences: true, // Fetch full experience objects
        applications: {
          select: {
            jobId: true,
          },
        },
        user: {
          select: {
            image: true,
          },
        },
      },
    });

    if (!jobSeeker) {
      return new NextResponse("Job seeker profile not found", { status: 404 });
    }

    // Combine user image with the rest of the profile
    const profile = {
      ...jobSeeker,
      image: jobSeeker.user.image,
      workExperiences: jobSeeker.experiences, // Matching frontend property name
    };
    // Clean up the object to match frontend expectations
    delete (profile as any).user;
    delete (profile as any).experiences;
    delete (profile as any).id;

    // Fetch stats in parallel
    const [applicationCount, interviewCount, messageCount] = await Promise.all([
      prisma.application.count({ where: { jobSeekerId: jobSeeker.id } }),
      prisma.interview.count({ where: { jobSeekerId: jobSeeker.id } }),
      prisma.message.groupBy({
        by: ['senderId', 'receiverId'],
        where: {
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id },
          ],
        },
      }),
    ]);

    const stats = {
      applications: applicationCount,
      interviewRequests: interviewCount,
      conversations: new Set(messageCount.map(m => m.senderId === session.user.id ? m.receiverId : m.senderId)).size,
      profileViews: 0, // Placeholder
    };

    return NextResponse.json({ profile, stats, activities: [] });
  } catch (error) {
    console.error("[DASHBOARD_JOB_SEEKER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}