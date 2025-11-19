"use client"

import { 
  MessageSquare, 
  Calendar, 
  Plus,
  Eye,
  MapPin,
  DollarSign,
  Clock,
  Building,  
  FileText,
  Briefcase,
  MailPlus,
  EyeOff,
  Sparkles,
  Pencil
} from "lucide-react"
import { Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState, useTransition} from "react"
import { toast } from "sonner"

import { DashboardNav } from "@/components/layout/dashboard-nav"
import { ApplyJobDialog } from "@/components/ui/apply-job-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { JobDialog } from "@/components/ui/job-dialog"
import { SkeletonList } from "@/components/ui/skeleton"
import { useDashboard } from "@/context/DashboardContext"

import type { Job, Skill, Company } from "@prisma/client"

type JobWithCompany = Job & {
  company: Pick<Company, 'name' | 'logoUrl'>;
  skills: { skill: Pick<Skill, 'id' | 'name'> }[];
};

export default function JobSeekerDashboard() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  type JobSeekerProfile = {
    image?: string
    title?: string
    location?: string
    salaryMin?: number
    salaryMax?: number
    availability?: "OPEN" | "ACTIVELY_SEARCHING" | "NOT_LOOKING"
    profileVisibility?: "PUBLIC" | "PRIVATE"
    bio?: string | null
    workExperiences?: any[]
    skills?: any[]
    applications?: { jobId: string | null }[]
  }

  type DashboardStats = {
    invitations?: number
    messages?: number
    interviewRequests?: number
    conversations?: number
    applications?: number
  }

  // type Activity = {
  //   id: string
  //   type: 'PROFILE_VIEW' | 'MESSAGE' | 'INTERVIEW'
  //   companyName: string
  //   timestamp: string
  //   description: string
  // }

  const [profile, setProfile] = useState<JobSeekerProfile | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null);
  const [jobToApply, setJobToApply] = useState<JobWithCompany | null>(null);
  // const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    invitations: 0,
    messages: 0,
    conversations: 0,
    applications: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition();
  const { setTargetApplicationTab } = useDashboard();

  useEffect(() => {
    // This effect is not directly related to the fix but is good practice.
    // It ensures that if the user navigates away and back, the tab state is clean.
    // The primary fix is in handleCardClick and the new useEffect below.
    setTargetApplicationTab(null);
  }, [setTargetApplicationTab]);

  useEffect(() => {
    if (sessionStatus === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "JOB_SEEKER") {
      router.push("/dashboard/company")
      return
    }

    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const dashboardResponse = await fetch("/api/dashboard/job-seeker");

        if (dashboardResponse.ok) {
          const data = await dashboardResponse.json()
          setProfile(data.profile || {})
          setStats(data.stats || {})
          // Set applied jobs from profile data
          if (data.profile?.applications) {
            setAppliedJobIds(new Set(data.profile.applications.map((app: { jobId: string }) => app.jobId)));
          }
        } else {
          console.error("Failed to fetch dashboard data:", dashboardResponse.statusText)
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [session, sessionStatus, router])

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<JobWithCompany[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set<string | null>());

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/jobs/ai-search?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        toast.error("AI search failed. Please try a different query.");
      }
    } catch {
      toast.error("An error occurred during the search.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleExampleSearch = (query: string) => {
    setSearchQuery(query);
    // We need to use a function form of setSearchQuery in handleSearch if we call it immediately
    // So, we'll just trigger it in an effect or let the user click the button.
    // For a better UX, let's trigger it directly.
  };

  const handleCardClick = (tab: string) => {
    setTargetApplicationTab(tab);
    // We will navigate in a useEffect to ensure state is set before navigation
    startTransition(() => router.push('/dashboard/job-seeker/applications'));
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
        <DashboardNav userType="job_seeker" />
        <main className="container mx-auto px-4 py-8">
          <SkeletonList />
        </main>
      </div>
    )
  }

  const calculateProfileCompletion = () => {
    if (!profile) return 0;

    const fields: (keyof JobSeekerProfile)[] = [
      'image', 'title', 'location', 'bio', 'skills', 'workExperiences'
    ];
    const completedFields = fields.filter(field => {
      const value = profile[field];
      return Array.isArray(value) ? value.length > 0 : !!value;
    }).length;

    return Math.round((completedFields / fields.length) * 100);
  }

  const handleConfirmApply = (job: JobWithCompany) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id, companyId: job.companyId }),
        });
  
        if (response.status === 201) {
          toast.success(`Successfully applied for ${job.title}!`);
          // Optionally, update stats or UI
          setStats(prev => ({ ...prev, applications: (prev.applications || 0) + 1 }));
          // Add the new application to the profile state to disable the button
          setProfile(prev => prev ? ({ ...prev, applications: [...(prev.applications || []), { jobId: job.id }] }) : null);
          setJobToApply(null); // Close dialog on success
        } else if (response.status === 409) {
          toast.info("You have already applied for this job.");
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || "Failed to submit application.");
        }
      } catch {
        toast.error("An error occurred while applying.");
      }
    });
  };

  const getEmploymentTypeBadge = (type: string | null) => {
    switch (type) {
      case 'FULL_TIME':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-700">{type.replace('_', ' ')}</Badge>;
      case 'PART_TIME':
        return <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200 border-sky-200 dark:border-sky-700">{type.replace('_', ' ')}</Badge>;
      case 'CONTRACT':
        return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700">{type}</Badge>;
      case 'INTERNSHIP':
        return <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getRemoteTypeBadge = (type: string | null) => {
    switch (type) {
      case 'REMOTE':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-700">{type}</Badge>;
      case 'HYBRID':
        return <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 border-violet-200 dark:border-violet-700">{type}</Badge>;
      case 'ONSITE':
        return <Badge className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getSkillBadge = (skillName: string) => {
    return (
      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
        {skillName}
      </Badge>
    );
  };

  const getExperienceLevelBadge = (level: string | null) => {
    if (!level) return null;
    const formattedLevel = level.replace('_', ' ');
    switch (level) {
      case 'ENTRY':
        return <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 border-teal-200 dark:border-teal-700">{formattedLevel}</Badge>;
      case 'JUNIOR':
        return <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700">{formattedLevel}</Badge>;
      case 'SENIOR':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-700">{formattedLevel}</Badge>;
      case 'LEAD':
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border-rose-200 dark:border-rose-700">{formattedLevel}</Badge>;
      default:
        return <Badge variant="outline">{formattedLevel}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <DashboardNav userType="job_seeker" />

      <div className="container mx-auto px-4 py-8">        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text-primary mb-2 py-2">
                  Welcome back, {session?.user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your job search today.</p>
              </div>
              <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Profile Overview
                  <Link href="/dashboard/job-seeker/profile">
                    <Button variant="ghost" size="sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    <AvatarImage src={profile?.image || session?.user?.image || ""} alt={session?.user?.name || "User"} />
                    <AvatarFallback className="text-lg">
                      {session?.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg text-foreground">{session?.user?.name}</h3>
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4 mr-1.5" />
                    <span>{profile?.title || "Add your title"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {profile?.location ? (
                    <Badge variant="outline" className="font-normal text-xs border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
                      <MapPin className="w-3 h-3 mr-1.5" />
                      {profile.location}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-normal text-xs border-dashed">Add location</Badge>
                  )}
                  {profile?.salaryMin && profile?.salaryMax ? (
                    <Badge variant="outline" className="font-normal text-xs border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                      <DollarSign className="w-3 h-3 mr-1.5" />
                      {`Kshs ${profile.salaryMin}k - ${profile.salaryMax}k`}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-normal text-xs border-dashed">Add salary range</Badge>
                  )}
                  {profile?.availability && (
                    <Badge variant="outline" className={`font-normal text-xs 
                      ${profile.availability === 'ACTIVELY_SEARCHING' && 'border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200'}
                      ${profile.availability === 'OPEN' && 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'}
                      ${profile.availability === 'NOT_LOOKING' && 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200'}
                    `}>
                      <Clock className="w-3 h-3 mr-1.5" />
                      {profile.availability === "OPEN" && "Open to opportunities"}
                      {profile.availability === "ACTIVELY_SEARCHING" && "Actively searching"}
                      {profile.availability === "NOT_LOOKING" && "Not looking"}
                    </Badge>
                  )}
                </div>


                <div className="pt-4 mt-4 border-t">
                  <div className={`p-3 rounded-lg flex items-start gap-3 ${
                    profile?.profileVisibility === 'PUBLIC' 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30' 
                      : 'bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50'
                  }`}>
                    {profile?.profileVisibility === 'PUBLIC' 
                      ? <Eye className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      : <EyeOff className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                    }
                    <div>
                      <p className="font-semibold text-sm text-foreground">Profile is {profile?.profileVisibility === 'PUBLIC' ? 'Public' : 'Private'}</p>
                      <p className="text-xs text-muted-foreground">{profile?.profileVisibility === 'PUBLIC' ? 'Visible to companies in search results.' : 'Hidden from public search results.'}</p>
                    </div>
                  </div>
                </div>

                <Link href="/dashboard/job-seeker/profile">
                  {calculateProfileCompletion() < 100 ? (
                    <Button className="w-full mt-3 mb-2 btn-gradient">
                      <Plus className="w-4 h-4 mr-2" />
                      Complete Profile
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full mt-3 mb-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-colors duration-200">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </Link>
              </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Analytics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" >
              <div className="flex cursor-pointer" onClick={() => handleCardClick('INVITATIONS')}>
                <Card className="modern-card bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 hover:shadow-lg hover:-translate-y-1 transition-all w-full" >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Job Invitations</CardTitle>
                    <MailPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.invitations || 0}</div></CardContent>
                </Card>
              </div>
              <div className="flex cursor-pointer" onClick={() => handleCardClick('ACTIVE')}>
                <Card className="modern-card bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/30 hover:shadow-lg hover:-translate-y-1 transition-all w-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Applications</CardTitle>
                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.applications || 0}</div></CardContent>
                </Card>
              </div>
              <div className="flex cursor-pointer" onClick={() => handleCardClick('INTERVIEW')}>
                <Card className="modern-card bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30 hover:shadow-lg hover:-translate-y-1 transition-all w-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Interviews</CardTitle>
                    <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.interviewRequests || 0}</div></CardContent>
                </Card>
              </div>
              <Link href="/dashboard/job-seeker/messages" className="flex">
                <Card className="modern-card bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30 hover:shadow-lg hover:-translate-y-1 transition-all w-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Messages</CardTitle>
                    <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.conversations || 0}</div></CardContent>
                </Card>
              </Link>
            </div>

            {/* Available Jobs */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle>Available Jobs</CardTitle>
                <CardDescription>Use our AI-powered search to find your next role.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input
                    placeholder="e.g., 'senior react developer in Nairobi...'"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 pr-24 h-12 text-base input-modern"
                  />
                  <Button
                    onClick={handleSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn-gradient btn-search-submit"
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>

                {isSearching ? (
                  <SkeletonList count={3} />
                ) : hasSearched ? (
                  searchResults.length > 0 ? (
                    <div className="space-y-4">
                      {searchResults.map(job => (
                        <Card key={job.id} className="hover:shadow-lg transition-shadow duration-300 border-border/50">
                          <CardContent className="p-4 flex flex-col sm:flex-row items-start gap-4">
                            <Avatar className="h-12 w-12 rounded-md">
                              <AvatarImage src={job.company.logoUrl || ''} alt={job.company.name} />
                              <AvatarFallback className="rounded-md bg-primary/10">
                                <Building className="w-6 h-6 text-primary" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 onClick={() => setSelectedJob(job)} className="font-semibold text-lg hover:underline cursor-pointer text-foreground">
                                    {job.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">{job.company.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-foreground">
                                    {job.salaryMin && job.salaryMax 
                                      ? `Kshs ${
                                          job.salaryMin >= 1000 ? `${Math.round(job.salaryMin / 1000)}k` : job.salaryMin
                                        } - ${
                                          job.salaryMax >= 1000 ? `${Math.round(job.salaryMax / 1000)}k` : job.salaryMax
                                        }`
                                      : 'Competitive'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{job.location}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {getEmploymentTypeBadge(job.employmentType)}
                                {getRemoteTypeBadge(job.remoteType)}
                                {getExperienceLevelBadge(job.experienceLevel)}
                                <Badge variant="outline" className="font-normal text-xs border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                                  <Clock className="w-3 h-3 mr-1.5"/>Posted: {new Date(job.createdAt).toLocaleDateString()}
                                </Badge>
                                {job.applicationDeadline && (
                                  <Badge variant="outline" className="font-normal text-xs border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                                    <Calendar className="w-3 h-3 mr-1.5"/>Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {job.skills.slice(0, 5).map(({ skill }) => (
                                  <div key={skill.id}>
                                    {getSkillBadge(skill.name)}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto pt-2 sm:pt-0 sm:min-w-[100px]">
                              <Button size="sm" className="flex-1" onClick={() => setSelectedJob(job)}>View</Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1" 
                                onClick={() => setJobToApply(job)} 
                                disabled={isPending || appliedJobIds.has(job.id)}
                              >{appliedJobIds.has(job.id) ? 'Applied' : 'Apply'}</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <EyeOff className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                      <h3 className="text-lg font-medium text-foreground mb-1">No jobs found</h3>
                      <p>Your search for &quot;{searchQuery}&quot; didn&apos;t return any results. Try a different query.</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Describe your ideal job</h3>
                    <p className="text-muted-foreground mb-4">Search by title, skills, location, experience level, and more.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button size="sm" variant="outline" className="font-normal" onClick={() => handleExampleSearch('senior react developer in Nairobi')}>
                        &quot;senior react developer in Nairobi&quot;
                      </Button>
                      <Button size="sm" variant="outline" className="font-normal" onClick={() => handleExampleSearch('remote marketing manager roles')}>
                        &quot;remote marketing manager roles&quot;
                      </Button>
                      <Button size="sm" variant="outline" className="font-normal" onClick={() => handleExampleSearch('entry level data analyst jobs')}>
                        &quot;entry level data analyst jobs&quot;
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <JobDialog 
          job={selectedJob} 
          open={!!selectedJob} 
          onOpenChange={(isOpen) => !isOpen && setSelectedJob(null)}
          onApplyClick={(job) => {
            setSelectedJob(null); // Close the JobDialog
            setJobToApply(job);   // Open the ApplyJobDialog
          }}
          isApplied={!!selectedJob && appliedJobIds.has(selectedJob.id)}
        />

        <ApplyJobDialog
          job={jobToApply}
          profile={profile}
          open={!!jobToApply}
          onOpenChange={(isOpen) => !isOpen && setJobToApply(null)}
          onConfirmApply={handleConfirmApply}
          isApplying={isPending}
          hasApplied={!!jobToApply && appliedJobIds.has(jobToApply.id)}
        />

      </div>
    </div>
  )
}