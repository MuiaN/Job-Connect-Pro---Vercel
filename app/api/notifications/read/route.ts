import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/notifications/read
 * Marks all unread notifications for the user as read.
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return new NextResponse("Notifications marked as read", { status: 200 });
  } catch (error) {
    console.error("[NOTIFICATIONS_READ_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}