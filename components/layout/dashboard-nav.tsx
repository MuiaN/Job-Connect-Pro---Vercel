"use client"

import { motion } from "framer-motion"
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Building,
  Calendar,
  FileText,
  LogOut,
  MessageSquare,
  Search,
  Plus,
} from "lucide-react"
import { Users } from "lucide-react"
import { User } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useEffect, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useDashboard } from "@/context/DashboardContext"

import type { Company, Notification } from "@prisma/client"
interface DashboardNavProps {
  userType: "job_seeker" | "company"
}

interface NavNotification extends Notification {
  // We can extend this if needed in the future
}

// Helper to format time since a date
const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

interface NavProfile {
  image?: string | null;
  logoUrl?: string | null; // For Company
}

export function DashboardNav({ userType }: DashboardNavProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<NavProfile | null>(null)
  const [notifications, setNotifications] = useState<NavNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { setViewingCandidate } = useDashboard();

  useEffect(() => {
    if (session?.user.id) {
      // Fetch user/company profile for avatar
      const fetchNavProfile = async () => {
        try {
          if (userType === 'company') {
            const response = await fetch('/api/profile/company');
            if (response.ok) {
              const data: Company = await response.json();
              setProfile(data); // Contains logoUrl
            }
          } else { // job_seeker
            const response = await fetch('/api/dashboard/job-seeker');
            if (response.ok) {
              const data = await response.json();
              setProfile(data.profile); // Contains image
            }
          }
        } catch (error) {
          console.error("Failed to fetch profile for navbar:", error);
        }
      };
      fetchNavProfile();

      // Fetch notifications
      const fetchNotifications = async () => {
        try {
          const response = await fetch('/api/notifications');
          if (response.ok) {
            const data: NavNotification[] = await response.json();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
          }
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        }
      };
      fetchNotifications();
    }
  }, [session?.user.id, userType]);

  const jobSeekerNavItems = [
    { href: "/dashboard/job-seeker", label: "Dashboard", icon: Search },
    { href: "/dashboard/job-seeker/applications", label: "Applications", icon: FileText },
    { href: "/dashboard/job-seeker/messages", label: "Messages", icon: MessageSquare },
  ]

  const companyNavItems = [
    { href: "/dashboard/company", label: "Dashboard", icon: Building },
    { href: "/dashboard/company/candidates", label: "Find Candidates", icon: Search },
    { href: "/dashboard/company/jobs", label: "Job Postings", icon: Briefcase },
    { href: "/dashboard/company/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/company/interviews", label: "Interviews", icon: Calendar },
  ]

  const navItems = userType === "job_seeker" ? jobSeekerNavItems : companyNavItems

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      const response = await fetch('/api/notifications/read', { method: 'PATCH' });
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        // Consider using a toast notification here if you have one set up globally
        // toast.success("All notifications marked as read.");
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }

  const handleNewApplicationClick = async (notification: NavNotification) => {
    const url = new URL(notification.link || '', window.location.origin);
    const applicationId = url.searchParams.get('viewApplication');

    if (applicationId) {
      try {
        const response = await fetch(`/api/applications/company?applicationId=${applicationId}`);
        if (response.ok) {
          const applicationData = await response.json();
          if (applicationData.length > 0) {
            setViewingCandidate(applicationData[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch application for notification:", error);
      }
    }
  };
  const handleNotificationClick = async (notification: NavNotification) => {
    // Log the notification object to verify the link is correct
    console.log("Clicked notification:", notification);

    // Optimistically update the UI
    if (!notification.read) {
      setNotifications(
        notifications.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Mark as read in the backend
      try {
        await fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' });
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        // Optionally, revert the optimistic update here
      }
    }

    if (notification.type === 'NEW_APPLICATION') {
      handleNewApplicationClick(notification);
    } else {
      // For all other notifications, navigate to the link directly
      router.push(notification.link || '#');
    }
  };

  return (
    <motion.header 
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 group">
              <motion.div 
                className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <span className="text-xl font-bold text-foreground">
                JobConnect Pro
              </span>
            </Link>

            {/* Navigation Items */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </motion.div>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Action Button */}
            {userType === "company" && (
              <Link href="/dashboard/company/jobs/new">
                <Button size="sm" className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
                  <Plus className="w-4 h-4" />
                  <span>Post Job</span>
                </Button>
              </Link>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-red-600">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 glass-strong border-border/50" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                  <p className="font-semibold">Notifications</p>
                  {unreadCount > 0 && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleMarkAllAsRead}>
                      Mark all as read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="cursor-pointer items-start p-0" onClick={() => handleNotificationClick(notification)}>
                        <div className={`flex w-full gap-3 p-2 ${!notification.read ? 'bg-primary/5' : ''}`}>
                          <div className={`mt-1 h-2 w-2 rounded-full ${!notification.read ? 'bg-primary' : 'bg-transparent'}`} />
                          <div className="flex-1">
                            <p className="text-sm leading-snug">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {timeSince(new Date(notification.createdAt))}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground p-8">
                      <Bell className="mx-auto h-6 w-6 mb-2" />
                      <p>You have no new notifications.</p>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-transparent dark:border-border/50 shadow-md">
                      <AvatarImage
                        src={userType === 'company' ? profile?.logoUrl || "" : profile?.image || session?.user?.image || ""}
                        alt={session?.user?.name || ""}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {session?.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 glass-strong border-border/50" 
                align="end" 
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email || "user@example.com"}
                    </p>
                    <Badge 
                      className={`w-fit mt-1 text-xs border-transparent ${
                        userType === "job_seeker"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                      }`}
                    >
                      {userType === "job_seeker" ? "Job Seeker" : "Company"}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={userType === "job_seeker" ? "/dashboard/job-seeker/profile" : "/dashboard/company/profile"} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span>Back to Website</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-3 pt-3 border-t border-border/40">
          <nav className="flex items-center space-x-1 overflow-x-auto pb-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </motion.header>
  )
}
