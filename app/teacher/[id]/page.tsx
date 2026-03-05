"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ScheduleItem {
  id: string
  day: string
  slot: number
  grade: { name: string }
  classroom: { name: string }
  subject: { name: string }
}

const days = ["MON", "TUE", "WED", "THU", "FRI"]
const slots = [1, 2, 3, 4, 5, 6, 7, 8]

export default function TeacherSchedulePage() {
  const params = useParams()
  const teacherId = params.id as string
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [teacher, setTeacher] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/schedule").then((r) => r.json()),
      fetch(`/api/teachers/${teacherId}`).then((r) => r.json()),
    ]).then(([scheduleData, teacherData]) => {
      const teacherSchedule = scheduleData.filter(
        (s: any) => s.teacherId === teacherId
      )
      setSchedule(teacherSchedule)
      setTeacher(teacherData)
      setLoading(false)
    })
  }, [teacherId])

  const getScheduleItem = (day: string, slot: number) => {
    return schedule.find((s) => s.day === day && s.slot === slot)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{teacher?.name || "Teacher"} Schedule</h1>
        <p className="text-muted-foreground">Weekly timetable</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">Time Slot</th>
                  {days.map((day) => (
                    <th key={day} className="border p-2">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot}>
                    <td className="border p-2 font-medium">Slot {slot}</td>
                    {days.map((day) => {
                      const item = getScheduleItem(day, slot)
                      return (
                        <td key={day} className="border p-2">
                          {item ? (
                            <div className="space-y-1">
                              <div className="font-semibold">{item.grade.name}</div>
                              <div>{item.subject.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.classroom.name}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-xs">Free</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}







