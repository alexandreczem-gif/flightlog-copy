import React, { useState } from "react";
import { Form } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

import FormFieldBuilder from "../components/form-builder/FormFieldBuilder";
import FormPreview from "../components/form-builder/FormPreview";

export default function CreateForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fields: [],
    color: "blue",
    status: "active"
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim() || formData.fields.length === 0) {
      alert("Por favor, preencha o nome do formulário e adicione pelo menos um campo.");
      return;
    }

    setIsSaving(true);
    try {
      await Form.create(formData);
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Erro ao salvar formulário:", error);
      alert("Erro ao salvar formulário. Tente novamente.");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Criar Novo Formulário</h1>
            <p className="text-slate-600">Configure os campos da sua planilha</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Configurações do Formulário</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Formulário</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Cadastro de Clientes"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="border-slate-200 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o propósito deste formulário..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="h-24 border-slate-200 focus:border-blue-500"
                  />
                </div>

                <FormFieldBuilder 
                  fields={formData.fields}
                  onFieldsChange={(fields) => setFormData({...formData, fields})}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl("Dashboard"))}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Salvando..." : "Salvar Formulário"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FormPreview formData={formData} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}