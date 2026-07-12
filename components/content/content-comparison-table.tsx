import type { CalculatorContentTable } from "@/types/calculator-content"

export function ContentComparisonTable({ table }: { table: CalculatorContentTable }) {
  return <div className="max-w-full overflow-x-auto rounded-xl border"><table className="w-full min-w-xl border-collapse text-left"><caption className="border-b bg-muted/40 px-4 py-3 text-left font-semibold">{table.caption}</caption><thead><tr>{table.headers.map((header) => <th key={header} scope="col" className="border-b px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{table.rows.map((row, index) => <tr key={`${row[0]}-${index}`} className="border-b last:border-0">{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row" className="px-4 py-3 font-medium">{cell}</th> : <td key={cellIndex} className="px-4 py-3 text-muted-foreground">{cell}</td>)}</tr>)}</tbody></table></div>
}
