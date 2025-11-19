'use client'

import { Headphones, Mail, MapPin, MessageSquare, Phone, Send, Users } from 'lucide-react'
import { useState } from 'react'

import { Navbar } from '@/components/navigation/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const contactMethods = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Email Support",
    description: "Get help via email within 24 hours",
    contact: "support@jobconnectpro.com",
    available: "24/7"
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Phone Support",
    description: "Speak directly with our support team",
    contact: "+1 (555) 123-4567",
    available: "Mon-Fri, 9AM-6PM PST"
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Live Chat",
    description: "Chat with us in real-time",
    contact: "Available on website",
    available: "Mon-Fri, 9AM-6PM PST"
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community Forum",
    description: "Connect with other users and get help",
    contact: "community.jobconnectpro.com",
    available: "24/7"
  }
]

const offices = [
  {
    city: "San Francisco",
    address: "123 Tech Street, Suite 400",
    zipcode: "San Francisco, CA 94105",
    phone: "+1 (555) 123-4567",
    email: "sf@jobconnectpro.com"
  },
  {
    city: "New York",
    address: "456 Business Ave, Floor 12",
    zipcode: "New York, NY 10001",
    phone: "+1 (555) 987-6543",
    email: "ny@jobconnectpro.com"
  },
  {
    city: "Austin",
    address: "789 Innovation Blvd, Building C",
    zipcode: "Austin, TX 78701",
    phone: "+1 (555) 456-7890",
    email: "austin@jobconnectpro.com"
  }
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary dark:text-white border-primary/20">
            Get In Touch
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-white mb-6">
            Contact Us
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Have questions about JobConnect Pro? We&apos;re here to help! Reach out to our team 
            and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl text-primary dark:text-white">
                  Send us a Message
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Fill out the form below and we&apos;ll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Full Name *
                      </label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                        className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email Address *
                      </label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        required
                        className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Category
                    </label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing & Pricing</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Subject *
                    </label>
                    <Input
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief description of your inquiry"
                      required
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Message *
                    </label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please provide details about your inquiry..."
                      rows={6}
                      required
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl text-primary dark:text-white">
                  Get Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactMethods.map((method, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/40 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-primary dark:text-white mt-1">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary dark:text-white">
                        {method.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                        {method.description}
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {method.contact}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {method.available}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Response */}
            <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Headphones className="h-12 w-12 text-primary dark:text-white mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary dark:text-white mb-2">
                    Need Immediate Help?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    For urgent matters, call our support hotline
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Office Locations */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary dark:text-white mb-4">
              Our Offices
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Visit us at one of our locations or reach out to your nearest office.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <Card key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-primary dark:text-white flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    {office.city}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      {office.address}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      {office.zipcode}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-700 dark:text-slate-200 text-sm flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-primary dark:text-white" />
                      {office.phone}
                    </p>
                    <p className="text-slate-700 dark:text-slate-200 text-sm flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-primary dark:text-white" />
                      {office.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-primary dark:text-white mb-4">
                Frequently Asked Questions
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Find quick answers to common questions about JobConnect Pro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-primary dark:text-white mb-2">
                      How do I create an account?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Click &apos;Get Started&apos; and choose whether you&apos;re a job seeker or company. 
                      Fill out the registration form and verify your email address.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary dark:text-white mb-2">
                      Is JobConnect Pro free to use?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      We offer both free and premium plans. Basic job searching and posting 
                      is free, with premium features available for enhanced functionality.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary dark:text-white mb-2">
                      How does the matching algorithm work?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Our AI analyzes skills, experience, preferences, and company culture 
                      to suggest the most relevant matches for both job seekers and employers.
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-primary dark:text-white mb-2">
                      Can I edit my profile after creating it?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Yes, you can update your profile, skills, experience, and preferences 
                      at any time from your dashboard.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary dark:text-white mb-2">
                      How do I schedule interviews?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Our smart scheduling system integrates with your calendar to find 
                      mutually available times and sends automatic invitations.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary dark:text-white mb-2">
                      What support is available?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      We offer 24/7 email support, live chat during business hours, 
                      phone support, and a comprehensive help center.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
