"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  School,
  GraduationCap,
  BookOpen,
  Link as LinkIcon,
  Calendar,
} from "lucide-react"

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/teachers", label: "Teachers", icon: Users },
  { href: "/admin/classrooms", label: "Classrooms", icon: School },
  { href: "/admin/grades", label: "Grades", icon: GraduationCap },
  { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/admin/assignments", label: "Assignments", icon: LinkIcon },
  { href: "/admin/schedule", label: "Schedule", icon: Calendar },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-card">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <nav className="space-y-1 p-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}







