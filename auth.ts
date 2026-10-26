import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { db } from '@/lib/db'

type ResolvedAuth = {
  id: string
  id_peserta: number | null
  id_pengurus: number | null
  isNew: boolean
  needsRegistration: boolean
}

async function resolveAuthUser(
  email: string,
  name: string,
  image: string | null,
): Promise<ResolvedAuth> {
  const existing = await db.auth_users.findFirst({
    where: { email },
    select: { id: true, id_peserta: true, id_pengurus: true },
  })
  if (existing) {
    return {
      ...existing,
      isNew: false,
      needsRegistration: existing.id_peserta == null,
    }
  }

  const peserta = await db.peserta.findFirst({
    where: { email },
    select: { id_peserta: true },
  })

  if (peserta) {
    const authUser = await db.auth_users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name,
        image,
        id_peserta: peserta.id_peserta,
      },
      select: { id: true, id_peserta: true, id_pengurus: true },
    })
    return { ...authUser, isNew: false, needsRegistration: false }
  }

  // New Google email — auth_users only; peserta created on /daftar
  const authUser = await db.auth_users.create({
    data: {
      id: crypto.randomUUID(),
      email,
      name,
      image,
      id_peserta: null,
    },
    select: { id: true, id_peserta: true, id_pengurus: true },
  })
  return { ...authUser, isNew: true, needsRegistration: true }
}

async function resolveCredentials(email: string, password: string) {
  const peserta = await db.peserta.findFirst({
    where: { email, password },
    select: { id_peserta: true, nama: true, email: true },
  })
  if (!peserta?.email) return null

  let authUser = await db.auth_users.findFirst({
    where: { email: peserta.email },
    select: { id: true, id_peserta: true, id_pengurus: true },
  })
  if (!authUser) {
    authUser = await db.auth_users.create({
      data: {
        id: crypto.randomUUID(),
        email: peserta.email,
        name: peserta.nama,
        image: null,
        id_peserta: peserta.id_peserta,
      },
      select: { id: true, id_peserta: true, id_pengurus: true },
    })
  } else if (authUser.id_peserta !== peserta.id_peserta) {
    authUser = await db.auth_users.update({
      where: { id: authUser.id },
      data: { id_peserta: peserta.id_peserta },
      select: { id: true, id_peserta: true, id_pengurus: true },
    })
  }

  return {
    id: authUser.id,
    email: peserta.email,
    name: peserta.nama,
    idPeserta: peserta.id_peserta,
    idPengurus: authUser.id_pengurus,
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim()
        const password = String(credentials?.password ?? '').trim()
        if (!email || !password) return null
        return resolveCredentials(email, password)
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === 'google' && user?.email) {
        const authUser = await resolveAuthUser(
          user.email,
          user.name ?? '',
          user.image ?? null,
        )
        token.authUserId = authUser.id
        token.idPeserta = authUser.id_peserta
        token.idPengurus = authUser.id_pengurus
        token.isNew = authUser.isNew
        token.needsRegistration = authUser.needsRegistration
      }
      if (account?.provider === 'credentials' && user) {
        const u = user as {
          id: string
          idPeserta?: number
          idPengurus?: number | null
        }
        token.authUserId = u.id
        token.idPeserta = u.idPeserta ?? null
        token.idPengurus = u.idPengurus ?? null
        token.isNew = false
        token.needsRegistration = false
      }
      // After completeRegistration on /daftar
      if (trigger === 'update' && session && typeof session === 'object') {
        const s = session as { idPeserta?: number; needsRegistration?: boolean }
        if (typeof s.idPeserta === 'number') {
          token.idPeserta = s.idPeserta
          token.needsRegistration = false
        }
        if (s.needsRegistration === false) token.needsRegistration = false
      }
      return token
    },
    async session({ session, token }) {
      session.user.authUserId = token.authUserId as string | undefined
      session.user.idPeserta = token.idPeserta as number | null | undefined
      session.user.idPengurus = token.idPengurus as number | null | undefined
      session.user.needsRegistration = Boolean(token.needsRegistration)
      return session
    },
  },
})
