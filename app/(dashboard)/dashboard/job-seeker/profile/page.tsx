"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Plus, CheckCircle, AlertCircle, Sparkles, X, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

import { DashboardNav } from "@/components/layout/dashboard-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ImageUpload } from "@/components/ui/image-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SkeletonList } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

// Local types to match our Prisma schema payload contract
interface Skill {
  name: string
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
}

type Availability = "OPEN" | "ACTIVELY_SEARCHING" | "NOT_LOOKING"
type ExperienceLevel = "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE"
type RemotePreference = "REMOTE" | "ONSITE" | "HYBRID"
type ProfileVisibility = "PUBLIC" | "PRIVATE"

interface FormExperience {
  id: string
  company: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  current: boolean
}

interface FormEducation {
  id: string
  institution: string
  degree: string
  field: string | null
  startDate: string
  endDate: string | null
  current: boolean
}

type FormData = {
  avatar: string | null
  fullName: string | null
  headline: string | null
  about: string | null
  location: string | null
  website: string | null
  email: string | null
  phone: string | null
  skills: Skill[]
  availability: Availability | null
  salaryMin: number | null
  salaryMax: number | null
  experienceLevel: ExperienceLevel | null
  noticePeriod: string | null
  remotePreference: RemotePreference | null
  profileVisibility: ProfileVisibility | null
  experience: FormExperience[]
  education: FormEducation[]
}

export default function JobSeekerProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newSkill, setNewSkill] = useState("")
  const [newSkillLevel, setNewSkillLevel] = useState<Skill["level"]>("INTERMEDIATE")
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [tempSkillLevel, setTempSkillLevel] = useState<Skill["level"] | undefined>()

  const [formData, setFormData] = useState<FormData>({
    avatar: null,
    fullName: "",
    headline: "",
    about: "",
    location: "",
    website: null,
    email: "",
    phone: "",
    skills: [],
    availability: null,
    salaryMin: null,
    salaryMax: null,
    experienceLevel: null,
    noticePeriod: null,
    remotePreference: null,
    profileVisibility: null,
    experience: [],
    education: [],
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push('/auth/signin'); return }
    if (session.user.role !== 'JOB_SEEKER') { router.push('/dashboard/company'); return }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/job-seeker')
      if (response.ok) {
        const data = await response.json()
        setFormData({
          avatar: data.avatar ?? null,
          fullName: data.fullName ?? "",
          headline: data.headline ?? "",
          about: data.about ?? "",
          location: data.location ?? "",
          website: data.website ?? null,
          email: data.email ?? "",
          phone: data.phone ?? "",
          skills: Array.isArray(data.skills) ? data.skills : [],
          availability: data.availability ?? null,
          salaryMin: data.salaryMin ?? null,
          salaryMax: data.salaryMax ?? null,
          experienceLevel: data.experienceLevel ?? null,
          noticePeriod: data.noticePeriod ?? null,
          remotePreference: data.remotePreference ?? null,
          profileVisibility: data.profileVisibility ?? null,
          experience: Array.isArray(data.experience) ? data.experience.map((exp: any) => ({
            id: exp.id,
            company: exp.company ?? "",
            title: exp.title ?? "",
            description: exp.description ?? "",
            startDate: exp.startDate ? String(exp.startDate).slice(0, 10) : "",
            endDate: exp.endDate ? String(exp.endDate).slice(0, 10) : null,
            current: Boolean(exp.current),
          })) : [],
          education: Array.isArray(data.education) ? data.education.map((ed: any) => ({
            id: ed.id,
            institution: ed.institution ?? "",
            degree: ed.degree ?? "",
            field: ed.field ?? "",
            startDate: ed.startDate ? String(ed.startDate).slice(0, 10) : "",
            endDate: ed.endDate ? String(ed.endDate).slice(0, 10) : null,
            current: Boolean(ed.current),
          })) : [],
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (
    field: keyof Omit<FormData, 'experience' | 'education' | 'skills'>,
    value: any
  ) => setFormData(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile/job-seeker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        fetchProfile() // Re-fetch to get latest data with proper IDs
      } else {
        const errorData = await response.json()
        console.error("Failed to save profile:", errorData)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.find(s => s.name.toLowerCase() === newSkill.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, { name: newSkill.trim(), level: newSkillLevel }]
      }))
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: Skill) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }))
  }

  const handleSkillLevelChange = (skillName: string, newLevel: Skill['level']) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map(skill => skill.name === skillName ? { ...skill, level: newLevel } : skill)
    }))
    setEditingSkill(null)
  }

  useEffect(() => {
    if (editingSkill) setTempSkillLevel(editingSkill.level)
  }, [editingSkill])

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [
        {
          id: `new_${Date.now()}`,
          company: '',
          title: '',
          description: '',
          startDate: '',
          endDate: null,
          current: false,
        },
        ...prev.experience,
      ],
    }))
  }

  const removeExperience = (id: string) => {
    setFormData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== id) }))
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [
        {
          id: `new_${Date.now()}`,
          institution: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: null,
          current: false,
        },
        ...prev.education,
      ],
    }))
  }

  const removeEducation = (id: string) => {
    setFormData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }))
  }

  const strengthChecks = () => {
    return [
      { key: 'avatar', label: 'Photo', done: !!formData.avatar },
      { key: 'fullName', label: 'Full Name', done: !!formData.fullName },
      { key: 'headline', label: 'Headline', done: !!formData.headline },
      { key: 'about', label: 'About', done: !!formData.about },
      { key: 'location', label: 'Location', done: !!formData.location },
      { key: 'website', label: 'Website', done: !!formData.website },
      { key: 'phone', label: 'Phone', done: !!formData.phone },
      { key: 'profileVisibility', label: 'Profile Visibility', done: !!formData.profileVisibility },
      { key: 'availability', label: 'Availability', done: !!formData.availability },
      { key: 'salaryRange', label: 'Salary Range', done: formData.salaryMin !== null && formData.salaryMax !== null },
      { key: 'experienceLevel', label: 'Experience Level', done: !!formData.experienceLevel },
      { key: 'remotePreference', label: 'Remote Preference', done: !!formData.remotePreference },
      { key: 'noticePeriod', label: 'Notice Period', done: !!formData.noticePeriod },
      { key: 'skills', label: 'Skills', done: formData.skills && formData.skills.length > 0 },
      { key: 'experience', label: 'Experience', done: formData.experience && formData.experience.length > 0 },
      { key: 'education', label: 'Education', done: formData.education && formData.education.length > 0 },
    ]
  }

  const profileCompletion = () => {
    const checks = strengthChecks()
    const completed = checks.filter(c => c.done).length
    const total = checks.length
    return Math.round((completed/total)*100)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
        <DashboardNav userType="job_seeker" />
        <main className="container mx-auto px-4 py-8"><SkeletonList count={4} /></main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <DashboardNav userType="job_seeker" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text-primary leading-snug pb-1 mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your public profile and resume</p>
          </div>
          <div>
            <Button onClick={handleSave} disabled={isSaving || isLoading} className="btn-gradient">{isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/> : <CheckCircle className="w-4 h-4 mr-2"/>}Save</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <Card className="modern-card sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary"/> Profile Strength</CardTitle>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{profileCompletion()}%</div>
                  <div className="space-y-2 mt-4 text-left">
                    {strengthChecks().map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        {item.done ? <CheckCircle className="text-green-500"/> : <AlertCircle className="text-yellow-500"/>}
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CardHeader>
            </Card>
          </aside>

          <section className="lg:col-span-3 space-y-6">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <Label className="text-sm mb-1.5 block">Profile Photo</Label>
                    <ImageUpload value={formData.avatar ?? undefined} onChange={(v)=>handleInputChange('avatar', v)} onRemove={()=>handleInputChange('avatar','')} type="profile" size="lg" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName" className="mb-1.5 block">Full Name</Label>
                        <Input id="fullName" value={formData.fullName || ''} onChange={(e)=>handleInputChange('fullName', e.target.value)} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                      <div>
                        <Label htmlFor="headline" className="mb-1.5 block">Headline</Label>
                        <Input id="headline" value={formData.headline || ''} onChange={(e)=>handleInputChange('headline', e.target.value)} className="input-modern border-2 border-black dark:border-white" placeholder="e.g., Senior Frontend Developer" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="about" className="mb-1.5 block">About</Label>
                      <Textarea id="about" value={formData.about || ''} onChange={(e)=>handleInputChange('about', e.target.value)} className="input-modern border-2 border-black dark:border-white min-h-[100px]" placeholder="Tell us about yourself..."/>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location" className="mb-1.5 block">Location</Label>
                        <Input id="location" value={formData.location || ''} onChange={(e)=>handleInputChange('location', e.target.value)} className="input-modern border-2 border-black dark:border-white" placeholder="e.g., San Francisco, CA"/>
                      </div>
                      <div>
                        <Label htmlFor="website" className="mb-1.5 block">Website</Label>
                        <Input id="website" value={formData.website || ''} onChange={(e)=>handleInputChange('website', e.target.value)} className="input-modern border-2 border-black dark:border-white" placeholder="https://your-portfolio.com"/>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="email" className="mb-1.5 block">Email</Label>
                        <Input id="email" value={formData.email || ''} disabled className="input-modern border-2 border-black dark:border-white bg-muted/50" />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="mb-1.5 block">Phone</Label>
                        <Input id="phone" value={formData.phone || ''} onChange={(e)=>handleInputChange('phone', e.target.value)} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                      <div>
                        <Label htmlFor="profileVisibility" className="mb-1.5 block">Profile Visibility</Label>
                        <Select value={formData.profileVisibility || ''} onValueChange={(v: ProfileVisibility) => handleInputChange('profileVisibility', v)}>
                          <SelectTrigger className="input-modern border-2 border-black dark:border-white"><SelectValue placeholder="Select visibility" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PUBLIC">Public</SelectItem>
                            <SelectItem value="PRIVATE">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="availability" className="mb-1.5 block">Availability</Label>
                        <Select value={formData.availability || ''} onValueChange={(v: Availability) => handleInputChange('availability', v)}>
                          <SelectTrigger className="input-modern border-2 border-black dark:border-white"><SelectValue placeholder="Select availability" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN">Open to opportunities</SelectItem>
                            <SelectItem value="ACTIVELY_SEARCHING">Actively searching</SelectItem>
                            <SelectItem value="NOT_LOOKING">Not looking</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="salaryMin" className="mb-1.5 block">Minimum Salary (USD)</Label>
                        <Input id="salaryMin" type="number" value={formData.salaryMin ?? ''} onChange={(e)=>handleInputChange('salaryMin', e.target.value)} className="input-modern border-2 border-black dark:border-white" placeholder="e.g., 80000"/>
                      </div>
                      <div>
                        <Label htmlFor="salaryMax" className="mb-1.5 block">Maximum Salary (USD)</Label>
                        <Input id="salaryMax" type="number" value={formData.salaryMax ?? ''} onChange={(e)=>handleInputChange('salaryMax', e.target.value)} className="input-modern border-2 border-black dark:border-white" placeholder="e.g., 120000"/>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="experienceLevel" className="mb-1.5 block">Experience Level</Label>
                        <Select value={formData.experienceLevel || ''} onValueChange={(v: ExperienceLevel) => handleInputChange('experienceLevel', v)}>
                          <SelectTrigger className="input-modern border-2 border-black dark:border-white"><SelectValue placeholder="Select experience level" /></SelectTrigger>
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
                      <div>
                        <Label htmlFor="remotePreference" className="mb-1.5 block">Remote Preference</Label>
                        <Select value={formData.remotePreference || ''} onValueChange={(v: RemotePreference) => handleInputChange('remotePreference', v)}>
                          <SelectTrigger className="input-modern border-2 border-black dark:border-white"><SelectValue placeholder="Select remote preference" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONSITE">On-site</SelectItem>
                            <SelectItem value="HYBRID">Hybrid</SelectItem>
                            <SelectItem value="REMOTE">Remote</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                       <div>
                        <Label htmlFor="noticePeriod" className="mb-1.5 block">Notice Period</Label>
                        <Input id="noticePeriod" value={formData.noticePeriod || ''} onChange={(e)=>handleInputChange('noticePeriod', e.target.value)} className="input-modern border-2 border-black dark:border-white" placeholder="e.g., 1 month, 2 weeks"/>
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <Label htmlFor="skills" className="mb-1.5 block">Skills</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="skills"
                          placeholder="Add a skill (e.g. React, Python)"
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
                        {formData.skills && formData.skills.length > 0 && (
                          <motion.div className="flex flex-wrap gap-2 mt-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {formData.skills.map((skill, index) => (
                              <motion.div key={skill.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: index * 0.05 }}>
                                <Badge
                                  variant="secondary"
                                  className="px-3 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors items-center"
                                  onClick={() => setEditingSkill(skill)}
                                >
                                  <span>{skill.name}</span>
                                  <span className="text-xs opacity-60 ml-1.5 capitalize">({skill.level.toLowerCase()})</span>
                                  <button onClick={(e) => { e.stopPropagation(); removeSkill(skill); }} className="ml-2 hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Work Experience
                  <Button size="sm" className="btn-gradient" onClick={addExperience}><Plus className="w-4 h-4 mr-2"/>Add</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.experience.map((exp, idx) => (
                  <div key={exp.id} className="relative p-4 pt-[41px] border rounded-md space-y-3 border-blue-200 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-950/20">
                    <div className="absolute top-2 right-2">
                      <Button size="sm" variant="outline" onClick={() => removeExperience(exp.id)} className="h-7 px-2 rounded-full bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800 hover:bg-red-100 hover:text-red-800">
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <Label className="mb-1.5 block">Company</Label>
                        <Input placeholder="Company" value={exp.company} onChange={(e) => { const copy = [...formData.experience]; copy[idx] = { ...copy[idx], company: e.target.value }; setFormData((p) => ({ ...p, experience: copy })) }} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Title</Label>
                        <Input placeholder="Title" value={exp.title} onChange={(e) => { const copy = [...formData.experience]; copy[idx] = { ...copy[idx], title: e.target.value }; setFormData((p) => ({ ...p, experience: copy })) }} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="mb-1.5 block">Start Date</Label>
                          <Input type="date" placeholder="Start" value={exp.startDate || ''} onChange={(e) => { const copy = [...formData.experience]; copy[idx] = { ...copy[idx], startDate: e.target.value }; setFormData((p) => ({ ...p, experience: copy })) }} className="input-modern border-2 border-black dark:border-white pr-10" />
                        </div>
                        <div>
                          <Label className="mb-1.5 block">End Date</Label>
                          <Input type="date" placeholder="End" disabled={exp.current} value={exp.endDate || ''} onChange={(e) => { const copy = [...formData.experience]; copy[idx] = { ...copy[idx], endDate: e.target.value }; setFormData((p) => ({ ...p, experience: copy })) }} className="input-modern border-2 border-black dark:border-white pr-10" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox className="border-black dark:border-white" id={`exp-current-${idx}`} checked={exp.current} onCheckedChange={(checked) => { const copy = [...formData.experience]; const isChecked = Boolean(checked); copy[idx] = { ...copy[idx], current: isChecked, endDate: isChecked ? null : copy[idx].endDate }; setFormData((p) => ({ ...p, experience: copy })) }} />
                      <Label htmlFor={`exp-current-${idx}`}>I currently work here</Label>
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Description</Label>
                      <Textarea placeholder="Description" value={exp.description || ''} onChange={(e) => { const copy = [...formData.experience]; copy[idx] = { ...copy[idx], description: e.target.value }; setFormData((p) => ({ ...p, experience: copy })) }} className="min-h-[80px] input-modern border-2 border-black dark:border-white" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Education
                  <Button size="sm" className="btn-gradient" onClick={addEducation}><Plus className="w-4 h-4 mr-2"/>Add</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.education.map((ed, idx) => (
                  <div key={ed.id} className="relative p-4 border rounded-md space-y-3 border-blue-200 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-950/20">
                    <div className="absolute top-2 right-2">
                      <Button size="sm" variant="outline" onClick={() => removeEducation(ed.id)} className="h-7 px-2 rounded-full bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800 hover:bg-red-100 hover:text-red-800">
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <Label className="mb-1.5 block">Institution</Label>
                        <Input placeholder="Institution" value={ed.institution} onChange={(e) => { const copy = [...formData.education]; copy[idx] = { ...copy[idx], institution: e.target.value }; setFormData((p) => ({ ...p, education: copy })) }} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Degree</Label>
                        <Input placeholder="Degree" value={ed.degree} onChange={(e) => { const copy = [...formData.education]; copy[idx] = { ...copy[idx], degree: e.target.value }; setFormData((p) => ({ ...p, education: copy })) }} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Field of Study</Label>
                        <Input placeholder="Field of Study" value={ed.field || ''} onChange={(e) => { const copy = [...formData.education]; copy[idx] = { ...copy[idx], field: e.target.value }; setFormData((p) => ({ ...p, education: copy })) }} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1.5 block">Start Date</Label>
                        <Input type="date" placeholder="Start" value={ed.startDate || ''} onChange={(e) => { const copy = [...formData.education]; copy[idx] = { ...copy[idx], startDate: e.target.value }; setFormData((p) => ({ ...p, education: copy })) }} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">End Date</Label>
                        <Input type="date" placeholder="End" disabled={ed.current} value={ed.endDate || ''} onChange={(e) => { const copy = [...formData.education]; copy[idx] = { ...copy[idx], endDate: e.target.value }; setFormData((p) => ({ ...p, education: copy })) }} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox className="border-black dark:border-white" id={`edu-current-${idx}`} checked={ed.current} onCheckedChange={(checked) => { const copy = [...formData.education]; const isChecked = Boolean(checked); copy[idx] = { ...copy[idx], current: isChecked, endDate: isChecked ? null : copy[idx].endDate }; setFormData((p) => ({ ...p, education: copy })) }} />
                      <Label htmlFor={`edu-current-${idx}`}>I currently study here</Label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </section>
        </div>
      </div>

      <Dialog open={!!editingSkill} onOpenChange={(isOpen) => !isOpen && setEditingSkill(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Skill Level</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Set your proficiency for <span className="font-semibold text-primary">{editingSkill?.name}</span>.</p>
            <Select value={tempSkillLevel} onValueChange={(v: Skill['level']) => setTempSkillLevel(v)}>
              <SelectTrigger className="input-modern border-2 border-black dark:border-white">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
                <SelectItem value="EXPERT">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={() => editingSkill && tempSkillLevel && handleSkillLevelChange(editingSkill.name, tempSkillLevel)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
