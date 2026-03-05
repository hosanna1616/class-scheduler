"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Calendar, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ScheduleItem {
  id: string
  day: string
  slot: number
  status?: string
  grade: { name: string }
  classroom: { name: string }
  subject: { name: string }
  teacher: { name: string }
}

interface Period {
  id: string
  day: string
  slot: number
  startTime: string
  endTime: string
}

interface Student {
  id: string
  name: string
  email: string
  grade: {
    id: string
    name: string
  }
}

const days = ["MON", "TUE", "WED", "THU", "FRI"]
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const slots = [1, 2, 3, 4, 5, 6, 7, 8]

function getCurrentDay(): string {
  const now = new Date()
  const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1
  return days[dayIndex]
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const [student, setStudent] = useState<Student | null>(null)
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return

    // Fetch student data
    fetch("/api/student/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Student not found:", data.error)
          setLoading(false)
          return
        }
        setStudent(data)

        // Fetch schedule for student's grade
        return Promise.all([
          fetch(`/api/schedule?gradeId=${data.grade.id}`).then((r) => r.json()),
          fetch("/api/periods").then((r) => r.json()),
        ])
      })
      .then(([scheduleData, periodsData]) => {
        if (scheduleData) {
          setSchedule(scheduleData)
          setPeriods(periodsData || [])
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching student data:", error)
        setLoading(false)
      })
  }, [session])

  const getTodaySchedule = () => {
    const today = getCurrentDay()
    return schedule
      .filter((s) => s.day === today && s.status === "ACTIVE")
      .sort((a, b) => a.slot - b.slot)
  }

  const getScheduleItem = (day: string, slot: number) => {
    return schedule.find(
      (s) => s.day === day && s.slot === slot && s.status === "ACTIVE"
    )
  }

  const getPeriod = (slot: number) => {
    const today = getCurrentDay()
    return periods.find((p) => p.day === today && p.slot === slot)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6">
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle>Student Account Not Found</CardTitle>
            <CardDescription>
              Your student account could not be found. Please contact the administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const todaySchedule = getTodaySchedule()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {student.name}</h1>
        <p className="text-muted-foreground">
          Grade: {student.grade.name} | View your personal timetable
        </p>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Schedule</TabsTrigger>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Timetable</CardTitle>
              <CardDescription>
                {dayNames[days.indexOf(getCurrentDay())]} - All periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {slots.map((slot) => {
                  const period = getPeriod(slot)
                  const item = getScheduleItem(getCurrentDay(), slot)

                  return (
                    <div
                      key={slot}
                      className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="font-semibold w-20">Period {slot}</div>
                          {period && (
                            <div className="text-sm text-muted-foreground">
                              {period.startTime} - {period.endTime}
                            </div>
                          )}
                        </div>
                      </div>
                      {item ? (
                        <div className="mt-2 space-y-2">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Subject</p>
                              <p className="font-medium">{item.subject.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Teacher</p>
                              <p className="font-medium">{item.teacher.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Room</p>
                              <p className="font-medium">{item.classroom.name}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Free period
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Your complete weekly timetable</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left">Time</th>
                      {days.map((day) => (
                        <th key={day} className="border p-2 text-center">
                          {dayNames[days.indexOf(day)]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot) => {
                      const period = periods.find((p) => p.day === days[0] && p.slot === slot)
                      return (
                        <tr key={slot}>
                          <td className="border p-2">
                            {period ? (
                              <div className="text-sm">
                                <div>{period.startTime}</div>
                                <div className="text-muted-foreground">
                                  {period.endTime}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm">Slot {slot}</div>
                            )}
                          </td>
                          {days.map((day) => {
                            const item = getScheduleItem(day, slot)
                            return (
                              <td key={day} className="border p-2">
                                {item ? (
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {item.subject.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.teacher.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.classroom.name}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    Free
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


