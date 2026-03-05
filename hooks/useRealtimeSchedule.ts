"use client"

import { useEffect, useState } from "react"
import { useSocket } from "./useSocket"
import { useSession } from "next-auth/react"

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

export function useRealtimeSchedule() {
  const { data: session } = useSession()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  // Initial fetch
  useEffect(() => {
    fetch("/api/schedule", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setSchedule(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching schedule:", error)
        setLoading(false)
      })
  }, [])

  // Real-time updates via polling (every 10 seconds)
  useEffect(() => {
    if (!session) return

    const interval = setInterval(() => {
      fetch("/api/schedule", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          setSchedule(data)
        })
        .catch((error) => {
          console.error("Error fetching schedule:", error)
        })
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [session])

  return { schedule, loading, isConnected: true }
}

