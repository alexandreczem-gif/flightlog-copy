import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Database } from "lucide-react";

export default function DataTable({ form, responses, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex gap-4">
                {Array(4).fill(0).map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!form) {
    return (
      <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Selecione um formulário
          </h3>
          <p className="text-slate-500">
            Escolha um formulário nos filtros acima para visualizar os dados.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (responses.length === 0) {
    return (
      <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {form.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Nenhum dado encontrado
          </h3>
          <p className="text-slate-500">
            Ainda não há registros para este formulário. Comece preenchendo alguns dados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {form.name}
          </CardTitle>
          <Badge variant="outline" className="w-fit">
            {responses.length} registro(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                {form.fields.map((field) => (
                  <TableHead key={field.id} className="font-semibold text-slate-700">
                    {field.label}
                  </TableHead>
                ))}
                <TableHead className="font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Data
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response, index) => (
                <TableRow key={response.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  {form.fields.map((field) => (
                    <TableCell key={field.id} className="text-slate-900">
                      {response.data[field.id] || '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-slate-600">
                    {format(new Date(response.created_date), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}