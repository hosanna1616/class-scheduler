"use client"

import { useEffect, useState } from "react"
import { CrudTable } from "@/components/crud-table"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Assignment {
  id: string
  gradeId: string
  subjectId: string
  teacherId: string
  grade: { id: string; name: string }
  subject: { id: string; name: string }
  teacher: { id: string; name: string }
}

export default function AssignmentsPage() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/assignments").then((r) => r.json()),
      fetch("/api/grades").then((r) => r.json()),
      fetch("/api/subjects").then((r) => r.json()),
      fetch("/api/teachers").then((r) => r.json()),
    ]).then(([assignments, grades, subjects, teachers]) => {
      setAssignments(assignments)
      setGrades(grades)
      setSubjects(subjects)
      setTeachers(teachers)
      setLoading(false)
    })
  }, [])

  const fetchAssignments = async () => {
    const res = await fetch("/api/assignments")
    const data = await res.json()
    setAssignments(data)
  }

  const handleAdd = async (data: any) => {
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || "Failed to create assignment")
    }
    const newAssignment = await res.json()
    fetchAssignments()
    toast({
      title: "✅ Assignment Created Successfully!",
      description: `Grade: ${newAssignment.grade?.name} | Subject: ${newAssignment.subject?.name} | Teacher: ${newAssignment.teacher?.name}. Remember to regenerate the timetable to include this assignment.`,
      variant: "success",
    })
  }

  const handleUpdate = async (id: string, data: any) => {
    const res = await fetch(`/api/assignments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update assignment")
    fetchAssignments()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/assignments/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("Failed to delete assignment")
    fetchAssignments()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <CrudTable
      title="Assignments"
      items={assignments}
      columns={[
        {
          key: "grade",
          label: "Grade",
          render: (item) => item.grade?.name || "N/A",
        },
        {
          key: "subject",
          label: "Subject",
          render: (item) => item.subject?.name || "N/A",
        },
        {
          key: "teacher",
          label: "Teacher",
          render: (item) => item.teacher?.name || "N/A",
        },
      ]}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      formFields={({ data, onChange }) => (
        <>
          <div className="space-y-2">
            <Label>Grade</Label>
            <Select
              value={data?.gradeId || ""}
              onValueChange={(value) => onChange("gradeId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select
              value={data?.subjectId || ""}
              onValueChange={(value) => onChange("subjectId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Select
              value={data?.teacherId || ""}
              onValueChange={(value) => onChange("teacherId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      getItemId={(item) => item.id}
      getItemName={(item) =>
        `${item.grade?.name} - ${item.subject?.name} - ${item.teacher?.name}`
      }
    />
  )
}

