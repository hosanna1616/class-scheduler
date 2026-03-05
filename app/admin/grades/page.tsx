"use client"

import { useEffect, useState } from "react"
import { CrudTable } from "@/components/crud-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Grade {
  id: string
  name: string
  studentCount: number
}

export default function GradesPage() {
  const { toast } = useToast()
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGrades = async () => {
    try {
      const res = await fetch("/api/grades")
      if (!res.ok) {
        throw new Error("Failed to fetch grades")
      }
      const data = await res.json()
      setGrades(data)
    } catch (error: any) {
      console.error("Error fetching grades:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to load grades. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGrades()
  }, [])

  const handleAdd = async (data: any) => {
    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create grade")
    fetchGrades()
  }

  const handleUpdate = async (id: string, data: any) => {
    const res = await fetch(`/api/grades/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update grade")
    fetchGrades()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/grades/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("Failed to delete grade")
    fetchGrades()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading grades...</p>
        </div>
      </div>
    )
  }

  return (
    <CrudTable
      title="Grades"
      items={grades}
      columns={[
        { key: "name", label: "Name" },
        { key: "studentCount", label: "Student Count", render: (item: Grade) => item.studentCount || 0 },
      ]}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      formFields={({ data, onChange }) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={data?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g., Software Engineering or Grade 10A"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentCount">Student Count *</Label>
            <Input
              id="studentCount"
              type="number"
              min="1"
              value={data?.studentCount || ""}
              onChange={(e) => onChange("studentCount", parseInt(e.target.value) || 0)}
              placeholder="e.g., 60"
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of students in this grade/department. Used to match with classroom capacity.
            </p>
          </div>
        </div>
      )}
      getItemId={(item) => item.id}
      getItemName={(item) => item.name}
    />
  )
}
