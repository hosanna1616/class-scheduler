"use client"

import { useEffect, useState } from "react"
import { CrudTable } from "@/components/crud-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Classroom {
  id: string
  name: string
  capacity: number
}

export default function ClassroomsPage() {
  const { toast } = useToast()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClassrooms = async () => {
    try {
      const res = await fetch("/api/classrooms")
      if (!res.ok) {
        throw new Error("Failed to fetch classrooms")
      }
      const data = await res.json()
      setClassrooms(data)
    } catch (error: any) {
      console.error("Error fetching classrooms:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to load classrooms. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClassrooms()
  }, [])

  const handleAdd = async (data: any) => {
    const res = await fetch("/api/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create classroom")
    fetchClassrooms()
  }

  const handleUpdate = async (id: string, data: any) => {
    const res = await fetch(`/api/classrooms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update classroom")
    fetchClassrooms()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/classrooms/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("Failed to delete classroom")
    fetchClassrooms()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading classrooms...</p>
        </div>
      </div>
    )
  }

  return (
    <CrudTable
      title="Classrooms"
      items={classrooms}
      columns={[
        { key: "name", label: "Name" },
        { key: "capacity", label: "Capacity" },
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
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={data?.capacity || ""}
              onChange={(e) => onChange("capacity", parseInt(e.target.value))}
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



