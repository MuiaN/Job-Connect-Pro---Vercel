import { ApplicationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export async function PUT(
  req: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "COMPANY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const params = await context.params;

    const body = await req.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse("Invalid status provided", { status: 400 });
    }

    const { status } = validation.data;

    const updatedApplication = await prisma.application.update({
      where: {
        id: params.applicationId,
        // Ensure the company owns this application by checking its user ID
        company: {
          userId: session.user.id,
        },
      },
      data: {
        status: status,
      },
      include: {
        job: { select: { title: true } },
        jobSeeker: { select: { user: { select: { id: true } } } },
      },
    });

    // Notify the job seeker about the status update
    await prisma.notification.create({
      data: {
        userId: updatedApplication.jobSeeker.user.id,
        type: "APPLICATION_STATUS_UPDATE",
        message: `Your application for "${updatedApplication.job?.title ?? "a position"}" was updated to ${status
          .toLowerCase()
          .replace("_", " ")}.`,
        link: `/dashboard/job-seeker/applications?applicationId=${updatedApplication.id}`,
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    // Prisma's P2025 error code indicates that a record to update was not found.
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return new NextResponse("Application not found", { status: 404 });
    }
    console.error("[APPLICATION_STATUS_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}