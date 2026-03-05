import { prisma } from "./prisma"
import { emitToRoom, emitToAll } from "./socket"

interface NotificationData {
  userId: string
  title: string
  message: string
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR"
  link?: string
}

export async function createNotification(data: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || "INFO",
        link: data.link,
      },
    })

    // Real-time notification will be picked up by polling
    
    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

export async function createBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR",
  link?: string
) {
  try {
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        type: type || "INFO",
        link,
      })),
    })

    // Real-time notifications will be picked up by polling

    return notifications
  } catch (error) {
    console.error("Error creating bulk notifications:", error)
    throw error
  }
}

