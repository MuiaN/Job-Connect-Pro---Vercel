"use client"

import { Calendar, Eye, Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { SkeletonList } from "@/components/ui/skeleton"

import type { Application, Education, Experience, Job, JobSeeker, JobSkill, Skill, User } from "@prisma/client"

type JobWithRelations = Job & {
  skills: (JobSkill & { skill: Skill })[];
  _count: {
    applications: number;
  };
};

type ApplicationWithRelations = Application & {
    job: Pick<Job, 'title' | 'location' | 'salaryMin' | 'salaryMax' | 'employmentType' | 'applicationDeadline' | 'status'>;
    jobSeeker: JobSeeker & {
        user: Pick<User, 'name' | 'email' | 'image'>;
        skills: { skill: Skill }[];
        experiences: Experience[];
        educations: Education[];
    };
};

interface ApplicationsDialogProps {
  job: JobWithRelations | null;
  applications: ApplicationWithRelations[];
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewProfile: (application: ApplicationWithRelations) => void;
  onSchedule: (application: ApplicationWithRelations) => void;
  scheduledCandidateIds: Set<string>;
  scheduledIcon?: React.ReactNode;
}

export function ApplicationsDialog({
  job,
  applications,
  isLoading,
  open,
  onOpenChange,
  onViewProfile,
  onSchedule,
  scheduledCandidateIds,
  scheduledIcon,
}: ApplicationsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Applications for {job?.title}</DialogTitle>
          <DialogDescription>
            Review candidates who have applied for this position.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <SkeletonList count={3} />
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
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onViewProfile(app)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                    {scheduledCandidateIds.has(app.jobSeekerId) ? (
                      <Button size="sm" className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-200" disabled>
                        {scheduledIcon}
                        Scheduled
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => onSchedule(app)}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <p>No applications yet for this job.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}