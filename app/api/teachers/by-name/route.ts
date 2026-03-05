import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")

    if (!name) {
      return NextResponse.json({ error: "Name parameter required" }, { status: 400 })
    }

    // SQLite doesn't support case-insensitive, so we'll search manually
    const allTeachers = await prisma.teacher.findMany({
      include: {
        user: true,
      },
    })

    const teacher = allTeachers.find(
      (t) => t.name.toLowerCase().includes(name.toLowerCase())
    )

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    return NextResponse.json(teacher)
  } catch (error) {
    return NextResponse.json({ error: "Failed to find teacher" }, { status: 500 })
  }
}

