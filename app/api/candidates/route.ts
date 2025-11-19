import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import type { ExperienceLevel, Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only companies can search candidates
    if (session.user.role !== "COMPANY") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const skills = searchParams.get("skills")?.split(",") || []
    const location = searchParams.get("location") || ""
    const experienceLevel = searchParams.get("experienceLevel") || ""
    const availability = searchParams.get("availability") || ""

    // Build where clause with strong types
    const where: Prisma.JobSeekerWhereInput = {
      availability: {
        not: "NOT_LOOKING" // Only show candidates open to opportunities
      },
      profileVisibility: "PUBLIC"
    }

    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive"
      }
    }

    if (experienceLevel) {
      where.experienceLevel = { equals: experienceLevel as ExperienceLevel }
    }

    if (availability && availability !== "all") {
      where.availability = availability as Prisma.EnumAvailabilityFilter<"JobSeeker">
    }

    const searchConditions: Prisma.JobSeekerWhereInput[] = []

    // Add search query conditions
    if (search) {
      searchConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { location: { contains: search, mode: 'insensitive' } },
          { skills: { some: { skill: { name: { contains: search, mode: 'insensitive' } } } } }
        ]
      })
    }

    // Add skills filter conditions
    if (skills.length > 0) {
      searchConditions.push({
        skills: {
          some: {
            skill: {
              name: { in: skills, mode: 'insensitive' }
            }
          }
        }
      })
    }

    if (searchConditions.length > 0) {
      where.AND = searchConditions
    }

    const candidates = await prisma.jobSeeker.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        },
        skills: {
          include: { skill: true }
        },
        experiences: {
          orderBy: {
            startDate: "desc"
          },
        },
        educations: {
          orderBy: {
            endDate: "desc"
          },
          take: 1,
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 20
    })

    return NextResponse.json(candidates)
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
