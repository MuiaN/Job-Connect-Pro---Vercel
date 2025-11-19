"use client"

import { useEffect, useState } from "react"
import type { Application, Job, JobSeeker, User } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type ApplicationWithRelations = Application & {
  job: Pick<Job, 'title'>;
  jobSeeker: Partial<JobSeeker> & {
    user: Pick<User, 'name' | 'email' | 'image'>;
  };
};

type InterviewData = {
  title: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  meetingUrl: string | null;
}

interface ScheduleInterviewDialogProps {
  application: ApplicationWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isScheduling: boolean;
  interviewData?: Partial<InterviewData> | null;
}

export function ScheduleInterviewDialog({
  application,
  open,
  onOpenChange,
  onSubmit,
  isScheduling,
  interviewData,
}: ScheduleInterviewDialogProps) {
  const isEditing = !!interviewData;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: '60',
    meetingUrl: '',
  });

  const toLocalISOString = (date: Date) => {
    const tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, -1);
    return localISOTime.slice(0, 16);
  };

  // This effect will pre-populate the form when editing
  useEffect(() => {
    if (isEditing && interviewData) {
      setFormData({
        title: interviewData.title || '',
        description: interviewData.description || '',
        scheduledAt: interviewData.scheduledAt ? toLocalISOString(new Date(interviewData.scheduledAt)) : '',
        duration: (interviewData.duration || 60).toString(),
        meetingUrl: interviewData.meetingUrl || '',
      });
    } else {
      // Reset form for new interview
      setFormData({ title: '', description: '', scheduledAt: '', duration: '60', meetingUrl: '' });
    }
  }, [isEditing, open, interviewData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="job-dialog-content">
        {application && (
          <>
            <DialogHeader className="job-dialog-header text-left">
              <DialogTitle>{isEditing ? 'Reschedule' : 'Schedule'} Interview with {application.jobSeeker.user.name}</DialogTitle>
              <DialogDescription>
                For the position of: {application.job.title}
              </DialogDescription>
            </DialogHeader>
            <form id="schedule-interview-form" onSubmit={onSubmit} className="job-dialog-body space-y-4">
              <div>
                <label htmlFor="title" className="text-sm font-medium">Interview Title</label>
                <Input id="title" name="title" placeholder="e.g., Technical Screening" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label htmlFor="scheduledAt" className="text-sm font-medium">Date and Time</label>
                <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required value={formData.scheduledAt} onChange={e => setFormData({...formData, scheduledAt: e.target.value})} />
              </div>
              <div>
                <label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</label>
                <Input id="duration" name="duration" type="number" required value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
              </div>
              <div>
                <label htmlFor="meetingUrl" className="text-sm font-medium">Meeting URL</label>
                <Input id="meetingUrl" name="meetingUrl" placeholder="e.g., https://meet.google.com/xyz-abc-def" required value={formData.meetingUrl} onChange={e => setFormData({...formData, meetingUrl: e.target.value})} />
              </div>
              <div>
                <label htmlFor="description" className="text-sm font-medium">Description / Notes (optional)</label>
                <Textarea id="description" name="description" placeholder="e.g., Agenda, topics to cover, or internal notes." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="job-dialog-footer">
                <Button type="submit" disabled={isScheduling} className="w-full btn-gradient">
                  {isScheduling ? (isEditing ? "Rescheduling..." : "Scheduling...") : (isEditing ? "Confirm Reschedule" : "Schedule Interview")}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}