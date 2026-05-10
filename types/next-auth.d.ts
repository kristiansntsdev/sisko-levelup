import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      authUserId?: string
      idPeserta?: number | null
      idPengurus?: number | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    authUserId?: string
    idPeserta?: number | null
    idPengurus?: number | null
    isNew?: boolean
  }
}
