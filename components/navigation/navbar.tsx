"use client"

import { UserRole } from "@prisma/client"
import { motion } from "framer-motion"
import { Building2, LayoutDashboard, LogOut, Menu, MessageSquare, Search, User, Users, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"
interface NavProfile {
  image?: string | null;
  logoUrl?: string | null;
}

export function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const publicNavItems = [
    { href: "/", label: "Home", icon: Users },
    { href: "/browse-jobs", label: "Browse Jobs", icon: Search },
    { href: "/about", label: "About", icon: Building2 },
    { href: "/contact", label: "Contact", icon: MessageSquare },
  ]  

  function isActive(href: string) {
    if (!pathname) return false
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const { data: session, status } = useSession()
  const user = session?.user
  const userRole = user?.role as UserRole // Assuming role is in the session

  const [profile, setProfile] = useState<NavProfile | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      const fetchNavProfile = async () => {
        try {
          if (userRole === 'COMPANY') {
            const response = await fetch('/api/profile/company');
            if (response.ok) {
              const data = await response.json();
              setProfile(data); // Contains logoUrl
            }
          } else if (userRole === 'JOB_SEEKER') {
            const response = await fetch('/api/dashboard/job-seeker');
            if (response.ok) {
              const data = await response.json();
              setProfile({ image: data.profile?.image }); // Contains image
            }
          }
        } catch (error) {
          console.error("Failed to fetch profile for navbar:", error);
        }
      };
      fetchNavProfile();
    }
  }, [status, user, userRole]);

  const dashboardUrl = userRole === 'COMPANY' ? '/dashboard/company' : '/dashboard/job-seeker'
  const profileUrl = userRole === 'COMPANY' ? '/dashboard/company/profile' : '/dashboard/job-seeker/profile'

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <nav className="sticky top-0 z-50 w-full nav-glass">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">
            JobConnect Pro
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                "text-sm font-medium transition-colors flex items-center space-x-1",
                isActive(item.href)
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Right side - Theme toggle and auth buttons */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {status === 'loading' ? (
            <div className="hidden md:block w-20 h-8 bg-muted/50 rounded-md animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-transparent dark:border-border/50 shadow-md">
                      <AvatarImage src={userRole === 'COMPANY' ? profile?.logoUrl ?? undefined : profile?.image ?? user.image ?? undefined} alt={user.name ?? "User"} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass-strong border-border/50" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <Badge 
                      className={`w-fit mt-1 text-xs border-transparent ${
                        userRole === "JOB_SEEKER"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                      }`}
                    >
                      {userRole === "JOB_SEEKER" ? "Job Seeker" : "Company"}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardUrl} className="cursor-pointer"><LayoutDashboard className="mr-2 h-4 w-4" /><span>Back to Dashboard</span></Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={profileUrl}><User className="mr-2 h-4 w-4" /><span>Profile</span></Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild><Link href="/signin">Sign In</Link></Button>
              <Button size="sm" asChild className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"><Link href="/signup">Get Started</Link></Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <div className="container py-4 space-y-4">
            {/* Public Navigation */}
            <div className="space-y-2">
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    "flex items-center space-x-2 text-sm font-medium transition-colors py-2",
                    isActive(item.href) ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile Auth Buttons / User Info */}
            {user ? (
              <div className="pt-4 border-t border-border/40">
                <div className="flex items-center px-4 mb-3">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={userRole === 'COMPANY' ? profile?.logoUrl ?? undefined : profile?.image ?? user.image ?? undefined} alt={user.name ?? "User"} />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => signOut({ callbackUrl: '/' })}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 pt-4 border-t border-border/40">
                <Button variant="ghost" size="sm" asChild><Link href="/signin">Sign In</Link></Button>
                <Button size="sm" asChild className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"><Link href="/signup">Get Started</Link></Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
