import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gradeId = searchParams.get("gradeId")

    const where: any = {}
    if (gradeId) {
      where.gradeId = gradeId
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        grade: true,
        classroom: true,
        teacher: true,
        subject: true,
      },
      orderBy: [
        { day: "asc" },
        { slot: "asc" },
        { grade: { name: "asc" } },
      ],
    })

    return NextResponse.json(schedules)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
  }
}


