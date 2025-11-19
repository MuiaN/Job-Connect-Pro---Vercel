"use client"

import { Calendar } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import type { Application, Education, Experience, Job, JobSeeker, Skill, User } from "@prisma/client"

type ApplicationWithRelations = Application & {
  job: Pick<Job, 'id' | 'title' | 'status' | 'applicationDeadline'>;
  jobSeeker: JobSeeker & {
    user: Pick<User, 'name' | 'email' | 'image'>;
    skills: { skill: Skill }[];
    experiences: Experience[];
    educations: Education[];
  };
};

interface SchedulableCandidatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: ApplicationWithRelations[];
  onScheduleSelect: (candidate: ApplicationWithRelations) => void;
  scheduledCandidateIds: Set<string>;
}

export function SchedulableCandidatesDialog({
  open,
  onOpenChange,
  candidates,
  onScheduleSelect,
  scheduledCandidateIds,
}: SchedulableCandidatesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="job-dialog-content sm:max-w-2xl">
        <DialogHeader className="job-dialog-header text-left">
          <DialogTitle>Schedule a New Interview</DialogTitle>
          <DialogDescription>Select a candidate who has applied to one of your jobs.</DialogDescription>
        </DialogHeader>
        <div className="job-dialog-body">
          {candidates.length > 0 ? (
            <div className="space-y-3">
              {candidates.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={app.jobSeeker.user.image || ''} />
                      <AvatarFallback>{app.jobSeeker.user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{app.jobSeeker.user.name}</p>
                      <p className="text-sm text-muted-foreground">Applied for: {app.job.title}</p>
                    </div>
                  </div>
                  <Button
                    variant={scheduledCandidateIds.has(app.jobSeekerId) ? "outline" : "default"}
                    size="sm"
                    disabled={scheduledCandidateIds.has(app.jobSeekerId)}
                    onClick={() => onScheduleSelect(app)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {scheduledCandidateIds.has(app.jobSeekerId) ? "Scheduled" : "Schedule"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No available candidates to schedule.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}