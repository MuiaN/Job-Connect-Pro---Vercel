'use client'

import type { Application, Job, Company, Interview } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FileText,
  Clock,
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Briefcase,
  Sparkles,
} from "lucide-react"

type JobWithCompanyAndSkills = Job & {
  company: Pick<Company, 'name' | 'logoUrl'>;
  skills: { skill: { id: string; name: string } }[];
};

type ApplicationWithRelations = Application & {
  job: JobWithCompanyAndSkills | null;
  company: Pick<Company, 'name' | 'logoUrl'>;
  interviews: Interview[];
};

interface PastApplicationDetailsDialogProps {
  application: ApplicationWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusInfo = (status: string, hasInterview: boolean) => {
  switch (status) {
    case "ACCEPTED":
      return {
        Icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        title: "Application Accepted!",
        description: "Congratulations! The company has accepted your application.",
      }
    case "REJECTED":
      return {
        Icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        title: "Application Not Selected",
        description: "Unfortunately, the company has decided not to move forward with your application at this time.",
      }
    case "INTERVIEW":
      return {
        Icon: Sparkles,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        title: "You've Got an Interview!",
        description: "Excellent news! The company is impressed and wants to talk to you. You're on the verge of getting this position. Hold tight, they will reach out with the next steps soon.",
      }
    default:
      // This will now handle PENDING, REVIEWING, OFFER, and any other closed states
      return {
        Icon: AlertCircle,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        title: "Application Closed",
        description: "This application is now closed. The deadline may have passed or the position may have been filled.",
      }
  }
}

export function PastApplicationDetailsDialog({ application, open, onOpenChange }: PastApplicationDetailsDialogProps) {
  if (!application) return null;

  const hasInterview = application.interviews && application.interviews.length > 0;
  const { Icon, color, bgColor, title, description } = getStatusInfo(application.status, hasInterview);
  const deadlinePassed = application.job?.applicationDeadline ? new Date(application.job.applicationDeadline) < new Date() : false;
  const showDeadlineMessage = deadlinePassed && (application.status === 'ACCEPTED' || application.status === 'INTERVIEW');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Application Details</DialogTitle>
          <DialogDescription>
            A summary of your application for the {application.job?.title || 'unavailable'} position.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className={`p-4 rounded-lg flex items-start gap-4 ${bgColor}`}>
            <Icon className={`w-8 h-8 flex-shrink-0 mt-1 ${color}`} />
            <div>
              <h3 className={`text-lg font-semibold ${color}`}>{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {showDeadlineMessage && (
            <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200">
              As much as you got the interview, the position deadline arrived and the job is closed.
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Position Information</h4>
            <div className="flex items-start space-x-4 p-4 border rounded-lg">
              <Avatar className="h-12 w-12 rounded-md">
                <AvatarImage src={application.company.logoUrl || ""} />
                <AvatarFallback><Building className="w-6 h-6"/></AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h5 className="font-semibold text-foreground">{application.job?.title || 'Job no longer available'}</h5>
                <p className="text-muted-foreground text-sm">{application.company.name}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{application.job?.location || 'N/A'}</div>
                  <div className="flex items-center"><Briefcase className="w-4 h-4 mr-1" />{application.job?.employmentType?.replace('_', ' ') || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {hasInterview && (
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Interview Details</h4>
              {application.interviews.map(interview => (
                <div key={interview.id} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <h5 className="font-semibold text-foreground">{interview.title}</h5>
                  <p className="text-sm text-muted-foreground mt-1">{interview.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                    <div className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> Scheduled for: {new Date(interview.scheduledAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Application Timeline</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><FileText className="w-4 h-4 text-slate-500" /></div>
                <div>
                  <p className="font-medium text-foreground">Applied on {new Date(application.createdAt).toLocaleDateString()}</p>
                  <p className="text-muted-foreground">Your application was submitted successfully.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><Calendar className="w-4 h-4 text-slate-500" /></div>
                <div>
                  <p className="font-medium text-foreground">Closed on {new Date(application.updatedAt).toLocaleDateString()}</p>
                  <p className="text-muted-foreground">The application process concluded with a status of <Badge variant="outline">{application.status}</Badge>.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}