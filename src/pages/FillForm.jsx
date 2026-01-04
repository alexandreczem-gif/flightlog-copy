import React, { useState, useEffect, useCallback } from "react";
import { Form, FormResponse } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

import DynamicForm from "../components/fill-forms/DynamicForm";

export default function FillForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadForm = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');
    
    if (!formId) {
      navigate(createPageUrl("FillForms"));
      return;
    }

    try {
      const forms = await Form.filter({ id: formId });
      if (forms.length > 0) {
        setForm(forms[0]);
        // Initialize form data with empty values
        const initialData = {};
        forms[0].fields.forEach(field => {
          initialData[field.id] = '';
        });
        setFormData(initialData);
      } else {
        navigate(createPageUrl("FillForms"));
      }
    } catch (error) {
      console.error("Erro ao carregar formulário:", error);
      navigate(createPageUrl("FillForms"));
    }
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await FormResponse.create({
        form_id: form.id,
        form_name: form.name,
        data: formData,
        status: 'completed'
      });

      // Sync to Google Sheets
      try {
        const { base44 } = await import('@/api/base44Client');
        await base44.functions.invoke('syncFormToSheets', {
          form_id: form.id,
          form_name: form.name,
          response_data: formData
        });
      } catch (sheetsError) {
        console.error("Erro ao sincronizar com Google Sheets:", sheetsError);
        // Don't block the user if sheets sync fails
      }

      navigate(createPageUrl("ViewData") + `?form=${form.id}`);
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
      alert("Erro ao salvar dados. Tente novamente.");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Carregando formulário...</div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("FillForms"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{form.name}</h1>
            {form.description && (
              <p className="text-slate-600">{form.description}</p>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Preencher Dados</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DynamicForm 
                fields={form.fields}
                formData={formData}
                onDataChange={setFormData}
              />
              
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl("FillForms"))}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar Dados"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}