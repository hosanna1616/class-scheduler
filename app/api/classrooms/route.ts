import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const classroomSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().positive(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const classrooms = await prisma.classroom.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(classrooms)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch classrooms" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = classroomSchema.parse(body)

    const classroom = await prisma.classroom.create({
      data,
    })

    return NextResponse.json(classroom)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create classroom" }, { status: 500 })
  }
}


