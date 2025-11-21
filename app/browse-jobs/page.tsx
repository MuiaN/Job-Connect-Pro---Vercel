"use client"

import { Search, Sparkles, Send, EyeOff, Clock, Calendar, Building } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Footer } from "@/components/footer/footer"
import { Navbar } from "@/components/navigation/navbar"
import { ApplyJobDialog } from "@/components/ui/apply-job-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { JobDialog } from "@/components/ui/job-dialog"
import { SkeletonList } from "@/components/ui/skeleton"

import type { Job, Skill, Company } from "@prisma/client"

type JobWithCompany = Job & {
  company: Pick<Company, 'name' | 'logoUrl' | 'industry'>;
  skills: { skill: Pick<Skill, 'id' | 'name'> }[];
};


export default function BrowseJobsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<JobWithCompany[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null);
  const [jobToApply, setJobToApply] = useState<JobWithCompany | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/jobs/ai-search?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        // Extract unique categories from results
        const categories = [...new Set(results.map((job: JobWithCompany) => job.company.industry).filter(Boolean))] as string[];
        setAvailableCategories(categories);
        setSelectedCategories([]); // Reset filters on new search
        setSelectedFilters([]); // Reset filters on new search
      } else {
        toast.error("AI search failed. Please try a different query.");
        setSearchResults([]);
      }
    } catch {
      toast.error("An error occurred during the search.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExampleSearch = (query: string) => {
    setSearchQuery(query);
    // Trigger search after setting query for better UX
    // This will now also populate the categories
    startTransition(() => {
      handleSearch();
    });
  };

  const handleApplyClick = (job: JobWithCompany) => {
    if (!session) {
      router.push(`/signin?callbackUrl=/browse-jobs&jobId=${job.id}`);
    } else {
      // This part is for logged-in users, but good to have
      setJobToApply(job);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedFilters([]);
  };

  // --- Badge Helper Functions (from job-seeker dashboard) ---
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

  const getRemoteTypeBadge = (type: string | null) => {
    if (!type) return null;
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

  const jobsToDisplay = hasSearched ? searchResults.filter(job => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(job.company.industry ?? '');
    
    if (selectedFilters.length === 0) {
      return categoryMatch;
    }

    const filterMatch = selectedFilters.every(filter => {
      const remoteTypeMatch = job.remoteType === filter.toUpperCase();
      const employmentTypeMatch = job.employmentType === filter.toUpperCase().replace('-', '_');
      return remoteTypeMatch || employmentTypeMatch;
    });

    return categoryMatch && filterMatch;
  }) : [];

  const workStyleFilters = ['Remote', 'Onsite', 'Hybrid'];
  const employmentTypeFilters = ['Full-time', 'Part-time', 'Contract', 'Internship'];

  const showReset = selectedCategories.length > 0 || selectedFilters.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Browse Jobs</h1>
          <p className="text-lg text-muted-foreground">Discover your next career opportunity from thousands of verified companies</p>
        </div>

        <div className="relative mb-8 max-w-3xl mx-auto">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
          <Input
            placeholder="Use AI to search by title, skills, location, e.g., 'senior react developer in Nairobi...'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-12 pr-28 h-14 text-base input-modern"
          />
          <Button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-gradient btn-search-submit h-10 px-4"
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            <span className="hidden sm:inline">{isSearching ? 'Searching...' : 'Search'}</span>
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left - Filters */}
          <aside className="lg:col-span-1">
            <div className="modern-card p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Filters</h3>
              <h3 className="mt-4 text-sm font-semibold text-muted-foreground">Work Style</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {workStyleFilters.map((filter) => {
                  const isSelected = selectedFilters.includes(filter);
                  return (
                    <Button
                      key={filter}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterToggle(filter)}
                      className="px-3 py-1 h-auto text-xs rounded-full transition-all"
                    >{filter}</Button>
                  );
                })}
              </div>
              
              <h3 className="mt-6 text-sm font-semibold text-muted-foreground">Employment Type</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {employmentTypeFilters.map((filter) => {
                  const isSelected = selectedFilters.includes(filter);
                  return (
                    <Button
                      key={filter}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterToggle(filter)}
                      className="px-3 py-1 h-auto text-xs rounded-full transition-all"
                    >{filter}</Button>
                  );
                })}
              </div>

              {hasSearched && availableCategories.length > 0 && (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-muted-foreground">Categories from your search</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableCategories.map((category) => {
                      const isSelected = selectedCategories.includes(category);
                      return (
                        <Button
                          key={category}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCategoryToggle(category)}
                          className="px-3 py-1 h-auto text-xs rounded-full transition-all"
                        >
                          {category}
                        </Button>
                      );
                    })}
                  </div>
                </>
              )}

              {showReset && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs h-auto p-1 mt-4 w-full">Reset All Filters</Button>
              )}
            </div>
          </aside>

          {/* Right - Job listings */}
          <section className="lg:col-span-3 space-y-6">
            {isSearching ? (
              <SkeletonList count={4} />
            ) : hasSearched ? (
              jobsToDisplay.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {jobsToDisplay.map((job) => (
                    <Card key={job.id} className="modern-card group hover:scale-105 transition-transform">
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start gap-4">
                        <Avatar className="h-12 w-12 rounded-md">
                          <AvatarImage src={job.company.logoUrl || ''} alt={job.company.name} />
                          <AvatarFallback className="rounded-md bg-primary/10">
                            <Building className="w-6 h-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 onClick={() => setSelectedJob(job)} className="font-semibold text-lg hover:underline cursor-pointer text-foreground">
                                {job.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">{job.company.name}</p>
                            </div>
                            <div className="text-right flex-shrink-0 pl-2">
                              <p className="font-semibold text-foreground">
                                {job.salaryMin && job.salaryMax 
                                  ? `Kshs ${
                                      job.salaryMin >= 1000 ? `${Math.round(job.salaryMin / 1000)}k` : job.salaryMin
                                    } - ${
                                      job.salaryMax >= 1000 ? `${Math.round(job.salaryMax / 1000)}k` : job.salaryMax
                                    }`
                                  : 'Competitive'}
                              </p>
                              <p className="text-xs text-muted-foreground">{job.location}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {getEmploymentTypeBadge(job.employmentType)}
                            {getRemoteTypeBadge(job.remoteType)}
                            {getExperienceLevelBadge(job.experienceLevel)}
                            <Badge variant="outline" className="font-normal text-xs border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                              <Clock className="w-3 h-3 mr-1.5"/>Posted: {new Date(job.createdAt).toLocaleDateString()}
                            </Badge>
                            {job.applicationDeadline && (
                              <Badge variant="outline" className="font-normal text-xs border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                                <Calendar className="w-3 h-3 mr-1.5"/>Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.skills.slice(0, 5).map(({ skill }) => (
                              <div key={skill.id}>
                                {getSkillBadge(skill.name)}
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 w-full pt-4">
                            <Button size="sm" className="flex-1" onClick={() => setSelectedJob(job)}>View Details</Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1" 
                              onClick={() => handleApplyClick(job)} 
                              disabled={isPending}
                            >
                              {session ? 'Apply Now' : 'Sign in to Apply'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground col-span-full">
                  <EyeOff className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-medium text-foreground mb-2">No Jobs Found</h3>
                  <p>Your search for &quot;{searchQuery}&quot; didn&apos;t return any results. Try a different query.</p>
                </div>
              )
            ) : (
              <div className="text-center py-16 text-muted-foreground col-span-full">
                <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-medium text-foreground mb-2">Find Your Dream Job</h3>
                <p className="mb-4">Use the AI-powered search to find jobs by title, skills, location, and more.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" variant="outline" className="font-normal" onClick={() => handleExampleSearch('senior react developer in Nairobi')}>
                    e.g., &quot;senior react developer in Nairobi&quot;
                  </Button>
                  <Button size="sm" variant="outline" className="font-normal" onClick={() => handleExampleSearch('remote marketing manager roles')}>
                    e.g., &quot;remote marketing manager roles&quot;
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      <JobDialog 
        job={selectedJob} 
        open={!!selectedJob} 
        onOpenChange={(isOpen) => !isOpen && setSelectedJob(null)}
        onApplyClick={handleApplyClick}
        isApplied={false} // Public page, user is not logged in to know this
      />

      {/* This dialog is for logged-in users, but we keep the component for consistency */}
      <ApplyJobDialog
        job={jobToApply}
        profile={null} // No profile on public page
        open={!!jobToApply && !!session}
        onOpenChange={(isOpen) => !isOpen && setJobToApply(null)}
        onConfirmApply={() => {}} // This will be handled by redirecting to sign-in
        isApplying={isPending}
        hasApplied={false}
      />
    </div>
  )
}
