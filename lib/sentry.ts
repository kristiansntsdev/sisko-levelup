import type { NodeOptions } from '@sentry/nextjs'

export const sentryOptions: NodeOptions = {
  dsn: 'https://b34286e4580049349062b7213e6f2aa3@logs.pphtgd.org/1',
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0,
}
