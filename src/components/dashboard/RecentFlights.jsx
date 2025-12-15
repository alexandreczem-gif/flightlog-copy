import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RecentFlights({ logs, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-xl bg-white border-slate-200">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-red-600" />
            Voos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-3 border-b last:border-0">
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="shadow-xl bg-white border-slate-200">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-red-600" />
            Voos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-slate-500">
          Nenhum voo registrado recentemente.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl bg-white border-slate-200">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-red-600" />
          Voos Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-slate-50 -mx-6 px-6 transition-colors">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Missão {log.mission_id} - {log.aircraft}</p>
                <p className="text-sm text-slate-600">{log.mission_type}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {format(new Date(log.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-2">{log.flight_duration} min</Badge>
                <p className="text-xs text-slate-500">{log.pilot_in_command}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}