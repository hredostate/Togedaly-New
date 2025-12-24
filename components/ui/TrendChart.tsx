
import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface TrendChartProps {
  data: any[];
  dataKey: string;
  categoryKey: string;
  type?: 'line' | 'bar';
  color?: string;
  height?: number;
  formatter?: (value: number) => string;
  label?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ 
  data, 
  dataKey, 
  categoryKey, 
  type = 'line', 
  color = '#4F46E5', 
  height = 250,
  formatter = (val) => val.toLocaleString(),
  label
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center bg-slate-50 border border-dashed rounded-xl text-gray-400 text-xs" style={{ height }}>
        No data available for chart
      </div>
    );
  }

  const ChartComponent = type === 'line' ? LineChart : BarChart;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis 
            dataKey={categoryKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#64748B' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#64748B' }} 
            tickFormatter={formatter}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [formatter(value), label || dataKey]}
            labelStyle={{ color: '#64748B', marginBottom: '4px', fontSize: '11px' }}
          />
          {type === 'line' ? (
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={3} 
              dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 6 }}
            />
          ) : (
            <Bar 
              dataKey={dataKey} 
              fill={color} 
              radius={[4, 4, 0, 0]} 
              maxBarSize={50}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};
