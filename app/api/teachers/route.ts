import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const teacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.union([z.string().email("Invalid email format"), z.literal("")]).optional(),
  password: z.union([z.string().min(6, "Password must be at least 6 characters"), z.literal("")]).optional(),
  userId: z.string().optional(),
  availability: z.record(z.string(), z.array(z.number())).optional(),
}).refine(
  (data) => {
    // If email is provided, password must also be provided
    if (data.email && data.email.trim()) {
      return data.password && data.password.trim() && data.password.length >= 6
    }
    return true
  },
  {
    message: "Password is required when email is provided and must be at least 6 characters",
    path: ["password"],
  }
)

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // If userId is provided, return teacher for that user
    if (userId) {
      const teacher = await prisma.teacher.findFirst({
        where: { userId },
        include: { user: true },
      })
      return NextResponse.json(teacher || null)
    }

    // Admin only for full list
    if (session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teachers = await prisma.teacher.findMany({
      include: { user: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(teachers)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Clean up empty strings
    if (body.email === "") delete body.email
    if (body.password === "") delete body.password
    
    const data = teacherSchema.parse(body)

    // If email and password are provided, create a User account
    let userId: string | undefined = data.userId

    if (data.email && data.email.trim() && data.password && data.password.trim()) {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists. Please use a different email." },
          { status: 400 }
        )
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(data.password, 10)
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          role: "TEACHER",
        },
      })
      userId = user.id
    }

    // Create teacher with or without user account
    const teacher = await prisma.teacher.create({
      data: {
        name: data.name,
        userId: userId,
        availability: data.availability ? JSON.stringify(data.availability) : null,
      },
      include: { user: true },
    })

    return NextResponse.json(teacher)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // Format Zod errors into a readable message
      const errorMessages = error.errors.map((e) => {
        const field = e.path.join(".")
        return `${field}: ${e.message}`
      })
      return NextResponse.json(
        { error: errorMessages.join(", ") || "Validation failed" },
        { status: 400 }
      )
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }
    console.error("Error creating teacher:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create teacher" },
      { status: 500 }
    )
  }
}


