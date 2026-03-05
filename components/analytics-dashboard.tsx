"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

interface AnalyticsData {
  overview: {
    totalTeachers: number
    totalStudents: number
    totalClassrooms: number
    totalGrades: number
    totalSubjects: number
    totalSchedules: number
    activeSchedules: number
    canceledSchedules: number
    scheduleCompletionRate: number
  }
  classroomUtilization: Array<{
    name: string
    capacity: number
    usedSlots: number
    totalSlots: number
    utilization: number
  }>
  teacherWorkload: Array<{
    name: string
    totalHours: number
    averageHoursPerDay: number
  }>
  scheduleByDay: {
    MON: number
    TUE: number
    WED: number
    THU: number
    FRI: number
  }
  scheduleBySlot: Array<{
    slot: number
    count: number
  }>
  capacityUtilization: {
    average: number
    details: Array<{
      grade: string
      classroom: string
      studentCount: number
      capacity: number
      utilization: number
    }>
  }
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"]

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching analytics:", error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return <div>No data available</div>
  }

  const dayData = Object.entries(data.scheduleByDay).map(([day, count]) => ({
    day,
    count,
  }))

  const topClassrooms = [...data.classroomUtilization]
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 5)

  const topTeachers = [...data.teacherWorkload]
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalTeachers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activeSchedules}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.scheduleCompletionRate}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalClassrooms}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Distribution by Day</CardTitle>
            <CardDescription>Number of classes per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule Distribution by Slot</CardTitle>
            <CardDescription>Number of classes per time slot</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.scheduleBySlot}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="slot" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Classroom Utilization</CardTitle>
            <CardDescription>Most used classrooms</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClassrooms}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="utilization" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Teacher Workload</CardTitle>
            <CardDescription>Teachers with most classes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topTeachers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalHours" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity Utilization</CardTitle>
          <CardDescription>
            Average: {data.capacityUtilization.average.toFixed(2)}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.capacityUtilization.details.slice(0, 10).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">{item.grade}</p>
                  <p className="text-sm text-muted-foreground">{item.classroom}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.utilization.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {item.studentCount}/{item.capacity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


