'use client'

import { Globe, Target, Zap, Users } from 'lucide-react'
import Image from 'next/image'

import { Footer } from '@/components/footer/footer'
import { Navbar } from '@/components/navigation/navbar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PageHeaderProps = {
  badge: string
  title: string
  description: string
}

function PageHeader({ badge, title, description }: PageHeaderProps) {
  return (
    <div className="text-center mb-16">
      <Badge className="mb-4 px-6 py-2 text-sm font-semibold bg-gradient-to-r from-primary to-purple-500 text-primary-foreground border-transparent shadow-lg">{badge}</Badge>
      <h1 className="text-4xl font-bold text-primary dark:text-white mb-4">{title}</h1>
      <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{description}</p>
    </div>
  )
}

const teamMembers = [
  {
    name: "George Muia",
    role: "Lead Full-Stack Engineer",
    bio: "A forward-thinking lead developer specializing in building intelligent, cloud-native applications",
    avatar: "/GM.JPG"
  },
  {
    name: "Brian Miles",
    role: "Full-Stack Developer",
    bio: "A versatile full-stack developer with a passion for creating seamless user experiences and robust backend systems.",
    avatar: "/BM.JPEG"
  }
]

const values = [
  {
    icon: <Users className="h-8 w-8" />,
    title: "For Kenyans, By Kenyans",
    description: "We are deeply committed to our local community, building a platform that understands and serves the unique needs of the Kenyan job market."
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "Quality Connections",
    description: "We focus on creating meaningful, long-term career matches, not just filling positions. Our goal is to foster growth for both individuals and businesses."
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Innovation",
    description: "Leveraging the latest technology, including AI, we make the hiring process smarter, faster, and more efficient for everyone involved."
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Accessibility",
    description: "We're committed to making career opportunities accessible to everyone, everywhere."
  }
]

const stats = [
  { number: "10K+", label: "Kenyan Job Seekers" },
  { number: "500+", label: "Partner Companies" },
  { number: "1K+", label: "Successful Placements" },
  { number: "98%", label: "User Satisfaction" }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <PageHeader
          badge="For Kenyans, By Kenyans"
          title="Connecting Kenyan Talent with Opportunity"
          description="JobConnect Pro was founded in 2025 by the TytanTech development team to bridge the gap between Kenyan job seekers and local companies, creating a seamless platform for talent to meet opportunity without intermediaries."
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
                Our mission is to empower the Kenyan workforce by creating a transparent, efficient, and accessible job market. We strive to eliminate the barriers that make job hunting difficult, ensuring that every qualified Kenyan has the opportunity to build a meaningful career right here at home.
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
              We&apos;re a diverse team of technologists and dreamers united by our passion for connecting people.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 w-full max-w-xs sm:w-64 overflow-hidden">
                <div className="relative w-full aspect-[4/3] -mt-6">
                  <Image 
                    src={member.avatar} 
                    alt={member.name} 
                    fill
                    sizes="(max-width: 640px) 90vw, 256px"
                    className="object-cover" 
                  />
                </div>
                <div className="p-4 text-center">
                  <CardTitle className="text-primary dark:text-white text-lg">
                    {member.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {member.role}
                  </p>
                  <div className="mt-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {member.bio}
                    </p>
                  </div>
                </div>
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
                <p>JobConnect Pro was born from a shared frustration. As the TytanTech development team, we saw firsthand how difficult it was for talented Kenyans to find jobs easily, and for great local companies to find the right people. The process was often slow, filled with intermediaries, and lacked transparency.</p>
                <p>We asked ourselves: What if we could build a platform specifically for Kenyans? A place where job seekers could connect directly with employers, where skills were matched intelligently, and where the entire process was built on trust and efficiency.</p>
                <p>In 2025, we turned that idea into a reality. JobConnect Pro is our answer. It&apos;s more than just a job board; it&apos;s a community-driven platform designed to empower our nation&apos;s workforce. We&apos;re just getting started, but our commitment is unwavering: to build a future where every Kenyan has the tools and access to achieve their career aspirations.</p>
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
