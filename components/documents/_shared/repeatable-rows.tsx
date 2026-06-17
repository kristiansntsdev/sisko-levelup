type Column = {
  id: string
  label: string
  width?: string
}

type Props = {
  columns: Column[]
  rows: Record<string, string>[]
  showNo?: boolean
  className?: string
}

export function RepeatableRows({
  columns,
  rows,
  showNo = true,
  className = 'doc-table',
}: Props) {
  return (
    <table className={className}>
      <thead>
        <tr>
          {showNo && <th className="doc-table-no">No</th>}
          {columns.map((col) => (
            <th key={col.id} style={col.width ? { width: col.width } : undefined}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {showNo && <td className="doc-table-no">{i + 1}</td>}
            {columns.map((col) => (
              <td key={col.id}>{row[col.id] ?? ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
