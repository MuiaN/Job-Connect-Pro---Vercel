"use client"

import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  MapPin,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// This type should ideally be shared, but we define it here for clarity.
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

interface PastInterviewReportDialogProps {
  interview: Interview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getResultBadge: (status: string) => React.ReactNode;
  getResultIcon: (status: string) => React.ReactNode;
}

export function PastInterviewReportDialog({
  interview,
  open,
  onOpenChange,
  getResultBadge,
  getResultIcon,
}: PastInterviewReportDialogProps) {
  if (!interview) return null;

  const { jobSeeker, application, status, scheduledAt, description } = interview;
  const job = application?.job;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 modern-card">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 text-left border-b">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-lg border">
              <AvatarImage src={jobSeeker.user.image || ''} />
              <AvatarFallback className="rounded-lg bg-primary/10 text-lg">
                {jobSeeker.user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold truncate">{jobSeeker.user.name}</DialogTitle>
              <DialogDescription className="text-base truncate">
                Interview Report for <span className="font-semibold text-foreground">{job?.title || 'N/A'}</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getResultIcon(status.toLowerCase())}
              {getResultBadge(status.toLowerCase())}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <section>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <span>Position Details</span>
              </h4>
              <div className="p-4 rounded-lg border bg-accent/30 dark:bg-accent/10 space-y-2">
                <p className="text-lg font-semibold text-foreground">{job?.title || 'Job no longer available'}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job?.location || 'N/A'}</div>
                  <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {job?.salaryMin && job?.salaryMax ? `Kshs ${job.salaryMin/1000}k - ${job.salaryMax/1000}k` : 'Not specified'}</div>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Interview Details</span>
              </h4>
              <div className="p-4 rounded-lg border bg-accent/30 dark:bg-accent/10 space-y-2">
                <p className="font-semibold text-foreground">{interview.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Conducted on {new Date(scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Feedback & Notes</span>
              </h4>
              <div className="p-4 rounded-lg border bg-accent/30 dark:bg-accent/10 min-h-[100px]">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{description || "No feedback was recorded for this interview."}</p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}