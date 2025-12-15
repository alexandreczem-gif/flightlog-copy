import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

export default function AerodromoForm({ aerodromo, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    icao_code: '',
    latitude_raw: '',
    longitude_raw: '',
    latitude_decimal: null,
    longitude_decimal: null
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (aerodromo) {
      setFormData({
        icao_code: aerodromo.icao_code || '',
        latitude_raw: aerodromo.latitude_raw || '',
        longitude_raw: aerodromo.longitude_raw || '',
        latitude_decimal: aerodromo.latitude_decimal || null,
        longitude_decimal: aerodromo.longitude_decimal || null
      });
    }
  }, [aerodromo]);

  const convertToDecimal = (value, isLongitude = false) => {
    const minLength = isLongitude ? 7 : 6;
    if (!value || value.length < minLength) return null;
    
    let degrees, minutes, seconds;
    
    if (isLongitude) {
      // Longitude: DDDMMSS (7 digits)
      degrees = parseInt(value.substring(0, 3));
      minutes = parseInt(value.substring(3, 5));
      seconds = parseInt(value.substring(5, 7));
    } else {
      // Latitude: DDMMSS (6 digits)
      degrees = parseInt(value.substring(0, 2));
      minutes = parseInt(value.substring(2, 4));
      seconds = parseInt(value.substring(4, 6));
    }
    
    let decimal = degrees + (minutes / 60) + (seconds / 3600);
    decimal = -decimal;
    
    return parseFloat(decimal.toFixed(6));
  };

  const handleChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };

    if (field === 'icao_code') {
      const upperValue = value.toUpperCase();
      newFormData.icao_code = upperValue.slice(0, 4);
      
      if (upperValue.length > 0 && !/^[A-Z]+$/.test(upperValue)) {
        setErrors({ ...errors, icao_code: 'Apenas letras maiúsculas' });
      } else if (upperValue.length > 0 && upperValue.length < 4) {
        setErrors({ ...errors, icao_code: 'Código ICAO deve ter 4 letras' });
      } else {
        const newErrors = { ...errors };
        delete newErrors.icao_code;
        setErrors(newErrors);
      }
    }

    if (field === 'latitude_raw') {
      newFormData.latitude_decimal = convertToDecimal(value, false);
    }
    if (field === 'longitude_raw') {
      newFormData.longitude_decimal = convertToDecimal(value, true);
    }

    setFormData(newFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.icao_code.length !== 4) {
      setErrors({ icao_code: 'Código ICAO deve ter exatamente 4 letras' });
      return;
    }

    if (!formData.latitude_raw || formData.latitude_raw.length < 6) {
      alert('Latitude inválida. Use formato DDMMSS (6 dígitos)');
      return;
    }

    if (!formData.longitude_raw || formData.longitude_raw.length < 7) {
      alert('Longitude inválida. Use formato DDDMMSS (7 dígitos)');
      return;
    }

    onSave(formData);
  };

  return (
    <Card className="shadow-xl bg-white border-slate-200 mb-6">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle>
          {aerodromo ? 'Editar Aeródromo' : 'Novo Aeródromo'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="icao_code">Código ICAO *</Label>
              <Input
                id="icao_code"
                value={formData.icao_code}
                onChange={(e) => handleChange('icao_code', e.target.value)}
                placeholder="Ex: SBCT"
                maxLength={4}
                className={errors.icao_code ? 'border-red-500' : ''}
              />
              {errors.icao_code && (
                <p className="text-xs text-red-500 mt-1">{errors.icao_code}</p>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Coordenadas</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="latitude_raw">Latitude (DDMMSS) *</Label>
                <Input
                  id="latitude_raw"
                  value={formData.latitude_raw}
                  onChange={(e) => handleChange('latitude_raw', e.target.value)}
                  placeholder="Ex: 251034 (6 dígitos)"
                  maxLength={6}
                />
                {formData.latitude_decimal && (
                  <p className="text-xs text-slate-500 mt-1">
                    Decimal: {formData.latitude_decimal.toFixed(6)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="longitude_raw">Longitude (DDDMMSS) *</Label>
                <Input
                  id="longitude_raw"
                  value={formData.longitude_raw}
                  onChange={(e) => handleChange('longitude_raw', e.target.value)}
                  placeholder="Ex: 0491034 (7 dígitos)"
                  maxLength={7}
                />
                {formData.longitude_decimal && (
                  <p className="text-xs text-slate-500 mt-1">
                    Decimal: {formData.longitude_decimal.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || Object.keys(errors).length > 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}