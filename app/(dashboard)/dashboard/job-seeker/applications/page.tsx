'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { SkeletonList } from "@/components/ui/skeleton"
import { JobDialog } from "@/components/ui/job-dialog"
import { PastApplicationDetailsDialog } from "@/components/ui/past-application-details-dialog"
import { InterviewDetailsDialog, type InterviewDetails } from "@/components/ui/interview-details-dialog"
import {
  FileText,
  Clock,
  MapPin,
  DollarSign,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  Briefcase,
  Mail,
} from "lucide-react"
import { useDashboard } from "@/context/DashboardContext"

type JobWithCompanyAndSkills = {
  id: string
  title: string
  description: string
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  employmentType: string | null
  remoteType?: string | null
  applicationDeadline?: string | null
  createdAt?: string
  company?: { name: string; logoUrl: string | null }
  skills?: { skill: { id: string; name: string } }[]
}

type CompanyLite = { name: string; logoUrl: string | null }

type Application = {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  job: JobWithCompanyAndSkills | null
  company: CompanyLite
}

type JobInvitationWithJob = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  job: JobWithCompanyAndSkills;
  company: CompanyLite;
  createdAt: string;
  updatedAt?: string; // Add optional updatedAt to match Application type
  isInvitation: true;
};

type JobWithCompany = JobWithCompanyAndSkills & { company: NonNullable<JobWithCompanyAndSkills["company"]> }

export default function JobSeekerApplications() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { targetApplicationTab, setTargetApplicationTab } = useDashboard();
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null)
  const [viewingPastApp, setViewingPastApp] = useState<Application | null>(null)
  const [interviews, setInterviews] = useState<InterviewDetails[]>([])
  const [selectedInterview, setSelectedInterview] = useState<InterviewDetails | null>(null)
  const [invitations, setInvitations] = useState<JobInvitationWithJob[]>([])

  const [activeTab, setActiveTab] = useState(targetApplicationTab || 'ACTIVE');

  useEffect(() => {
    if (targetApplicationTab) {
      setActiveTab(targetApplicationTab);
      // Reset the context state so it doesn't persist
      setTargetApplicationTab(null);
    }
  }, [targetApplicationTab, setTargetApplicationTab]);
  
  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push('/auth/signin'); return }
    if (session.user.role !== 'JOB_SEEKER') { router.push('/dashboard/company'); return }

    const fetchApplications = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/applications/job-seeker')
        if (response.ok) {
          const data = await response.json()
          setApplications(data)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [session, status, router])

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== 'JOB_SEEKER') return
    const fetchInterviews = async () => {
      try {
        const res = await fetch('/api/interviews/job-seeker')
        if (res.ok) {
          const data = await res.json()
          setInterviews(data)
        }
      } catch (e) {
        // ignore
      }
    }
    fetchInterviews()
  }, [session, status])

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== 'JOB_SEEKER') return
    const fetchInvitations = async () => {
      try {
        const res = await fetch('/api/invitations/job-seeker')
        if (res.ok) {
          const data = await res.json()
          setInvitations(data.map((inv: any) => ({ ...inv, isInvitation: true })))
        }
      } catch (e) { /* ignore */ }
    }
    fetchInvitations()
  }, [session, status])

  const statusBuckets = useMemo(() => {
    const now = Date.now()
    const isExpired = (a: Application) => {
      const dl = (a.job as any)?.applicationDeadline
      return dl ? new Date(dl).getTime() < now : false
    }
    const sortByExpiredFirst = (arr: Application[]) => [...arr].sort((a,b) => Number(isExpired(b)) - Number(isExpired(a)))
    const sortInvitations = (arr: JobInvitationWithJob[]) => [...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const buckets = {
      ACTIVE: applications.filter(a => ["PENDING", "REVIEWING", "INTERVIEW", "OFFER"].includes(a.status) && !isExpired(a)),
      EXPIRED: sortByExpiredFirst(applications.filter(a => ["PENDING", "REVIEWING", "INTERVIEW", "OFFER"].includes(a.status) && isExpired(a))),
      INTERVIEW: sortByExpiredFirst(applications.filter(a => a.status === "INTERVIEW")),
      // Combine job offers and pending invitations for the "Offer" tab
      OFFER: sortByExpiredFirst(applications.filter(a => a.status === "OFFER")),
      INVITATIONS: sortInvitations(invitations),
      ACCEPTED: sortByExpiredFirst(applications.filter(a => a.status === "ACCEPTED" || a.status === "INTERVIEW")),
      REJECTED: sortByExpiredFirst(applications.filter(a => a.status === "REJECTED")),
    }
    return buckets
  }, [applications, invitations])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Pending</Badge>
      case "REVIEWING": return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">In Review</Badge>
      case "INTERVIEW": return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Interview</Badge>
      case "OFFER": return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Offer</Badge>
      case "PENDING": return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
      case "ACCEPTED": return <Badge className="bg-green-100 text-green-700 border-green-200">Accepted</Badge>
      case "REJECTED": return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
      case "DECLINED": return <Badge className="bg-red-100 text-red-700 border-red-200">Declined</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "INTERVIEW":
      case "OFFER":
      case "ACCEPTED":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "DECLINED":
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "REVIEWING":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-slate-400" />
    }
  }

  const handleInvitationAction = async (invitationId: string, newStatus: 'ACCEPTED' | 'DECLINED') => {
    const originalInvitations = [...invitations];
    setInvitations(prev => prev.map(inv => inv.id === invitationId ? { ...inv, status: newStatus } : inv));

    try {
      const response = await fetch(`/api/invitations/job-seeker/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // toast.success(`Invitation ${newStatus.toLowerCase()}.`);
        if (newStatus === 'ACCEPTED') {
          // If accepted, we might want to refetch applications to show it in the 'ACTIVE' tab
          const appResponse = await fetch('/api/applications/job-seeker');
          if (appResponse.ok) setApplications(await appResponse.json());
        }
      } else {
        // toast.error(`Failed to ${newStatus.toLowerCase()} invitation.`);
        setInvitations(originalInvitations); // Revert on failure
      }
    } catch (error) {
      // toast.error("An error occurred.");
      setInvitations(originalInvitations);
    }
  };

  const handleAcceptInvitation = (invitationId: string) => handleInvitationAction(invitationId, 'ACCEPTED');
  const handleDeclineInvitation = (invitationId: string) => handleInvitationAction(invitationId, 'DECLINED');

  const openJobDialog = (app: Application | JobInvitationWithJob) => {
    if (!app.job || !app.job.company) return
    const job: JobWithCompany = {
      ...app.job,
      company: app.job.company,
    }
    setSelectedJob(job)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
        <DashboardNav userType="job_seeker" />
        <main className="container mx-auto px-4 py-8"><SkeletonList count={4} /></main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <DashboardNav userType="job_seeker" />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text-primary mb-2 pb-2">My Applications</h1>
          <p className="text-muted-foreground">Track your applications by status and view job details</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-flow-col">
              <TabsTrigger value="ACTIVE" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Active ({statusBuckets.ACTIVE.length})</TabsTrigger>
              <TabsTrigger value="INVITATIONS" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-indigo-50">Invitations ({statusBuckets.INVITATIONS.length})</TabsTrigger>
              <TabsTrigger value="INTERVIEW" className="data-[state=active]:bg-blue-500 data-[state=active]:text-blue-50">Interview ({statusBuckets.INTERVIEW.length})</TabsTrigger>
              <TabsTrigger value="OFFER" className="data-[state=active]:bg-purple-500 data-[state=active]:text-purple-50">Offer ({statusBuckets.OFFER.length})</TabsTrigger>
              <TabsTrigger value="ACCEPTED" className="data-[state=active]:bg-green-600 data-[state=active]:text-green-50">Accepted ({statusBuckets.ACCEPTED.length})</TabsTrigger>
              <TabsTrigger value="REJECTED" className="data-[state=active]:bg-red-600 data-[state=active]:text-red-50">Rejected ({statusBuckets.REJECTED.length})</TabsTrigger>
              <TabsTrigger value="EXPIRED" className="data-[state=active]:bg-slate-600 data-[state=active]:text-slate-50">Expired ({statusBuckets.EXPIRED.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* Content renderer */}
          {(["ACTIVE", "INVITATIONS", "INTERVIEW", "OFFER", "ACCEPTED", "REJECTED", "EXPIRED"] as const).map((tab) => {
            const list: (Application | JobInvitationWithJob)[] = statusBuckets[tab]
            return (
              <TabsContent key={tab} value={tab} className="space-y-6">
                {list.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {list.map(app => {
                      const dl = (app.job as any)?.applicationDeadline;
                      const isJobExpired = dl ? new Date(dl).getTime() < Date.now() : false;
                      let showExpired = isJobExpired;
                      if (app.status === 'INTERVIEW' && isJobExpired) {
                        const iv = interviews.find(i => i.applicationId === app.id);
                        if (iv) {
                          const ivTime = new Date(iv.scheduledAt).getTime();
                          // If interview is still upcoming, do not show expired yet
                          showExpired = ivTime <= Date.now();
                        }
                      }

                      return (
                        <Card key={app.id} className="modern-card hover:shadow-lg transition-shadow border-border/60">
                          <CardContent className="relative p-4 sm:p-6 pb-0">
                            {showExpired && (
                              <div className="absolute -top-2 left-2">
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 border-red-200 dark:border-red-800">Expired</Badge>
                              </div>
                            )}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                              <Avatar className="h-12 w-12 rounded-md">
                                <AvatarImage src={app.company.logoUrl || ''} />
                                <AvatarFallback className="rounded-md bg-primary/10">
                                  <Building className="w-6 h-6 text-primary" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-foreground mb-1">
                                  {app.job?.title || 'Job no longer available'}
                                </h3>
                                <p className="text-muted-foreground">{app.company.name}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {app.job?.employmentType && (
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-700">
                                      <Briefcase className="w-3.5 h-3.5 mr-1" />{app.job.employmentType.replace('_',' ')}
                                    </Badge>
                                  )}
                                  {app.job?.remoteType && (
                                    <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 border-violet-200 dark:border-violet-700">
                                      {app.job.remoteType}
                                    </Badge>
                                  )}
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-700">
                                    <DollarSign className="w-3.5 h-3.5 mr-1" />
                                    {app.job?.salaryMin && app.job?.salaryMax 
                                      ? `Kshs ${
                                          app.job.salaryMin >= 1000 ? `${Math.round(app.job.salaryMin / 1000)}k` : app.job.salaryMin
                                        } - ${
                                          app.job.salaryMax >= 1000 ? `${Math.round(app.job.salaryMax / 1000)}k` : app.job.salaryMax
                                        }`
                                      : 'Competitive'}
                                  </Badge>
                                  {app.job?.location && (
                                    <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">
                                      <MapPin className="w-3.5 h-3.5 mr-1" />{app.job.location}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {'isInvitation' in app ? <Mail className="w-5 h-5 text-indigo-600" /> : getStatusIcon(app.status)}
                              {'isInvitation' in app
                                ? <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Invitation</Badge>
                                : getStatusBadge(app.status)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">
                                <Clock className="w-3.5 h-3.5 mr-1" />Applied {new Date(app.createdAt).toLocaleDateString()}
                              </Badge>
                              {app.job?.applicationDeadline && (
                                <Badge variant="outline" className="text-orange-700 dark:text-orange-200 border-orange-300 dark:border-orange-700">
                                  <Calendar className="w-3.5 h-3.5 mr-1" />Deadline {new Date(app.job.applicationDeadline).toLocaleDateString()}
                                </Badge>
                              )}
                              {tab === 'INTERVIEW' && (() => {
                                const iv = interviews.find(i => i.applicationId === app.id);
                                return iv ? (
                                  <Badge variant="outline" className="text-blue-700 dark:text-blue-200 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/50">
                                    <Calendar className="w-3.5 h-3.5 mr-1" />Interview: {new Date(iv.scheduledAt).toLocaleDateString()}
                                  </Badge>
                                ) : null;
                              })()}
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              {(tab === "ACCEPTED" || tab === "REJECTED") && (
                                <Button size="sm" onClick={() => setViewingPastApp(app as Application)}>
                                  <FileText className="w-4 h-4 mr-2"/>View Details
                                </Button>
                              )}
                              {tab === "OFFER" && 'isInvitation' in app && app.status === 'PENDING' && (
                                <div className="flex flex-wrap gap-2">
                                  <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => handleDeclineInvitation(app.id)}>
                                    Decline
                                  </Button>
                                  <Button size="sm" className="btn-gradient" onClick={() => handleAcceptInvitation(app.id)}>
                                    Accept & Apply
                                  </Button>
                                </div>
                              )}
                              {tab === "INVITATIONS" && 'isInvitation' in app && (
                                <div className="flex flex-nowrap gap-2">
                                  {app.status === 'PENDING' ? <>
                                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => handleDeclineInvitation(app.id)}>Decline</Button>
                                    <Button size="sm" className="btn-gradient" onClick={() => handleAcceptInvitation(app.id)}>Accept & Apply</Button>
                                  </> : (
                                    <Button size="sm" variant="outline" disabled>{app.status}</Button>
                                  )}
                                </div>
                              )}
                              {tab === "INTERVIEW" && (
                                <div className="flex flex-nowrap gap-2">
                                  <Button variant="outline" size="sm" onClick={() => openJobDialog(app)}>
                                    <Eye className="w-4 h-4 mr-2"/>View Job
                                  </Button>
                                  <Button size="sm" className="btn-gradient" onClick={() => { const iv = interviews.find(i => i.applicationId === app.id); if (iv) setSelectedInterview(iv); }}>
                                    <Calendar className="w-4 h-4 mr-2"/>Interview
                                  </Button>
                                </div>
                              )}                              
                              {tab !== 'INTERVIEW' && tab !== 'ACCEPTED' && tab !== 'REJECTED' && tab !== 'OFFER' && tab !== 'INVITATIONS' && (
                                <Button size="sm" className="btn-gradient" onClick={() => openJobDialog(app)}>
                                  <Eye className="w-4 h-4 mr-2" />View Job
                                </Button>
                              )}
                            </div>
                          </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      {tab === 'INVITATIONS' ? (
                        <>
                          <Mail className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No pending invitations</h3>
                          <p className="text-muted-foreground">Invitations from companies to apply for jobs will appear here.</p>
                        </>
                      ) : tab === 'EXPIRED' ? (
                        <>
                          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No expired applications</h3>
                          <p className="text-muted-foreground">Applications for jobs whose deadlines have passed will appear here.</p>
                        </>
                      ) : (
                        <>
                          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No applications in {tab.toLowerCase()}</h3>
                          <p className="text-muted-foreground">When you apply for jobs that match this status, they will appear here.</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>

      {/* Dialogs */}
      <JobDialog
        job={selectedJob as any}
        open={!!selectedJob}
        onOpenChange={(isOpen) => !isOpen && setSelectedJob(null)}
        onApplyClick={() => { /* Job already applied; keep for consistency */ }}
        isApplied={true}
      />

      <PastApplicationDetailsDialog
        application={viewingPastApp as any}
        open={!!viewingPastApp}
        onOpenChange={(isOpen) => !isOpen && setViewingPastApp(null)}
      />

      <InterviewDetailsDialog
        interview={selectedInterview}
        open={!!selectedInterview}
        onOpenChange={(isOpen) => !isOpen && setSelectedInterview(null)}
      />
    </div>
  )
}
