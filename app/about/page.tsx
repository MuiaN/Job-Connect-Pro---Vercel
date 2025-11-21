'use client'

import { Globe, Heart, Target, Zap } from 'lucide-react'

import { Footer } from '@/components/footer/footer'
import { Navbar } from '@/components/navigation/navbar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type PageHeaderProps = {
  badge: string
  title: string
  description: string
}

function PageHeader({ badge, title, description }: PageHeaderProps) {
  return (
    <div className="text-center mb-12">
      <Badge className="mb-4">{badge}</Badge>
      <h1 className="text-4xl font-bold text-primary dark:text-white mb-4">{title}</h1>
      <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{description}</p>
    </div>
  )
}

const teamMembers = [
  {
    name: "Sarah Johnson",
    role: "CEO & Founder",
    bio: "Former VP of Talent at Google with 15+ years in recruitment technology.",
    avatar: "👩‍💼"
  },
  {
    name: "Michael Chen",
    role: "CTO",
    bio: "Ex-Microsoft engineer specializing in AI and machine learning systems.",
    avatar: "👨‍💻"
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Product",
    bio: "Product leader with experience at LinkedIn and Airbnb.",
    avatar: "👩‍🎨"
  },
  {
    name: "David Kim",
    role: "Head of Engineering",
    bio: "Full-stack engineer with expertise in scalable platform architecture.",
    avatar: "👨‍🔧"
  }
]

const values = [
  {
    icon: <Heart className="h-8 w-8" />,
    title: "People First",
    description: "We believe that behind every resume is a person with dreams, aspirations, and unique talents."
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "Quality Connections",
    description: "We focus on meaningful matches rather than quantity, ensuring better outcomes for everyone."
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Innovation",
    description: "We continuously innovate to make job searching and hiring more efficient and enjoyable."
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Accessibility",
    description: "We're committed to making career opportunities accessible to everyone, everywhere."
  }
]

const stats = [
  { number: "50K+", label: "Active Job Seekers" },
  { number: "5K+", label: "Partner Companies" },
  { number: "25K+", label: "Successful Matches" },
  { number: "95%", label: "Satisfaction Rate" }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          badge="About JobConnect Pro"
          title="Revolutionizing How Talent Meets Opportunity"
          description="Founded in 2023, JobConnect Pro was born from a simple belief: the job search process should be transparent, efficient, and human-centered. We're building the future of recruitment technology."
        />

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-primary dark:text-white mb-4">
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
                To create a world where finding the right job or the perfect candidate is no longer a matter of luck, 
                but a result of intelligent matching, transparent communication, and mutual respect. We&apos;re eliminating 
                the barriers between talent and opportunity, making career growth accessible to everyone.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              These core principles guide everything we do and every decision we make.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="text-primary dark:text-white">
                      {value.icon}
                    </div>
                    <CardTitle className="text-primary dark:text-white">
                      {value.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary dark:text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              We&apos;re a diverse team of technologists, recruiters, and dreamers united by our passion for connecting people.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="text-6xl mb-4">{member.avatar}</div>
                  <CardTitle className="text-primary dark:text-white">
                    {member.name}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-16">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-3xl text-center text-primary dark:text-white mb-4">
                Our Story
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="text-slate-600 dark:text-slate-300 space-y-6">
                <p>
                  JobConnect Pro started in a small coffee shop in San Francisco, where our founder Sarah Johnson 
                  was frustrated by the inefficiencies she witnessed in traditional recruitment processes. Having 
                  spent over a decade in talent acquisition at major tech companies, she knew there had to be a better way.
                </p>
                <p>
                  The idea was simple: what if job seekers could communicate directly with hiring managers? What if 
                  the application process was transparent and respectful of everyone&apos;s time? What if technology could 
                  truly serve both candidates and companies equally?
                </p>
                <p>
                  Today, JobConnect Pro is trusted by thousands of professionals and hundreds of companies worldwide. 
                  We&apos;ve facilitated over 25,000 successful job matches and continue to grow our community of 
                  forward-thinking organizations and talented individuals.
                </p>
                <p>
                  But we&apos;re just getting started. Our vision extends beyond job matching – we&apos;re building a platform 
                  that supports entire career journeys, from skill development to professional networking to long-term 
                  career planning.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-3xl font-bold text-primary dark:text-white mb-4">
                Ready to Join Our Mission?
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
                Whether you&apos;re looking for your next opportunity or searching for exceptional talent, 
                we&apos;d love to have you as part of the JobConnect Pro community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Get Started Today
                </button>
                <button className="border border-primary text-primary dark:text-white hover:bg-primary/10 px-8 py-3 rounded-lg font-semibold transition-colors">
                  Contact Our Team
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
