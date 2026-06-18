type Row = {
  label: string
  value: string
}

type Props = {
  rows: Row[]
  className?: string
}

export function FieldTable({ rows, className = 'doc-keputusan' }: Props) {
  return (
    <table className={className}>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td className="label">{row.label}</td>
            <td className="sep">:</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
