"use client"

import { motion } from "framer-motion"
import { ArrowRight, Briefcase, Building2, Calendar, CheckCircle, FileText, MessageSquare, Search, Shield, Sparkles, Star, User, UserCheck, Zap } from "lucide-react"
import Link from "next/link"

import { Footer } from "@/components/footer/footer"
import { Navbar } from "@/components/navigation/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const seekerJourney = [
  {
    icon: User,
    title: "Create Your Profile",
    description: "Connect directly with hiring managers and candidates without intermediaries."
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI-powered interview scheduling that works with everyone's calendar."
  },
  {
    icon: FileText,
    title: "Apply with Confidence",
    description: "Get matched with relevant opportunities in real-time using advanced algorithms."
  },
  {
    icon: Shield,
    title: "Verified Profiles",
    description: "All companies and candidates are verified for authenticity and quality."
  },
  {
    icon: Star, // Placeholder, consider a more specific icon
    title: "Land Your Dream Job",
    description: "Enjoy a premium, ad-free experience focused on meaningful connections."
  }
];

const companyJourney = [
  {
    icon: Building2,
    title: "Build Your Company Brand",
    description: "Create a compelling company profile to attract top-tier candidates."
  },
  {
    icon: Briefcase,
    title: "Post & Manage Jobs",
    description: "Easily post job listings and manage your entire hiring pipeline from one dashboard."
  },
  {
    icon: UserCheck,
    title: "Discover & Vet Talent",
    description: "Use our powerful search to find qualified candidates and review their detailed profiles."
  },
  {
    icon: CheckCircle, // Placeholder
    title: "Hire the Perfect Fit",
    description: "Track your application progress and get insights to improve your success rate."
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex items-center justify-center min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="container relative z-10 py-20 md:py-0">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge 
                className="
                  mb-6 px-4 py-2 text-sm font-semibold border-transparent
                  bg-gradient-to-r from-blue-500 to-purple-600 text-white 
                  dark:from-blue-400 dark:to-purple-500 dark:text-white
                  shadow-lg
                "
              >
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                <span>The Future of Recruitment is Here</span>
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Connect Talent with <span className="text-primary">Opportunity</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              The premier platform connecting job seekers with companies for direct communication and seamless interview scheduling.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button size="lg" asChild className="btn-gradient text-lg px-8 py-6">
                <Link href="/signup">Start Your Journey <ArrowRight className="ml-2 w-5 h-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 border-border/50 hover:bg-accent/50">
                <Link href="/browse-jobs">Browse Jobs <Search className="ml-2 w-5 h-5" /></Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">A streamlined process for both sides of the hiring equation.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* For Job Seekers */}
            <div className="space-y-8">
              <h3 className="text-2xl font-semibold text-center text-primary flex items-center justify-center gap-2"><User className="w-6 h-6" /> For Job Seekers</h3>
              {seekerJourney.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="modern-card">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* For Companies */}
            <div className="space-y-8 lg:mt-16">
              <h3 className="text-2xl font-semibold text-center text-primary flex items-center justify-center gap-2"><Building2 className="w-6 h-6" /> For Companies</h3>
              {companyJourney.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="modern-card">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="modern-card text-center p-8 md:p-12 bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 border-primary/20">
            <CardContent className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Ready to Transform Your Career or Company?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of professionals and companies who have found their perfect match on JobConnect Pro.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="btn-gradient">
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

      {/* Platform Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">A Platform Built for Growth</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed for a seamless recruitment experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: MessageSquare, title: "Direct Messaging", description: "Connect directly with hiring managers and candidates without intermediaries." },
              { icon: Calendar, title: "Smart Scheduling", description: "AI-powered interview scheduling that works with everyone's calendar." },
              { icon: Zap, title: "Instant Matching", description: "Get matched with relevant opportunities in real-time using advanced algorithms." },
              { icon: Shield, title: "Verified Profiles", description: "All companies and candidates are verified for authenticity and quality." },
              { icon: Star, title: "Premium Experience", description: "Enjoy a premium, ad-free experience focused on meaningful connections." },
              { icon: CheckCircle, title: "Success Tracking", description: "Track your application progress and get insights to improve your success rate." }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card className="modern-card h-full group hover:-translate-y-2 transition-transform duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}