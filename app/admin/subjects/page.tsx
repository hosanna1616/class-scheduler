"use client"

import { useEffect, useState } from "react"
import { CrudTable } from "@/components/crud-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Subject {
  id: string
  name: string
  hoursPerWeek: number
}

export default function SubjectsPage() {
  const { toast } = useToast()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects")
      if (!res.ok) {
        throw new Error("Failed to fetch subjects")
      }
      const data = await res.json()
      setSubjects(data)
    } catch (error: any) {
      console.error("Error fetching subjects:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to load subjects. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  const handleAdd = async (data: any) => {
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create subject")
    fetchSubjects()
  }

  const handleUpdate = async (id: string, data: any) => {
    const res = await fetch(`/api/subjects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update subject")
    fetchSubjects()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/subjects/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("Failed to delete subject")
    fetchSubjects()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    )
  }

  return (
    <CrudTable
      title="Subjects"
      items={subjects}
      columns={[
        { key: "name", label: "Name" },
        { key: "hoursPerWeek", label: "Hours/Week" },
      ]}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      formFields={({ data, onChange }) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={data?.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hoursPerWeek">Hours Per Week</Label>
            <Input
              id="hoursPerWeek"
              type="number"
              value={data?.hoursPerWeek || ""}
              onChange={(e) => onChange("hoursPerWeek", parseInt(e.target.value))}
              required
            />
          </div>
        </>
      )}
      getItemId={(item) => item.id}
      getItemName={(item) => item.name}
    />
  )
}



