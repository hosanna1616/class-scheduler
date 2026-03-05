import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const type = searchParams.get("type") || "schedule"

    let data: any[] = []
    let filename = "export"

    switch (type) {
      case "schedule":
        const schedules = await prisma.schedule.findMany({
          include: {
            grade: true,
            classroom: true,
            teacher: true,
            subject: true,
          },
          orderBy: [{ day: "asc" }, { slot: "asc" }],
        })
        data = schedules.map((s) => ({
          Day: s.day,
          Slot: s.slot,
          Grade: s.grade.name,
          Subject: s.subject.name,
          Teacher: s.teacher.name,
          Classroom: s.classroom.name,
          Status: s.status,
          "Created At": s.createdAt.toISOString(),
        }))
        filename = "schedule"
        break

      case "teachers":
        const teachers = await prisma.teacher.findMany({
          include: {
            schedules: {
              where: { status: "ACTIVE" },
            },
          },
        })
        data = teachers.map((t) => ({
          Name: t.name,
          "Total Classes": t.schedules.length,
          "Created At": t.createdAt.toISOString(),
        }))
        filename = "teachers"
        break

      case "classrooms":
        const classrooms = await prisma.classroom.findMany({
          include: {
            schedules: {
              where: { status: "ACTIVE" },
            },
          },
        })
        data = classrooms.map((c) => ({
          Name: c.name,
          Capacity: c.capacity,
          "Used Slots": c.schedules.length,
          "Utilization %": Math.round((c.schedules.length / (5 * 8)) * 100),
          "Created At": c.createdAt.toISOString(),
        }))
        filename = "classrooms"
        break

      case "grades":
        const grades = await prisma.grade.findMany({
          include: {
            schedules: {
              where: { status: "ACTIVE" },
            },
          },
        })
        data = grades.map((g) => ({
          Name: g.name,
          "Student Count": g.studentCount,
          "Total Classes": g.schedules.length,
          "Created At": g.createdAt.toISOString(),
        }))
        filename = "grades"
        break

      default:
        return NextResponse.json(
          { error: "Invalid export type" },
          { status: 400 }
        )
    }

    if (format === "csv") {
      // Convert to CSV
      const headers = Object.keys(data[0] || {})
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
          headers.map((header) => JSON.stringify(row[header] || "")).join(",")
        ),
      ]
      const csv = csvRows.join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      })
    } else if (format === "xlsx") {
      // Convert to XLSX
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      })
    } else {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'xlsx'" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}


