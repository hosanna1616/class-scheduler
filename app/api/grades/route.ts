import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const gradeSchema = z.object({
  name: z.string().min(1),
  studentCount: z.number().int().min(1).default(0),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const grades = await prisma.grade.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(grades)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch grades" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = gradeSchema.parse(body)

    const grade = await prisma.grade.create({
      data,
    })

    return NextResponse.json(grade)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This grade already exists" },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Failed to create grade" }, { status: 500 })
  }
}
