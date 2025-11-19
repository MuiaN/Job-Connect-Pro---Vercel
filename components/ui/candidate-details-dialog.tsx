"use client"

import { Briefcase, GraduationCap, UserPlus } from "lucide-react"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import type { Education, Experience, JobSeeker, Skill, User } from "@prisma/client"

type Candidate = JobSeeker & {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  skills: { skill: Skill }[];
  experiences: Experience[];
  educations: Education[];
  applications: { jobId: string | null }[];
};

interface CandidateDetailsDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (candidate: Candidate) => void;
}

export function CandidateDetailsDialog({ candidate, open, onOpenChange, onInvite }: CandidateDetailsDialogProps) {
  if (!candidate) return null;

  const { user, bio, experiences = [], educations = [], skills = [] } = candidate;

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

  const getAvailabilityBadge = (availability: string) => {
    if (!availability) return null;
    const text = availability.replace(/_/g, ' ');
    switch (availability) {
      case "ACTIVELY_SEARCHING":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">{text}</Badge>
        );
      case "OPEN":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">{text}</Badge>
        );
      case "NOT_LOOKING":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">{text}</Badge>
        );
      default:
        return <Badge variant="secondary">{text}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 text-left border-b">
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
                {candidate.title || 'No title provided'}
              </DialogDescription>
              <div className="mt-2">
                {getAvailabilityBadge(candidate.availability)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {bio && (
              <section>
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

        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-background gap-2">
          <Button className="w-full btn-gradient btn-gradient-subtle transition-transform" onClick={() => onInvite(candidate)}>
            <UserPlus className="w-4 h-4 mr-2" /> Invite to Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}