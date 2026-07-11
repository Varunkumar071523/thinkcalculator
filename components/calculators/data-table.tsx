"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

export type DataTableColumn<Row> = { readonly header: string; readonly cell: (row: Row) => ReactNode }

export function DataTable<Row>({ caption, rows, columns, initialRows = 12 }: { readonly caption: string; readonly rows: readonly Row[]; readonly columns: readonly DataTableColumn<Row>[]; readonly initialRows?: number }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div>
      <div className="calculator-table overflow-x-auto" data-print-schedule>
        <table className="w-full min-w-5xl border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead><tr className="border-b">{columns.map((column) => <th key={column.header} scope="col" className="whitespace-nowrap px-3 py-3 text-right font-semibold first:text-left">{column.header}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index} className={`border-b last:border-0 ${!expanded && index >= initialRows ? "schedule-extra-row hidden" : ""}`}>{columns.map((column) => <td key={column.header} className="whitespace-nowrap px-3 py-2 text-right tabular-nums first:text-left">{column.cell(row)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {rows.length > initialRows ? <Button className="mt-4" type="button" variant="outline" data-print-hide onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Show full schedule"}</Button> : null}
    </div>
  )
}
