import { auth } from "@/auth"
import { connectDB } from "@/lib/db"
import { User, IUser } from "@/lib/models/User"

/**
 * Retrieves the currently authenticated MongoDB user document from the session.
 * Returns null if not logged in or user record not found.
 */
export async function getSessionUser(): Promise<IUser | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  await connectDB()
  const user = await User.findById(session.user.id)
  return user
}

/**
 * Throws an Error("Unauthorized") if no session exists or user not found.
 */
export async function requireSessionUser(): Promise<IUser> {
  const user = await getSessionUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}
