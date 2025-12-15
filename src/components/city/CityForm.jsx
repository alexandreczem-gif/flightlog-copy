import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';

export default function CityForm({ city, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    name: '',
    latitude_raw: '',
    longitude_raw: ''
  });

  useEffect(() => {
    if (city) {
      setFormData({
        name: city.name || '',
        latitude_raw: city.latitude_raw || '',
        longitude_raw: city.longitude_raw || ''
      });
    }
  }, [city]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.name.trim()) {
      alert("Por favor, preencha o nome da cidade no formato Cidade-UF");
      return;
    }

    // Validar formato Cidade-UF
    if (!formData.name.includes('-') || formData.name.split('-').length !== 2) {
      alert("Por favor, use o formato: Cidade-UF (ex: Curitiba-PR)");
      return;
    }

    const [cityName, state] = formData.name.split('-');
    if (!cityName.trim() || !state.trim() || state.trim().length !== 2) {
      alert("Formato inválido. Use: Cidade-UF (ex: Curitiba-PR)");
      return;
    }

    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="mb-6 shadow-lg bg-white border-slate-200">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle>{city ? 'Editar Cidade' : 'Nova Cidade'}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Cidade (Formato: Cidade-UF)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Curitiba-PR"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Use o formato "Cidade-UF" (ex: Curitiba-PR, São Paulo-SP)
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="latitude_raw">Latitude (DDMMSS S)</Label>
              <Input
                id="latitude_raw"
                value={formData.latitude_raw}
                onChange={(e) => handleChange('latitude_raw', e.target.value)}
                placeholder="Ex: 251640S"
                maxLength={7}
              />
              <p className="text-xs text-slate-500 mt-1">
                Formato: DDMMSS S (ex: 251640S para 25°16'40" Sul)
              </p>
            </div>

            <div>
              <Label htmlFor="longitude_raw">Longitude (DDDMMSS W)</Label>
              <Input
                id="longitude_raw"
                value={formData.longitude_raw}
                onChange={(e) => handleChange('longitude_raw', e.target.value)}
                placeholder="Ex: 0491625W"
                maxLength={8}
              />
              <p className="text-xs text-slate-500 mt-1">
                Formato: DDDMMSS W (ex: 0491625W para 49°16'25" Oeste)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
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