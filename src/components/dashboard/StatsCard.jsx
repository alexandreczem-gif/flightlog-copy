import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const colorClasses = {
  blue: 'from-blue-500 to-sky-500',
  green: 'from-green-500 to-emerald-500',
  orange: 'from-orange-500 to-amber-500',
  red: 'from-red-600 to-rose-600',
  purple: 'from-purple-500 to-violet-500',
  indigo: 'from-indigo-500 to-blue-500',
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', isLoading }) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden bg-white border-0 shadow-lg h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className="h-full">
      <Card className="relative overflow-hidden bg-white border-0 shadow-lg h-full">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-r ${colorClasses[color]} opacity-10 rounded-full transform translate-x-12 -translate-y-12`} />
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <p className={`font-bold text-slate-900 ${subtitle ? 'text-xl' : 'text-3xl'}`}>{value}</p>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}