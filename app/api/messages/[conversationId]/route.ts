import { NextResponse } from "next/server";
import { getServerSession }
 from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Ensure dynamic rendering for params

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const { conversationId: applicationId } = await params;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUserId = session.user.id;
    const messages = await prisma.message.findMany({
      where: {
        applicationId: applicationId,
      },
      orderBy: {
        createdAt: "asc", // Order chronologically
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        application: {
          include: {
            job: {
              select: {
                status: true,
                applicationDeadline: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[MESSAGES_USER_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const { conversationId: applicationId } = await params;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUserId = session.user.id;

    // Use a transaction to ensure both messages and their notifications are updated together
    await prisma.$transaction([
      // 1. Mark all messages in this conversation sent to the current user as read
      prisma.message.updateMany({
        where: {
          applicationId: applicationId,
          receiverId: currentUserId,
          read: false,
        },
        data: {
          read: true,
        },
      }),
      // 2. Mark all "NEW_MESSAGE" notifications related to this conversation for the user as read
      prisma.notification.updateMany({
        where: {
          userId: currentUserId,
          type: "NEW_MESSAGE",
          link: {
            contains: `conversationId=${applicationId}`, // Changed to conversationId
          },
          read: false,
        },
        data: {
          read: true,
        },
      }),
    ]);

    return new NextResponse("Messages marked as read", { status: 200 });
  } catch (error) {
    console.error("[MESSAGES_USER_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}