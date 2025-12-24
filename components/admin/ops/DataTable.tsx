
import React from 'react';
import { FixedSizeList as List } from 'react-window';

export function DataTable({ rows = [], cols = [] as string[], actions }:{ rows:any[]; cols:string[]; actions?: (row:any)=>React.ReactNode }){
  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const r = rows[index];
    return (
      <div style={style} className={`flex items-center border-b ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
        {cols.map((c, i) => (
          <div key={c} className="flex-1 p-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis px-2">
            {String(r?.[c] ?? '')}
          </div>
        ))}
        {actions && <div className="flex-1 p-2">{actions(r)}</div>}
      </div>
    );
  };

  const Header = () => (
    <div className="flex items-center bg-slate-50 border-b font-semibold text-sm sticky top-0 z-10">
      {cols.map(c => (
        <div key={c} className="flex-1 p-2 text-left px-2">{c}</div>
      ))}
      {actions && <div className="flex-1 p-2"></div>}
    </div>
  );

  // If few rows, render standard table for simplicity and auto-layout behavior
  if (rows.length < 50) {
    return (
        <div className="overflow-auto border rounded-xl bg-white">
        <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b">
            <tr>
                {cols.map(c => <th key={c} className="text-left p-2 font-semibold">{c}</th>)}
                {actions && <th className="p-2"></th>}
            </tr>
            </thead>
            <tbody>
            {rows.map((r,i)=> (
                <tr key={i} className="odd:bg-gray-50 border-b">
                {cols.map(c=> <td key={c} className="p-2 whitespace-nowrap">{String(r?.[c] ?? '')}</td>)}
                {actions && <td className="p-2">{actions(r)}</td>}
                </tr>
            ))}
            {rows.length === 0 && (
                    <tr><td colSpan={cols.length + (actions ? 1 : 0)} className="p-6 text-center text-gray-500">No data found.</td></tr>
                )}
            </tbody>
        </table>
        </div>
    );
  }

  // Virtualized List for large datasets
  return (
    <div className="border rounded-xl bg-white overflow-hidden">
      <Header />
      <List
        height={400}
        itemCount={rows.length}
        itemSize={40} // Approximate row height
        width="100%"
      >
        {Row}
      </List>
      <div className="p-2 text-xs text-gray-400 text-center border-t bg-slate-50">
        Showing {rows.length.toLocaleString()} rows (Virtual Mode)
      </div>
    </div>
  );
}
