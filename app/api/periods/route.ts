import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const periods = await prisma.period.findMany({
      orderBy: [{ day: "asc" }, { slot: "asc" }],
    })

    return NextResponse.json(periods)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch periods" }, { status: 500 })
  }
}







