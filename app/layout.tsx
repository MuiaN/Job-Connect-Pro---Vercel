import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { DashboardProvider } from "@/context/DashboardContext"
import { ConversationProvider } from "@/context/ConversationContext"
import { GlobalCandidateDialog } from "@/components/ui/global-candidate-dialog"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "JobConnect Pro - Connect Talent with Opportunity",
  description: "The premier platform connecting job seekers with companies for direct communication and seamless interview scheduling.",
  keywords: ["jobs", "hiring", "recruitment", "talent", "careers", "employment"],
  authors: [{ name: "JobConnect Pro Team" }],
  creator: "JobConnect Pro",
  publisher: "JobConnect Pro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://jobconnect-pro.com'),
  openGraph: {
    title: "JobConnect Pro - Connect Talent with Opportunity",
    description: "The premier platform connecting job seekers with companies for direct communication and seamless interview scheduling.",
    url: 'https://jobconnect-pro.com',
    siteName: 'JobConnect Pro',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "JobConnect Pro - Connect Talent with Opportunity",
    description: "The premier platform connecting job seekers with companies for direct communication and seamless interview scheduling.",
    creator: '@jobconnectpro',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <Providers>
            <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
              <DashboardProvider>
                <ConversationProvider>
                  {children}
                  {/* Global dialog for displaying candidate profiles from notifications */}
                  <GlobalCandidateDialog />
                </ConversationProvider>
              </DashboardProvider>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
