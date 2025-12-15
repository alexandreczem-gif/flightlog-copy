import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X } from 'lucide-react';
import CitySelect from '../forms/CitySelect';

export default function HospitalForm({ hospital, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    name: '',
    razao_social: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    municipality: '',
    phone: '',
    latitude: null,
    longitude: null,
    esfera_administrativa: ''
  });

  useEffect(() => {
    if (hospital) {
      setFormData(hospital);
    }
  }, [hospital]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.municipality) {
      alert("Nome e Município são obrigatórios.");
      return;
    }
    
    onSave(formData);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="bg-green-50 border-b">
        <CardTitle>{hospital ? 'Editar Hospital' : 'Novo Hospital'}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Hospital Regional"
                required
              />
            </div>

            <div>
              <Label htmlFor="razao_social">Razão Social</Label>
              <Input
                id="razao_social"
                value={formData.razao_social}
                onChange={(e) => handleChange('razao_social', e.target.value)}
                placeholder="Ex: Hospital Regional S.A."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleChange('cep', e.target.value)}
                placeholder="Ex: 80000-000"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                value={formData.logradouro}
                onChange={(e) => handleChange('logradouro', e.target.value)}
                placeholder="Ex: Rua das Flores"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleChange('numero', e.target.value)}
                placeholder="Ex: 123"
              />
            </div>

            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
                placeholder="Ex: Centro"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Ex: (41) 3333-4444"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="municipality">Município *</Label>
              <CitySelect 
                value={formData.municipality}
                onChange={(v) => handleChange('municipality', v)}
                placeholder="Selecione o município..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Selecione uma das cidades cadastradas no sistema
              </p>
            </div>

            <div>
              <Label htmlFor="esfera_administrativa">Esfera Administrativa</Label>
              <Select 
                value={formData.esfera_administrativa} 
                onValueChange={(v) => handleChange('esfera_administrativa', v)}
              >
                <SelectTrigger id="esfera_administrativa">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Federal">Federal</SelectItem>
                  <SelectItem value="Estadual">Estadual</SelectItem>
                  <SelectItem value="Municipal">Municipal</SelectItem>
                  <SelectItem value="Privada">Privada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="latitude">Latitude (Decimal)</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={formData.latitude || ''}
                onChange={(e) => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Ex: -25.4284"
              />
            </div>

            <div>
              <Label htmlFor="longitude">Longitude (Decimal)</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={formData.longitude || ''}
                onChange={(e) => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Ex: -49.2733"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}