import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get teacher by userId
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        grade: true,
        classroom: true,
        subject: true,
        teacher: true,
      },
      orderBy: [
        { day: "asc" },
        { slot: "asc" },
      ],
    })

    console.log(`Found ${schedules.length} schedules for teacher ${teacher.name} (ID: ${teacher.id})`)
    
    return NextResponse.json(schedules)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
  }
}



