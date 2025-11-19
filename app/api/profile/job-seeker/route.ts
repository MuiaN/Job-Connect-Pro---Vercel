import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'JOB_SEEKER') {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { name: true, email: true, image: true }
        },
        skills: { include: { skill: true } },
        experiences: true,
        educations: true,
      },
    });

    if (!jobSeeker) {
      return new NextResponse("Profile not found", { status: 404 });
    }

    const response = {
      avatar: jobSeeker.user.image,
      fullName: jobSeeker.user.name,
      email: jobSeeker.user.email,
      headline: jobSeeker.title,
      about: jobSeeker.bio,
      location: jobSeeker.location,
      website: jobSeeker.website,
      phone: jobSeeker.phone,
      skills: jobSeeker.skills.map(s => ({ name: s.skill.name, level: s.level })),
      availability: jobSeeker.availability,
      salaryMin: jobSeeker.salaryMin,
      salaryMax: jobSeeker.salaryMax,
      resumeUrl: jobSeeker.resumeUrl,
      experienceLevel: jobSeeker.experienceLevel,
      noticePeriod: jobSeeker.noticePeriod,
      remotePreference: jobSeeker.remotePreference,
      profileVisibility: jobSeeker.profileVisibility,
      experience: jobSeeker.experiences,
      education: jobSeeker.educations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[PROFILE_JOB_SEEKER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'JOB_SEEKER') {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { fullName, avatar, skills, experience, education, ...jobSeekerData } = body;

    // 1. Update the User model for name and image
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: fullName,
        image: avatar,
      },
    });

    // 2. Upsert skills and get their IDs
    const skillOps = (skills || []).map((skill: { name: string; level: any }) =>
      prisma.skill.upsert({
        where: { name: skill.name },
        update: {},
        create: { name: skill.name },
      })
    );
    const skillRecords = await prisma.$transaction(skillOps);
    const skillIdMap = new Map(skillRecords.map(s => [s.name, s.id]));

    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    // Prepare IDs lists for deletion sync
    const existingExperienceIds = (experience || [])
      .filter((exp: { id: string }) => exp.id && !exp.id.startsWith('new_'))
      .map((exp: { id: string }) => exp.id);

    const existingEducationIds = (education || [])
      .filter((edu: { id: string }) => edu.id && !edu.id.startsWith('new_'))
      .map((edu: { id: string }) => edu.id);

    // 3. Update the JobSeeker profile
    const updateProfilePromise = prisma.jobSeeker.update({
      where: { userId: session.user.id },
      data: {
        title: jobSeekerData.headline,
        bio: jobSeekerData.about,
        location: jobSeekerData.location,
        website: jobSeekerData.website,
        phone: jobSeekerData.phone,
        availability: jobSeekerData.availability,
        salaryMin: jobSeekerData.salaryMin ? parseInt(String(jobSeekerData.salaryMin), 10) : null,
        salaryMax: jobSeekerData.salaryMax ? parseInt(String(jobSeekerData.salaryMax), 10) : null,
        resumeUrl: jobSeekerData.resumeUrl,
        experienceLevel: jobSeekerData.experienceLevel,
        noticePeriod: jobSeekerData.noticePeriod,
        remotePreference: jobSeekerData.remotePreference,
        profileVisibility: jobSeekerData.profileVisibility,
        skills: {
          deleteMany: {}, // Clear existing skills
          create: (skills || []).map((skill: { name: string; level: any }) => ({
            skillId: skillIdMap.get(skill.name)!,
            level: skill.level,
          })),
        },
      },
    });

    // 4. Handle Experience updates
    const experienceUpdates = (experience || []).map((exp: { id: string; title: string; company: string; description: string | null; startDate: string; endDate: string | null; current: boolean; }) => {
      const data = {
        jobSeekerId: jobSeeker!.id,
        title: exp.title,
        company: exp.company,
        description: exp.description,
        current: exp.current,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate ? new Date(exp.endDate) : null,
      };
      return prisma.experience.upsert({
        where: { id: exp.id.startsWith('new_') ? `_` : exp.id }, // a new record won't have a real ID
        create: data,
        update: data,
      });
    });

    // 5. Handle Education updates
    const educationUpdates = (education || []).map((edu: { id: string; institution: string; degree: string; field: string | null; startDate: string; endDate: string | null; current: boolean; }) => {
      const data = {
        jobSeekerId: jobSeeker!.id,
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        startDate: new Date(edu.startDate),
        endDate: edu.endDate ? new Date(edu.endDate) : null,
        current: edu.current,
      };
      return prisma.education.upsert({
        where: { id: edu.id.startsWith('new_') ? `_` : edu.id },
        create: data,
        update: data,
      });
    });

    const deleteExperiencesPromise = (existingExperienceIds.length > 0)
      ? prisma.experience.deleteMany({ where: { jobSeekerId: jobSeeker!.id, id: { notIn: existingExperienceIds } } })
      : prisma.experience.deleteMany({ where: { jobSeekerId: jobSeeker!.id } });

    const deleteEducationsPromise = (existingEducationIds.length > 0)
      ? prisma.education.deleteMany({ where: { jobSeekerId: jobSeeker!.id, id: { notIn: existingEducationIds } } })
      : prisma.education.deleteMany({ where: { jobSeekerId: jobSeeker!.id } });

    const txResults = await prisma.$transaction([
      updateProfilePromise,
      deleteExperiencesPromise,
      deleteEducationsPromise,
      ...experienceUpdates,
      ...educationUpdates
    ]);

    return NextResponse.json(txResults[0]);
  } catch (error) {
    console.error("[PROFILE_JOB_SEEKER_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
