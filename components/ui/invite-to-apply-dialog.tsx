"use client"

import { Briefcase, DollarSign, MapPin, Plus, Send } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

import type { Job, JobSeeker, JobSkill, Skill, User } from "@prisma/client"

type Candidate = JobSeeker & {
  user: Pick<User, 'name'>;
};

type JobWithSkills = Pick<Job, 'id' | 'title' | 'employmentType' | 'location' | 'salaryMin' | 'salaryMax'> & {
  skills: (JobSkill & { skill: Skill })[];
};

interface InviteToApplyDialogProps {
  candidate: Candidate | null;
  // We'll receive applied job IDs from the parent to avoid re-fetching
  appliedJobIds: Set<string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteToApplyDialog({ candidate, open, onOpenChange, appliedJobIds }: InviteToApplyDialogProps) {
  const [activeJobs, setActiveJobs] = useState<JobWithSkills[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [invitedJobIds, setInvitedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      const fetchActiveJobs = async () => {
        try {
          const response = await fetch('/api/jobs/company?status=ACTIVE&fields=id,title,employmentType,location,salaryMin,salaryMax,skills');
          if (response.ok) {
            const jobs = await response.json();
            setActiveJobs(jobs);
          }

          // Fetch invitations to prevent re-inviting
          const invitationsResponse = await fetch(`/api/invitations?jobSeekerId=${candidate?.id}`);
          if (invitationsResponse.ok) setInvitedJobIds(new Set((await invitationsResponse.json()).map((inv: { jobId: string }) => inv.jobId)));
        } finally {
          setIsLoading(false);
        }
      };
      fetchActiveJobs();
    } else {
      // Reset state when dialog closes
      setSelectedJobId(null);
      setMessage("");
      setInvitedJobIds(new Set());
    }
  }, [open, candidate?.id]);

  const handleSendInvitation = async () => {
    if (!selectedJobId || !candidate) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJobId,
          jobSeekerId: candidate.id,
          message,
        }),
      });

      if (response.ok) {
        toast.success(`Invitation sent to ${candidate.user.name}!`);
        onOpenChange(false);
      } else {
        const data = await response.json();
        toast.error(data?.message || "Failed to send invitation.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred while sending the invitation.";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const getEmploymentTypeBadge = (type: string | null) => {
    if (!type) return null;
    const formattedType = type.replace('_', ' ');
    switch (type) {
      case 'FULL_TIME':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-700">{formattedType}</Badge>;
      case 'PART_TIME':
        return <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200 border-sky-200 dark:border-sky-700">{formattedType}</Badge>;
      case 'CONTRACT':
        return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700">{formattedType}</Badge>;
      default:
        return <Badge variant="outline">{formattedType}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite {candidate?.user.name} to Apply</DialogTitle>
          <DialogDescription>
            Select one of your active job postings to invite the candidate to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : activeJobs.length > 0 ? (
            <div className="space-y-4">
              <ScrollArea className="h-64 pr-4 -mr-4">
                <RadioGroup onValueChange={setSelectedJobId} value={selectedJobId || ''} className="space-y-3">
                  {activeJobs.map((job) => (
                    <Label key={job.id} htmlFor={job.id} className={`block ${invitedJobIds.has(job.id) || appliedJobIds.has(job.id) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <div className={`p-4 rounded-lg border-2 bg-card transition-all ${selectedJobId === job.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={job.id} id={job.id} disabled={invitedJobIds.has(job.id) || appliedJobIds.has(job.id)} />
                          <div className="flex gap-2">
                            {invitedJobIds.has(job.id) && <Badge variant="outline" className="border-purple-300 text-purple-700">Invited</Badge>}
                            {appliedJobIds.has(job.id) && <Badge variant="outline" className="border-green-300 text-green-700">Applied</Badge>}
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-base text-foreground">{job.title}</h4>
                            {getEmploymentTypeBadge(job.employmentType)}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {job.location}</div>
                            <div className="flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> {job.salaryMin && job.salaryMax ? `Kshs ${job.salaryMin/1000}k - ${job.salaryMax/1000}k` : 'Not specified'}</div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.skills.slice(0, 4).map(({ skill }) => (
                              <Badge key={skill.id} variant="secondary">{skill.name}</Badge>
                            ))}
                            {job.skills.length > 4 && <Badge variant="outline">+{job.skills.length - 4} more</Badge>}
                          </div>
                        </div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </ScrollArea>
              <Textarea
                placeholder="Add a personal message to the candidate (optional)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-lg">No Active Jobs Found</h3>
              <p className="text-muted-foreground text-sm mb-4">You need an active job posting to send an invitation.</p>
              <Button asChild>
                <Link href="/dashboard/company/jobs/new">
                  <Plus className="w-4 h-4 mr-2" /> Post a New Job
                </Link>
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSendInvitation} disabled={selectedJobId === null || isSending} className="btn-gradient">
            {isSending ? "Sending..." : <><Send className="w-4 h-4 mr-2" /> Send Invitation</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}