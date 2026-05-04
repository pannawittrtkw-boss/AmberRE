import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          image: user.profileImage,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }

      // Refresh role + active flag from DB so admin role changes take
      // effect on the next request without requiring users to re-login.
      // Fetch on initial sign-in, on session update, and once per minute
      // (the existing token gets a `lastSync` timestamp).
      const lastSync = (token as any).lastSync as number | undefined;
      const now = Date.now();
      const stale = !lastSync || now - lastSync > 60_000;
      if (token.id && (user || trigger === "update" || stale)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          select: { role: true, isActive: true },
        });
        if (!dbUser || !dbUser.isActive) {
          // User disabled or removed — drop the session
          return {} as typeof token;
        }
        token.role = dbUser.role;
        (token as any).lastSync = now;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/th/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
