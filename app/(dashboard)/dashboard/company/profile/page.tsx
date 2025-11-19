"use client"

import { Company, CompanySize } from "@prisma/client"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { ImageUpload } from "@/components/ui/image-upload"
import { SkeletonList } from "@/components/ui/skeleton"
import {
  Building,
  Save,
  MapPin,
  Plus,  
  Users,
  Award,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react"

type CompanyProfileData = Partial<Company>;

export default function CompanyProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<CompanyProfileData | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/auth/signin"); return }
    if (session.user.role !== "COMPANY") { router.push("/dashboard/job-seeker"); return }
    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile/company')
      if (response.ok) {
        const data = await response.json()
        setFormData(data)
      } else {
        console.error("Failed to fetch company profile")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CompanyProfileData, value: unknown) => {
    if (!formData) return
    setFormData(prev => ({ ...prev!, [field]: value }))
  }

  const calculateProfileCompletion = () => {
    if (!formData) return 0

    const fieldsToCheck: (keyof CompanyProfileData)[] = [
      'logoUrl', 'name', 'description', 'industry', 'size', 'location', 'website'
    ];

    const completedFields = fieldsToCheck.filter(field => !!formData[field]).length;

    return Math.round((completedFields / fieldsToCheck.length) * 100);
  }

  const handleSave = async () => {
    if (!formData) return
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the form data directly. The base64 string will be handled by the API.
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Company profile saved successfully!')
        fetchProfile()
      } else {
        toast.error('Failed to save profile. Please try again.')
      }
    } catch (e) { 
      console.error(e)
      toast.error('An unexpected error occurred.') 
    }
    setIsSaving(false)
  }

  const profileCompletion = calculateProfileCompletion()

  if (status === "loading" || isLoading || !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
        <DashboardNav userType="company" />
        <main className="container mx-auto px-4 py-8"><SkeletonList count={4} /></main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <DashboardNav userType="company" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Company Profile</h1>
            <p className="text-muted-foreground">Manage your company information and attract top talent</p>
          </div>
          <div className="flex items-center space-x-3">            
            <div className="flex items-center space-x-2">
            <Button onClick={handleSave} disabled={isSaving} className="btn-gradient">
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2"/>}
              Save Profile
            </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <Card className="modern-card sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary"/> Profile Strength</CardTitle>
                <CardDescription>Complete your profile to attract more candidates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <div className="text-3xl font-bold text-primary">{profileCompletion}%</div>
                <Progress value={profileCompletion} className="w-full" />
                <div className="space-y-2 pt-2 text-left text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><span>{formData.logoUrl ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-yellow-500"/>}</span><span>Company Logo</span></div>
                  <div className="flex items-center gap-2"><span>{formData.name ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-yellow-500"/>}</span><span>Company Name</span></div>
                  <div className="flex items-center gap-2"><span>{formData.description ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-yellow-500"/>}</span><span>Description</span></div>
                  <div className="flex items-center gap-2"><span>{formData.industry ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-yellow-500"/>}</span><span>Industry</span></div>
                  <div className="flex items-center gap-2"><span>{formData.size ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-yellow-500"/>}</span><span>Company Size</span></div>
                  <div className="flex items-center gap-2"><span>{formData.location ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-yellow-500"/>}</span><span>Location</span></div>
                  <div className="flex items-center gap-2"><span>{formData.website ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertCircle className="w-4 h-4 text-yellow-500"/>}</span><span>Website</span></div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="lg:col-span-3 space-y-6">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-primary"/> Company Information</CardTitle>
                <CardDescription>Basic details about your company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <Label className="text-sm mb-1.5 block">Company Logo</Label>
                    <ImageUpload value={formData.logoUrl || undefined} onChange={(v)=>handleInputChange('logoUrl', v)} onRemove={()=>handleInputChange('logoUrl', null)} type="company" size="lg" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="companyName" className="mb-1.5 block">Company Name</Label>
                        <Input id="companyName" value={formData.name || ''} onChange={(e)=>handleInputChange('name', e.target.value)} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="mb-1.5 block">Company Description</Label>
                      <Textarea id="description" value={formData.description || ''} onChange={(e)=>handleInputChange('description', e.target.value)} className="input-modern border-2 border-black dark:border-white min-h-[100px]" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label className="mb-1.5 block">Industry</Label>
                        <Select value={formData.industry || ''} onValueChange={(v)=>handleInputChange('industry', v)}>
                          <SelectTrigger className="input-modern border-2 border-black dark:border-white"><SelectValue placeholder="Select industry"/></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Company Size</Label>
                        <Select value={formData.size || ''} onValueChange={(v)=>handleInputChange('size', v)}>
                          <SelectTrigger className="input-modern border-2 border-black dark:border-white"><SelectValue placeholder="Select size"/></SelectTrigger>
                          <SelectContent>
                            {Object.values(CompanySize).map((size) => (
                              <SelectItem key={size} value={size}>
                                {size.charAt(0) + size.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1.5 block">Website</Label>
                        <Input value={formData.website || ''} onChange={(e)=>handleInputChange('website', e.target.value)} className="input-modern border-2 border-black dark:border-white" />
                      </div>
                      <div>
                        <Label htmlFor="location" className="mb-1.5 block">Location</Label>
                        <Input id="location" value={formData.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} className="input-modern border-2 border-black dark:border-white" placeholder="e.g. San Francisco, CA" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
