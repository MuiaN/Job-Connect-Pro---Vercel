"use client"

import { Navbar } from "@/components/navigation/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, MessageSquare, Calendar, Search, Zap, Shield, Star, CheckCircle, Sparkles } from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: MessageSquare,
    title: "Direct Communication",
    description: "Connect directly with hiring managers and candidates without intermediaries."
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI-powered interview scheduling that works with everyone's calendar."
  },
  {
    icon: Zap,
    title: "Instant Matching",
    description: "Get matched with relevant opportunities in real-time using advanced algorithms."
  },
  {
    icon: Shield,
    title: "Verified Profiles",
    description: "All companies and candidates are verified for authenticity and quality."
  },
  {
    icon: Star,
    title: "Premium Experience",
    description: "Enjoy a premium, ad-free experience focused on meaningful connections."
  },
  {
    icon: CheckCircle,
    title: "Success Tracking",
    description: "Track your application progress and get insights to improve your success rate."
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              The Future of Job Matching
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-primary dark:text-white leading-tight">
              Connect Talent with
              <span className="block text-primary">
                Opportunity
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              The premier platform connecting job seekers with companies for direct communication and seamless interview scheduling.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg text-lg px-8 py-6">
                <Link href="/signup">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 border-border/50 hover:bg-accent/50">
                <Link href="/jobs">
                  Browse Jobs
                  <Search className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 dark:from-slate-800 dark:via-blue-900 dark:to-purple-900">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Why Choose JobConnect Pro?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of job matching with our innovative features designed for modern professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="modern-card group hover:scale-105 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="modern-card text-center p-12 bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 dark:from-slate-700 dark:via-blue-800 dark:to-purple-800 border-blue-200 dark:border-slate-600">
            <CardContent className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Ready to Transform Your Career?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of professionals who have found their dream jobs through JobConnect Pro.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/about">
                    Learn More
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-muted/20">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                JobConnect Pro
              </span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-muted-foreground">&copy; 2024 JobConnect Pro. All rights reserved.</p>
              <p className="text-sm text-muted-foreground/80 mt-1">Connecting talent with opportunity.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
