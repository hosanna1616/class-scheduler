"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { TeacherSidebar } from "@/components/teacher-sidebar"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Don't show sidebar on login page
  if (pathname === "/teacher/login") {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If not authenticated or not teacher, middleware will handle redirect
  // Just show loading here to prevent flash
  if (!session || session.user?.role !== "TEACHER") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}


