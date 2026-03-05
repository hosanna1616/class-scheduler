"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertTriangle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeSchedule } from "@/hooks/useRealtimeSchedule"
import { ScheduleSkeleton } from "@/components/skeleton-loader"
import { useLanguage } from "@/components/language-provider"

interface ScheduleItem {
  id: string
  day: string
  slot: number
  grade: { name: string }
  classroom: { name: string }
  teacher: { name: string }
  subject: { name: string }
}

interface Period {
  id: string
  day: string
  slot: number
  startTime: string
  endTime: string
}

const days = ["MON", "TUE", "WED", "THU", "FRI"]
const slots = [1, 2, 3, 4, 5, 6, 7, 8]

export default function SchedulePage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { schedule: realtimeSchedule, loading: realtimeLoading } = useRealtimeSchedule()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchSchedule = async () => {
    try {
      const [scheduleRes, periodsRes] = await Promise.all([
        fetch("/api/schedule", { cache: "no-store", next: { revalidate: 0 } }),
        fetch("/api/periods", { cache: "no-store", next: { revalidate: 0 } })
      ])
      const scheduleData = await scheduleRes.json()
      const periodsData = await periodsRes.json()
      console.log(`Fetched ${scheduleData.length} schedule entries`)
      setSchedule(scheduleData)
      setPeriods(periodsData)
    } catch (error) {
      console.error("Error fetching schedule:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [])

  // Use real-time schedule if available
  useEffect(() => {
    if (realtimeSchedule.length > 0) {
      setSchedule(realtimeSchedule)
    }
  }, [realtimeSchedule])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/timetable/generate", {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate")
      
      // Show success message with details
      if (data.placementRate === 100) {
        toast({
          title: "✅ Timetable Generated Successfully!",
          description: `All ${data.scheduleCount} hours have been placed successfully. The schedule is now complete and ready to use.`,
          variant: "success",
        })
      } else {
        toast({
          title: "⚠️ Timetable Generated (Partial)",
          description: `${data.scheduleCount}/${data.totalNeeded} hours placed (${data.placementRate}%). Some assignments may need manual adjustment.`,
          variant: "warning",
        })
      }
      
      // Force refresh with cache busting
      setLoading(true)
      await fetchSchedule()
      setLoading(false)
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate timetable. Please try again.",
        variant: "destructive",
      })
      console.error("Error:", error)
    } finally {
      setGenerating(false)
    }
  }

  const getScheduleItems = (day: string, slot: number) => {
    // Get ALL schedules for this day/slot (there might be multiple classrooms)
    return schedule.filter((s) => s.day === day && s.slot === slot)
  }

  const getPeriod = (day: string, slot: number) => {
    return periods.find((p) => p.day === day && p.slot === slot)
  }

  const handleExport = async (format: string) => {
    setExporting(true)
    try {
      const response = await fetch(`/api/export?type=schedule&format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `schedule.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "✅ Export Successful",
        description: `Schedule exported as ${format.toUpperCase()}`,
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "❌ Export Failed",
        description: "Failed to export schedule",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading || realtimeLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schedule</h1>
            <p className="text-muted-foreground">View and manage the complete timetable</p>
          </div>
        </div>
        <ScheduleSkeleton />
      </div>
    )
  }

  // Count total schedules
  const totalSchedules = schedule.length
  const uniqueGrades = new Set(schedule.map(s => s.grade.name)).size
  const uniqueSubjects = new Set(schedule.map(s => s.subject.name)).size

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedule</h2>
          <p className="text-sm text-muted-foreground">
            Showing {totalSchedules} schedule entries across {uniqueGrades} grades and {uniqueSubjects} subjects
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Regenerate Timetable
        </Button>
      </div>

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
            {slots.map((slot) => {
              const period = getPeriod("MON", slot) // All days have same times
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
                    const items = getScheduleItems(day, slot)
                    return (
                      <td key={day} className="border p-2">
                        {items.length > 0 ? (
                          <div className="text-xs space-y-2">
                            {items.map((item, idx) => (
                              <div key={idx} className="border-b last:border-b-0 pb-1 last:pb-0">
                                <div className="font-semibold">{item.grade.name}</div>
                                <div>{item.subject.name}</div>
                                <div className="text-muted-foreground">
                                  {item.teacher.name}
                                </div>
                                <div className="text-muted-foreground text-[10px]">
                                  {item.classroom.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-xs">Free</div>
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
    </div>
  )
}

