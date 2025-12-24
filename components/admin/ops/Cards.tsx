
// FIX: Import PropsWithChildren to create a more robust component type
import React, { PropsWithChildren } from 'react';

export function Card({ title, value, hint }: { title:string; value:any; hint?:string }){
  return (
    <div className="rounded-2xl p-4 shadow bg-white border">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{String(value)}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}
// FIX: Refactor component to use React.FC and PropsWithChildren for robust children typing.
export const Grid: React.FC<PropsWithChildren> = ({ children }) => {
  return <section className="grid gap-4 md:grid-cols-3">{children}</section>;
}