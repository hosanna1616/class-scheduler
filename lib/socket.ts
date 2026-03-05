import { Server as SocketIOServer } from "socket.io"
import { Server as HTTPServer } from "http"

let io: SocketIOServer | null = null

export function initializeSocket(server: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
    })

    // Join room based on user role
    socket.on("join-room", (room: string) => {
      socket.join(room)
      console.log(`Socket ${socket.id} joined room: ${room}`)
    })

    socket.on("leave-room", (room: string) => {
      socket.leave(room)
      console.log(`Socket ${socket.id} left room: ${room}`)
    })
  })

  return io
}

export function getIO(): SocketIOServer | null {
  return io
}

export function emitToRoom(room: string, event: string, data: any) {
  if (io) {
    io.to(room).emit(event, data)
  }
}

export function emitToAll(event: string, data: any) {
  if (io) {
    io.emit(event, data)
  }
}


