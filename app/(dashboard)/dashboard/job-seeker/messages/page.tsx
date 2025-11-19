'use client'

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { Skeleton, SkeletonList } from "@/components/ui/skeleton"
import { format, isToday, isYesterday, isSameDay, isThisWeek } from 'date-fns';
import { MessageSquare, Send, Search, Building } from "lucide-react"

export default function JobSeekerMessages() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
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
    id: string // This will be the other user's ID
    name: string | null
    logoUrl: string | null
    role: string
    lastMessage: string
    timestamp: Date | undefined
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
  const [currentTime, setCurrentTime] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push('/auth/signin'); return }
    if (session.user.role !== 'JOB_SEEKER') { router.push('/dashboard/company'); return }

    fetchConversations()

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [session, status, router, searchParams]);

  const fetchConversations = async () => {
    setIsConversationsLoading(true);
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data: Conversation[] = await response.json();
        setConversations(data);

        const conversationIdFromUrl = searchParams.get('conversationId');
        const conversationToSelect = 
          conversationIdFromUrl ? data.find(c => c.id === conversationIdFromUrl) : data[0];

        if (conversationToSelect) {
          setSelectedConversation(conversationToSelect);
          fetchMessages(conversationToSelect.id);
        } else if (data.length > 0) {
          handleConversationSelect(data[0]);
        } else if (selectedConversation) {
          // If a conversation is already selected, refresh its data but keep it selected
          const updatedSelected = data.find(c => c.id === selectedConversation.id);
          if (updatedSelected) {
            setSelectedConversation(updatedSelected);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsConversationsLoading(false);
    }
  };

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

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    router.push(`/dashboard/job-seeker/messages?conversationId=${conversation.id}`, { scroll: false });
  };

  const fetchMessages = async (conversationId: string) => {
    setIsMessagesLoading(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`);
      if (response.ok) {
        const data: Message[] = await response.json();
        setMessages(data); // API already sends them in 'asc' order
        // Mark messages as read
        const markAsReadResponse = await fetch(`/api/messages/${conversationId}`, { method: 'PUT' });
        if (markAsReadResponse.ok) {
          // Instead of re-fetching all conversations, just update the local state
          setConversations(prev => prev.map(c =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ));
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    // The conversation ID is the application ID. The receiver is the company user.
    // The backend can find the company user from the application, so we just need to pass the application ID.
    // However, the POST /api/messages expects a receiverId (user id). Let's find it.
    // A better approach would be to refactor the backend, but for a minimal change, we can find the user on the frontend.
    // The current backend logic can find the other user from the application, so we just need to send the correct application context.
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: selectedConversation.id, content: newMessage }),
      });

      if (response.ok) {
        setNewMessage("");
        const newMessageData = await response.json();
        // Optimistically update the UI with the new message
        setMessages(prev => [...prev, newMessageData]);
        // Update the conversation list with the new last message and move it to the top
        setConversations(prev => {
          const updatedConvo = { ...selectedConversation, lastMessage: newMessage, timestamp: new Date() };
          return [updatedConvo, ...prev.filter(c => c.id !== selectedConversation.id)];
        });
      } else {
        // Handle error silently or with a toast
      }
    } catch (error) {
      console.error("Error sending message:", error);
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

  if (status === "loading" || isConversationsLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <DashboardNav userType="job_seeker" />
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
      <DashboardNav userType="job_seeker" />
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
              ).map(convo => (
                <div
                  key={convo.id}
                  onClick={() => handleConversationSelect(convo)}
                  className={`p-4 cursor-pointer border-b border-border/50 transition-colors ${selectedConversation?.id === convo.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                >
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12 rounded-md">
                      <AvatarImage src={convo.logoUrl || ''} />
                      <AvatarFallback className="rounded-md bg-primary/10"><Building className="w-5 h-5 text-primary" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground truncate pr-2">{convo.name}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatConversationTimestamp(convo.timestamp)}
                        </span>
                      </div>
                      {convo.job?.title && (
                        <p className="text-xs text-muted-foreground truncate">{convo.job.title}</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground truncate pr-2">{convo.lastMessage}</p>
                        {convo.unreadCount > 0 && <Badge className="bg-primary h-5 w-5 p-0 flex items-center justify-center">{convo.unreadCount}</Badge>}
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
                    <div className="flex items-center justify-between ">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 rounded-md">
                          <AvatarImage src={selectedConversation.logoUrl || ''} />
                          <AvatarFallback className="rounded-md bg-primary/10"><Building className="w-5 h-5 text-primary" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{selectedConversation.name}</h3>
                          <p className="text-sm text-muted-foreground">Company Representative</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
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
                            <div className={`flex items-end gap-2 ${message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-md lg:max-w-lg px-4 py-2.5 rounded-xl ${message.senderId === session?.user?.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1.5 text-right ${message.senderId === session?.user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                    <p>Choose a conversation from the list to start messaging.</p>
                  </div>
                </div>
              )}
          </div>
        </div>
    </div>
  )
}
