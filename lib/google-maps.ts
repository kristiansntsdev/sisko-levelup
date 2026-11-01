/** Shared Google Maps JS loader (event form + lokasi scan pins). */
const GMAPS_SCRIPT_ID = 'gmaps-script'
// Shared across remounts — stale script.onload on an unmounted form was the grey-box race.
let gmapsReady: Promise<void> | null = null

export function ensureGoogleMaps(apiKey: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).google?.maps?.importLibrary) return Promise.resolve()
  if (gmapsReady) return gmapsReady

  gmapsReady = new Promise<void>((resolve, reject) => {
    const settle = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).google?.maps?.importLibrary) {
        resolve()
        return
      }
      // loading=async: onload can fire before importLibrary is attached
      const t0 = Date.now()
      const id = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).google?.maps?.importLibrary) {
          clearInterval(id)
          resolve()
        } else if (Date.now() - t0 > 15_000) {
          clearInterval(id)
          gmapsReady = null
          reject(new Error('Google Maps load timeout'))
        }
      }, 50)
    }

    const existing = document.getElementById(GMAPS_SCRIPT_ID)
    if (existing) {
      settle()
      return
    }
    const script = document.createElement('script')
    script.id = GMAPS_SCRIPT_ID
    // loading=async = Google bootstrap; constructors only after importLibrary
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
    script.async = true
    script.onload = settle
    script.onerror = () => {
      gmapsReady = null
      reject(new Error('Google Maps script failed'))
    }
    document.head.appendChild(script)
  })

  return gmapsReady
}
