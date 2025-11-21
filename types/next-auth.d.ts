import { UserRole } from "@prisma/client"
import { DefaultSession } from "next-auth"


declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    role?: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole
  }
}
