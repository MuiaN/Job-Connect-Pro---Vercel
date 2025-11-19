"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type {
  Application,
  Job,
  JobSeeker,
  User,
  Experience,
  Education,
  Skill,
} from "@prisma/client";

export type ApplicationWithRelations = Application & {
  job: Pick<Job, 'title' | 'location' | 'salaryMin' | 'salaryMax' | 'employmentType' | 'applicationDeadline' | 'status'>;
  jobSeeker: JobSeeker & {
    user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
    skills: { skill: Skill }[];
    experiences: Experience[];
    educations: Education[];
  };
};

interface DashboardContextType {
  targetApplicationTab: string | null;
  setTargetApplicationTab: (tab: string | null) => void;
  targetCompanyJobsTab: string | null;
  setTargetCompanyJobsTab: (tab: string | null) => void;
  viewingCandidate: ApplicationWithRelations | null;
  setViewingCandidate: (candidate: ApplicationWithRelations | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [targetApplicationTab, setTargetApplicationTab] = useState<string | null>(null);
  const [targetCompanyJobsTab, setTargetCompanyJobsTab] = useState<string | null>(null);
  const [viewingCandidate, setViewingCandidate] = useState<ApplicationWithRelations | null>(null);

  return (
    <DashboardContext.Provider
      value={{
        targetApplicationTab,
        setTargetApplicationTab,
        targetCompanyJobsTab,
        setTargetCompanyJobsTab,
        viewingCandidate,
        setViewingCandidate,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};