import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download, Upload, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import AerodromoTable from '../components/aerodromo/AerodromoTable';
import AerodromoForm from '../components/aerodromo/AerodromoForm';

export default function Aerodromos() {
  const navigate = useNavigate();
  const [aerodromos, setAerodromos] = useState([]);
  const [filteredAerodromos, setFilteredAerodromos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAerodromo, setEditingAerodromo] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
        } else {
          loadAerodromos();
        }
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        navigate(createPageUrl("Dashboard"));
      }
    };
    checkAccess();
  }, [navigate]);

  useEffect(() => {
    const results = aerodromos.filter(aero =>
      aero.icao_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAerodromos(results);
  }, [searchTerm, aerodromos]);

  const loadAerodromos = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Aerodromo.list();
      setAerodromos(data);
      setFilteredAerodromos(data);
    } catch (error) {
      console.error("Erro ao carregar aeródromos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (aerodromoData) => {
    setIsSaving(true);
    try {
      if (editingAerodromo) {
        await base44.entities.Aerodromo.update(editingAerodromo.id, aerodromoData);
        alert("Aeródromo atualizado com sucesso!");
      } else {
        await base44.entities.Aerodromo.create(aerodromoData);
        alert("Aeródromo cadastrado com sucesso!");
      }
      setShowForm(false);
      setEditingAerodromo(null);
      loadAerodromos();
    } catch (error) {
      console.error("Erro ao salvar aeródromo:", error);
      alert("Erro ao salvar aeródromo. Verifique os dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (aerodromo) => {
    setEditingAerodromo(aerodromo);
    setShowForm(true);
  };

  const handleDelete = async (aerodromoId) => {
    try {
      await base44.entities.Aerodromo.delete(aerodromoId);
      alert("Aeródromo excluído com sucesso!");
      loadAerodromos();
    } catch (error) {
      console.error("Erro ao excluir aeródromo:", error);
      alert("Erro ao excluir aeródromo.");
    }
  };

  const handleDeleteAll = async () => {
    const confirm = window.confirm(
      `⚠️ ATENÇÃO: Você está prestes a excluir TODOS os ${aerodromos.length} aeródromos cadastrados.\n\nEsta ação é IRREVERSÍVEL!\n\nDeseja realmente continuar?`
    );
    
    if (!confirm) return;

    const doubleConfirm = window.confirm(
      "Confirme novamente: Tem CERTEZA ABSOLUTA que deseja excluir todos os aeródromos?"
    );
    
    if (!doubleConfirm) return;

    setIsLoading(true);
    try {
      const deletePromises = aerodromos.map(a => base44.entities.Aerodromo.delete(a.id));
      await Promise.all(deletePromises);
      alert(`✅ Todos os ${aerodromos.length} aeródromos foram excluídos com sucesso!`);
      loadAerodromos();
    } catch (error) {
      console.error("Erro ao excluir todos os aeródromos:", error);
      alert("Erro ao excluir aeródromos. Alguns podem não ter sido excluídos.");
      loadAerodromos();
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAerodromo(null);
  };

  const convertToDecimal = (value) => {
    if (!value || value.length < 6) return null;
    
    const degrees = parseInt(value.substring(0, 2));
    const minutes = parseInt(value.substring(2, 4));
    const seconds = parseInt(value.substring(4, 6));
    
    let decimal = degrees + (minutes / 60) + (seconds / 3600);
    decimal = -decimal; // Sul e Oeste são negativos
    
    return parseFloat(decimal.toFixed(6));
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const headerLine = lines[0];
    const headers = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of headerLine) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        headers.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    headers.push(current.trim());

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const handleImportCSV = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // Ler arquivo CSV diretamente
      const text = await file.text();
      const csvData = parseCSV(text);

      if (csvData.length === 0) {
        alert("Arquivo CSV vazio ou formato inválido.");
        return;
      }

      // Mapear colunas do CSV para campos da entidade
      const aerodromosToImport = csvData.map(row => {
        const latRaw = row['Latitude'] || row['latitude_raw'] || '';
        const lonRaw = row['Longitude'] || row['longitude_raw'] || '';
        
        return {
          icao_code: (row['ICAO'] || row['Código ICAO'] || row['icao_code'] || '').toUpperCase().trim(),
          latitude_raw: latRaw.trim(),
          longitude_raw: lonRaw.trim(),
          latitude_decimal: convertToDecimal(latRaw.trim()),
          longitude_decimal: convertToDecimal(lonRaw.trim())
        };
      }).filter(aero => aero.icao_code && aero.latitude_raw && aero.longitude_raw);

      if (aerodromosToImport.length === 0) {
        alert("Nenhum aeródromo válido encontrado no arquivo.\n\nVerifique se as colunas necessárias estão presentes: ICAO, Latitude, Longitude");
        return;
      }

      const confirm = window.confirm(
        `Encontrados ${aerodromosToImport.length} aeródromos válidos para importar.\n\nDeseja continuar? Esta ação adicionará novos registros ao banco de dados.`
      );

      if (!confirm) return;

      // Importar em lote
      await base44.entities.Aerodromo.bulkCreate(aerodromosToImport);

      alert(`✅ ${aerodromosToImport.length} aeródromos importados com sucesso!`);
      loadAerodromos();
      
      event.target.value = '';
    } catch (error) {
      console.error("Erro ao importar CSV:", error);
      alert("Erro ao importar arquivo CSV. Verifique o formato.\n\nO arquivo deve ser CSV com colunas: ICAO, Latitude, Longitude (obrigatórias)");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Código ICAO', 'Latitude', 'Longitude'];
    const csvContent = [
      headers.join(','),
      ...filteredAerodromos.map(aero => [
        aero.icao_code,
        aero.latitude_raw,
        aero.longitude_raw
      ].join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `aerodromos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Aeródromos do Brasil
            </h1>
            <p className="text-slate-600">
              Gerencie os aeródromos com códigos ICAO e coordenadas
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Aeródromo
            </Button>
            <Button 
              onClick={() => document.getElementById('csv-upload').click()}
              disabled={isImporting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importando..." : "Importar CSV"}
            </Button>
            <Button 
              onClick={handleDeleteAll}
              disabled={aerodromos.length === 0}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Todos
            </Button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </div>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AerodromoForm
              aerodromo={editingAerodromo}
              onSave={handleSave}
              onCancel={handleCancelForm}
              isSaving={isSaving}
            />
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl bg-white border-slate-200">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle>
                  Lista de Aeródromos ({filteredAerodromos.length})
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por código ICAO..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    disabled={filteredAerodromos.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <AerodromoTable
                aerodromos={filteredAerodromos}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}