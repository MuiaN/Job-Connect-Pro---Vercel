'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  ExternalLink,
  MapPin,
  Phone,
  Plus,
  Video,
  XCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { DashboardNav } from "@/components/layout/dashboard-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PastInterviewReportDialog } from "@/components/ui/past-interview-report-dialog"
import { SchedulableCandidatesDialog } from "@/components/ui/schedulable-candidates-dialog"
import { ScheduleInterviewDialog } from "@/components/ui/schedule-interview-dialog"
import { SkeletonList } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { Application, Education, Experience, Job, JobSeeker, Skill, User } from "@prisma/client"

type Interview = {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  status: string;
  meetingUrl: string | null;
  description: string | null;
  createdAt: string;
  jobSeeker: {
    id: string;
    user: {
      name: string | null;
      email: string;
      image: string | null;
    }
  };
  application: {
    id: string;
    job: {
      id: string;
      title: string;
      location?: string | null;
      salaryMin?: number | null;
      salaryMax?: number | null;
    } | null;
  } | null;
};

type ApplicationWithRelations = Application & {
  job: Pick<Job, 'id' | 'title' | 'status' | 'applicationDeadline'>;
  jobSeeker: JobSeeker & {
    user: Pick<User, 'name' | 'email' | 'image'>;
    skills: { skill: Skill }[];
    experiences: Experience[];
    educations: Education[];
  };
};

export default function CompanyInterviews() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [schedulableCandidates, setSchedulableCandidates] = useState<ApplicationWithRelations[]>([]);
  const [schedulingFor, setSchedulingFor] = useState<ApplicationWithRelations | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [viewingReport, setViewingReport] = useState<Interview | null>(null);

  const fetchInterviews = useCallback(async () => {
    try {
      const response = await fetch('/api/interviews/company');
      if (response.ok) {
        setInterviews(await response.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

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

    fetchInterviews();
  }, [session, status, router, fetchInterviews])

  const handleOpenScheduleDialog = async () => {
    setIsScheduleDialogOpen(true);
    // Fetch candidates who can be scheduled
    try {
      const response = await fetch('/api/applications/company?includeJob=true');
      if (response.ok) {
        const allApplications: ApplicationWithRelations[] = await response.json();
        const now = new Date();
        const activeApplications = allApplications.filter(app => 
          app.job?.status === 'ACTIVE' && 
          (!app.job.applicationDeadline || new Date(app.job.applicationDeadline) >= now)
        );
        setSchedulableCandidates(activeApplications);
      }
    } catch (error) {
      console.error("Failed to fetch schedulable candidates", error);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!schedulingFor) return;

    setIsScheduling(true);
    const formData = new FormData(e.currentTarget);
    const isEditing = !!editingInterview;
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      scheduledAt: formData.get('scheduledAt'),
      duration: Number(formData.get('duration')),
      meetingUrl: formData.get('meetingUrl'),
      jobSeekerId: schedulingFor.jobSeekerId,
      applicationId: schedulingFor.id,
      companyId: schedulingFor.companyId,
    };
    const editData = { ...data, interviewId: editingInterview?.id };

    try {
      const response = await fetch('/api/interviews/company', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? editData : data),
      });

      if (response.ok) {
        // toast.success("Interview scheduled successfully!");
        setSchedulingFor(null); // Close the scheduling dialog
        setEditingInterview(null);
        await fetchInterviews(); // Refetch interviews to update the list
      } else {
        // toast.error("Failed to schedule interview.");
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingInterview) return;

    setIsScheduling(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      interviewId: editingInterview.id,
      title: formData.get('title'),
      description: formData.get('description'),
      scheduledAt: formData.get('scheduledAt'),
      duration: Number(formData.get('duration')),
      meetingUrl: formData.get('meetingUrl'),
    };

    try {
      const response = await fetch('/api/interviews/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // toast.success("Interview rescheduled successfully!");
        setEditingInterview(null);
        setSchedulingFor(null);
        await fetchInterviews(); // Refresh the list
      } else {
        // toast.error("Failed to reschedule interview.");
      }
    } finally {
      setIsScheduling(false);
    }
  };
  
  const handleReschedule = (interview: Interview) => {
    // We need to construct an `ApplicationWithRelations` object to pass to the dialog
    // This ensures the dialog has the necessary info like candidate name and job title.
    const mockApplication: ApplicationWithRelations = {
      id: interview.application?.id || 'mock-app-id',
      jobId: interview.application?.job?.id || 'unknown',
      companyId: '', // Not needed for the dialog UI
      jobSeekerId: interview.jobSeeker.id,
      status: 'INTERVIEW',
      coverLetter: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: {
        id: interview.application?.job?.id || 'unknown-job-id',
        title: interview.application?.job?.title || 'N/A',
        status: 'ACTIVE', // Assuming active for rescheduling, adjust if needed
        applicationDeadline: null,
      },
      jobSeeker: {
        id: interview.jobSeeker.id,
        user: interview.jobSeeker.user,
        // Add other required fields with default values to satisfy the type.
        userId: '', title: null, location: null, bio: null, website: null, phone: null, resumeUrl: null, salaryMin: null, salaryMax: null, experienceLevel: null, availability: 'OPEN', noticePeriod: null, profileVisibility: 'PUBLIC', remotePreference: 'HYBRID', createdAt: new Date(), updatedAt: new Date(), skills: [], experiences: [], educations: []
      },
    };
    setEditingInterview(interview);
    setSchedulingFor(mockApplication);
  };

  const upcomingInterviews = interviews.filter(i => new Date(i.scheduledAt) >= new Date());
  const pastInterviews = interviews.filter(i => new Date(i.scheduledAt) < new Date());

  const scheduledCandidateIds = useMemo(() => {
    const upcomingIds = upcomingInterviews.map(i => i.jobSeeker.id); // This was the line with the error
    return new Set(upcomingIds);
  }, [upcomingInterviews]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case "hired":
        return <Badge className="bg-green-100 text-green-700">Hired</Badge>
      case "declined":
        return <Badge className="bg-red-100 text-red-700">Declined</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Under Review</Badge>
      default:
        return <Badge variant="secondary">{result}</Badge>
    }
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case "hired":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "declined":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "video": // Assuming 'video' means a meetingUrl is present
        return <Video className="w-4 h-4" />
      case "phone":
        return <Phone className="w-4 h-4" />
      case "in-person":
        return <MapPin className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  if (status === "loading" || loading) {
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
      <DashboardNav userType="company" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text-primary mb-2">Interviews</h1>
            <p className="text-muted-foreground">Manage your interview schedule and candidate evaluations</p>
          </div>
          <Button className="btn-gradient" onClick={handleOpenScheduleDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Interview
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <div className="flex justify-center overflow-x-auto">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-flow-col">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-green-600 data-[state=active]:text-green-50">Upcoming ({upcomingInterviews.length})</TabsTrigger>
              <TabsTrigger value="past" className="data-[state=active]:bg-slate-600 data-[state=active]:text-slate-50">Past ({pastInterviews.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upcoming" className="space-y-6">
            {upcomingInterviews.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {upcomingInterviews.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).map((interview) => (
                  <Card key={interview.id} className="modern-card hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex-grow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={interview.jobSeeker.user.image || ""} />
                              <AvatarFallback>
                                {interview.jobSeeker.user.name?.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-xl font-semibold text-foreground">{interview.jobSeeker.user.name}</h3>
                              <p className="text-muted-foreground">{interview.application?.job?.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            {getStatusBadge(interview.status.toLowerCase())}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                          <Badge variant="outline" className="font-normal text-xs border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
                            <Calendar className="w-3 h-3 mr-1.5" />
                            {new Date(interview.scheduledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </Badge>
                          <Badge variant="outline" className="font-normal text-xs border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                            <Clock className="w-3 h-3 mr-1.5" />
                            {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({interview.duration} mins)
                          </Badge>
                          <Badge variant="outline" className="font-normal text-xs border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                            {getTypeIcon(interview.meetingUrl ? 'video' : 'in-person')}
                            <span className="ml-1.5 capitalize">{interview.meetingUrl ? 'Video Call' : 'In-Person'}</span>
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {interview.description || 'No description provided for this interview.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-slate-500">
                          Scheduled {formatDistanceToNow(new Date(interview.createdAt), { addSuffix: true })}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleReschedule(interview)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
                          {interview.meetingUrl && (
                            <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="btn-gradient">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Join Meeting
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-primary dark:text-white mb-2">No upcoming interviews</h3>
                  <p className="text-muted-foreground mb-4">Schedule interviews with candidates to evaluate their fit for your roles</p>
                  <Button onClick={handleOpenScheduleDialog}><Plus className="w-4 h-4 mr-2" />Schedule Your First Interview</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            {pastInterviews.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pastInterviews.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).map((interview) => (
                  <Card key={interview.id} className="modern-card hover:shadow-lg transition-shadow opacity-80">
                    <CardContent className="p-6">
                      <div className="flex-grow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={interview.jobSeeker.user.image || ""} />
                              <AvatarFallback>{interview.jobSeeker.user.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-xl font-semibold text-foreground">{interview.jobSeeker.user.name}</h3>
                              <p className="text-muted-foreground">{interview.application?.job?.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getResultIcon(interview.status.toLowerCase())}
                            {getResultBadge(interview.status.toLowerCase())}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                          <Badge variant="outline" className="font-normal text-xs border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
                            <Calendar className="w-3 h-3 mr-1.5" />
                            {new Date(interview.scheduledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                          </Badge>
                          <Badge variant="outline" className="font-normal text-xs border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
                            <Clock className="w-3 h-3 mr-1.5" />
                            {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Badge>
                        </div>

                        <div className="mt-4">
                          <h4 className="font-medium text-sm text-foreground mb-2">Interview Feedback</h4>
                          <p className="text-sm text-muted-foreground bg-accent/30 dark:bg-accent/10 p-3 rounded-lg border border-border/30">No feedback recorded.</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t mt-4">
                        <div className="text-sm text-slate-500">Interviewed by You</div>
                        <div className="flex space-x-2"><Button variant="outline" size="sm" onClick={() => setViewingReport(interview)}>View Full Report</Button></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12"><Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-primary dark:text-white mb-2">No past interviews</h3><p className="text-slate-600">Your completed interviews and evaluations will appear here</p></CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <SchedulableCandidatesDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        candidates={schedulableCandidates}
        scheduledCandidateIds={scheduledCandidateIds}
        onScheduleSelect={(app) => { setIsScheduleDialogOpen(false); setSchedulingFor(app); }}
      />

      <ScheduleInterviewDialog
        application={schedulingFor}
        open={!!schedulingFor || !!editingInterview}
        onOpenChange={(isOpen) => { if (!isOpen) { setSchedulingFor(null); setEditingInterview(null); } }}
        onSubmit={editingInterview ? handleRescheduleSubmit : handleScheduleInterview}
        isScheduling={isScheduling}
        interviewData={editingInterview}
      />

      <PastInterviewReportDialog
        interview={viewingReport}
        open={!!viewingReport}
        onOpenChange={(isOpen) => !isOpen && setViewingReport(null)}
        getResultBadge={getResultBadge}
        getResultIcon={getResultIcon}
      />
    </div>
  )
}
