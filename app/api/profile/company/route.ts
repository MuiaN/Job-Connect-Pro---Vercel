import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    let companyProfile = await prisma.company.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    if (!companyProfile) {
      // If no profile exists, create a basic one to ensure the page loads correctly
      companyProfile = await prisma.company.create({
        data: {
          userId: session.user.id,
          name: session.user.name || "My Company",
        },
        include: {
          user: { select: { name: true, email: true, image: true } },
        },
      })
    }

    return NextResponse.json(companyProfile)
  } catch (error) {
    console.error("Error fetching company profile:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const data = await request.json() // 'request' is defined but never used.
    
    // Sanitize the data to only include fields that are part of the Company model
    const companyUpdateData = {
      name: data.name,
      description: data.description,
      website: data.website,
      industry: data.industry,
      size: data.size,
      logoUrl: data.logoUrl,
      location: data.location,
    }

    const updatedProfile = await prisma.company.update({
      where: { userId: session.user.id },
      data: companyUpdateData,
      include: {
        user: true,
      },
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error("Error updating company profile:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}