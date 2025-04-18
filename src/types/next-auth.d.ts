import NextAuth, { type DefaultSession, type DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    isAdmin?: boolean;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    isAdmin: boolean;
  }
}
