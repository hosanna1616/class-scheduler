"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useSession } from "next-auth/react"

export function useSocket() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!session) return

    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id)
      setIsConnected(true)
      
      // Join rooms based on user role
      if (session.user?.role) {
        socketInstance.emit("join-room", session.user.role.toLowerCase())
        socketInstance.emit("join-room", session.user.id)
      }
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [session])

  return { socket, isConnected }
}


