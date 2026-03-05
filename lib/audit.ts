import { prisma } from "./prisma"
import { headers } from "next/headers"

interface AuditLogData {
  userId?: string
  userEmail?: string
  action: string
  entity: string
  entityId?: string
  details?: any
}

export async function createAuditLog(data: AuditLogData) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    await prisma.auditLog.create({
      data: {
        ...data,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error("Error creating audit log:", error)
    // Don't throw - audit logging shouldn't break the main flow
  }
}


