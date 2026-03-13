import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AeronaveForm({ aeronave, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(aeronave || {
    designativo: "",
    prefixo: "",
    modelo: "",
    ativa: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{aeronave ? "Editar Aeronave" : "Nova Aeronave"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="designativo">Designativo *</Label>
            <Input
              id="designativo"
              value={formData.designativo}
              onChange={(e) => setFormData({ ...formData, designativo: e.target.value })}
              placeholder="Ex: Arcanjo 01, Falcão 08"
              required
            />
          </div>

          <div>
            <Label htmlFor="prefixo">Prefixo</Label>
            <Input
              id="prefixo"
              value={formData.prefixo}
              onChange={(e) => setFormData({ ...formData, prefixo: e.target.value })}
              placeholder="Ex: PR-ZAZ"
            />
          </div>

          <div>
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              placeholder="Ex: AS350 B2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="ativa"
              checked={formData.ativa}
              onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
            />
            <Label htmlFor="ativa" className="cursor-pointer">Aeronave ativa</Label>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {aeronave ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}