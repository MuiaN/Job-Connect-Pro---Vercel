"use client"

import { Briefcase, CheckCircle, Sparkles, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

import type { Company, Job, Skill } from "@prisma/client"

type JobWithCompanyAndSkills = Job & {
  company: Pick<Company, 'name' | 'logoUrl'>;
  skills: { skill: Pick<Skill, 'id' | 'name'> }[];
};

type JobSeekerProfile = {
  skills?: { skill: { id: string, name: string } }[];
  // Add other profile fields if you want to match more than just skills
};

interface ApplyJobDialogProps {
  job: JobWithCompanyAndSkills | null;
  profile: JobSeekerProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmApply: (job: JobWithCompanyAndSkills) => void;
  isApplying: boolean;
  hasApplied: boolean;
}

export function ApplyJobDialog({
  job,
  profile,
  open,
  onOpenChange,
  onConfirmApply,
  isApplying,
  hasApplied,
}: ApplyJobDialogProps) {
  if (!job) return null;

  const userSkillIds = new Set(profile?.skills?.map(s => s.skill.id) || []);
  const requiredSkills = job.skills;
  const matchedSkills = requiredSkills.filter(s => userSkillIds.has(s.skill.id));
  const missingSkills = requiredSkills.filter(s => !userSkillIds.has(s.skill.id));
  const matchPercentage = requiredSkills.length > 0 ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Apply for {job.title}
          </DialogTitle>
          <DialogDescription>
            Review your profile match before submitting your application to {job.company.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="font-semibold text-lg mb-3 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-yellow-500" />Your Match Score</h3>
            <div className="text-center">
              <p className="text-5xl font-bold gradient-text-primary">{matchPercentage}%</p>
              <p className="text-muted-foreground mt-1">Based on required skills</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-600" />Matched Skills</h4>
              {matchedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {matchedSkills.map(({ skill }) => <Badge key={skill.id} className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-700">{skill.name}</Badge>)}
                </div>
              ) : <p className="text-sm text-muted-foreground">No required skills listed or none of your skills match.</p>}
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center"><XCircle className="w-5 h-5 mr-2 text-red-600" />Missing Skills</h4>
              {missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map(({ skill }) => <Badge key={skill.id} variant="outline" className="border-dashed border-red-400/50 text-red-600 dark:text-red-400">{skill.name}</Badge>)}
                </div>
              ) : <p className="text-sm text-muted-foreground">You have all the required skills!</p>}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          {hasApplied ? (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-md w-full">
              <CheckCircle className="w-4 h-4" /> You have already applied for this job.
            </div>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}
          <Button onClick={() => onConfirmApply(job)} disabled={isApplying || hasApplied} className="btn-gradient">
            {isApplying ? "Submitting..." : "Confirm and Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}