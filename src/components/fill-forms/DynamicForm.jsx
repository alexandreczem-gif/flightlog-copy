import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function DynamicForm({ fields, formData, onDataChange }) {
  const handleFieldChange = (fieldId, value) => {
    onDataChange({
      ...formData,
      [fieldId]: value
    });
  };

  const renderField = (field) => {
    const value = formData[field.id] || '';
    const baseProps = {
      id: field.id,
      value,
      placeholder: field.required ? `${field.label} *` : field.label,
      onChange: (e) => handleFieldChange(field.id, e.target.value),
      className: "border-slate-200 focus:border-blue-500"
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...baseProps} className="h-24 border-slate-200 focus:border-blue-500" />;
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
            <SelectTrigger className="border-slate-200 focus:border-blue-500">
              <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
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
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className="text-slate-700 font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
}