"use client"

import React, { createContext, useState, useContext, ReactNode } from 'react';

type NewConversationInfo = {
  candidateId: string;
  name: string | null;
  avatar: string | null;
  applicationId?: string; // Add applicationId
  jobId?: string; // Add jobId to the context
  jobTitle?: string; // Add jobTitle for display
};

type ConversationContextType = {
  newConversationInfo: NewConversationInfo | null;
  setNewConversationInfo: (info: NewConversationInfo | null) => void;
};

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  const [newConversationInfo, setNewConversationInfo] = useState<NewConversationInfo | null>(null);

  return (
    <ConversationContext.Provider value={{ newConversationInfo, setNewConversationInfo }}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};