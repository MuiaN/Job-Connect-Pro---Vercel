"use client"

import { 
  Building, 
  Calendar, 
  Plus,
  Briefcase,
  Users,
  MapPin,
  Clock,
  Eye,
  Pencil,
  CheckCircle,
  Link as LinkIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState, useMemo } from "react"

import { DashboardNav } from "@/components/layout/dashboard-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CandidateProfileDialog } from "@/components/ui/candidate-profile-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScheduleInterviewDialog } from "@/components/ui/schedule-interview-dialog"
import { SkeletonList } from "@/components/ui/skeleton"
import { useConversation } from "@/context/ConversationContext"
import { useDashboard } from "@/context/DashboardContext"

import type { JobSeeker, Skill, Company, Application, Job, User, Experience, Education } from "@prisma/client"

type ApplicationWithRelations = Application & {
  job: Pick<Job, 'title' | 'location' | 'salaryMin' | 'salaryMax' | 'employmentType' | 'applicationDeadline' | 'status'>;
  jobSeeker: JobSeeker & {
    user: Pick<User, 'id' | 'name' | 'email' | 'image'>; // This is now a full user object from the API
    skills: { skill: Skill }[];
    experiences: Experience[];
    educations: Education[];
  };
};

type JobWithStatus = Pick<Job, 'status'>;

interface DashboardStats {
  activeJobs: number
  totalApplications: number
  interviewsToday: number
  unreadMessages: number
  positionsClosed?: number
}

export default function CompanyDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  // const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Partial<Company> | null>(null)
  const [recentApplications, setRecentApplications] = useState<ApplicationWithRelations[]>([])
  const [jobs, setJobs] = useState<JobWithStatus[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0, totalApplications: 0, interviewsToday: 0, unreadMessages: 0, positionsClosed: 0
  })
  const [loading, setLoading] = useState(true)
  const [schedulingFor, setSchedulingFor] = useState<ApplicationWithRelations | null>(null);
  const [viewingCandidate, setViewingCandidate] = useState<ApplicationWithRelations | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledApplicationIds, setScheduledApplicationIds] = useState<Set<string>>(new Set());
  const [scheduledInterviewsCount, setScheduledInterviewsCount] = useState(0);
  const { setNewConversationInfo } = useConversation();
  const { setTargetCompanyJobsTab } = useDashboard();
  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "COMPANY") {
      router.push("/dashboard/job-seeker")
      return
    }

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [profileResponse, applicationsResponse, statsResponse, jobsResponse, interviewsResponse] = await Promise.all([
          fetch("/api/profile/company"),
          fetch(`/api/applications/company?includeJob=true`), // This now points to the correct API route
          fetch("/api/dashboard"),
          fetch('/api/jobs/company?fields=status'), // Fetch only the status field for efficiency
          fetch('/api/interviews/company')
        ]);

        if (profileResponse.ok) setProfile(await profileResponse.json());
        if (applicationsResponse.ok) setRecentApplications(await applicationsResponse.json());
        if (jobsResponse.ok) setJobs(await jobsResponse.json());
        if (statsResponse.ok) setStats(await statsResponse.json());
        if (interviewsResponse.ok) {
          const interviews = await interviewsResponse.json();
          setScheduledInterviewsCount(interviews.length);
          setScheduledApplicationIds(new Set(interviews.map((i: any) => i.applicationId)));
        }

      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [session, status, router])

  const handleScheduleInterview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!schedulingFor) return;

    setIsScheduling(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      scheduledAt: formData.get('scheduledAt'),
      duration: Number(formData.get('duration')),
      meetingUrl: formData.get('meetingUrl'),
      description: formData.get('description'),
      jobSeekerId: schedulingFor.jobSeekerId,
      applicationId: schedulingFor.id,
      companyId: schedulingFor.companyId,
    };

    try {
      const response = await fetch('/api/interviews/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Using toast from sonner which should be in your layout
        // toast.success("Interview scheduled successfully!");
        setSchedulingFor(null); // Close the scheduling dialog
        setScheduledApplicationIds(prev => new Set(prev).add(schedulingFor.id));
      } else {
        // toast.error("Failed to schedule interview.");
      }
    } finally {
      setIsScheduling(false);
    }
  }

  const handleMessageCandidate = (application: ApplicationWithRelations) => {
    if (!application) return;
    setNewConversationInfo({
      candidateId: application.jobSeeker.user.id,
      name: application.jobSeeker.user.name,
      avatar: application.jobSeeker.user.image,
      applicationId: application.id,
      jobId: application.jobId ?? undefined,
      jobTitle: application.job.title,
    });
    router.push('/dashboard/company/messages');
  };

  const handleCardClick = (tab: string) => {
    setTargetCompanyJobsTab(tab);
    router.push('/dashboard/company/jobs');
  };

  const activeRecentApplications = useMemo(() => {
    return recentApplications.filter(app => app.job.status === 'ACTIVE');
  }, [recentApplications]);

  // Calculate closed positions from the fetched jobs list
  const positionsClosedCount = jobs.filter(job => job.status === 'CLOSED' || job.status === 'PAUSED').length;

  const calculateProfileCompletion = () => {
    if (!profile) return 0;

    const fieldsToCheck: (keyof Company)[] = [
      'logoUrl', 'name', 'description', 'industry', 'size', 'location', 'website'
    ];

    const completedFields = fieldsToCheck.filter(field => !!profile[field]).length;

    return Math.round((completedFields / fieldsToCheck.length) * 100);
  }

  const getSkillBadge = (skillName: string) => {
    return (
      <Badge
        variant="secondary"
        className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
      >
        {skillName}
      </Badge>
    );
  };
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
        <DashboardNav userType="company" />
        <main className="container mx-auto px-4 py-8">
          <SkeletonList />
        </main>
      </div>
    )
  }

  const profileCompletion = calculateProfileCompletion()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <DashboardNav userType="company" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text-primary mb-2 py-2">
            Welcome back, {profile?.name || session?.user?.name}!
          </h1>
          <p className="text-muted-foreground">Find and connect with top talent for your company.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Company Overview */}
          <div className="lg:col-span-1">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Company Profile
                  <Link href="/dashboard/company/profile">
                    <Button variant="ghost" size="sm">
                      <Building className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-28 w-28 mx-auto mb-2 rounded-lg">
                    <AvatarImage src={profile?.logoUrl || ""} alt={profile?.name || "Company Logo"} />
                    <AvatarFallback className="rounded-lg bg-primary/10">
                      <Building className="w-10 h-10 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg text-foreground pt-2">{profile?.name || session?.user?.name}</h3>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {profile?.industry ? (
                    <Badge variant="outline" className="font-normal text-xs border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                      <Briefcase className="w-3 h-3 mr-1.5" />{profile.industry}
                    </Badge>
                  ) : <Badge variant="outline" className="font-normal text-xs border-dashed">Add industry</Badge>}
                  {profile?.size ? (
                    <Badge variant="outline" className="font-normal text-xs border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                      <Users className="w-3 h-3 mr-1.5" />{profile.size}
                    </Badge>
                  ) : <Badge variant="outline" className="font-normal text-xs border-dashed">Add company size</Badge>}
                  {profile?.location ? (
                    <Badge variant="outline" className="font-normal text-xs border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                      <MapPin className="w-3 h-3 mr-1.5" />{profile.location}
                    </Badge>
                  ) : <Badge variant="outline" className="font-normal text-xs border-dashed">Add location</Badge>}
                  {profile?.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex">
                      <Badge variant="outline" className="font-normal text-xs border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900">
                        <LinkIcon className="w-3 h-3 mr-1.5" />{profile.website.replace(/^https?:\/\//, '')}
                      </Badge>
                    </a>
                  )}
                </div>

                <Link href="/dashboard/company/profile">
                  {profileCompletion < 100 ? (
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

            {/* Quick Stats */}
            <Card className="modern-card mt-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Link href="/dashboard/company/jobs/new"><Button className="w-full btn-gradient"><Plus className="w-4 h-4 mr-2" />Post a New Job</Button></Link>
                <Link href="/dashboard/company/jobs"><Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-colors duration-200"><Briefcase className="w-4 h-4 mr-2" />View Job Postings</Button></Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Analytics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/company/jobs" className="flex">
                <Card className="modern-card bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 hover:shadow-lg hover:-translate-y-1 transition-all w-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Active Jobs</CardTitle>
                    <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.activeJobs}</div></CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/company/jobs" className="flex">
                <Card className="modern-card bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/30 hover:shadow-lg hover:-translate-y-1 transition-all w-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Applications</CardTitle>
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalApplications}</div></CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/company/interviews" className="flex">
                <Card className="modern-card bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30 hover:shadow-lg hover:-translate-y-1 transition-all w-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Scheduled Interviews</CardTitle>
                    <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{scheduledInterviewsCount}</div></CardContent>
                </Card>
              </Link>
              <div className="flex cursor-pointer" onClick={() => handleCardClick('closed')}>
                <Card className="modern-card bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30 hover:shadow-lg hover:-translate-y-1 transition-all w-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Positions Closed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-green-900 dark:text-green-100">{positionsClosedCount}</div></CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Activity / Candidates */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle>Recently Active Candidates</CardTitle>
                <CardDescription>Candidates who have recently applied to your active job positions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeRecentApplications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeRecentApplications.slice(0, 6).map((app) => (
                      <Card key={app.id} className="hover:shadow-md transition-shadow flex flex-col">
                        <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center flex-grow">
                          <Avatar className="w-16 h-16 mb-3">
                            <AvatarImage src={app.jobSeeker.user.image || ''} />
                            <AvatarFallback>{app.jobSeeker.user.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <p className="font-semibold text-foreground">{app.jobSeeker.user.name}</p>
                          <div className="w-full p-2 mt-1 mb-2 text-left bg-accent/30 dark:bg-accent/10 rounded-md border border-border/30">
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Briefcase className="w-3 h-3"/>Applied for</p>
                            <p className="font-semibold text-sm text-foreground truncate">{app.job.title}</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2 mb-3">
                            <Badge variant="outline" className="font-normal text-xs border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
                              <Calendar className="w-3 h-3 mr-1.5" />Applied: {new Date(app.createdAt).toLocaleDateString()}
                            </Badge>
                            {app.job?.applicationDeadline && (
                              <Badge variant="outline" className="font-normal text-xs border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                                <Clock className="w-3 h-3 mr-1.5" />Deadline: {new Date(app.job.applicationDeadline).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 justify-center mt-2 mb-4">
                            {app.jobSeeker.skills.slice(0, 3).map(({ skill }) => (
                              <div key={skill.id}>{getSkillBadge(skill.name)}</div>
                            ))}
                            {app.jobSeeker.skills.length > 3 && <Badge variant="outline" className="text-xs">+{app.jobSeeker.skills.length - 3}</Badge>}
                          </div>
                          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full mt-auto pt-4 border-t">
                            <Button variant="outline" size="sm" className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-colors duration-200" onClick={() => setViewingCandidate(app)}>
                              <Eye className="w-3 h-3 mr-1.5" /> View Profile
                            </Button>
                            {scheduledApplicationIds.has(app.id) ? (
                              <Button size="sm" className="flex-1 bg-green-100 text-green-700 border border-green-200 hover:bg-green-200" disabled>
                                <CheckCircle className="w-3 h-3 mr-1.5" /> Scheduled
                              </Button>
                            ) : (
                              <Button size="sm" className="flex-1 btn-gradient" onClick={() => setSchedulingFor(app)}>
                                <Calendar className="w-3 h-3 mr-1.5" /> Schedule
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                    <p>No recent applications to show.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <ScheduleInterviewDialog
          application={schedulingFor}
          open={!!schedulingFor}
          onOpenChange={(isOpen) => !isOpen && setSchedulingFor(null)}
          onSubmit={handleScheduleInterview}
          isScheduling={isScheduling}
        />

        <CandidateProfileDialog
          application={viewingCandidate}
          open={!!viewingCandidate}
          onOpenChange={(isOpen) => !isOpen && setViewingCandidate(null)}
          onSchedule={() => viewingCandidate && setSchedulingFor(viewingCandidate)}
          onMessage={() => { if (viewingCandidate) handleMessageCandidate(viewingCandidate) }}
          isScheduled={!!viewingCandidate && scheduledApplicationIds.has(viewingCandidate.id)}
        />
      </div>
    </div>
  )
}