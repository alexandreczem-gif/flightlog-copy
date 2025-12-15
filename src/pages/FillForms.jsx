import React, { useState, useEffect } from "react";
import { Form } from "@/entities/all";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

import FormCard from "../components/fill-forms/FormCard";

export default function FillForms() {
  const [forms, setForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setIsLoading(true);
    try {
      const data = await Form.filter({ status: 'active' }, '-created_date');
      setForms(data);
    } catch (error) {
      console.error("Erro ao carregar formulários:", error);
    }
    setIsLoading(false);
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Preencher Formulários
            </h1>
            <p className="text-slate-600">
              Selecione um formulário para inserir novos dados
            </p>
          </div>
          <Link to={createPageUrl("CreateForm")}>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Formulário
            </Button>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Buscar formulários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200 focus:border-blue-500"
          />
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <Card className="h-48 bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredForms.length > 0 ? (
              <motion.div 
                key="forms-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredForms.map((form, index) => (
                  <FormCard key={form.id} form={form} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="no-forms"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileSpreadsheet className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {searchTerm ? "Nenhum formulário encontrado" : "Nenhum formulário disponível"}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm 
                    ? "Tente ajustar sua pesquisa ou criar um novo formulário."
                    : "Comece criando seu primeiro formulário para coletar dados."
                  }
                </p>
                <Link to={createPageUrl("CreateForm")}>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Formulário
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}