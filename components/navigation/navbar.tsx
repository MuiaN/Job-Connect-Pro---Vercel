"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Users, Menu, X, Briefcase, User, MessageSquare, Calendar, FileText, Building2, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const publicNavItems = [
    { href: "/", label: "Home", icon: Users },
    { href: "/browse-jobs", label: "Browse Jobs", icon: Search },
    { href: "/about", label: "About", icon: Building2 },
    { href: "/contact", label: "Contact", icon: MessageSquare },
  ]

  const dashboardItems = [
    {
      label: "Job Seeker Dashboard",
      items: [
        { href: "/dashboard/job-seeker", label: "Dashboard", icon: User },
        { href: "/dashboard/job-seeker/profile", label: "Profile", icon: User },
        { href: "/dashboard/job-seeker/applications", label: "Applications", icon: FileText },
        { href: "/dashboard/job-seeker/interviews", label: "Interviews", icon: Calendar },
        { href: "/dashboard/job-seeker/messages", label: "Messages", icon: MessageSquare },
      ]
    },
    {
      label: "Company Dashboard",
      items: [
        { href: "/dashboard/company", label: "Dashboard", icon: Building2 },
        { href: "/dashboard/company/profile", label: "Company Profile", icon: Building2 },
        { href: "/dashboard/company/jobs", label: "Job Listings", icon: Briefcase },
        { href: "/dashboard/company/jobs/new", label: "Post New Job", icon: Briefcase },
        { href: "/dashboard/company/messages", label: "Messages", icon: MessageSquare },
        { href: "/dashboard/company/interviews", label: "Interviews", icon: Calendar },
      ]
    }
  ]

  function isActive(href: string) {
    if (!pathname) return false
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

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
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

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

            {/* Dashboard Links */}
            {dashboardItems.map((section, index) => (
              <div key={index} className="space-y-2">
                <div className="text-sm font-semibold text-muted-foreground border-t border-border/40 pt-4">
                  {section.label}
                </div>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      "flex items-center space-x-2 text-sm transition-colors py-1 pl-4",
                      isActive(item.href) ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            ))}

            {/* Mobile Auth Buttons */}
            <div className="flex flex-col space-y-2 pt-4 border-t border-border/40">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signin" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
              </Button>
              <Button size="sm" asChild className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
                <Link href="/signup" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
