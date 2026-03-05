"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CrudTableProps<T> {
  title: string
  items: T[]
  columns: { key: string; label: string; render?: (item: T) => React.ReactNode }[]
  onAdd: (data: any) => Promise<void>
  onUpdate: (id: string, data: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
  formFields: (props: {
    data?: Partial<T>
    onChange: (field: string, value: any) => void
  }) => React.ReactNode
  getItemId: (item: T) => string
  getItemName: (item: T) => string
}

export function CrudTable<T extends Record<string, any>>({
  title,
  items,
  columns,
  onAdd,
  onUpdate,
  onDelete,
  formFields,
  getItemId,
  getItemName,
}: CrudTableProps<T>) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const handleOpen = (item?: T) => {
    if (item) {
      setEditingItem(item)
      setFormData(item)
    } else {
      setEditingItem(null)
      setFormData({})
    }
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setEditingItem(null)
    setFormData({})
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (editingItem) {
        await onUpdate(getItemId(editingItem), formData)
        const itemName = getItemName(editingItem)
        toast({
          title: "✅ Updated Successfully!",
          description: `${title.slice(0, -1)} "${itemName}" has been updated successfully.`,
          variant: "success",
        })
      } else {
        await onAdd(formData)
        // Get the name from formData if available
        const itemName = formData.name || formData[Object.keys(formData)[0]] || "item"
        toast({
          title: "✅ Added Successfully!",
          description: `New ${title.slice(0, -1).toLowerCase()} "${itemName}" has been created successfully.`,
          variant: "success",
        })
      }
      handleClose()
    } catch (error: any) {
      console.error("Error:", error)
      toast({
        title: "❌ Error",
        description: error?.message || "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const item = items.find((i) => getItemId(i) === id)
    if (!confirm(`Are you sure you want to delete "${getItemName(item!)}"?`)) return
    try {
      await onDelete(id)
      toast({
        title: "🗑️ Deleted Successfully!",
        description: `${title.slice(0, -1)} "${getItemName(item!)}" has been deleted successfully.`,
        variant: "success",
      })
    } catch (error: any) {
      console.error("Error:", error)
      toast({
        title: "❌ Error",
        description: error?.message || "Failed to delete item. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button onClick={() => handleOpen()}>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left text-sm font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={getItemId(item)} className="border-b">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm">
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpen(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(getItemId(item))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${title.slice(0, -1)}` : `Add New ${title.slice(0, -1)}`}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Update the details for ${getItemName(editingItem)}`
                : `Fill in the details to create a new ${title.slice(0, -1).toLowerCase()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formFields({
              data: formData,
              onChange: (field, value) => {
                setFormData((prev) => ({ ...prev, [field]: value }))
              },
              isEdit: !!editingItem,
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



