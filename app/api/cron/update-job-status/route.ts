import { JobStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * This endpoint is designed to be called by a cron job.
 * It finds all 'ACTIVE' jobs whose application deadline has passed and updates their status to 'CLOSED'.
 *
 * Generate a strong CRON_SECRET.
 * Add the CRON_SECRET to your environment variables.
 *
 * Bash:
 * openssl rand -base64 32
 * PowerShell:
 * $bytes = [byte[]]::new(32); [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [System.Convert]::ToBase64String($bytes)
 *
 * To secure this endpoint, the cron job request must include an Authorization header
 * with a Bearer token matching the CRON_SECRET environment variable.
 *
 * Example with curl:
 * curl -X POST "https://<your-domain>/api/cron/update-job-status" -H "Authorization: Bearer <your-cron-secret>"
 */
export async function POST(request: Request) {
  const { headers } = request;
  const authHeader = headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get the start of today (00:00:00).
    // A job with a deadline of yesterday will have a timestamp less than the start of today.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { count } = await prisma.job.updateMany({
      where: {
        status: JobStatus.ACTIVE,
        applicationDeadline: {
          lt: today, // 'lt' means "less than the start of today"
        },
      },
      data: {
        status: JobStatus.CLOSED,
      },
    });

    return NextResponse.json({ success: true, updatedJobs: count });
  } catch (error) {
    console.error("[CRON_UPDATE_JOB_STATUS]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}