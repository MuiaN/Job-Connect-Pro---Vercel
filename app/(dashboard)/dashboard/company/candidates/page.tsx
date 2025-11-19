'use client'

import {
  Search,
  MapPin,
  DollarSign,
  Eye,
  Sparkles,
  Send,
  EyeOff,
  Briefcase,
  UserPlus,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { DashboardNav } from "@/components/layout/dashboard-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CandidateDetailsDialog } from "@/components/ui/candidate-details-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InviteToApplyDialog } from "@/components/ui/invite-to-apply-dialog"
import { SkeletonList } from "@/components/ui/skeleton"

import type { JobSeeker, Skill, Experience, Education, User as PrismaUser } from "@prisma/client"
// import type { Job } from "@prisma/client"

type Candidate = JobSeeker & {
  user: Pick<PrismaUser, 'id' | 'name' | 'email' | 'image'>;
  skills: { skill: Skill }[];
  experiences: Experience[];
  educations: Education[];
  applications: { jobId: string | null }[];
}

export default function CompanyCandidates() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [invitingCandidate, setInvitingCandidate] = useState<Candidate | null>(null);
  // const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [appliedJobIdsByCandidate, setAppliedJobIdsByCandidate] = useState<Record<string, Set<string>>>({});


  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (session.user.role !== "COMPANY") {
      router.push("/dashboard/job-seeker");
      return;
    }

    const fetchInitialData = async () => {
      try {
        // const jobsResponse = await fetch('/api/jobs/company?status=ACTIVE');
        // if (jobsResponse.ok) {
        //   setActiveJobs(await jobsResponse.json());
        // }
      } catch {
        toast.error("Failed to load active jobs.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [session, status, router]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/candidates/ai-search?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const results = await response.json();
        setCandidates(results);
        const appliedIdsMap: Record<string, Set<string>> = {};
        results.forEach((candidate: Candidate) => {
          appliedIdsMap[candidate.id] = new Set(candidate.applications.map(app => app.jobId).filter(Boolean) as string[]);
        });
        setAppliedJobIdsByCandidate(appliedIdsMap);

      } else {
        toast.error("AI search failed. Please try a different query.");
      }
    } catch {
      toast.error("An error occurred during the search.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleExampleSearch = (query: string) => {
    setSearchQuery(query);
    // We can trigger the search immediately for a better UX,
    // but for consistency with the job seeker page, we'll just set the query.
    // To trigger immediately, you would call handleSearch() here, but be mindful of state updates.
    // A simple approach is to let the user click the search button after the query is populated.
    // Let's trigger it for a better experience.
    // To do this safely, we pass the query directly to handleSearch
    // after setting the state.
    // A better way is to just set the state and let the user click.
    // Let's stick to the job-seeker page's behavior.
  };

  const getExperienceLevelBadge = (level: string | null) => {
    if (!level) return null;
    const formattedLevel = level.replace('_', ' ');
    switch (level) {
      case 'ENTRY':
        return <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 border-teal-200 dark:border-teal-700">{formattedLevel}</Badge>;
      case 'JUNIOR':
        return <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700">{formattedLevel}</Badge>;
      case 'SENIOR':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-700">{formattedLevel}</Badge>;
      case 'LEAD':
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border-rose-200 dark:border-rose-700">{formattedLevel}</Badge>;
      default:
        return <Badge variant="outline">{formattedLevel}</Badge>;
    }
  };

  const getSkillBadge = (skillName: string) => {
    return (
      <Badge
        variant="secondary"
        className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
      >
        {skillName}
      </Badge>
    );
  };


  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case "ACTIVELY_SEARCHING":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-700">Actively Searching</Badge>
      case "OPEN":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-700">Open to Opportunities</Badge>
      case "NOT_LOOKING":
        return <Badge className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">Not Looking</Badge>
      default:
        return <Badge variant="secondary">{availability}</Badge>
    }
  }

  if (status === "loading" || initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
        <DashboardNav userType="company" />
        <main className="container mx-auto px-4 py-8">
          <SkeletonList count={6} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <DashboardNav userType="company" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text-primary mb-2 py-2">Find Candidates</h1>
            <p className="text-muted-foreground">Use our AI-powered search to find the perfect candidate.</p>
          </div>
          <div className="relative w-full md:max-w-lg">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              placeholder="e.g., 'React developers in Nairobi with 5+ years experience...'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-24 h-12 text-base input-modern"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-gradient btn-search-submit"
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {isSearching ? (
          <SkeletonList count={3} />
        ) : hasSearched ? (
          <>
            {/* Results Summary */}
            <div className="mb-8 flex items-center justify-between">
              <p className="text-muted-foreground">
                Found {candidates.length} candidate{candidates.length !== 1 && 's'} for &quot;{searchQuery}&quot;
              </p>
            </div>

            {/* Candidates List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidates.length > 0 ? (
                candidates.map((candidate) => (
                  <Card key={candidate.id} className="modern-card hover:shadow-lg transition-shadow flex flex-col">
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <div className="flex-grow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={candidate.user.image || ""} />
                              <AvatarFallback className="text-lg">
                                {candidate.user.name?.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-xl font-semibold text-foreground mb-1">{candidate.user.name}</h3>
                              <p className="text-muted-foreground flex items-center gap-1.5"><Briefcase className="w-4 h-4"/>{candidate.title}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                          {getAvailabilityBadge(candidate.availability)}
                          {getExperienceLevelBadge(candidate.experienceLevel)}
                          <Badge variant="outline" className="font-normal text-xs border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
                            <MapPin className="w-3 h-3 mr-1.5" />{candidate.location}
                          </Badge>
                          <Badge variant="outline" className="font-normal text-xs border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                            <DollarSign className="w-3 h-3 mr-1.5" />
                            {candidate.salaryMin && candidate.salaryMax ? `Kshs ${candidate.salaryMin/1000}k - ${candidate.salaryMax/1000}k` : 'Not specified'}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {candidate.bio || 'No bio provided.'}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {candidate.skills.slice(0, 5).map(({ skill }) => (
                            <div key={skill.id}>{getSkillBadge(skill.name)}</div>
                          ))}
                          {candidate.skills.length > 5 && <Badge variant="outline" className="text-xs">+{candidate.skills.length - 5} more</Badge>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t mt-auto">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setViewingCandidate(candidate)} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-colors duration-200" >
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                          <Button 
                            size="sm" className="btn-gradient" 
                            onClick={() => setInvitingCandidate(candidate)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" /> Invite to Apply
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <EyeOff className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No candidates found</h3>
                  <p>Your search for &quot;{searchQuery}&quot; didn&apos;t return any results. Try a different query.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">Find your perfect match</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Use natural language to search for candidates by skills, experience, location, and more.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="outline" className="font-normal" onClick={() => handleExampleSearch('senior python developers in Kenya')}>
                &quot;senior python developers in Kenya&quot;
              </Button>
              <Button size="sm" variant="outline" className="font-normal" onClick={() => handleExampleSearch('remote UI/UX designers open to opportunities')}>
                &quot;remote UI/UX designers open to opportunities&quot;
              </Button>
              <Button size="sm" variant="outline" className="font-normal" onClick={() => handleExampleSearch('junior data analysts with SQL and Tableau skills')}>
                &quot;junior data analysts with SQL and Tableau skills&quot;
              </Button>
            </div>
          </div>
        )}
      </div>

      <CandidateDetailsDialog
        candidate={viewingCandidate}
        open={!!viewingCandidate}
        onOpenChange={(isOpen) => !isOpen && setViewingCandidate(null)}
        onInvite={(candidateToInvite) => {
          setViewingCandidate(null);
          setInvitingCandidate(candidateToInvite);
        }}
      />

      <InviteToApplyDialog
        candidate={invitingCandidate}
        open={!!invitingCandidate}
        onOpenChange={(isOpen) => !isOpen && setInvitingCandidate(null)}
        appliedJobIds={invitingCandidate ? appliedJobIdsByCandidate[invitingCandidate.id] : new Set()}
      />
    </div>
  )
}
