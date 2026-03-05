import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { createAuditLog } from "@/lib/audit"

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
      include: { teacher: true },
    })

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    // Verify the teacher owns this schedule
    if (schedule.teacherId !== user.teacher.id) {
      return NextResponse.json(
        { error: "You can only cancel your own classes" },
        { status: 403 }
      )
    }

    // Check if already canceled
    if (schedule.status === "CANCELED") {
      return NextResponse.json(
        { error: "This class is already canceled" },
        { status: 400 }
      )
    }

    // Update the schedule status to CANCELED
    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
        canceledBy: user.teacher.id,
      },
      include: {
        grade: true,
        subject: true,
        classroom: true,
        teacher: true,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      action: "CANCEL",
      entity: "Schedule",
      entityId: id,
      details: {
        schedule: updatedSchedule,
      },
    })

    // Create notification for admin
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
    })
    if (adminUsers.length > 0) {
      await createNotification({
        userId: adminUsers[0].id,
        title: "Class Canceled",
        message: `${schedule.teacher.name} canceled ${schedule.subject.name} for ${schedule.grade.name}`,
        type: "WARNING",
        link: "/admin/schedule",
      })
    }

    return NextResponse.json({
      success: true,
      schedule: updatedSchedule,
      message: "Class canceled successfully. The classroom is now free for this time slot.",
    })
  } catch (error: any) {
    console.error("Error canceling class:", error)
    return NextResponse.json(
      { error: "Failed to cancel class" },
      { status: 500 }
    )
  }
}


