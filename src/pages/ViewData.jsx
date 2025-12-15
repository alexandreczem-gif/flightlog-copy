import React, { useState, useEffect } from "react";
import { Form, FormResponse } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

import DataTable from "../components/view-data/DataTable";

export default function ViewData() {
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Check if form ID is in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('form');
    if (formId) {
      setSelectedFormId(formId);
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [formsData, responsesData] = await Promise.all([
        Form.list('-created_date'),
        FormResponse.list('-created_date')
      ]);
      setForms(formsData);
      setResponses(responsesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const handleExport = async () => {
    if (!selectedFormId) {
      alert("Selecione um formulário primeiro.");
      return;
    }

    setIsExporting(true);
    try {
      const form = forms.find(f => f.id === selectedFormId);
      const formResponses = responses.filter(r => r.form_id === selectedFormId);

      if (formResponses.length === 0) {
        alert("Não há dados para exportar.");
        setIsExporting(false);
        return;
      }

      // Prepare data for export
      const headers = form.fields.map(field => field.label);
      const rows = formResponses.map(response => 
        form.fields.map(field => response.data[field.id] || '')
      );

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${form.name}-dados.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      alert("Erro ao exportar dados.");
    }
    setIsExporting(false);
  };

  const filteredResponses = responses.filter(response => {
    const matchesForm = !selectedFormId || response.form_id === selectedFormId;
    const matchesSearch = !searchTerm || 
      Object.values(response.data).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesForm && matchesSearch;
  });

  const selectedForm = forms.find(f => f.id === selectedFormId);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Visualizar Dados
            </h1>
            <p className="text-slate-600">
              Analise e exporte os dados coletados
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={!selectedFormId || isExporting || filteredResponses.length === 0}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar CSV"}
          </Button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Formulário
                  </label>
                  <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                    <SelectTrigger className="border-slate-200 focus:border-blue-500">
                      <SelectValue placeholder="Selecione um formulário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Todos os formulários</SelectItem>
                      {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar nos dados..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-slate-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DataTable 
            form={selectedForm}
            responses={filteredResponses}
            isLoading={isLoading}
          />
        </motion.div>
      </div>
    </div>
  );
}