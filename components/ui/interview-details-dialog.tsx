"use client"

import { Building, Calendar, Clock, ExternalLink, Info } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export type InterviewDetails = {
  id: string
  title: string
  description: string | null
  scheduledAt: string
  duration: number
  applicationId: string
  meetingUrl: string | null
  application: { job: { title: string } }
  company: { name: string; logoUrl: string | null }
}

interface InterviewDetailsDialogProps {
  interview: InterviewDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InterviewDetailsDialog({ interview, open, onOpenChange }: InterviewDetailsDialogProps) {
  const scheduledDate = interview ? new Date(interview.scheduledAt) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] sm:h-auto sm:max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 text-left border-b">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-lg border">
              <AvatarImage src={interview?.company.logoUrl || ''} />
              <AvatarFallback className="rounded-lg bg-primary/10">
                <Building className="w-6 h-6 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold truncate">Interview Details</DialogTitle>
              <DialogDescription className="text-base truncate">
                {interview ? (
                  <>For {interview.application.job.title} at {interview.company.name}</>
                ) : null}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          {interview && (
            <div className="p-6 space-y-6">
              <section>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><Info className="w-5 h-5" /> Details</h4>
                <p className="text-2xl font-bold text-foreground mb-4">{interview.title}</p>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {scheduledDate && (
                    <Badge variant="outline" className="text-blue-700 dark:text-blue-200 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/50">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {scheduledDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-purple-700 dark:text-purple-200 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/50">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {interview.duration} minutes
                  </Badge>
                  {interview.meetingUrl && (
                    <a href={interview.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex">
                      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700 dark:hover:bg-green-900/80 cursor-pointer">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Join Meeting
                      </Badge>
                    </a>
                  )}
                </div>
              </section>

              {interview.description && (
                <section>
                  <Separator className="my-4" />
                  <h4 className="font-semibold text-lg mb-3">Notes from the hiring team</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">{interview.description}</p>
                </section>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
