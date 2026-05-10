'use client';

import { useMemo, useState } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sortValue?: (row: T) => string | number;
  width?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  className?: string;
}

type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  const color = active ? 'var(--accent)' : 'var(--subtle)';
  if (!active) {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="inline-block ml-1 shrink-0">
        <path d="M6 2L4 5h4L6 2zM6 10L4 7h4l-2 3z" fill={color} />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="inline-block ml-1 shrink-0">
      {dir === 'asc'
        ? <path d="M6 2L3 7h6L6 2z" fill={color} />
        : <path d="M6 10L3 5h6l-3 5z" fill={color} />}
    </svg>
  );
}

const alignClass: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyState,
  className = '',
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;
    return [...data].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const isClickable = Boolean(onRowClick);

  return (
    <div
      className={`bg-surface border border-border rounded-card overflow-hidden ${className}`}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg border-b border-border">
            {columns.map((col) => {
              const isSortable = Boolean(col.sortValue);
              const isActive = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={`px-4 py-3 text-[11px] font-semibold text-subtle uppercase tracking-[0.5px] ${alignClass[col.align ?? 'left']} ${isSortable ? 'cursor-pointer select-none hover:text-fg transition-colors duration-150' : ''}`}
                  onClick={isSortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    isActive
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : isSortable
                      ? 'none'
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.header}
                    {isSortable && <SortIcon active={isActive} dir={sortDir} />}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-10 text-center text-[14px] text-muted"
              >
                {emptyState ?? 'Belum ada data'}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={isClickable ? () => onRowClick!(row) : undefined}
                className={`border-t border-border transition-colors duration-150 ${isClickable ? 'cursor-pointer hover:bg-bg' : 'hover:bg-bg/50'}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-[14px] font-medium text-fg ${alignClass[col.align ?? 'left']}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
