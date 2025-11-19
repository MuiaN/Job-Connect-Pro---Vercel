"use client"

import { Job, JobSkill, Skill, Application, JobSeeker, User, Experience, Education } from "@prisma/client"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton, SkeletonList } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { CandidateProfileDialog } from "@/components/ui/candidate-profile-dialog"
import { 
  Plus, 
  MapPin,
  DollarSign,
  Users,
  Eye,
  Edit,
  Trash2,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react"
import { useDashboard } from "@/context/DashboardContext"
import { useConversation } from "@/context/ConversationContext"

type JobWithRelations = Job & {
  skills: (JobSkill & { skill: Skill })[];
  _count: {
    applications: number;
  };
};

type ApplicationWithRelations = Application & {
  job: Pick<Job, 'title' | 'location' | 'salaryMin' | 'salaryMax' | 'employmentType' | 'applicationDeadline' | 'status'>;
  jobSeeker: JobSeeker & {
    user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
    skills: { skill: Skill }[];
    experiences: Experience[];
    educations: Education[];
  };
};

interface CompanyJobsProps {
  showNav?: boolean;
}

export default function CompanyJobs({ showNav = true }: CompanyJobsProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<JobWithRelations | null>(null)
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([])
  const [isApplicationsLoading, setIsApplicationsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingFor, setSchedulingFor] = useState<ApplicationWithRelations | null>(null);
  const [viewingCandidate, setViewingCandidate] = useState<ApplicationWithRelations | null>(null);
  const [scheduledApplicationIds, setScheduledApplicationIds] = useState<Set<string>>(new Set());
  const { targetCompanyJobsTab, setTargetCompanyJobsTab } = useDashboard();
  const { setNewConversationInfo } = useConversation();

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(targetCompanyJobsTab || 'active');

  useEffect(() => {
    if (targetCompanyJobsTab) {
      setActiveTab(targetCompanyJobsTab);
      setTargetCompanyJobsTab(null);
    }
  }, [targetCompanyJobsTab, setTargetCompanyJobsTab]);

  useEffect(() => {
    setIsLoading(true)
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "COMPANY") {
      router.push("/dashboard/job-seeker")
      return
    }

    const handleViewApplicationFromUrl = async () => {
      const applicationId = searchParams.get('viewApplication');
      if (applicationId) {
        // Fetch the specific application
        try {
          const response = await fetch(`/api/applications/company?applicationId=${applicationId}`);
          if (response.ok) {
            const applicationData: ApplicationWithRelations[] = await response.json();
            if (applicationData.length > 0) {
              setViewingCandidate(applicationData[0]);
            }
          }
        } catch (error) {
          console.error("Failed to fetch application from URL", error);
        }
      }
    };

    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const [jobsResponse, interviewsResponse] = await Promise.all([
          fetch('/api/jobs/company'),
          fetch('/api/interviews/company')
        ]);

        if (jobsResponse.ok) {
          const data = await jobsResponse.json();
          setJobs(data);
        }
        if (interviewsResponse.ok) {
          const interviews = await interviewsResponse.json();
          setScheduledApplicationIds(new Set(interviews.map((i: any) => i.applicationId)));
        }
        await handleViewApplicationFromUrl();

      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false)
      }
    };

    fetchJobs();
  }, [session, status, router]) // searchParams is stable, no need to add it here

  const handleViewApplications = async (job: JobWithRelations) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
    setIsApplicationsLoading(true);
    try {
      const response = await fetch(`/api/jobs/company/${job.id}/applications?full=true`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        toast.error("Failed to fetch applications.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching applications.");
      console.error("Error fetching applications:", error);
    } finally {
      setIsApplicationsLoading(false);
    }
  }

  const handleStatusChange = async (jobId: string, newStatus: Job["status"]) => {
    // Optimistically update the UI
    const originalJobs = [...jobs];
    setJobs(currentJobs =>
      currentJobs.map(job =>
        job.id === jobId ? { ...job, status: newStatus } : job
      )
    );

    try {
      const response = await fetch(`/api/jobs/company/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert the optimistic update on failure
        setJobs(originalJobs);
        toast.error(`Failed to update job status.`);
      } else {
        toast.success(`Job successfully moved to ${newStatus.toLowerCase()}!`);
      }
    } catch (error) {
      setJobs(originalJobs);
      toast.error("An error occurred while updating job status.");
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!schedulingFor) return;

    setIsScheduling(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const companyId = jobs.find(job => job.id === selectedJob?.id)?.companyId;

    try {
      const response = await fetch('/api/interviews/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, jobSeekerId: schedulingFor.jobSeekerId, applicationId: schedulingFor.id, companyId }),
      });

      if (response.ok) {
        toast.success("Interview scheduled successfully!");
        setSchedulingFor(null); // Close the scheduling sub-dialog
      } else {
        toast.error("Failed to schedule interview.");
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


  const now = new Date();
  const activeJobs = jobs.filter(job => 
    job.status === 'ACTIVE' && 
    (!job.applicationDeadline || new Date(job.applicationDeadline) >= now)
  );
  const draftJobs = jobs.filter(job => job.status === 'DRAFT');
  const closedJobs = jobs.filter(job => 
    job.status === 'CLOSED' || 
    job.status === 'PAUSED' ||
    (job.status === 'ACTIVE' && job.applicationDeadline && new Date(job.applicationDeadline) < now)
  );

  const isJobExpired = (job: JobWithRelations) => job.applicationDeadline && new Date(job.applicationDeadline) < now;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
      case "draft":
      case "DRAFT":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Draft</Badge>
      case "closed":
      case "CLOSED":
      case "PAUSED":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Closed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRemoteBadge = (remote: string) => {
    switch (remote.toUpperCase()) {
      case "REMOTE":
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Remote</Badge>
      case "HYBRID":
        return <Badge variant="outline" className="text-purple-600 border-purple-200">Hybrid</Badge>
      case "ONSITE":
        return <Badge variant="outline" className="text-gray-600 border-gray-200">On-site</Badge>
      default:
        return <Badge variant="outline">{remote}</Badge>
    }
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

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
        <DashboardNav userType="company" />
        <main className="container mx-auto px-4 py-8">
          <SkeletonList count={4} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      {showNav && <DashboardNav userType="company" />}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text-primary mb-2 py-2">Job Postings</h1>
            <p className="text-muted-foreground">Manage your job postings and track applications</p>
          </div>
          <Link href="/dashboard/company/jobs/new">
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-flow-col">
              <TabsTrigger value="active" className="data-[state=active]:bg-green-600 data-[state=active]:text-green-50">Active ({activeJobs.length})</TabsTrigger>
              <TabsTrigger value="drafts" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-yellow-50">Drafts ({draftJobs.length})</TabsTrigger>
              <TabsTrigger value="closed" className="data-[state=active]:bg-slate-600 data-[state=active]:text-slate-50">Closed ({closedJobs.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="space-y-6">
            {activeJobs.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeJobs.map((job) => (
                  <Card key={job.id} className="modern-card hover:shadow-lg transition-shadow flex flex-col">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex-grow">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              {getStatusBadge(job.status)}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-700">
                              <Briefcase className="w-3.5 h-3.5 mr-1" />{job.employmentType ? job.employmentType.replace('_',' ') : 'Not specified'}
                            </Badge>
                            <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 border-violet-200 dark:border-violet-700">
                              {job.remoteType}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-700">
                              <DollarSign className="w-3.5 h-3.5 mr-1" />
                              {job.salaryMin && job.salaryMax 
                                ? `Kshs ${
                                    job.salaryMin >= 1000 ? `${Math.round(job.salaryMin / 1000)}k` : job.salaryMin
                                  } - ${
                                    job.salaryMax >= 1000 ? `${Math.round(job.salaryMax / 1000)}k` : job.salaryMax
                                  }`
                                : 'Competitive'}
                            </Badge>
                            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">
                              <MapPin className="w-3.5 h-3.5 mr-1" />{job.location}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.skills.slice(0, 4).map(({ skill }) => (
                              <div key={skill.id}>{getSkillBadge(skill.name)}</div>
                            ))}
                            {job.skills.length > 4 && <Badge variant="outline" className="text-xs">+{job.skills.length - 4} more</Badge>}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-4 mb-4">
                            <Badge variant="outline" className="font-normal text-xs border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
                              <Calendar className="w-3 h-3 mr-1.5" />
                              Posted: {new Date(job.createdAt).toLocaleDateString()}
                            </Badge>
                            {job.applicationDeadline && (
                              <Badge variant="outline" className="font-normal text-xs border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                                <Clock className="w-3 h-3 mr-1.5" />
                                Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center text-muted-foreground">
                            <Users className="w-4 h-4 mr-1.5" />
                            <span className="font-medium">{job._count.applications}</span>
                            <span className="ml-1">
                              {job._count.applications === 1 ? 'application' : 'applications'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewApplications(job)} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-colors duration-200">
                              <Eye className="w-4 h-4 mr-2" />
                              View Applications
                            </Button>
                            <Link href={`/dashboard/company/jobs/${job.id}/edit`}>
                              <Button size="sm" className="btn-gradient">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Job
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
                                  Close
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure you want to close this job?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will move the job to the "Closed" tab and it will no longer be visible to candidates.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleStatusChange(job.id, 'CLOSED')}>Confirm Close</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-primary dark:text-white mb-2">No active job postings</h3>
                  <p className="text-slate-600 mb-4">
                    Create your first job posting to start receiving applications
                  </p>
                  <Link href="/dashboard/company/jobs/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Post Your First Job
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-6">
            {draftJobs.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {draftJobs.map((job) => (
                  <Card key={job.id} className="modern-card hover:shadow-lg transition-shadow border-dashed flex flex-col">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex-grow">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                            <div className="flex items-center space-x-2">
                              {isJobExpired(job) && (
                                <Badge className="bg-red-100 text-red-700 border-red-200">Expired</Badge>
                              )}
                              {getStatusBadge(job.status)}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-700">
                              <Briefcase className="w-3.5 h-3.5 mr-1" />{job.employmentType ? job.employmentType.replace('_',' ') : 'Not specified'}
                            </Badge>
                            <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 border-violet-200 dark:border-violet-700">
                              {job.remoteType}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-700">
                              <DollarSign className="w-3.5 h-3.5 mr-1" />
                              {job.salaryMin && job.salaryMax 
                                ? `Kshs ${
                                    job.salaryMin >= 1000 ? `${Math.round(job.salaryMin / 1000)}k` : job.salaryMin
                                  } - ${
                                    job.salaryMax >= 1000 ? `${Math.round(job.salaryMax / 1000)}k` : job.salaryMax
                                  }`
                                : 'Competitive'}
                            </Badge>
                            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">
                              <MapPin className="w-3.5 h-3.5 mr-1" />{job.location}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.skills.slice(0, 4).map(({ skill }) => (
                              <div key={skill.id}>{getSkillBadge(skill.name)}</div>
                            ))}
                            {job.skills.length > 4 && <Badge variant="outline" className="text-xs">+{job.skills.length - 4} more</Badge>}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-4 mb-4">
                            <Badge variant="outline" className="font-normal text-xs border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
                              <Calendar className="w-3 h-3 mr-1.5" />
                              Created: {new Date(job.createdAt).toLocaleDateString()}
                            </Badge>
                            {job.applicationDeadline && (
                              <Badge variant="outline" className="font-normal text-xs border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                                <Clock className="w-3 h-3 mr-1.5" />
                                Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Draft saved
                          </div>
                          <div className="flex items-center space-x-2">
                            <Link href={`/dashboard/company/jobs/${job.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Continue Editing
                              </Button>
                            </Link>
                            <Button size="sm" className="btn-gradient" onClick={() => handleStatusChange(job.id, 'ACTIVE')}>
                              Publish Job
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600 h-9 w-9">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure you want to close this draft?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will move the job to the "Closed" tab. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel> 
                                  <AlertDialogAction onClick={() => handleStatusChange(job.id, 'CLOSED')}>Confirm Close</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-primary dark:text-white mb-2">No draft job postings</h3>
                  <p className="text-slate-600">
                    Draft jobs will appear here when you save them before publishing
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="closed" className="space-y-6">
            {closedJobs.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {closedJobs.map((job) => (
                  <Card key={job.id} className="modern-card hover:shadow-lg transition-shadow opacity-75 flex flex-col">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex-grow">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                            {getStatusBadge(job.status)}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-700">
                              <Briefcase className="w-3.5 h-3.5 mr-1" />{job.employmentType ? job.employmentType.replace('_',' ') : 'Not specified'}
                            </Badge>
                            <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 border-violet-200 dark:border-violet-700">
                              {job.remoteType}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-700">
                              <DollarSign className="w-3.5 h-3.5 mr-1" />
                              {job.salaryMin && job.salaryMax 
                                ? `Kshs ${
                                    job.salaryMin >= 1000 ? `${Math.round(job.salaryMin / 1000)}k` : job.salaryMin
                                  } - ${
                                    job.salaryMax >= 1000 ? `${Math.round(job.salaryMax / 1000)}k` : job.salaryMax
                                  }`
                                : 'Competitive'}
                            </Badge>
                            <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">
                              <MapPin className="w-3.5 h-3.5 mr-1" />{job.location}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.skills.slice(0, 4).map(({ skill }) => (
                              <div key={skill.id}>{getSkillBadge(skill.name)}</div>
                            ))}
                            {job.skills.length > 4 && <Badge variant="outline" className="text-xs">+{job.skills.length - 4} more</Badge>}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-4 mb-4">
                            <Badge variant="outline" className="font-normal text-xs border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
                              <Calendar className="w-3 h-3 mr-1.5" />
                              Posted: {new Date(job.createdAt).toLocaleDateString()}
                            </Badge>
                            {job.applicationDeadline && (
                              <Badge variant="outline" className="font-normal text-xs border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                                <Clock className="w-3 h-3 mr-1.5" />
                                Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center text-muted-foreground">
                            <Users className="w-4 h-4 mr-1.5" />
                            <span className="font-medium">{job._count.applications}</span>
                            <span className="ml-1">
                              {job._count.applications === 1 ? 'application' : 'applications'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewApplications(job)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Report
                            </Button>
                            <Link href={`/dashboard/company/jobs/new?repostFrom=${job.id}`}>
                              <Button variant="default" size="sm" className="btn-gradient">
                                Repost Job
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-primary dark:text-white mb-2">No closed job postings</h3>
                  <p className="text-slate-600">
                    Closed and completed job postings will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px] modern-card">
          <DialogHeader>
            <DialogTitle>Applications for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Review candidates who have applied for this position.
            </DialogDescription>
          </DialogHeader>          
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {isApplicationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={app.jobSeeker.user.image || ''} />
                        <AvatarFallback>{app.jobSeeker.user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{app.jobSeeker.user.name}</p>
                        <p className="text-sm text-muted-foreground">{app.jobSeeker.title}</p>
                      </div>
                    </div>
                    <div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-colors duration-200" 
                        onClick={() => setViewingCandidate({ ...app, job: selectedJob! })}
                      >
                        <Eye className="w-4 h-4 mr-2" /> View Profile
                      </Button>
                      {scheduledApplicationIds.has(app.id) ? (
                        <Button size="sm" className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-200" disabled>
                          <CheckCircle className="w-4 h-4 mr-2" /> Scheduled
                        </Button>
                      ) : (
                        <Button variant="default" size="sm" onClick={() => setSchedulingFor(app)}><Calendar className="w-4 h-4 mr-2" /> Schedule</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No applications yet for this job.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <>
        {/* This fragment is no longer strictly necessary but is kept for safety */}
        
      {/* Nested Dialog for Scheduling */}
      <Dialog open={!!schedulingFor} onOpenChange={(isOpen) => !isOpen && setSchedulingFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview with {schedulingFor?.jobSeeker.user.name}</DialogTitle>
            <DialogDescription>
              For the position of: {selectedJob?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleInterview} className="space-y-4">
            <div>
              <Label htmlFor="title">Interview Title</Label>
              <Input id="title" name="title" placeholder="e.g., Technical Screening" required />
            </div>
            <div>
              <Label htmlFor="scheduledAt">Date and Time</Label>
              <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select name="duration" defaultValue="60">
                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="meetingUrl">Meeting URL (optional)</Label>
              <Input id="meetingUrl" name="meetingUrl" placeholder="e.g., https://meet.google.com/xyz-abc-def" />
            </div>
            <Button type="submit" disabled={isScheduling}>{isScheduling ? "Scheduling..." : "Schedule Interview"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <CandidateProfileDialog
        application={viewingCandidate}
        open={!!viewingCandidate}
        onOpenChange={(isOpen) => !isOpen && setViewingCandidate(null)}
        onSchedule={() => {
          if (viewingCandidate) setSchedulingFor(viewingCandidate);
        }}
        onMessage={() => viewingCandidate && handleMessageCandidate(viewingCandidate)}
        isScheduled={!!viewingCandidate && scheduledApplicationIds.has(viewingCandidate.id)}
      />
      </>
    </div>
  )
}
