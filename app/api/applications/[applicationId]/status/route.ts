import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";

export async function PUT(
  req: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "COMPANY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { status } = (await req.json()) as { status: ApplicationStatus };

    if (!status || !Object.values(ApplicationStatus).includes(status)) {
      return new NextResponse("Invalid status provided", { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    // First, verify the application exists and belongs to the company
    const application = await prisma.application.findFirst({
      where: {
        id: params.applicationId,
        companyId: company.id,
      },
    });

    if (!application) {
      return new NextResponse(
        "Application not found or you do not have permission to update it",
        { status: 404 }
      );
    }

    const updatedApplication = await prisma.application.update({
      where: {
        id: params.applicationId,
        companyId: company.id, // Ensure the company owns this application
      },
      data: {
        status: status,
      },
      include: {
        job: { select: { title: true } },
        jobSeeker: { include: { user: { select: { id: true } } } },
      },
    });

    // Notify the job seeker about the status update
    await prisma.notification.create({
      data: {
        userId: updatedApplication.jobSeeker.user.id,
        type: "APPLICATION_STATUS_UPDATE",
        message: `The status of your application for "${
          updatedApplication.job?.title || "a position"
        }" has been updated to ${
          status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        }.`,
        link: `/dashboard/job-seeker/applications?applicationId=${updatedApplication.id}`,
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    // Prisma's P2025 error code indicates that a record to update was not found.
    if (error instanceof Error && (error as any).code === 'P2025') {
      return new NextResponse("Application not found", { status: 404 });
    }
    console.error("[APPLICATION_STATUS_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}