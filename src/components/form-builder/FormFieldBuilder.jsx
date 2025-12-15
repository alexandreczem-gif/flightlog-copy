import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'select', label: 'Lista Suspensa' }
];

export default function FormFieldBuilder({ fields, onFieldsChange }) {
  const [editingField, setEditingField] = useState(null);

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      options: []
    };
    onFieldsChange([...fields, newField]);
    setEditingField(newField.id);
  };

  const updateField = (fieldId, updates) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    onFieldsChange(updatedFields);
  };

  const removeField = (fieldId) => {
    const updatedFields = fields.filter(field => field.id !== fieldId);
    onFieldsChange(updatedFields);
    if (editingField === fieldId) {
      setEditingField(null);
    }
  };

  const addOption = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      updateField(fieldId, {
        options: [...(field.options || []), `Opção ${(field.options || []).length + 1}`]
      });
    }
  };

  const updateOption = (fieldId, optionIndex, value) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const newOptions = [...(field.options || [])];
      newOptions[optionIndex] = value;
      updateField(fieldId, { options: newOptions });
    }
  };

  const removeOption = (fieldId, optionIndex) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const newOptions = (field.options || []).filter((_, index) => index !== optionIndex);
      updateField(fieldId, { options: newOptions });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Campos do Formulário</h3>
        <Button
          onClick={addField}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Campo
        </Button>
      </div>

      <AnimatePresence>
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={`border-2 transition-colors ${
              editingField === field.id ? 'border-blue-500' : 'border-slate-200'
            }`}>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">
                      {field.label || `Campo ${index + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField(
                        editingField === field.id ? null : field.id
                      )}
                    >
                      {editingField === field.id ? 'Fechar' : 'Editar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(field.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {editingField === field.id && (
                <CardContent className="p-4 border-t border-slate-100 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rótulo do Campo</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder="Nome do campo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo do Campo</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(field.id, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                    />
                    <Label>Campo obrigatório</Label>
                  </div>

                  {field.type === 'select' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Opções</Label>
                        <Button
                          onClick={() => addOption(field.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar Opção
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(field.options || []).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(field.id, optionIndex, e.target.value)}
                              placeholder={`Opção ${optionIndex + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(field.id, optionIndex)}
                              className="text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {fields.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p className="mb-4">Nenhum campo adicionado ainda.</p>
          <Button
            onClick={addField}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Primeiro Campo
          </Button>
        </div>
      )}
    </div>
  );
}