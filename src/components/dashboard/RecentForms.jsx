import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function RecentForms({ forms, isLoading }) {
  const statusColors = {
    active: "bg-emerald-100 text-emerald-800",
    draft: "bg-amber-100 text-amber-800", 
    archived: "bg-slate-100 text-slate-800"
  };

  const statusLabels = {
    active: "Ativo",
    draft: "Rascunho",
    archived: "Arquivado"
  };

  return (
    <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Formulários Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Nenhum formulário ainda
            </h3>
            <p className="text-slate-500 mb-4">
              Crie seu primeiro formulário para começar a coletar dados.
            </p>
            <Link to={createPageUrl("CreateForm")}>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Criar Formulário
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {forms.slice(0, 6).map((form, index) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{form.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(form.created_date), "d 'de' MMM", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[form.status]}>
                      {statusLabels[form.status]}
                    </Badge>
                    <Link to={createPageUrl("FillForm") + `?id=${form.id}`}>
                      <Button variant="ghost" size="sm">
                        Preencher
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}