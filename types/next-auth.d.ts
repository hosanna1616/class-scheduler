import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: "ADMIN" | "TEACHER"
    }
  }

  interface User {
    role: "ADMIN" | "TEACHER"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "TEACHER"
  }
}







