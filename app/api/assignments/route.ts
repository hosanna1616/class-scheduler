import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const assignmentSchema = z.object({
  gradeId: z.string(),
  subjectId: z.string(),
  teacherId: z.string(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const assignments = await prisma.classSubject.findMany({
      include: {
        grade: true,
        subject: true,
        teacher: true,
      },
      orderBy: [{ grade: { name: "asc" } }, { subject: { name: "asc" } }],
    })

    return NextResponse.json(assignments)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = assignmentSchema.parse(body)

    const assignment = await prisma.classSubject.create({
      data,
      include: {
        grade: true,
        subject: true,
        teacher: true,
      },
    })

    return NextResponse.json(assignment)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This grade already has this subject assigned" },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
  }
}


