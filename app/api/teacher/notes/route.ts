import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const noteSchema = z.object({
  teacherId: z.string(),
  content: z.string().min(1),
  date: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID required" }, { status: 400 })
    }

    // For now, return empty array - you can add a Notes model later
    return NextResponse.json([])
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = noteSchema.parse(body)

    // For now, just return success - you can add a Notes model later
    return NextResponse.json({ success: true, message: "Note saved (mock)" })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 })
  }
}







