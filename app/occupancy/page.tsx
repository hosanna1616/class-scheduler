"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"

interface Period {
  id: string
  day: string
  slot: number
  startTime: string
  endTime: string
}

interface ScheduleItem {
  id: string
  day: string
  slot: number
  grade: { name: string }
  classroom: { name: string }
  teacher: { name: string }
  subject: { name: string }
}

interface OccupancyState {
  classroom: string
  teacher: string
  grade: string
  subject: string
  status: "free" | "occupied" | "upcoming" | "past"
  timeRemaining?: number
  startTime?: string
  endTime?: string
  currentSlot?: number
}

const days = ["MON", "TUE", "WED", "THU", "FRI"]
const slots = [1, 2, 3, 4, 5, 6, 7, 8]

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

function getCurrentSlot(periods: Period[]): { day: string; slot: number } | null {
  const now = new Date()
  const currentDay = days[now.getDay() === 0 ? 6 : now.getDay() - 1] // Convert Sunday=0 to Monday=0
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (const period of periods) {
    if (period.day === currentDay) {
      const start = parseTime(period.startTime)
      const end = parseTime(period.endTime)
      if (currentMinutes >= start && currentMinutes < end) {
        return { day: currentDay, slot: period.slot }
      }
    }
  }

  return null
}

function getTimeRemaining(period: Period): number {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const end = parseTime(period.endTime)
  return Math.max(0, end - currentMinutes)
}

function isPeriodPast(period: Period, currentSlot: { day: string; slot: number } | null): boolean {
  if (!currentSlot) return false
  
  const now = new Date()
  const currentDay = days[now.getDay() === 0 ? 6 : now.getDay() - 1]
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  // Check if this period is on the same day and has ended
  if (period.day === currentDay) {
    const end = parseTime(period.endTime)
    return currentMinutes >= end
  }
  
  // Check if this period is on a past day
  const periodDayIndex = days.indexOf(period.day)
  const currentDayIndex = days.indexOf(currentDay)
  return periodDayIndex < currentDayIndex
}

export default function OccupancyPage() {
  const { t } = useLanguage()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [currentSlot, setCurrentSlot] = useState<{ day: string; slot: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const fetchData = async () => {
    try {
      const [scheduleRes, periodsRes] = await Promise.all([
        fetch("/api/schedule", { cache: "no-store" }),
        fetch("/api/periods", { cache: "no-store" })
      ])
      const scheduleData = await scheduleRes.json()
      const periodsData = await periodsRes.json()
      
      // Filter out canceled classes for occupancy view (they show as free)
      const activeSchedule = scheduleData.filter((s: any) => s.status !== "CANCELED")
      
      setSchedule(activeSchedule)
      setPeriods(periodsData)
      setCurrentSlot(getCurrentSlot(periodsData))
      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Update every 30 seconds for real-time feel
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      fetchData() // Refresh schedule data
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getOccupancyState = (classroom: string, day: string, slot: number): OccupancyState | null => {
    const scheduleItem = schedule.find(
      (s) => s.classroom.name === classroom && s.day === day && s.slot === slot
    )

    const period = periods.find((p) => p.day === day && p.slot === slot)

    // If no schedule item or if it's canceled, show as free
    if (!scheduleItem || (scheduleItem as any).status === "CANCELED") {
      return {
        classroom,
        teacher: "",
        grade: "",
        subject: "",
        status: "free",
        startTime: period?.startTime,
        endTime: period?.endTime,
      }
    }

    const isCurrent = currentSlot?.day === day && currentSlot?.slot === slot
    const isPast = period ? isPeriodPast(period, currentSlot) : false
    const isUpcoming = currentSlot && !isPast && !isCurrent && 
      ((day === currentSlot.day && slot > currentSlot.slot) ||
       (days.indexOf(day) > days.indexOf(currentSlot.day)))

    let status: "free" | "occupied" | "upcoming" | "past" = "free"
    if (isCurrent) {
      status = "occupied"
    } else if (isPast) {
      status = "past" // Period has ended, show as free
    } else if (isUpcoming) {
      status = "upcoming"
    }

    return {
      classroom,
      teacher: scheduleItem.teacher.name,
      grade: scheduleItem.grade.name,
      subject: scheduleItem.subject.name,
      status,
      timeRemaining: isCurrent && period ? getTimeRemaining(period) : undefined,
      startTime: period?.startTime,
      endTime: period?.endTime,
      currentSlot: isCurrent ? slot : undefined,
    }
  }

  const getClassrooms = () => {
    const unique = new Set(schedule.map((s) => s.classroom.name))
    return Array.from(unique).sort()
  }

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}:${mins.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading occupancy data...</p>
        </div>
      </div>
    )
  }

  const classrooms = getClassrooms()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
          {t("occupancy.title")}
        </h1>
        <p className="text-muted-foreground">
          Real-time classroom occupancy status - Last updated: <span className="font-mono text-purple-600 dark:text-purple-400">{currentTime.toLocaleTimeString()}</span>
        </p>
      </div>

      <div className="grid gap-4">
        {classrooms.map((classroom) => (
          <Card key={classroom} className="border-purple-200 dark:border-purple-800">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardTitle className="text-purple-900 dark:text-purple-100">{classroom}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border p-2">Slot / Time</th>
                      {days.map((day) => (
                        <th key={day} className="border p-2">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot) => {
                      const period = periods.find((p) => p.day === "MON" && p.slot === slot)
                      return (
                        <tr key={slot}>
                          <td className="border p-2 font-medium">
                            <div>Slot {slot}</div>
                            {period && (
                              <div className="text-xs text-muted-foreground">
                                {period.startTime} - {period.endTime}
                              </div>
                            )}
                          </td>
                          {days.map((day) => {
                            const state = getOccupancyState(classroom, day, slot)
                            if (!state) return <td key={day} className="border p-2"></td>

                            const bgColor =
                              state.status === "occupied"
                                ? "bg-red-100 dark:bg-red-900/20 border-red-300"
                                : state.status === "upcoming"
                                ? "bg-purple-200 dark:bg-purple-900/30 border-purple-400"
                                : state.status === "past"
                                ? "bg-purple-100 dark:bg-purple-900/20 border-purple-300" // Past periods show as free
                                : "bg-purple-100 dark:bg-purple-900/20 border-purple-300"

                            return (
                              <td key={day} className={`border p-2 ${bgColor}`}>
                                {state.status === "free" || state.status === "past" ? (
                                  <div className="text-purple-700 dark:text-purple-300">
                                    <div className="font-medium">Free</div>
                                    {state.startTime && state.endTime && (
                                      <div className="text-xs mt-1 text-purple-600 dark:text-purple-400">
                                        {state.startTime} - {state.endTime}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="font-semibold text-foreground">{state.grade}</div>
                                    <div className="text-foreground">{state.subject}</div>
                                    <div className="text-xs text-muted-foreground">
                                      👤 {state.teacher}
                                    </div>
                                    {state.startTime && state.endTime && (
                                      <div className="text-xs font-mono text-purple-600 dark:text-purple-400">
                                        🕐 {state.startTime} - {state.endTime}
                                      </div>
                                    )}
                                    {state.timeRemaining !== undefined && (
                                      <div className="text-xs font-mono text-red-600 dark:text-red-400 font-semibold">
                                        ⏱️ {formatTime(state.timeRemaining)} remaining
                                      </div>
                                    )}
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
        ))}
      </div>
    </div>
  )
}

