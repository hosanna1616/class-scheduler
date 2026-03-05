import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
      },
    })

    if (!teacher) {
      console.error(`Teacher not found for userId: ${session.user.id}`)
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    console.log(`Found teacher: ${teacher.name} (ID: ${teacher.id}, userId: ${teacher.userId})`)
    return NextResponse.json(teacher)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teacher" }, { status: 500 })
  }
}



