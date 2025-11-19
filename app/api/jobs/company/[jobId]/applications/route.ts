import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const params = await context.params;
    const { jobId } = await params;
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");
    const includeJobDetails = searchParams.get("includeJobDetails") === "true";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "COMPANY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId: company.id,
      },
    });

    if (!job) {
      return new NextResponse("Job not found or access denied", { status: 404 });
    }

    // If a specific applicationId is requested, fetch and return only that one.
    if (applicationId) {
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          jobId: jobId, // Ensure it belongs to the correct job
        },
        include: {
          job: true,
          jobSeeker: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  role: true,
                },
              },
              skills: { include: { skill: true } },
              experiences: { orderBy: { startDate: 'desc' } },
              educations: { orderBy: { endDate: 'desc' } },
            },
          },
        },
      });

      if (!application) {
        return new NextResponse("Application not found for this job", { status: 404 });
      }

      // Security check: Ensure the application's companyId matches the logged-in user's company
      if (application.companyId !== company.id) {
        return new NextResponse("Access denied to this application", { status: 403 });
      }

      return NextResponse.json(application);
    }

    const applications = await prisma.application.findMany({
      where: {
        jobId: jobId,
      },
      include: {
        job: includeJobDetails ? {
          select: {
            title: true,
            location: true,
            salaryMin: true,
            salaryMax: true,
            employmentType: true,
            applicationDeadline: true,
            status: true,
          }
        } : false,
        jobSeeker: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
            skills: {
              include: {
                skill: true,
              },
            },
            experiences: {
              orderBy: {
                startDate: 'desc',
              },
            },
            educations: {
              orderBy: {
                startDate: 'desc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("[JOB_APPLICATIONS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}