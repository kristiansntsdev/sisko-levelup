/** Shared Google Maps JS loader + Places (New) address search (event form + lokasi scan pins). */
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

export type PlacePick = { address: string; lat: number; lng: number }

const placeSearches = new WeakMap<HTMLInputElement, () => void>()

/**
 * Address search on an existing <input> via Places API (New), after ensureGoogleMaps.
 * Replaces google.maps.places.Autocomplete: that widget calls the legacy Places API,
 * which cannot be enabled on projects created after 2025-03-01 (REQUEST_DENIED).
 * The input stays the app's own (React state + styling); suggestions are a fixed
 * list on <body>, text only (no innerHTML). Returns detach.
 */
export function attachPlaceSearch(input: HTMLInputElement, onPick: (p: PlacePick) => void): () => void {
  placeSearches.get(input)?.()

  /* eslint-disable @typescript-eslint/no-explicit-any */
  type Item = { main: string; sub: string; prediction: any }
  let lib: any = null
  let token: unknown = null
  /* eslint-enable @typescript-eslint/no-explicit-any */
  let items: Item[] = []
  let active = -1
  let seq = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  const list = document.createElement('div')
  list.setAttribute('role', 'listbox')
  list.className =
    'fixed z-[1000] hidden max-h-72 overflow-y-auto rounded-[10px] border border-[#161616]/20 bg-[#fffdf7] text-[#161616] shadow-lg'
  document.body.appendChild(list)

  const isOpen = () => !list.classList.contains('hidden')
  const position = () => {
    const r = input.getBoundingClientRect()
    list.style.left = `${r.left}px`
    list.style.top = `${r.bottom + 4}px`
    list.style.width = `${r.width}px`
  }
  const close = () => {
    list.classList.add('hidden')
    items = []
    active = -1
  }
  const render = () => {
    list.replaceChildren(
      ...items.map((it, i) => {
        const row = document.createElement('div')
        row.setAttribute('role', 'option')
        row.className = `cursor-pointer px-3 py-2 text-[14px] leading-snug ${i === active ? 'bg-[#ffd83d]/50' : ''}`
        const main = document.createElement('div')
        main.className = 'font-semibold'
        main.textContent = it.main
        const sub = document.createElement('div')
        sub.className = 'text-[12px] text-[#57534e]'
        sub.textContent = it.sub
        row.append(main, sub)
        // mousedown + preventDefault: keep focus on the input so blur does not close first
        row.addEventListener('mousedown', (e) => {
          e.preventDefault()
          void pick(i)
        })
        return row
      }),
    )
    if (!items.length) return close()
    position()
    list.classList.remove('hidden')
  }

  const query = async () => {
    const text = input.value.trim()
    const my = ++seq
    if (text.length < 3) return close()
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lib ??= await (window as any).google.maps.importLibrary('places')
      token ??= new lib.AutocompleteSessionToken()
      const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: text,
        sessionToken: token,
        includedRegionCodes: ['id'],
        language: 'id',
      })
      if (my !== seq || document.activeElement !== input) return
      items = (suggestions as { placePrediction?: Item['prediction'] }[])
        .filter((s) => s.placePrediction)
        .slice(0, 5)
        .map(({ placePrediction: p }) => ({
          main: p.mainText?.text ?? p.text.text,
          sub: p.secondaryText?.text ?? '',
          prediction: p,
        }))
      active = -1
      render()
    } catch (err) {
      if (my === seq) close()
      console.warn('Places search failed', err)
    }
  }

  const pick = async (i: number) => {
    const it = items[i]
    if (!it) return
    seq++
    close()
    try {
      // toPlace() carries the session token, so suggestions + details bill as one session
      const place = it.prediction.toPlace()
      await place.fetchFields({ fields: ['formattedAddress', 'location'] })
      token = null
      if (!place.location) return
      onPick({
        address: place.formattedAddress ?? [it.main, it.sub].filter(Boolean).join(', '),
        lat: place.location.lat(),
        lng: place.location.lng(),
      })
    } catch (err) {
      console.warn('Places details failed', err)
    }
  }

  const onInput = () => {
    clearTimeout(timer)
    timer = setTimeout(() => void query(), 250)
  }
  const onKey = (e: KeyboardEvent) => {
    if (!isOpen()) return
    const n = items.length
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      active = e.key === 'ArrowDown' ? (active + 1) % n : active <= 0 ? n - 1 : active - 1
      render()
    } else if (e.key === 'Enter') {
      e.preventDefault() // never submit the form while the list is open
      void pick(Math.max(active, 0))
    } else if (e.key === 'Escape') {
      close()
    }
  }
  const onBlur = () => {
    seq++
    close()
  }
  const onMove = () => {
    if (isOpen()) position()
  }

  input.addEventListener('input', onInput)
  input.addEventListener('keydown', onKey)
  input.addEventListener('blur', onBlur)
  window.addEventListener('scroll', onMove, true)
  window.addEventListener('resize', onMove)

  const detach = () => {
    clearTimeout(timer)
    seq++
    input.removeEventListener('input', onInput)
    input.removeEventListener('keydown', onKey)
    input.removeEventListener('blur', onBlur)
    window.removeEventListener('scroll', onMove, true)
    window.removeEventListener('resize', onMove)
    list.remove()
    if (placeSearches.get(input) === detach) placeSearches.delete(input)
  }
  placeSearches.set(input, detach)
  return detach
}
