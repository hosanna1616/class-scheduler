import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const type = searchParams.get("type") || "all"

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results: any = {
      teachers: [],
      classrooms: [],
      grades: [],
      subjects: [],
      schedules: [],
    }

    if (type === "all" || type === "teachers") {
      const teachers = await prisma.teacher.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: 10,
      })
      results.teachers = teachers.map((t) => ({
        id: t.id,
        name: t.name,
        type: "teacher",
        url: `/admin/teachers`,
      }))
    }

    if (type === "all" || type === "classrooms") {
      const classrooms = await prisma.classroom.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: 10,
      })
      results.classrooms = classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        type: "classroom",
        url: `/admin/classrooms`,
      }))
    }

    if (type === "all" || type === "grades") {
      const grades = await prisma.grade.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: 10,
      })
      results.grades = grades.map((g) => ({
        id: g.id,
        name: g.name,
        type: "grade",
        url: `/admin/grades`,
      }))
    }

    if (type === "all" || type === "subjects") {
      const subjects = await prisma.subject.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: 10,
      })
      results.subjects = subjects.map((s) => ({
        id: s.id,
        name: s.name,
        type: "subject",
        url: `/admin/subjects`,
      }))
    }

    if (type === "all" || type === "schedules") {
      const schedules = await prisma.schedule.findMany({
        where: {
          OR: [
            {
              grade: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
            {
              subject: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
            {
              teacher: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
            {
              classroom: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          ],
        },
        include: {
          grade: true,
          subject: true,
          teacher: true,
          classroom: true,
        },
        take: 20,
      })
      results.schedules = schedules.map((s) => ({
        id: s.id,
        name: `${s.grade.name} - ${s.subject.name} (${s.teacher.name})`,
        type: "schedule",
        url: `/admin/schedule`,
        details: {
          day: s.day,
          slot: s.slot,
          classroom: s.classroom.name,
        },
      }))
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    )
  }
}


