import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the teacher's user ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { teacher: true },
    })

    if (!user || !user.teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Get the schedule item
    const schedule = await prisma.schedule.findUnique({
      where: { id },
    })

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    // Verify the teacher owns this schedule
    if (schedule.teacherId !== user.teacher.id) {
      return NextResponse.json(
        { error: "You can only reactivate your own classes" },
        { status: 403 }
      )
    }

    // Check if already active
    if (schedule.status === "ACTIVE") {
      return NextResponse.json(
        { error: "This class is already active" },
        { status: 400 }
      )
    }

    // Update the schedule status back to ACTIVE
    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: {
        status: "ACTIVE",
        canceledAt: null,
        canceledBy: null,
      },
      include: {
        grade: true,
        subject: true,
        classroom: true,
        teacher: true,
      },
    })

    return NextResponse.json({
      success: true,
      schedule: updatedSchedule,
      message: "Class reactivated successfully",
    })
  } catch (error: any) {
    console.error("Error reactivating class:", error)
    return NextResponse.json(
      { error: "Failed to reactivate class" },
      { status: 500 }
    )
  }
}



