import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { db } from '@/lib/db'

async function resolveAuthUser(email: string, name: string, image: string | null) {
  const existing = await db.auth_users.findFirst({
    where: { email },
    select: { id: true, id_peserta: true, id_pengurus: true },
  })
  if (existing) return { ...existing, isNew: false }

  // Check peserta table by email
  const peserta = await db.peserta.findFirst({
    where: { email },
    select: { id_peserta: true },
  })

  let idPeserta: number

  if (peserta) {
    idPeserta = peserta.id_peserta
  } else {
    // First-time Google login — create a new peserta
    const created = await db.peserta.create({
      data: {
        usercode: 'LUP-0',
        nama: name,
        gender: '-',
        pendidikan: '',
        jurusan: '',
        pekerjaan: '',
        provinsi: '35',
        kabupaten: '3521',
        kecamatan: '',
        desa: '',
        alamat: '',
        tgllahir: '',
        tempatlahir: '',
        nowa: '',
        kotalevelup: '2',
        gereja: '',
        email,
        password: '',
        userlevel: '0',
        verifikasi: '0',
        foto: '',
        status: 'active',
        role: 'guest',
      },
      select: { id_peserta: true },
    })
    await db.peserta.update({
      where: { id_peserta: created.id_peserta },
      data: { usercode: `LUP-${created.id_peserta}` },
    })
    idPeserta = created.id_peserta
  }

  const authUser = await db.auth_users.create({
    data: {
      id: crypto.randomUUID(),
      email,
      name,
      image,
      id_peserta: idPeserta,
    },
    select: { id: true, id_peserta: true, id_pengurus: true },
  })

  return { ...authUser, isNew: !peserta }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && user?.email) {
        const authUser = await resolveAuthUser(
          user.email,
          user.name ?? '',
          user.image ?? null
        )
        token.authUserId = authUser.id
        token.idPeserta = authUser.id_peserta
        token.idPengurus = authUser.id_pengurus
        token.isNew = authUser.isNew
      }
      return token
    },
    async session({ session, token }) {
      session.user.authUserId = token.authUserId as string | undefined
      session.user.idPeserta = token.idPeserta as number | null | undefined
      session.user.idPengurus = token.idPengurus as number | null | undefined
      return session
    },
  },
})
