"use client"

import { useEffect, useState } from "react"
import { Bell, X, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSocket } from "@/hooks/useSocket"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR"
  read: boolean
  link?: string
  createdAt: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = () => {
      fetch("/api/notifications")
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch notifications")
          }
          return res.json()
        })
        .then((data) => {
          // Ensure data is an array
          const notifications = Array.isArray(data) ? data : []
          setNotifications(notifications)
          setUnreadCount(notifications.filter((n: Notification) => !n.read).length)
          setLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching notifications:", error)
          setNotifications([])
          setUnreadCount(0)
          setLoading(false)
        })
    }

    fetchNotifications()

    // Poll for new notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000)

    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "bg-green-500"
      case "WARNING":
        return "bg-yellow-500"
      case "ERROR":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b cursor-pointer hover:bg-accent transition-colors ${
                    !notification.read ? "bg-accent/50" : ""
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                    if (notification.link) {
                      window.location.href = notification.link
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${getTypeColor(
                        notification.type
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

