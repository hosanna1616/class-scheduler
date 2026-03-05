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
    id: string
    email: string
    name?: string | null
    role: "ADMIN" | "TEACHER"
  }
}

declare module "@auth/core" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: "ADMIN" | "TEACHER"
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: "ADMIN" | "TEACHER"
  }
}






