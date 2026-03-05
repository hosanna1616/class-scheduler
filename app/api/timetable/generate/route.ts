import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { generateTimetable } from "@/utils/generateTimetable"
import { createNotification, createBulkNotifications } from "@/lib/notifications"
import { createAuditLog } from "@/lib/audit"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await auth()

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await generateTimetable()

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      action: "GENERATE",
      entity: "Timetable",
      details: result,
    })

    // Notify all teachers
    try {
      const teachers = await prisma.teacher.findMany({
        include: { user: true },
      })
      const teacherUserIds = teachers
        .map((t) => t.user?.id)
        .filter((id): id is string => !!id)

      if (teacherUserIds.length > 0) {
        await createBulkNotifications(
          teacherUserIds,
          "Timetable Updated",
          `A new timetable has been generated. ${result.scheduleCount} schedule entries created.`,
          "INFO",
          "/teacher"
        )
      }
    } catch (notifError) {
      console.error("Error sending notifications:", notifError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error generating timetable:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate timetable" },
      { status: 500 }
    )
  }
}


