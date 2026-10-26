type Props = {
  kota: string
}

/** namacabang may already be "LevelUP Ngawi" — don't print LevelUP twice */
export function levelupKota(kota: string) {
  const t = kota.trim()
  return /^level\s*up\b/i.test(t) ? t : `LevelUP ${t}`
}

export function DocumentHeader({ kota }: Props) {
  return (
    <div className="doc-header">
      <div className="doc-header-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pphtgd.png" alt="PPHTGD" />
      </div>
      <div className="doc-header-address">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/right-header.png" alt="LevelUP Address" />
        <div className="doc-kota">{levelupKota(kota)}</div>
      </div>
    </div>
  )
}
