import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function FormCard({ form, index }) {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <Badge className={statusColors[form.status]}>
              {statusLabels[form.status]}
            </Badge>
          </div>
          <CardTitle className="text-xl text-slate-900 line-clamp-2">
            {form.name}
          </CardTitle>
          {form.description && (
            <p className="text-slate-600 text-sm line-clamp-2">
              {form.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>
                Criado em {format(new Date(form.created_date), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User className="w-4 h-4" />
              <span>{form.fields?.length || 0} campos</span>
            </div>

            <Link to={createPageUrl("FillForm") + `?id=${form.id}`} className="block">
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={form.status !== 'active'}
              >
                {form.status === 'active' ? 'Preencher Formulário' : 'Indisponível'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}