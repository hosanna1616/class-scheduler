import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json([], { status: 200 }) // Return empty array instead of error
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    return NextResponse.json(notifications || []) // Ensure array is returned
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json([], { status: 200 }) // Return empty array on error
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, read } = body

    if (id) {
      // Mark single notification as read
      const notification = await prisma.notification.update({
        where: { id },
        data: { read },
      })
      return NextResponse.json(notification)
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: {
          read: true,
        },
      })
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
}

