import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet, BarChart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function QuickActions() {
  const actions = [
    {
      title: "Criar Formulário",
      description: "Configure um novo formulário personalizado",
      icon: Plus,
      url: createPageUrl("CreateForm"),
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "Preencher Dados",
      description: "Adicione novos registros aos formulários",
      icon: FileSpreadsheet,
      url: createPageUrl("FillForms"),
      color: "from-emerald-500 to-green-500"
    },
    {
      title: "Visualizar Dados",
      description: "Analise e exporte dados coletados",
      icon: BarChart,
      url: createPageUrl("ViewData"),
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
      <CardHeader className="border-b border-slate-100">
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={action.url}>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-auto p-4 hover:bg-slate-50"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mr-3`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-900">{action.title}</div>
                  <div className="text-sm text-slate-500">{action.description}</div>
                </div>
              </Button>
            </Link>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}