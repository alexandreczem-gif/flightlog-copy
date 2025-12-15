import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldQuestion } from 'lucide-react';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function MissionChart({ logs, isLoading }) {
  const chartData = React.useMemo(() => {
    if (logs.length === 0) return [];
    const missionCounts = logs.reduce((acc, log) => {
      acc[log.mission_type] = (acc[log.mission_type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(missionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  if (isLoading) {
    return (
      <Card className="shadow-xl bg-white border-slate-200">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ShieldQuestion className="w-5 h-5 text-red-600" />
            Missões por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex items-center justify-center h-64">
          <Skeleton className="w-48 h-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="shadow-xl bg-white border-slate-200">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ShieldQuestion className="w-5 h-5 text-red-600" />
            Missões por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center py-16 text-slate-500">
          Nenhum dado de missão para exibir.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl bg-white border-slate-200">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ShieldQuestion className="w-5 h-5 text-red-600" />
          Missões por Tipo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="40%"
              labelLine={false}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} voos`, name]} />
            <Legend 
              layout="horizontal"
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}