import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/applications/company
 * Fetches recent applications for the logged-in company.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'COMPANY') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
  const applicationId = searchParams.get('applicationId');

  try {
    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json({ message: 'Company profile not found' }, { status: 404 });
    }

    const whereClause: any = { companyId: company.id };
    if (applicationId) {
      whereClause.id = applicationId;
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { title: true, location: true, salaryMin: true, salaryMax: true, employmentType: true, applicationDeadline: true, status: true} },
        jobSeeker: {
          select: {
            id: true,
            title: true,
            bio: true,
            user: { select: { name: true, email: true, image: true } },
            skills: { include: { skill: true } },
            experiences: { orderBy: { startDate: 'desc' } },
            educations: { orderBy: { endDate: 'desc' } },
          },
        },
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('[COMPANY_APPLICATIONS_GET]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
