import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        await connectDB()
        const email = String(credentials.email).toLowerCase().trim()
        const user = await User.findOne({ email })
        if (!user || !user.passwordHash) {
          return null
        }
        const isValid = await bcrypt.compare(String(credentials.password), user.passwordHash)
        if (!isValid) {
          return null
        }
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        }
      },
    }),
    // Future OAuth providers (e.g. Google, GitHub) can be appended here cleanly
  ],
})
