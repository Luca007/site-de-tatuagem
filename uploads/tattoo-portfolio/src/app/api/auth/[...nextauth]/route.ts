import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminAuth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "@/lib/firebase";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Sign in with Firebase Authentication
          const userCredential = await signInWithEmailAndPassword(
            clientAuth,
            credentials.email,
            credentials.password
          );

          const user = userCredential.user;

          // Check if user is admin
          const isAdmin = await isUserAdmin(user.uid);

          // Return user object with additional fields
          return {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split("@")[0] || "User",
            image: user.photoURL,
            isAdmin,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.isAdmin = user.isAdmin ?? false; // Fix the isAdmin assignment to handle undefined case
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    // Get a Firebase Admin auth user record
    const user = await adminAuth?.getUser(uid);

    // Check if user has admin custom claim
    // In production, you should have a process to assign admin privileges
    if (user?.customClaims?.admin) {
      return true;
    }

    // For development, you can implement a hardcoded admin check
    const adminUIDs = process.env.ADMIN_UIDS?.split(",") || [];
    return adminUIDs.includes(uid);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
