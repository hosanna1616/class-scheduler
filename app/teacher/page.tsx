"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Bell, BookOpen, Plus, X, Ban, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"

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

interface Note {
  id: string
  content: string
  date: string
}

const days = ["MON", "TUE", "WED", "THU", "FRI"]
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const slots = [1, 2, 3, 4, 5, 6, 7, 8]

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

function getCurrentDay(): string {
  const now = new Date()
  const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1
  return days[dayIndex]
}

function getCurrentSlot(periods: Period[]): { day: string; slot: number; period: Period } | null {
  const now = new Date()
  const currentDay = getCurrentDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (const period of periods) {
    if (period.day === currentDay) {
      const start = parseTime(period.startTime)
      const end = parseTime(period.endTime)
      if (currentMinutes >= start && currentMinutes < end) {
        return { day: currentDay, slot: period.slot, period }
      }
    }
  }

  return null
}

function getNextClass(schedule: ScheduleItem[], periods: Period[]): { item: ScheduleItem; minutesUntil: number } | null {
  const now = new Date()
  const currentDay = getCurrentDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  let nextClass: { item: ScheduleItem; minutesUntil: number } | null = null
  let minMinutes = Infinity

  for (const item of schedule) {
    if (item.day === currentDay) {
      const period = periods.find((p) => p.day === currentDay && p.slot === item.slot)
      if (period) {
        const start = parseTime(period.startTime)
        if (start > currentMinutes && start - currentMinutes < minMinutes) {
          minMinutes = start - currentMinutes
          nextClass = { item, minutesUntil: minMinutes }
        }
      }
    }
  }

  return nextClass
}

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [teacher, setTeacher] = useState<any>(null)
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [currentSlot, setCurrentSlot] = useState<{ day: string; slot: number; period: Period } | null>(null)
  const [nextClass, setNextClass] = useState<{ item: ScheduleItem; minutesUntil: number } | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Load notes from localStorage on mount
  useEffect(() => {
    if (teacher?.id || session?.user?.id) {
      const teacherId = teacher?.id || session?.user?.id
      if (teacherId) {
        const savedNotes = localStorage.getItem(`teacher-notes-${teacherId}`)
        if (savedNotes) {
          try {
            setNotes(JSON.parse(savedNotes))
          } catch (e) {
            console.error("Error loading notes:", e)
          }
        }
      }
    }
  }, [teacher, session])

  useEffect(() => {
    if (!session?.user?.id) return

    // Get teacher data using the /api/teacher/me endpoint
    // Use cache busting to ensure we get the latest data
    Promise.all([
      fetch("/api/teacher/me", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/teacher/schedule", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/periods", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([teacherData, scheduleData, periodsData]) => {
        console.log("Teacher data:", teacherData)
        console.log("Schedule data:", scheduleData)
        console.log("Periods data:", periodsData)
        
        if (teacherData && !teacherData.error) {
          setTeacher(teacherData)
          // Ensure scheduleData is an array
          const schedules = Array.isArray(scheduleData) ? scheduleData : []
          setSchedule(schedules)
          setPeriods(periodsData || [])
          setCurrentSlot(getCurrentSlot(periodsData || []))
          setNextClass(getNextClass(schedules, periodsData || []))
          
          if (schedules.length === 0) {
            console.warn(`⚠️ No schedules found for teacher ${teacherData.name} (ID: ${teacherData.id})`)
            toast({
              title: "No Schedule Found",
              description: "You don't have any assigned classes yet. Please contact the administrator to assign you to classes.",
              variant: "default",
            })
          }
        } else {
          // Fallback to session user if teacher not found
          console.error("Teacher not found in database")
          setTeacher({ id: session.user.id, name: session.user.name || "Teacher" })
          setSchedule([])
          setPeriods(periodsData || [])
          toast({
            title: "Teacher Account Not Found",
            description: "Your teacher account could not be found. Please contact the administrator.",
            variant: "destructive",
          })
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching teacher data:", error)
        // Fallback to session user
        setTeacher({ id: session.user.id, name: session.user.name || "Teacher" })
        setLoading(false)
      })

    // Update every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      if (periods.length > 0) {
        setCurrentSlot(getCurrentSlot(periods))
        setNextClass(getNextClass(schedule, periods))
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [session?.user?.id, periods.length, schedule.length])

  const handleAddNote = () => {
    if (!newNote.trim()) return

    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      date: new Date().toISOString(),
    }

    const updatedNotes = [...notes, note]
    setNotes(updatedNotes)
    setNewNote("")

    // Save to localStorage
    const teacherId = sessionStorage.getItem("teacherId")
    if (teacherId) {
      localStorage.setItem(`teacher-notes-${teacherId}`, JSON.stringify(updatedNotes))
      
      // Also try to save to API (optional)
      fetch("/api/teacher/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, content: newNote }),
      }).catch(console.error)
    }
  }

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter((n) => n.id !== id)
    setNotes(updatedNotes)
    
    // Save to localStorage
    const teacherId = teacher?.id || session?.user?.id
    if (teacherId) {
      localStorage.setItem(`teacher-notes-${teacherId}`, JSON.stringify(updatedNotes))
    }
  }

  const handleCancelClass = async (scheduleId: string) => {
    setCanceling(scheduleId)
    try {
      const res = await fetch(`/api/schedule/${scheduleId}/cancel`, {
        method: "PUT",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to cancel class")
      }
      const result = await res.json()
      toast({
        title: "✅ Class Canceled",
        description: result.message || "Class canceled successfully. The classroom is now free.",
        variant: "success",
      })
      // Refresh schedule
      const scheduleRes = await fetch("/api/teacher/schedule", { cache: "no-store" })
      const scheduleData = await scheduleRes.json()
      setSchedule(scheduleData)
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error?.message || "Failed to cancel class",
        variant: "destructive",
      })
    } finally {
      setCanceling(null)
    }
  }

  const handleReactivateClass = async (scheduleId: string) => {
    setCanceling(scheduleId)
    try {
      const res = await fetch(`/api/schedule/${scheduleId}/reactivate`, {
        method: "PUT",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to reactivate class")
      }
      const result = await res.json()
      toast({
        title: "✅ Class Reactivated",
        description: result.message || "Class reactivated successfully",
        variant: "success",
      })
      // Refresh schedule
      const scheduleRes = await fetch("/api/teacher/schedule", { cache: "no-store" })
      const scheduleData = await scheduleRes.json()
      setSchedule(scheduleData)
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error?.message || "Failed to reactivate class",
        variant: "destructive",
      })
    } finally {
      setCanceling(null)
    }
  }

  const getTodaySchedule = () => {
    const today = getCurrentDay()
    return schedule
      .filter((s) => s.day === today)
      .sort((a, b) => a.slot - b.slot)
  }

  const getScheduleItem = (day: string, slot: number) => {
    return schedule.find((s) => s.day === day && s.slot === slot)
  }

  const getPeriod = (slot: number) => {
    return periods.find((p) => p.day === "MON" && p.slot === slot)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const todaySchedule = getTodaySchedule()
  const currentPeriod = currentSlot
    ? todaySchedule.find((s) => s.slot === currentSlot.slot)
    : null

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header with Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, {teacher?.name || "Teacher"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Today: {formatDate(currentTime)}
          </p>
        </div>
        <motion.div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
        >
          <Clock className="h-4 w-4" />
          {currentTime.toLocaleTimeString()}
        </motion.div>
      </motion.div>

      {/* Next Class Banner */}
      {nextClass && nextClass.minutesUntil <= 15 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 hover-glow hover-gold transition-smooth">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Bell className="h-5 w-5 text-yellow-600" />
                </motion.div>
                <div>
                  <p className="font-semibold">
                    Next class in {nextClass.minutesUntil} minutes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nextClass.item.subject.name} - {nextClass.item.grade.name} at {nextClass.item.classroom.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Today's Current Period Card */}
      {currentPeriod && currentSlot && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-primary/5 border-primary/20 hover-glow hover-purple transition-smooth pulse-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="h-5 w-5" />
                </motion.div>
                Current Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Subject", value: currentPeriod.subject.name },
                  { label: "Class", value: currentPeriod.grade.name },
                  { label: "Room", value: currentPeriod.classroom.name },
                  { label: "Time", value: `${currentSlot.period.startTime} - ${currentSlot.period.endTime}` },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="hover-scale"
                  >
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="font-semibold">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Schedule</TabsTrigger>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="notes">Quick Notes</TabsTrigger>
        </TabsList>

        {/* Today's Schedule Tab */}
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
                  const isCurrent = currentSlot?.slot === slot

                  return (
                    <motion.div
                      key={slot}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: slot * 0.05 }}
                      className={`p-4 rounded-lg border transition-smooth hover-scale ${
                        isCurrent
                          ? "bg-primary/10 border-primary pulse-glow"
                          : "bg-card hover-glow hover-blue"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="font-semibold w-20">
                            Period {slot}
                          </div>
                          {period && (
                            <div className="text-sm text-muted-foreground">
                              {period.startTime} - {period.endTime}
                            </div>
                          )}
                        </div>
                        {isCurrent && (
                          <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                            Current
                          </span>
                        )}
                      </div>
                      {item ? (
                        <div className="mt-2 space-y-2">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Subject</p>
                              <p className="font-medium">{item.subject.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Class</p>
                              <p className="font-medium">{item.grade.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Room</p>
                              <p className="font-medium">{item.classroom.name}</p>
                            </div>
                          </div>
                          {item.status === "CANCELED" ? (
                            <div className="flex items-center gap-2 pt-2">
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded">
                                Canceled
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReactivateClass(item.id)}
                                disabled={canceling === item.id}
                                className="hover-glow hover-emerald transition-smooth"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                {canceling === item.id ? "Reactivating..." : "Reactivate"}
                              </Button>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelClass(item.id)}
                                disabled={canceling === item.id}
                                className="hover-glow hover-red transition-smooth text-red-600 dark:text-red-400"
                              >
                                <Ban className="h-3 w-3 mr-1" />
                                {canceling === item.id ? "Canceling..." : "Cancel Class"}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-muted-foreground">Free period</div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly View Tab */}
        <TabsContent value="weekly" className="space-y-4">
          {schedule.length === 0 ? (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <CardHeader>
                <CardTitle>No Schedule Assigned</CardTitle>
                <CardDescription>
                  You don't have any classes assigned yet. Please contact the administrator to:
                  <br />1. Create assignments (Grade + Subject) for you
                  <br />2. Regenerate the timetable
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Full week timetable</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2">Period</th>
                        {days.map((day) => (
                          <th key={day} className="border p-2">
                            {dayNames[days.indexOf(day)]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map((slot) => {
                        const period = getPeriod(slot)
                        return (
                          <tr key={slot}>
                            <td className="border p-2 font-medium">
                              <div>Period {slot}</div>
                              {period && (
                                <div className="text-xs text-muted-foreground">
                                  {period.startTime} - {period.endTime}
                                </div>
                              )}
                            </td>
                            {days.map((day) => {
                              const item = getScheduleItem(day, slot)
                              const isToday = day === getCurrentDay()
                              const isCurrent = isToday && currentSlot?.slot === slot

                              return (
                                <motion.td
                                  key={day}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: (slots.indexOf(slot) + days.indexOf(day)) * 0.02 }}
                                  className={`border p-2 transition-smooth hover-scale ${
                                    isCurrent
                                      ? "bg-primary/10 border-primary pulse-glow"
                                      : isToday
                                      ? "bg-muted/50 hover-emerald"
                                      : "hover-shimmer hover-blue"
                                  }`}
                                >
                                  {item ? (
                                    <div className="text-sm space-y-1">
                                      <div className="font-semibold">
                                        {item.subject.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {item.grade.name}
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
                                </motion.td>
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
          )}
        </TabsContent>

        {/* Quick Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Notes</CardTitle>
              <CardDescription>
                Add reminders and notes for your classes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <Input
                  placeholder="e.g., Bring projector for Grade 10 Physics"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddNote()
                    }
                  }}
                  className="transition-smooth focus:scale-[1.02]"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleAddNote} className="hover-glow hover-purple">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </motion.div>
              </motion.div>
              <div className="space-y-2">
                {notes.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-muted-foreground text-center py-4"
                  >
                    No notes yet. Add a note above.
                  </motion.p>
                ) : (
                  notes.map((note, idx) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start justify-between p-3 bg-muted rounded-lg hover-scale hover-shimmer hover-emerald transition-smooth"
                    >
                      <p className="text-sm flex-1">{note.content}</p>
                      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                          className="hover-gold"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

