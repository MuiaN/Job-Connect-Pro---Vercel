'use client'

import { format, isToday, isYesterday, isThisWeek, isSameDay } from 'date-fns'
import {
  MessageSquare,
  Send,
  Search,
  Calendar
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { toast } from "sonner"

import { DashboardNav } from "@/components/layout/dashboard-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScheduleInterviewDialog } from "@/components/ui/schedule-interview-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useConversation } from "@/context/ConversationContext"

export default function CompanyMessages() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Define types for better type safety
  type Message = {
    id: string
    senderId: string
    receiverId: string
    content: string
    createdAt: string
    read: boolean
    sender: { name: string | null; image: string | null; id: string }
    receiver: { name: string | null; image: string | null; id: string }
  }

  type Conversation = {
    timestamp: Date | undefined
    id: string // This will be the other user's ID
    jobSeekerUserId?: string; // Add this to match the API response
    name: string | null
    logoUrl: string | null // Using logoUrl to be consistent with job-seeker page
    role: string
    lastMessage: string
    unreadCount: number
    job?: {
      applicationDeadline?: string | null;
      id?: string;
      title?: string | null;
    } | null;
  }
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isConversationsLoading, setIsConversationsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [virtualConversationDetails, setVirtualConversationDetails] = useState<typeof newConversationInfo>(null);
  const newConversationHandled = useRef(false);
  const [schedulingFor, setSchedulingFor] = useState<Conversation | null>(null);

  const { newConversationInfo, setNewConversationInfo } = useConversation();

  const createVirtualConversation = useCallback((applicationId: string | undefined, candidateId: string, name: string | null, avatar: string | null, jobTitle?: string | null, jobId?: string | undefined): Conversation => {
    return {
      id: `virtual-${applicationId ?? candidateId}`,
      name: name,
      logoUrl: avatar,
      role: 'JOB_SEEKER',
      lastMessage: 'Start the conversation...',
      timestamp: new Date(),
      unreadCount: 0,
      job: {
        title: jobTitle || 'New Conversation',
        id: jobId,
        applicationDeadline: null,
      }
    };
  }, []);

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "COMPANY") {
      router.push("/dashboard/job-seeker")
      return
    }

    let isMounted = true;
    const loadData = async () => {
      if (!isMounted) return;
      setIsConversationsLoading(true);
      let conversationToSelect: Conversation | null = null;
      let initialMessages: Message[] = [];

      // --- Step 1: Handle incoming new conversation context ---
      if (newConversationInfo && !newConversationHandled.current) {
        newConversationHandled.current = true;

        // Check if a real conversation already exists for this application
        try {
          const response = await fetch(`/api/messages?applicationId=${newConversationInfo.applicationId}`);
          if (response.ok) {
            const existingConvos = await response.json();
            if (existingConvos.length > 0) {
              conversationToSelect = existingConvos[0];
            }
          }
        } catch (error) {
          console.error("Error checking for existing conversation:", error);
        }

        // If no existing conversation, create a virtual one
        if (!conversationToSelect) {
          conversationToSelect = createVirtualConversation(
            newConversationInfo.applicationId,
            newConversationInfo.candidateId,
            newConversationInfo.name,
            newConversationInfo.avatar,
            newConversationInfo.jobTitle,
            newConversationInfo.jobId
          );
          setVirtualConversationDetails(newConversationInfo); // Persist details for sending the first message
        }
        setNewConversationInfo(null); // Clear context immediately after use
      }

      // --- Step 2: Fetch all conversations for the list ---
      try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
          toast.error("Failed to fetch conversations.");
          throw new Error("Failed to fetch conversations");
        }
        let allConversations: Conversation[] = (await response.json()).map((convo: Conversation) => ({
          ...convo,
          timestamp: convo.timestamp ? new Date(convo.timestamp) : undefined,
        }));

        // If a virtual conversation is being created, prepend it to the list
        if (conversationToSelect && conversationToSelect.id.startsWith('virtual-')) {
          allConversations = [conversationToSelect, ...allConversations];
        }
        if (!isMounted) return;
        setConversations(allConversations);

        // --- Step 3: Determine which conversation to display ---
        const finalSelection = conversationToSelect || allConversations[0] || null;

        if (finalSelection) {
          setSelectedConversation(finalSelection);
          if (!finalSelection.id.startsWith('virtual-')) {
            // Fetch messages only for real conversations
            const messagesResponse = await fetch(`/api/messages/${finalSelection.id}`);
            if (messagesResponse.ok) {
              initialMessages = await messagesResponse.json();
            }
          }
        }
        if (!isMounted) return;
        setMessages(initialMessages);

      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast.error("An error occurred while fetching conversations.");
      } finally {
        if (isMounted) setIsConversationsLoading(false);
      }
    };

    loadData();

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60 * 1000); // update every minute

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [session, status, router, newConversationInfo, setNewConversationInfo, createVirtualConversation]);

  const formatConversationTimestamp = (timestamp: Date | undefined): string => {
    if (!timestamp) {
      return '';
    }
    const date = new Date(timestamp);

    if (isToday(date)) {
      return format(date, 'p'); // e.g., 4:30 PM
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    if (isThisWeek(date, { weekStartsOn: 1 /* Monday */ })) {
      return format(date, 'EEEE'); // e.g., Tuesday
    }
    return format(date, 'P'); // e.g., 10/27/2023
  };

  const fetchMessages = async (conversationId: string) => {
    setIsMessagesLoading(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`);
      if (response.ok) {
        const data: Message[] = await response.json();
        setMessages(data);
        // Mark messages as read
        const markAsReadResponse = await fetch(`/api/messages/${conversationId}`, { method: 'PUT' });
        if (markAsReadResponse.ok) {
          // Instead of re-fetching all conversations, just update the local state
          setConversations(prev => prev.map(c => 
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ));
        }
      } else {
        toast.error("Failed to fetch messages.");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("An error occurred while fetching messages.");
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const isVirtualConversation = selectedConversation.id.startsWith('virtual-');

    const body = isVirtualConversation
      ? { // This is the first message for this application
          applicationId: virtualConversationDetails?.applicationId,
          receiverId: virtualConversationDetails?.candidateId,
          content: newMessage,
        }
      : { // This is a reply in an existing conversation
          applicationId: selectedConversation.id, // This is the application ID
          content: newMessage,
        };

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setNewMessage("");
        if (isVirtualConversation) {
          // This was the first message. The conversation is now real. A simple and robust
          // way to ensure the UI is in sync is to reload the page. The useEffect will
          // then correctly pick up the new conversation from the context.
          setVirtualConversationDetails(null); // Clear the persisted details
          setNewConversationInfo(null); // Clear the context AFTER the message is sent and before refresh
          router.refresh(); 
        } else {
          // This is an existing conversation, so we can update optimistically.
          const newMessageData = await response.json();
          setMessages(prev => [...prev, newMessageData]);
          setConversations(prev => [ { ...selectedConversation, lastMessage: newMessage, timestamp: new Date() }, ...prev.filter(c => c.id !== selectedConversation.id) ].sort((a,b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)));
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to send message.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("An error occurred while sending the message.");
    }
  }

  useEffect(() => {
    // Scroll to the bottom of the messages container when messages change
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100); // A small delay ensures the DOM is updated before scrolling
  }, [messages]);

  const isConversationExpired = useMemo(() => {
    if (!selectedConversation?.job?.applicationDeadline) return false;
    const deadline = new Date(selectedConversation.job.applicationDeadline).getTime();
    return deadline < currentTime;
  }, [selectedConversation, currentTime]);

  const [isScheduling, setIsScheduling] = useState(false);

  const handleScheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!schedulingFor) return;

    setIsScheduling(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      ...Object.fromEntries(formData.entries()),
      applicationId: schedulingFor.id, // The conversation ID is the application ID
      jobSeekerId: schedulingFor.jobSeekerUserId,
    };

    try {
      const response = await fetch('/api/interviews/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Interview scheduled successfully!");
        setSchedulingFor(null); // Close the dialog
      } else {
        toast.error("Failed to schedule interview.");
      }
    } finally {
      setIsScheduling(false);
    }
  }

  if (status === "loading" || isConversationsLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <DashboardNav userType="company" />
        <div className="flex-1 flex overflow-hidden">
          <div className="w-full lg:w-[320px] xl:w-[380px] border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex-1 p-2 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-medium text-foreground mb-2">Loading Conversations...</h3>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <DashboardNav userType="company" />
      <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-full lg:w-[320px] xl:w-[380px] border-r border-border flex flex-col">
            <div className="p-4 border-b border-border flex-shrink-0">
              <h2 className="text-2xl font-bold">Messages</h2>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-muted/50 focus-visible:ring-primary/50" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                  {conversations.filter(c => 
                    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((conversation) => (
                    <div 
                      key={conversation.id} 
                      onClick={() => { setSelectedConversation(conversation); fetchMessages(conversation.id); }} 
                      className={`p-4 cursor-pointer border-b border-border/50 transition-colors ${selectedConversation?.id === conversation.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                    >
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12 rounded-md"><AvatarImage src={conversation.logoUrl || ""} /><AvatarFallback>{conversation.name?.charAt(0)}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground truncate pr-2">{conversation.name}</h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatConversationTimestamp(conversation.timestamp)}
                            </span>
                          </div>
                          {conversation.job?.title && (
                            <p className="text-xs text-muted-foreground truncate">{conversation.job.title}</p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground truncate pr-2">{conversation.lastMessage}</p>
                            {conversation.unreadCount > 0 && <Badge className="bg-primary h-5 w-5 p-0 flex items-center justify-center">{conversation.unreadCount}</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Message View */}
          <div className="hidden lg:flex flex-1 flex-col">
            {isMessagesLoading ? (
              <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) :
              selectedConversation ? (
                <>
                  <div className="p-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 rounded-md"><AvatarImage src={selectedConversation.logoUrl || ""} /><AvatarFallback>{selectedConversation.name?.charAt(0)}</AvatarFallback></Avatar>
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{selectedConversation.name}</h3>
                          <p className="text-sm text-muted-foreground">Candidate</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="btn-gradient" onClick={() => setSchedulingFor(selectedConversation)}>
                          <Calendar className="w-4 h-4 mr-2" />Schedule Interview
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-muted/20 ">
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const currentDate = new Date(message.createdAt);
                        const prevDate = index > 0 ? new Date(messages[index - 1].createdAt) : null;
                        const showDateSeparator = !prevDate || !isSameDay(currentDate, prevDate);

                        const formatDateSeparator = (date: Date): string => {
                          if (isToday(date)) return 'Today';
                          if (isYesterday(date)) return 'Yesterday';
                          return format(date, 'MMMM d, yyyy');
                        };

                        return (
                          <div key={message.id}>
                            {showDateSeparator && (
                              <div className="flex justify-center my-4">
                                <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold text-muted-foreground bg-background border border-border/50 shadow-sm">
                                  {formatDateSeparator(currentDate)}
                                </Badge>
                              </div>
                            )}
                        <div key={message.id} className={`flex items-end gap-2 ${message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md lg:max-w-lg px-4 py-2.5 rounded-xl ${message.senderId === session?.user?.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1.5 text-right ${message.senderId === session?.user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        </div>
                      )})}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {isConversationExpired ? (
                    <div className="border-t border-border p-4 flex-shrink-0 text-center text-sm text-muted-foreground bg-muted/50">
                      This job posting has expired. You can no longer send messages.
                    </div>
                  ) : (
                    <div className="border-t border-border p-4 flex-shrink-0 bg-background">
                      <div className="relative">
                        <Input placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="pr-12 h-11 bg-muted/50 focus-visible:ring-primary/50" />
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 btn-gradient">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-xl font-medium text-foreground mb-2">Select a conversation</h3>
                    <p>Choose a conversation or start a new one with a candidate.</p>
                  </div>
                </div>
              )}
          </div>
        </div>

        <ScheduleInterviewDialog
          application={schedulingFor ? {
            id: schedulingFor.id,
            job: { title: schedulingFor.job?.title || 'N/A' },
            jobSeeker: { user: { name: schedulingFor.name, email: null, image: schedulingFor.logoUrl } }
          } as any : null}
          open={!!schedulingFor}
          onOpenChange={(isOpen) => !isOpen && setSchedulingFor(null)}
          onSubmit={handleScheduleSubmit}
          isScheduling={isScheduling}
        />

    </div>
  )
}
