"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Calendar, Clock, Home, LogOut, BookOpen, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function TeacherSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/teacher/login" })
  }

  const menuItems = [
    { href: "/teacher", label: "Dashboard", icon: Home },
    { href: "/teacher/schedule", label: "My Schedule", icon: Calendar },
    { href: "/teacher/profile", label: "Profile", icon: User },
  ]

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Teacher Portal</h2>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item, idx) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-smooth hover-scale",
                  isActive
                    ? "bg-primary text-primary-foreground hover-glow hover-purple"
                    : "hover:bg-accent hover-glow hover-blue"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </motion.div>
          )
        })}
      </nav>
      <div className="p-4 border-t">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            className="w-full justify-start hover-glow hover-gold transition-smooth"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </motion.div>
      </div>
    </aside>
  )
}


