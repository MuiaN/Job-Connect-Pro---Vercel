"use client"

import { Building, Calendar, Clock } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import type { Company, Job, Skill } from "@prisma/client"

type JobWithCompany = Job & {
  company: Pick<Company, 'name' | 'logoUrl'>;
  skills: { skill: Pick<Skill, 'id' | 'name'> }[];
};

interface JobDialogProps {
  job: JobWithCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyClick: (job: JobWithCompany) => void;
  isApplied: boolean;
}

export function JobDialog({ job, open, onOpenChange, onApplyClick, isApplied }: JobDialogProps) {
  if (!job) return null;

  const getEmploymentTypeBadge = (type: string | null) => {
    switch (type) {
      case 'FULL_TIME':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-700">{type.replace('_', ' ')}</Badge>;
      case 'PART_TIME':
        return <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200 border-sky-200 dark:border-sky-700">{type.replace('_', ' ')}</Badge>;
      case 'CONTRACT':
        return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700">{type}</Badge>;
      case 'INTERNSHIP':
        return <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getRemoteTypeBadge = (type: string | null) => {
    switch (type) {
      case 'REMOTE':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-700">{type}</Badge>;
      case 'HYBRID':
        return <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 border-violet-200 dark:border-violet-700">{type}</Badge>;
      case 'ONSITE':
        return <Badge className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">{type}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getSkillBadge = (skillName: string) => {
    return (
      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
        {skillName}
      </Badge>
    );
  };

  const getSalaryBadge = (job: JobWithCompany) => {
    const text = job.salaryMin && job.salaryMax 
      ? `Kshs ${
          job.salaryMin >= 1000 ? `${Math.round(job.salaryMin / 1000)}k` : job.salaryMin
        } - ${
          job.salaryMax >= 1000 ? `${Math.round(job.salaryMax / 1000)}k` : job.salaryMax
        }`
      : 'Competitive Salary';
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-700 font-semibold">{text}</Badge>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="job-dialog-content">
        <DialogHeader className="job-dialog-header">
          <div className="flex items-start gap-4">
            {job.company && (
              <Avatar className="h-16 w-16 rounded-lg border">
                <AvatarImage src={job.company.logoUrl || ''} />
                <AvatarFallback className="rounded-lg bg-primary/10">
                  <Building className="w-8 h-8 text-primary" />
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <DialogTitle className="text-2xl font-bold">{job.title}</DialogTitle>
              <DialogDescription className="text-base">
                {job.company?.name} &middot; {job.location}
              </DialogDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                {getEmploymentTypeBadge(job.employmentType)}
                {getRemoteTypeBadge(job.remoteType)}
                {getSalaryBadge(job)}
                <Badge variant="outline" className="font-normal text-xs border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                  <Clock className="w-3 h-3 mr-1.5"/>Posted: {new Date(job.createdAt).toLocaleDateString()}
                </Badge>
                {job.applicationDeadline && (
                  <Badge variant="outline" className="font-normal text-xs border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                    <Calendar className="w-3 h-3 mr-1.5"/>Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="job-dialog-body">
          <div>
            <h4 className="font-semibold text-lg mb-2">Job Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
          </div>
          {job.skills.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">{job.skills.map(({ skill }) => <div key={skill.id}>{getSkillBadge(skill.name)}</div>)}</div>
            </div>
          )}
          {job.requirements && <div><h4 className="font-semibold text-lg mb-2">Requirements</h4><p className="text-muted-foreground whitespace-pre-wrap">{job.requirements}</p></div>}
          {job.benefits && <div><h4 className="font-semibold text-lg mb-2">Benefits</h4><p className="text-muted-foreground whitespace-pre-wrap">{job.benefits}</p></div>}
        </div>
        <DialogFooter className="job-dialog-footer">
          <Button size="lg" className="w-full btn-gradient" onClick={() => onApplyClick(job)} disabled={isApplied}>
            {isApplied ? 'Already Applied' : 'Apply Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}