import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/notifications/[notificationId]/read
 * Marks a single notification as read for the currently authenticated user.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { notificationId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await prisma.notification.updateMany({
      where: {
        id: params.notificationId,
        userId: session.user.id, // Ensure user can only update their own notifications
      },
      data: {
        read: true,
      },
    });

    return new NextResponse("Notification marked as read", { status: 200 });
  } catch (error) {
    console.error("[NOTIFICATION_READ_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}