import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "COMPANY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const companyId = company.id

    const [activeJobs, totalApplications, interviewsToday, unreadMessages] =
      await Promise.all([
        prisma.job.count({
          where: { companyId, status: "ACTIVE" },
        }),
        prisma.application.count({
          where: { companyId },
        }),
        prisma.interview.count({
          where: {
            companyId,
            scheduledAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        prisma.message.count({
          where: { receiverId: session.user.id, read: false },
        }),
      ])

    return NextResponse.json({
      activeJobs,
      totalApplications,
      interviewsToday,
      unreadMessages,
    })
  } catch (error) {
    console.error("Error fetching company dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
