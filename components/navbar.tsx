"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Globe, LogOut, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/components/language-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GlobalSearch } from "@/components/global-search"
import { NotificationCenter } from "@/components/notification-center"

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()

  // Hide navbar on login pages
  if (pathname === "/login" || pathname === "/teacher/login") {
    return null
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            Smart School Scheduler
          </Link>
          {session && (
            <div className="hidden md:flex items-center gap-4">
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="text-sm hover:underline">
                  Admin
                </Link>
              )}
              <Link href="/occupancy" className="text-sm hover:underline">
                Occupancy
              </Link>
              <Link href="/teacher" className="text-sm hover:underline">
                Teacher Portal
              </Link>
            </div>
          )}
          {!session && (
            <div className="hidden md:flex items-center gap-4">
              <Link href="/teacher/login" className="text-sm hover:underline">
                Teacher Login
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {session && <GlobalSearch />}
          {session && <NotificationCenter />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("am")}>
                አማርኛ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          {session && (
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}

