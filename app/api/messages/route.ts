import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; 

console.log("✅ Loading API route: /api/messages/route.ts");

export async function GET(req: NextRequest) {
  try {
    // Use NextRequest's `nextUrl` property which is safer than `new URL(req.url)`
    const { searchParams } = req.nextUrl;
    const includeAll = searchParams.get('include') === 'all';
    const candidateId = searchParams.get('candidateId');
    const jobId = searchParams.get('jobId');
    const applicationId = searchParams.get('applicationId');
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Base where clause
    const whereClause: any = {
      OR: [
        { jobSeeker: { userId: userId } },
        { company: { userId: userId } }
      ]
    };

    // If a specific candidateId is provided (by a company), filter for that candidate
    if (session.user.role === 'COMPANY' && candidateId) {
      whereClause.jobSeeker = { userId: candidateId };
    }

    // If a specific jobId is provided (when initiating a specific chat), filter by it
    if (jobId) {
      whereClause.jobId = jobId;
    }

    // If a specific applicationId is provided, filter for that single application
    if (applicationId) {
      whereClause.id = applicationId;
      // Also ensure that there's at least one message associated with it to consider it a "conversation"
      whereClause.messages = {
        some: {}
      };
    }

    // Optimized query to get conversations based on unique applications
    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        job: { select: { id: true, title: true, applicationDeadline: true, status: true } },
        jobSeeker: { include: { user: { select: { id: true, name: true, image: true, role: true } } } },
        company: {
          include: {
            user: { select: { id: true, name: true, image: true, role: true } }
          }
        },
      },
    });

    const conversations = await Promise.all(
      applications.map(async (app) => {
        const otherUser = session.user.role === 'COMPANY' ? app.jobSeeker.user : app.company.user;
        
        const [lastMessage, unreadCount] = await Promise.all([
          prisma.message.findFirst({
            where: { applicationId: app.id },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.message.count({
            where: {
              applicationId: app.id,
              receiverId: userId,
              read: false,
            },
          }),
        ]);

        // If there is no last message, it means no conversation has started for this application.
        // We should not return it as a valid conversation.
        if (!lastMessage && !includeAll) {
          return null;
        }

        return {
          id: app.id, // Use Application ID as the unique conversation identifier
          jobSeekerUserId: app.jobSeeker.user.id, // Add the job seeker's user ID
          name: otherUser.name,
          logoUrl: session.user.role === 'JOB_SEEKER' ? app.company.logoUrl : otherUser.image,
          role: otherUser.role.toLowerCase().replace('_', '-'), // CRITICAL FIX: Format the role consistently
          lastMessage: lastMessage?.content || "No messages yet.",
          timestamp: lastMessage?.createdAt,
          unreadCount,
          job: app.job ? {
            id: app.job.id,
            title: app.job.title,
            applicationDeadline: app.job.applicationDeadline,
            status: app.job.status,
          } : null,
        };
      })
    );

    const validConversations = conversations.filter(Boolean) as any[];

    const formattedConversations = validConversations.sort(
      (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
    );

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error("[MESSAGES_GET]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { receiverId, content, jobId, applicationId: providedApplicationId } = await req.json();

    if ((!receiverId && !providedApplicationId) || !content) {
      return NextResponse.json({ message: "Receiver ID/Application ID and content are required" }, {
        status: 400,
      });
    }

    let finalReceiverId: string | undefined;
    let receiver: { id: string; name: string | null; email: string; role: string } | null = null;

    if (receiverId) {
      finalReceiverId = receiverId;
    } else if (providedApplicationId) {
      const applicationForReceiver = await prisma.application.findFirst({
        where: { id: providedApplicationId },
        include: { company: { select: { userId: true } }, jobSeeker: { select: { userId: true } } },
      });

      if (!applicationForReceiver) {
        return NextResponse.json({ message: "Application not found" }, { status: 404 });
      }
      // **CRITICAL LOGIC FIX**: Correctly identify the other user in the application.
      // If the sender is the job seeker, the receiver is the company user, and vice-versa.
      finalReceiverId = session.user.id === applicationForReceiver.jobSeeker.userId ? applicationForReceiver.company.userId : applicationForReceiver.jobSeeker.userId;
    }

    if (!finalReceiverId) {
      return NextResponse.json({ message: "Could not determine the message receiver." }, { status: 400 });
    }

    // **CRITICAL FIX**: Always fetch the receiver's data using the determined finalReceiverId to ensure the 'role' is available.
    // This was the primary source of the 'undefined' role bug.
    receiver = await prisma.user.findUnique({
      where: { id: finalReceiverId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!receiver || !receiver.role) {
      console.error("DEBUG: Final check: Receiver object or its role is missing. Receiver:", receiver, "Final Receiver ID:", finalReceiverId);
      return NextResponse.json({ message: "Receiver user details or role not found for notification." }, { status: 500 });
    }
    
    // **FIX**: Define and populate companyProfileId and jobSeekerProfileId before they are used.
    let companyProfileId: string | undefined;
    let jobSeekerProfileId: string | undefined;

    if (session.user.role === 'COMPANY') {
      const company = await prisma.company.findUnique({ where: { userId: session.user.id }, select: { id: true } });
      const jobSeeker = await prisma.jobSeeker.findUnique({ where: { userId: finalReceiverId }, select: { id: true } });
      companyProfileId = company?.id;
      jobSeekerProfileId = jobSeeker?.id;
    } else { // session.user.role === 'JOB_SEEKER'
      const jobSeeker = await prisma.jobSeeker.findUnique({ where: { userId: session.user.id }, select: { id: true } });
      const company = await prisma.company.findUnique({ where: { userId: finalReceiverId }, select: { id: true } });
      jobSeekerProfileId = jobSeeker?.id;
      companyProfileId = company?.id;
    }

    if (!companyProfileId || !jobSeekerProfileId) {
      // **CRITICAL FIX**: If we cannot find the profiles, we cannot create an application, which is required.
      return NextResponse.json({ 
        message: "Could not find associated company or job seeker profile to create or find an application." 
      }, { status: 404 });
    }

    // Find or create an application to anchor the conversation
    let application = await prisma.application.findFirst({
      where: providedApplicationId
        ? { id: providedApplicationId }
        : jobId 
        ? { // Find application by Job ID, Company Profile ID, and Job Seeker Profile ID
            jobId: jobId,
            companyId: companyProfileId,
            jobSeekerId: jobSeekerProfileId,
          }
        : { // Fallback to finding any application between the two users
            companyId: companyProfileId,
            jobSeekerId: jobSeekerProfileId,
          },
      orderBy: { createdAt: 'desc' }
    });

    if (!application) {
      // If no application exists (e.g., a company is initiating a conversation from the general candidate pool),
      // create a shell application to anchor the conversation.
      // A job seeker can only reply to an existing application/conversation, so this block is safe.
      if (session.user.role === 'COMPANY') {
        application = await prisma.application.create({
          data: {
            companyId: companyProfileId,
            jobSeekerId: jobSeekerProfileId,
            jobId: jobId, // jobId can be null here, which is fine.
            // jobId is optional, so this application serves as a conversation holder
          }
        });
      } else {
        return NextResponse.json({ 
          message: "A message can only be sent if there is an associated job application." 
        }, { status: 403 });
      }
    }

    // Final check to ensure an application object exists before proceeding.
    if (!application) {
      return NextResponse.json({ message: "Could not find or create an application for this conversation." }, { status: 404 });
    }

    // Business logic: Company can initiate, Job Seeker can only reply
    if (session.user.role === "JOB_SEEKER" && receiver?.role === "COMPANY") {
      const existingConversation = await prisma.message.findFirst({
        where: {
          applicationId: application.id,
          senderId: receiverId, // Check if the company has sent a message in this application context
        },
      });

      if (!existingConversation) {
        // This rule is a bit strict. A job seeker who applied should be able to initiate.
        // The application check above is sufficient. We can relax this.
        // If you want to keep it, the logic is here. For now, we allow initiation post-application.
      }
    } else if (session.user.role === "COMPANY" && receiver?.role === "COMPANY") {
      return NextResponse.json({ message: "Companies cannot message other companies." }, {
        status: 403,
      });
    } else if (session.user.role === "JOB_SEEKER" && receiver?.role === "JOB_SEEKER") {
      return NextResponse.json({ message: "Job seekers cannot message other job seekers." }, {
        status: 403,
      });
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: finalReceiverId,
        content: content,
        applicationId: application.id,
        read: false,
      },
    });

    // Debugging: Log the values before creating the link
    console.log("DEBUG: Session User Role (for notification link):", session.user.role);
    console.log("DEBUG: Receiver Role (for notification link):", receiver.role);
    console.log("DEBUG: Application ID (for notification link):", application.id);

    // **DEFINITIVE FIX**: Explicitly handle the role transformation to ensure the correct URL path.
    const dashboardPath = receiver.role === 'JOB_SEEKER' 
      ? 'job-seeker' 
      : receiver.role.toLowerCase();

    // Create a notification for the receiver
    await prisma.notification.create({
      data: {
        userId: finalReceiverId,
        type: "NEW_MESSAGE",
        message: `You have a new message from ${session.user.name || 'a user'}.`,
        link: `/dashboard/${dashboardPath}/messages?conversationId=${application.id}`, // Link to the application-based conversation
      },
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}