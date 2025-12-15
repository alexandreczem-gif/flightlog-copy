import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";

export default function FormPreview({ formData }) {
  const renderField = (field) => {
    const baseProps = {
      id: field.id,
      placeholder: field.required ? `${field.label} *` : field.label,
      disabled: true
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...baseProps} className="h-24" />;
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={field.label} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'number':
        return <Input {...baseProps} type="number" />;
      case 'date':
        return <Input {...baseProps} type="date" />;
      case 'email':
        return <Input {...baseProps} type="email" />;
      case 'phone':
        return <Input {...baseProps} type="tel" />;
      default:
        return <Input {...baseProps} type="text" />;
    }
  };

  return (
    <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0 sticky top-8">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Pré-visualização
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!formData.name ? (
          <div className="text-center py-8 text-slate-500">
            <p>Preencha o nome do formulário e adicione campos para ver a pré-visualização.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {formData.name}
              </h3>
              {formData.description && (
                <p className="text-slate-600">{formData.description}</p>
              )}
            </div>
            
            {formData.fields.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                <p>Nenhum campo adicionado ainda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-slate-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}