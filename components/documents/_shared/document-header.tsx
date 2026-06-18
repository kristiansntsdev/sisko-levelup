type Props = {
  kota: string
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
        <div className="doc-kota">LevelUP {kota.trim()}</div>
      </div>
    </div>
  )
}
