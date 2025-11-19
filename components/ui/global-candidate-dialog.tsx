"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useConversation } from "@/context/ConversationContext";
import { useDashboard, ApplicationWithRelations } from "@/context/DashboardContext";


import { CandidateProfileDialog } from "./candidate-profile-dialog";
export function GlobalCandidateDialog() {
  const { viewingCandidate, setViewingCandidate } = useDashboard();
  const { setNewConversationInfo } = useConversation();
  const router = useRouter();

  // Scheduling is handled by the global dialog; no local scheduling state needed here
  const [scheduledApplicationIds, setScheduledApplicationIds] = useState<Set<string>>(new Set());

  // When the dialog opens, fetch the latest interview schedule to check the status
  useEffect(() => {
    if (viewingCandidate) {
      const fetchScheduledInterviews = async () => {
        try {
          const response = await fetch('/api/interviews/company');
          if (response.ok) {
            const interviews = await response.json();
            setScheduledApplicationIds(new Set(interviews.map((i: any) => i.applicationId)));
          }
        } catch (error) { console.error("Failed to fetch interviews for dialog", error); }
      };
      fetchScheduledInterviews();
    }
  }, [viewingCandidate]);

  const handleMessageCandidate = (application: ApplicationWithRelations) => {
    if (!application) return;
    setNewConversationInfo({
      candidateId: application.jobSeeker.user.id,
      name: application.jobSeeker.user.name,
      avatar: application.jobSeeker.user.image,
      applicationId: application.id,
      jobId: application.jobId ?? undefined,
      jobTitle: application.job.title,
    });
    router.push('/dashboard/company/messages');
  };

  return (
    <>
      <CandidateProfileDialog
        application={viewingCandidate}
        open={!!viewingCandidate}
        onOpenChange={(isOpen) => !isOpen && setViewingCandidate(null)}
        onSchedule={() => { /* scheduling is handled elsewhere for the global dialog */ }}
        onMessage={() => viewingCandidate && handleMessageCandidate(viewingCandidate)}
        isScheduled={!!viewingCandidate && scheduledApplicationIds.has(viewingCandidate.id)}
      />
    </>
  );
}