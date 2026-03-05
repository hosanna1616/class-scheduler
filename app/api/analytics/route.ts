import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all data for analytics
    const [
      totalTeachers,
      totalStudents,
      totalClassrooms,
      totalGrades,
      totalSubjects,
      totalSchedules,
      activeSchedules,
      canceledSchedules,
      classrooms,
      schedules,
      teachers,
    ] = await Promise.all([
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.classroom.count(),
      prisma.grade.count(),
      prisma.subject.count(),
      prisma.schedule.count(),
      prisma.schedule.count({ where: { status: "ACTIVE" } }),
      prisma.schedule.count({ where: { status: "CANCELED" } }),
      prisma.classroom.findMany({
        include: {
          schedules: {
            where: { status: "ACTIVE" },
          },
        },
      }),
      prisma.schedule.findMany({
        where: { status: "ACTIVE" },
        include: {
          classroom: true,
          teacher: true,
          grade: true,
        },
      }),
      prisma.teacher.findMany({
        include: {
          schedules: {
            where: { status: "ACTIVE" },
          },
        },
      }),
    ])

    // Calculate classroom utilization
    const classroomUtilization = classrooms.map((classroom) => {
      const totalSlots = 5 * 8 // 5 days * 8 slots
      const usedSlots = classroom.schedules.length
      const utilization = (usedSlots / totalSlots) * 100

      return {
        name: classroom.name,
        capacity: classroom.capacity,
        usedSlots,
        totalSlots,
        utilization: Math.round(utilization * 100) / 100,
      }
    })

    // Calculate teacher workload
    const teacherWorkload = teachers.map((teacher) => ({
      name: teacher.name,
      totalHours: teacher.schedules.length,
      averageHoursPerDay: Math.round((teacher.schedules.length / 5) * 100) / 100,
    }))

    // Calculate schedule distribution by day
    const scheduleByDay = {
      MON: schedules.filter((s) => s.day === "MON").length,
      TUE: schedules.filter((s) => s.day === "TUE").length,
      WED: schedules.filter((s) => s.day === "WED").length,
      THU: schedules.filter((s) => s.day === "THU").length,
      FRI: schedules.filter((s) => s.day === "FRI").length,
    }

    // Calculate schedule distribution by slot
    const scheduleBySlot = [1, 2, 3, 4, 5, 6, 7, 8].map((slot) => ({
      slot,
      count: schedules.filter((s) => s.slot === slot).length,
    }))

    // Calculate capacity utilization
    const capacityUtilization = schedules.map((schedule) => {
      const grade = schedule.grade
      const classroom = schedule.classroom
      const utilization = grade.studentCount > 0
        ? (grade.studentCount / classroom.capacity) * 100
        : 0

      return {
        grade: grade.name,
        classroom: classroom.name,
        studentCount: grade.studentCount,
        capacity: classroom.capacity,
        utilization: Math.round(utilization * 100) / 100,
      }
    })

    const averageCapacityUtilization =
      capacityUtilization.length > 0
        ? capacityUtilization.reduce((sum, c) => sum + c.utilization, 0) /
          capacityUtilization.length
        : 0

    return NextResponse.json({
      overview: {
        totalTeachers,
        totalStudents,
        totalClassrooms,
        totalGrades,
        totalSubjects,
        totalSchedules,
        activeSchedules,
        canceledSchedules,
        scheduleCompletionRate:
          totalSchedules > 0
            ? Math.round((activeSchedules / totalSchedules) * 100)
            : 0,
      },
      classroomUtilization,
      teacherWorkload,
      scheduleByDay,
      scheduleBySlot,
      capacityUtilization: {
        average: Math.round(averageCapacityUtilization * 100) / 100,
        details: capacityUtilization,
      },
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}


