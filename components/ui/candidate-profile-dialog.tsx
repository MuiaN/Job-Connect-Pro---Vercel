"use client"

import type { JobSeeker, Skill, Company, Application, Job, User, Experience, Education } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Building, Briefcase, GraduationCap, Mail, MessageSquare, Calendar, User as UserIcon, MapPin, DollarSign, Clock } from "lucide-react"
import { useConversation } from "@/context/ConversationContext";
import { useRouter } from "next/navigation";

type ApplicationWithFullRelations = Application & {
  job: Pick<Job, 'title' | 'location' | 'salaryMin' | 'salaryMax' | 'employmentType' | 'applicationDeadline' | 'status'>;
  jobSeeker: JobSeeker & {
    user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
    skills: { skill: Skill }[];
    experiences: (Experience & {
      description?: string | null;
    })[];
    educations: (Education & {
      description?: string | null;
    })[];
  };
};

interface CandidateProfileDialogProps {
  application: ApplicationWithFullRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (application: ApplicationWithFullRelations) => void;
  onMessage: (application: ApplicationWithFullRelations) => void;
  isScheduled: boolean;
}

export function CandidateProfileDialog({ application, open, onOpenChange, onSchedule, onMessage, isScheduled }: CandidateProfileDialogProps) {
  if (!application) return null;

  const { jobSeeker, job = { title: 'N/A', location: null, salaryMin: null, salaryMax: null, employmentType: null, applicationDeadline: null, status: 'OPEN' } } = application;
  const { user, bio, experiences = [], educations = [], skills = [] } = jobSeeker;
  const isJobClosed = job.status === 'CLOSED' || job.status === 'PAUSED';

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
      case 'INTERNSHIP':
        return <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700">{formattedType}</Badge>;
      default:
        return <Badge variant="outline">{formattedType}</Badge>;
    }
  };

  const getSalaryBadge = (job: Pick<Job, 'salaryMin' | 'salaryMax'>) => {
    const text = job.salaryMin && job.salaryMax ? `Kshs ${job.salaryMin/1000}k - ${job.salaryMax/1000}k` : 'Not specified';
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-700 font-semibold">{text}</Badge>;
  }

  const getSkillBadge = (skillName: string) => {
    return (
      <Badge
        variant="secondary"
        className="break-words max-w-full px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
      >
        {skillName}
      </Badge>
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 text-left border-b ">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 rounded-lg border">
              <AvatarImage src={user.image || ''} />
              <AvatarFallback className="rounded-lg bg-primary/10 text-lg">
                {user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold truncate">{user.name}</DialogTitle>
              <DialogDescription className="text-base truncate">
                {jobSeeker.title || 'No title provided'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1  overflow-auto">
          <div className="p-6 space-y-6">
            <section className="p-4 rounded-lg border bg-gradient-to-br from-accent/20 to-accent/50 dark:from-accent/10 dark:to-accent/20">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <span>Applied For</span>
              </h4>
              <div className="space-y-3">
                <h5 className="font-bold text-xl text-foreground">{job.title}</h5>
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  <Badge variant="outline" className="font-normal text-xs border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"><MapPin className="w-3 h-3 mr-1.5" /> {job.location || 'N/A'}</Badge>
                  {getSalaryBadge(job)}
                  {getEmploymentTypeBadge(job.employmentType)}
                </div>
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="font-normal text-xs border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
                    <Calendar className="w-3 h-3 mr-1.5" />Applied: {new Date(application.createdAt).toLocaleDateString()}
                  </Badge>
                  {job.applicationDeadline && (
                    <Badge variant="outline" className="font-normal text-xs border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                      <Clock className="w-3 h-3 mr-1.5" />Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            </section>

            {bio && (
              <section>
                <Separator className="my-4" />
                <h4 className="font-semibold text-lg mb-3">About</h4>
                <p className="text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">{bio}</p>
              </section>
            )}

            {skills.length > 0 && (
              <section>
                <Separator className="my-4" />
                <h4 className="font-semibold text-lg mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map(({ skill }) => (
                    <div key={skill.id}>{getSkillBadge(skill.name)}</div>
                  ))}
                </div>
              </section>
            )}

            {experiences.length > 0 && (
              <section>
                <Separator className="my-4" />
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" /> Work Experience
                </h4>
                <div className="space-y-4">
                  {experiences.map(exp => (
                    <div key={exp.id} className="break-words p-3 rounded-lg border bg-card">
                      <p className="font-semibold text-base">{exp.title}</p>
                      <p className="text-sm text-muted-foreground mb-1">{exp.company}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {exp.current || !exp.endDate ? 'Present' : new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {educations.length > 0 && (
              <section>
                <Separator className="my-4" />
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" /> Education
                </h4>
                <div className="space-y-4">
                  {educations.map(edu => (
                    <div key={edu.id} className="break-words p-3 rounded-lg border bg-card">
                      <p className="font-semibold text-base">{edu.degree}</p>
                      <p className="text-sm text-muted-foreground mb-1">{edu.field && `${edu.field} • `}{edu.institution}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {edu.current || !edu.endDate ? 'Present' : new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
          </ScrollArea>

        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-background">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1" onClick={isJobClosed ? undefined : () => onMessage(application)}>
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-colors duration-200" disabled={isJobClosed}>
                    <MessageSquare className="w-4 h-4 mr-2" /> Message
                  </Button>
                </div>
              </TooltipTrigger>
              {isJobClosed && <TooltipContent><p>Cannot message for a closed job.</p></TooltipContent>}
            </Tooltip>
          </TooltipProvider>
          <Button 
            className="flex-1 btn-gradient" 
            onClick={() => onSchedule(application)} 
            disabled={isScheduled}
          >
            <Calendar className="w-4 h-4 mr-2" /> 
            {isScheduled ? 'Scheduled' : 'Schedule Interview'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}