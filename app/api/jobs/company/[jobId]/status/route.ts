import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export async function PUT(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "COMPANY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { status } = await req.json();

    if (!status || !Object.values(JobStatus).includes(status.toUpperCase())) {
      return new NextResponse("Invalid status provided", { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!company) {
      return new NextResponse("Company not found", { status: 404 });
    }

    const jobToUpdate = await prisma.job.findFirst({
      where: {
        id: params.jobId,
        companyId: company.id,
      },
    });

    if (!jobToUpdate) {
      return new NextResponse("Job not found or access denied", { status: 404 });
    }

    const updatedJob = await prisma.job.update({
      where: {
        id: params.jobId,
      },
      data: {
        status: status.toUpperCase() as JobStatus,
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("[JOB_STATUS_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}