"use client"

import type { Job, Company, JobSkill, Skill } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  DollarSign,
  Clock,
  Building,
  Briefcase,
  Sparkles,
  Check,
  ClipboardList,
  Users,
  X,
  Calendar,
} from "lucide-react"

export type JobWithDetails = Job & {
  company: Pick<Company, 'name' | 'logoUrl'>;
  skills: (JobSkill & { skill: Skill })[];
};

interface JobDetailsDialogProps {
  job: JobWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
  onDecline?: () => void;
  isInvitation?: boolean;
}

export function JobDetailsDialog({ job, open, onOpenChange, onAccept, onDecline, isInvitation = false }: JobDetailsDialogProps) {
  if (!job) return null;

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
      case 'SENIOR':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-700">{formattedType}</Badge>;
      case 'LEAD':
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border-rose-200 dark:border-rose-700">{formattedType}</Badge>;
      default:
        return <Badge variant="outline">{formattedType}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 text-left border-b">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-lg border">
              <AvatarImage src={job.company.logoUrl || ''} />
              <AvatarFallback className="rounded-lg bg-primary/10">
                <Building className="w-6 h-6 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold truncate">{job.title}</DialogTitle>
              <DialogDescription className="text-base truncate">
                {job.company.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center text-muted-foreground"><MapPin className="w-4 h-4 mr-2 text-primary/70" />{job.location}</div>
              <Badge variant="outline" className="text-sm font-medium border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                <DollarSign className="w-4 h-4 mr-2" /> {job.salaryMin && job.salaryMax 
                  ? `Kshs ${
                      job.salaryMin >= 1000 ? `${Math.round(job.salaryMin / 1000)}k` : job.salaryMin
                    } - ${
                      job.salaryMax >= 1000 ? `${Math.round(job.salaryMax / 1000)}k` : job.salaryMax
                    }`
                  : 'Competitive'}
              </Badge>
              <div className="flex items-center">{getEmploymentTypeBadge(job.employmentType)}</div>
              <div className="flex items-center">{getEmploymentTypeBadge(job.experienceLevel || 'Any')}</div>
              {job.applicationDeadline && (
                <div className="flex items-center text-muted-foreground w-full">
                  <Calendar className="w-4 h-4 mr-2 text-primary/70" /> Application Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                </div>
              )}
            </div>

            <Separator />

            <section>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Job Description</h4>
              <p className="text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">{job.description}</p>
            </section>

            {job.requirements && (
              <section>
                <Separator className="my-4" />
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Requirements</h4>
                <p className="text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">{job.requirements}</p>
              </section>
            )}

            {job.benefits && (
              <section>
                <Separator className="my-4" />
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Benefits</h4>
                <p className="text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">{job.benefits}</p>
              </section>
            )}

            {job.skills.length > 0 && (
              <section>
                <Separator className="my-4" />
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><Users className="w-5 h-5" /> Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map(({ skill }) => (
                    <Badge key={skill.id} variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>

        {isInvitation && onAccept && onDecline && (
          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-background gap-2">
            <Button variant="outline" className="flex-1" onClick={onDecline}>
              <X className="w-4 h-4 mr-2" /> Decline
            </Button>
            <Button className="flex-1 btn-gradient" onClick={onAccept}>
              <Check className="w-4 h-4 mr-2" /> Accept & Apply
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}