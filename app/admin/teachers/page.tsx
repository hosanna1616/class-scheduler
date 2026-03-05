"use client"

import { useEffect, useState } from "react"
import { CrudTable } from "@/components/crud-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Teacher {
  id: string
  name: string
  userId?: string | null
  availability?: any
  user?: {
    email: string
  }
}

export default function TeachersPage() {
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers")
      if (!res.ok) {
        throw new Error("Failed to fetch teachers")
      }
      const data = await res.json()
      setTeachers(data)
    } catch (error: any) {
      console.error("Error fetching teachers:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to load teachers. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const handleAdd = async (data: any) => {
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errorData = await res.json()
      // Handle both string errors and array errors
      let errorMessage = "Failed to create teacher"
      if (errorData.error) {
        if (typeof errorData.error === "string") {
          errorMessage = errorData.error
        } else if (Array.isArray(errorData.error)) {
          errorMessage = errorData.error.map((e: any) => 
            typeof e === "string" ? e : e.message || JSON.stringify(e)
          ).join(", ")
        } else if (typeof errorData.error === "object") {
          errorMessage = JSON.stringify(errorData.error)
        }
      }
      throw new Error(errorMessage)
    }
    const newTeacher = await res.json()
    fetchTeachers()
    // Show reminder notification
    toast({
      title: "✅ Teacher Created Successfully!",
      description: `Teacher "${data.name}" has been added. Remember to: 1) Create assignments (Grade + Subject) for this teacher, and 2) Regenerate the timetable.`,
      variant: "success",
    })
  }

  const handleUpdate = async (id: string, data: any) => {
    const res = await fetch(`/api/teachers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errorData = await res.json()
      let errorMessage = "Failed to update teacher"
      if (errorData.error) {
        if (typeof errorData.error === "string") {
          errorMessage = errorData.error
        } else if (Array.isArray(errorData.error)) {
          errorMessage = errorData.error.map((e: any) => 
            typeof e === "string" ? e : e.message || JSON.stringify(e)
          ).join(", ")
        } else if (typeof errorData.error === "object") {
          errorMessage = JSON.stringify(errorData.error)
        }
      }
      throw new Error(errorMessage)
    }
    fetchTeachers()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/teachers/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("Failed to delete teacher")
    fetchTeachers()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading teachers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          When creating a new teacher, provide email and password. The system will automatically create a login account for them.
        </AlertDescription>
      </Alert>
      <CrudTable
        title="Teachers"
        items={teachers}
        columns={[
          { key: "name", label: "Name" },
          { key: "user.email", label: "Email", render: (item: Teacher) => item.user?.email || "No account" },
        ]}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        formFields={({ data, onChange, isEdit }) => (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={data?.name || ""}
                onChange={(e) => onChange("name", e.target.value)}
                required
                placeholder="Teacher Full Name"
              />
            </div>
            {!isEdit && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data?.email || ""}
                    onChange={(e) => onChange("email", e.target.value)}
                    required
                    placeholder="teacher@school.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used for login
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={data?.password || ""}
                    onChange={(e) => onChange("password", e.target.value)}
                    required
                    placeholder="Secure password"
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 characters
                  </p>
                </div>
              </>
            )}
          </>
        )}
        getItemId={(item) => item.id}
        getItemName={(item) => item.name}
      />
    </div>
  )
}



