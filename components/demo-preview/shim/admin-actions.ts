'use client'
import { mutate } from '../db'

export async function logoutPengurus() {
  mutate((d) => {
    d.session.idPengurus = null
  })
  window.location.assign('/demo-preview/login')
}
