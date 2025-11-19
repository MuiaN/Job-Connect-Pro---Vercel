"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  X,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Users,
  Briefcase,
  FileText,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Job, JobSkill, Skill as PrismaSkill } from "@prisma/client"

interface Skill {
  name: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
}

type JobWithSkills = Job & {
  skills: (JobSkill & { skill: PrismaSkill })[];
};

export default function NewJobPosting() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [newSkillLevel, setNewSkillLevel] = useState<Skill['level']>("INTERMEDIATE")

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    workType: "",
    employmentType: "FULL_TIME",
    remoteType: "HYBRID",
    experienceLevel: "",
    salaryMin: "",
    salaryMax: "",
    description: "",
    requirements: "",
    benefits: "",
    applicationDeadline: "",
  })

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "COMPANY") {
      router.push("/dashboard/job-seeker")
      return
    }

    const repostJobId = searchParams.get("repostFrom");
    if (repostJobId) {
      const fetchJobData = async () => {
        try {
          const response = await fetch(`/api/jobs/company/${repostJobId}`);
          if (!response.ok) {
            toast.error("Failed to fetch job data for reposting.");
            return;
          }
          const job: JobWithSkills = await response.json();

          setFormData({
            title: job.title,
            location: job.location || "",
            remoteType: job.remoteType,
            department: job.department || "",
            employmentType: job.employmentType || "FULL_TIME",
            experienceLevel: job.experienceLevel || "",
            salaryMin: job.salaryMin?.toString() || "",
            salaryMax: job.salaryMax?.toString() || "",
            applicationDeadline: "", // Reset deadline for new post
            description: job.description || "",
            requirements: job.requirements || "",
            benefits: job.benefits || "",
            workType: "", // This field is not used
          });

          setSkills(job.skills.map(s => ({ name: s.skill.name, level: s.level })));
          toast.info("Job data has been pre-filled for reposting.");

        } catch (error) {
          toast.error("An error occurred while fetching job data.");
        }
      };

      fetchJobData();
    }
  }, [session, status, router, searchParams])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.find(s => s.name.toLowerCase() === newSkill.trim().toLowerCase())) {
      setSkills([...skills, { name: newSkill.trim(), level: newSkillLevel }])
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: Skill) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleSubmit = async (publish: boolean = false) => {
    setIsLoading(true)

    try {
      const jobData = {
        ...formData,
        skills,
        status: publish ? "ACTIVE" : "DRAFT",
      }

      const response = await fetch('/api/jobs/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        toast.success(`Job successfully ${publish ? 'published' : 'saved as draft'}!`)
        router.push("/dashboard/company/jobs")
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to create job posting.")
      }
    } catch (error) {
      console.error("Error creating job posting:", error)
      toast.error("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardNav userType="company" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8 flex items-start justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/company/jobs">
              <Button variant="ghost" size="sm" className="hover:bg-accent/50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Create Job Posting
              </h1>
              <p className="text-muted-foreground">Fill in the details to create a new job posting</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <motion.div 
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Basic Information */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <span>Basic Information</span>
                </CardTitle>
                <CardDescription>
                  Essential details about the job position
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="mb-1.5 block">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Senior Frontend Developer"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="input-modern border-2 border-black dark:border-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="mb-1.5 block">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                      <SelectTrigger className="input-modern border-2 border-black dark:border-white">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent className="glass-strong">
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="mb-1.5 block">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g. San Francisco, CA"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="input-modern border-2 border-black dark:border-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workType" className="mb-1.5 block">Work Type</Label>
                    <Select value={formData.remoteType} onValueChange={(value) => handleInputChange("remoteType", value)}>
                      <SelectTrigger className="input-modern border-2 border-black dark:border-white">
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                      <SelectContent className="glass-strong">
                        <SelectItem value="REMOTE">Remote</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                        <SelectItem value="ONSITE">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentType" className="mb-1.5 block">Employment Type</Label>
                    <Select value={formData.employmentType} onValueChange={(value) => handleInputChange("employmentType", value)}>
                      <SelectTrigger className="input-modern border-2 border-black dark:border-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full-time</SelectItem>
                        <SelectItem value="PART_TIME">Part-time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="INTERNSHIP">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel" className="mb-1.5 block">Experience Level</Label>
                    <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange("experienceLevel", value)}>
                      <SelectTrigger className="input-modern border-2 border-black dark:border-white">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRY">Entry Level</SelectItem>
                        <SelectItem value="JUNIOR">Junior</SelectItem>
                        <SelectItem value="MID">Mid-Level</SelectItem>
                        <SelectItem value="SENIOR">Senior</SelectItem>
                        <SelectItem value="LEAD">Lead</SelectItem>
                        <SelectItem value="EXECUTIVE">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryMin" className="mb-1.5 block">Min Salary ($)</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      placeholder="80000"
                      value={formData.salaryMin}
                      onChange={(e) => handleInputChange("salaryMin", e.target.value)}
                      className="input-modern border-2 border-black dark:border-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryMax" className="mb-1.5 block">Max Salary ($)</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      placeholder="120000"
                      value={formData.salaryMax}
                      onChange={(e) => handleInputChange("salaryMax", e.target.value)}
                      className="input-modern border-2 border-black dark:border-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationDeadline" className="mb-1.5 block">Application Deadline</Label>
                  <Input
                    id="applicationDeadline"
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => handleInputChange("applicationDeadline", e.target.value)}
                    className="input-modern border-2 border-black dark:border-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Job Description</span>
                </CardTitle>
                <CardDescription>
                  Detailed information about the role and responsibilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="mb-1.5 block">Job Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="input-modern border-2 border-black dark:border-white min-h-[120px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements" className="mb-1.5 block">Requirements</Label>
                  <Textarea
                    id="requirements"
                    placeholder="List the required qualifications, experience, and skills..."
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                    className="input-modern border-2 border-black dark:border-white min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benefits" className="mb-1.5 block">Benefits & Perks</Label>
                  <Textarea
                    id="benefits"
                    placeholder="Describe the benefits, perks, and what makes your company great..."
                    value={formData.benefits}
                    onChange={(e) => handleInputChange("benefits", e.target.value)}
                    className="input-modern border-2 border-black dark:border-white min-h-[100px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Required Skills</span>
                </CardTitle>
                <CardDescription>
                  Add the key skills and technologies required for this role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a skill (e.g. React, Python, etc.)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    className="input-modern border-2 border-black dark:border-white flex-1"
                  />
                  <Select value={newSkillLevel} onValueChange={(v: Skill['level']) => setNewSkillLevel(v)}>
                    <SelectTrigger className="input-modern border-2 border-black dark:border-white w-[150px]">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                      <SelectItem value="EXPERT">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addSkill} size="sm" className="btn-gradient">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <AnimatePresence>
                  {skills.length > 0 && (
                    <motion.div 
                      className="flex flex-wrap gap-2"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {skills.map((skill, index) => (
                        <motion.div
                          key={skill.name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: index * 0.05 }}
                    >
                          <Badge 
                            variant="secondary" 
                            className="px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                          >
                            <span>{skill.name}</span>
                            <span className="text-xs opacity-60 ml-1.5 capitalize">({skill.level.toLowerCase()})</span>
                            <button
                              onClick={() => removeSkill(skill)}
                              className="ml-2 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview Sidebar */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="sticky top-24 space-y-6">
              {/* Sticky Action Buttons - No Card Wrapper */}
              <div className="flex items-center justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleSubmit(false)}
                  disabled={isLoading}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-colors duration-200"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button 
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Publish Job
                </Button>
              </div>

              {/* Preview Card */}
              <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <span>Preview</span>
                </CardTitle>
                <CardDescription>
                  How your job posting will appear to candidates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {formData.title || "Job Title"}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2 mb-4 text-sm">
                      {formData.department && <Badge variant="outline" className="capitalize font-normal text-xs border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200"><Building className="w-3.5 h-3.5 mr-1" />{formData.department}</Badge>}
                      {formData.employmentType && <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-700"><Briefcase className="w-3.5 h-3.5 mr-1" />{formData.employmentType.replace('_',' ')}</Badge>}
                      {formData.remoteType && <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 border-violet-200 dark:border-violet-700">{formData.remoteType}</Badge>}
                      {formData.experienceLevel && <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700">{formData.experienceLevel.charAt(0) + formData.experienceLevel.slice(1).toLowerCase()}</Badge>}
                      {(formData.salaryMin || formData.salaryMax) && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-700">
                          <DollarSign className="w-3.5 h-3.5 mr-1" />
                          {formData.salaryMin && formData.salaryMax 
                            ? `Kshs ${Math.round(parseInt(formData.salaryMin) / 1000)}k - ${Math.round(parseInt(formData.salaryMax) / 1000)}k`
                            : formData.salaryMin 
                              ? `Kshs ${Math.round(parseInt(formData.salaryMin) / 1000)}k+`
                              : `Up to Kshs ${Math.round(parseInt(formData.salaryMax) / 1000)}k`
                          }
                        </Badge>
                      )}
                      {formData.location && (
                        <Badge variant="outline" className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600">
                          <MapPin className="w-3.5 h-3.5 mr-1" />{formData.location}
                        </Badge>
                      )}
                      {formData.applicationDeadline && (
                        <Badge variant="outline" className="font-normal text-xs border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                          <Clock className="w-3.5 h-3.5 mr-1" />Deadline: {new Date(formData.applicationDeadline).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                </div>

                {formData.description && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Job Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed line-clamp-4">
                      {formData.description}
                    </p>
                  </div>
                )}

                {formData.requirements && (
                  <div className="pt-2">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><FileText className="w-5 h-5" /> Requirements</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed line-clamp-4">{formData.requirements}</p>
                  </div>
                )}

                {formData.benefits && (
                  <div className="pt-2">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Benefits</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed line-clamp-4">{formData.benefits}</p>
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="pt-2">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><Users className="w-5 h-5" /> Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 6).map((skill) => (
                        <Badge 
                          key={skill.name} 
                          variant="secondary" 
                          className="px-2 py-1 bg-primary/10 text-primary border-primary/20">
                          <span>{skill.name}</span><span className="text-xs opacity-60 ml-1.5 capitalize">({skill.level.toLowerCase()})</span>
                        </Badge>
                      ))}
                      {skills.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{skills.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
