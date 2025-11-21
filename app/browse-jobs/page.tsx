"use client"

import { Search, MapPin, DollarSign, Briefcase } from "lucide-react"

import { Footer } from "@/components/footer/footer"
import { Navbar } from "@/components/navigation/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const JOBS = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "Nairobi, Kenya",
    salary: "Kshs 120k - 160k",
    description: "We're looking for a senior frontend developer to join our growing team and help build delightful user experiences.",
    tags: ["React", "TypeScript", "Remote"]
  },
  {
    id: 2,
    title: "Product Manager",
    company: "StartupXYZ",
    location: "Nairobi, Kenya",
    salary: "Kshs 100k - 140k",
    description: "Join our product team to drive innovation and user experience across mobile and web platforms.",
    tags: ["Product", "PM", "Hybrid"]
  },
  {
    id: 3,
    title: "Backend Engineer",
    company: "InfraWorks",
    location: "Mombasa, Kenya",
    salary: "Kshs 110k - 150k",
    description: "Work on scalable backend services and APIs powering modern web applications.",
    tags: ["Node", "Postgres", "Onsite"]
  }
]

export default function BrowseJobsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left - Filters */}
          <aside className="lg:col-span-1">
            <div className="modern-card p-4">
              <h2 className="text-lg font-semibold mb-2">Search Jobs</h2>
              <div className="flex items-center bg-card p-2 rounded-lg">
                <Search className="w-5 h-5 text-muted-foreground mr-2" />
                <input
                  aria-label="Search jobs"
                  placeholder="Search by title, company, or keyword"
                  className="flex-1 bg-transparent outline-none text-sm text-foreground input-modern"
                />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-muted-foreground">Filters</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Remote','Onsite','Hybrid','Full-time','Part-time'].map((f) => (
                  <Badge key={f} variant="outline" className="px-3 py-1">{f}</Badge>
                ))}
              </div>

              <h3 className="mt-4 text-sm font-semibold text-muted-foreground">Categories</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Engineering','Product','Design','Marketing'].map((c) => (
                  <Badge key={c} variant="default" className="px-3 py-1">{c}</Badge>
                ))}
              </div>

              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm">Reset</Button>
                <Button size="sm">Apply</Button>
              </div>
            </div>
          </aside>

          {/* Right - Job listings */}
          <section className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Browse Jobs</h1>
                <p className="text-sm text-muted-foreground">Discover your next career opportunity from thousands of verified companies</p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center space-x-2 bg-card p-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <input placeholder="Location" className="bg-transparent outline-none text-sm input-modern" />
                </div>
                <div className="flex items-center space-x-2 bg-card p-2 rounded-lg">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <input placeholder="Salary" className="bg-transparent outline-none text-sm input-modern" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {JOBS.map((job) => (
                <Card key={job.id} className="modern-card group hover:scale-105 transition-transform">
                  <CardHeader>
                    <div className="flex items-start justify-between w-full">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <CardDescription className="text-sm">{job.company} • {job.location}</CardDescription>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">{job.salary}</div>
                        <div className="text-sm text-muted-foreground">{job.tags.join(' • ')}</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{job.description}</p>
                    <div className="flex items-center gap-3">
                      <Button size="sm" asChild className="btn-gradient">
                        <a href="#">Apply Now</a>
                      </Button>
                      <Button variant="outline" size="sm">Save Job</Button>
                      <div className="ml-auto flex items-center space-x-2">
                        {job.tags.slice(0,3).map((t) => (
                          <Badge key={t} variant="secondary">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination placeholder */}
            <div className="flex items-center justify-center">
              <Button variant="ghost" size="sm">Load more</Button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer - match homepage footer */}
      <Footer />
    </div>
  )
}
