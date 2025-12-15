import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download, Upload, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import CityTable from '../components/city/CityTable';
import CityForm from '../components/city/CityForm';

export default function Cidades() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== 'admin' && user.flight_log_role !== 'Administrador') {
          alert("Acesso restrito aos administradores.");
          navigate(createPageUrl("Dashboard"));
        } else {
          loadCities();
        }
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        navigate(createPageUrl("Dashboard"));
      }
    };
    checkAccess();
  }, [navigate]);

  useEffect(() => {
    const results = cities.filter(city =>
      city.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCities(results);
  }, [searchTerm, cities]);

  const loadCities = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.City.list(null, 20000);
      setCities(data);
      setFilteredCities(data);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (cityData) => {
    setIsSaving(true);
    try {
      if (editingCity) {
        await base44.entities.City.update(editingCity.id, cityData);
        alert("Cidade atualizada com sucesso!");
      } else {
        await base44.entities.City.create(cityData);
        alert("Cidade cadastrada com sucesso!");
      }
      setShowForm(false);
      setEditingCity(null);
      loadCities();
    } catch (error) {
      console.error("Erro ao salvar cidade:", error);
      alert("Erro ao salvar cidade. Verifique os dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (city) => {
    setEditingCity(city);
    setShowForm(true);
  };

  const handleDelete = async (cityId) => {
    try {
      await base44.entities.City.delete(cityId);
      alert("Cidade excluída com sucesso!");
      loadCities();
    } catch (error) {
      console.error("Erro ao excluir cidade:", error);
      alert("Erro ao excluir cidade.");
    }
  };

  const handleDeleteAll = async () => {
    const confirm = window.confirm(
      `⚠️ ATENÇÃO: Você está prestes a excluir TODAS as ${cities.length} cidades cadastradas.\n\nEsta ação é IRREVERSÍVEL!\n\nDeseja realmente continuar?`
    );
    
    if (!confirm) return;

    const doubleConfirm = window.confirm(
      "Confirme novamente: Tem CERTEZA ABSOLUTA que deseja excluir todas as cidades?"
    );
    
    if (!doubleConfirm) return;

    setIsLoading(true);
    try {
      let allCities = await base44.entities.City.list(null, 20000);
      let deletedCount = 0;
      const total = allCities.length;

      for (const city of allCities) {
        let retries = 3;
        while (retries > 0) {
          try {
            await base44.entities.City.delete(city.id);
            deletedCount++;
            await new Promise(resolve => setTimeout(resolve, 600));
            break;
          } catch (err) {
            if (err.message && (err.message.includes('not found') || err.message.includes('404'))) {
              break;
            }
            
            if (err.message && (err.message.includes('Rate limit') || err.message.includes('429'))) {
              console.warn(`Rate limit hit for ${city.id}, retrying... (${retries} left)`);
              await new Promise(resolve => setTimeout(resolve, 3000));
              retries--;
            } else {
              console.error(`Failed to delete city ${city.id}:`, err);
              break;
            }
          }
        }
      }
      
      alert(`✅ Todas as ${total} cidades foram excluídas com sucesso!`);
      loadCities();
    } catch (error) {
      console.error("Erro ao excluir todas as cidades:", error);
      alert("Erro ao excluir cidades. Algumas podem não ter sido excluídas.");
      loadCities();
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCity(null);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

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
      const text = await file.text();
      const csvData = parseCSV(text);

      if (csvData.length === 0) {
        alert("Arquivo CSV vazio ou formato inválido.");
        return;
      }

      const citiesToImport = csvData.map(row => ({
        name: row['Nome'] || row['name'] || row['Cidade'] || '',
        latitude_raw: row['Latitude'] || row['latitude_raw'] || '',
        longitude_raw: row['Longitude'] || row['longitude_raw'] || ''
      })).filter(c => c.name);

      if (citiesToImport.length === 0) {
        alert("Nenhuma cidade válida encontrada no arquivo.\n\nVerifique se a coluna 'Nome' está presente.");
        return;
      }

      const confirm = window.confirm(
        `Tem certeza que deseja importar ${citiesToImport.length} ${citiesToImport.length === 1 ? 'cidade' : 'cidades'}?`
      );

      if (!confirm) {
        setIsImporting(false);
        event.target.value = '';
        return;
      }

      await base44.entities.City.bulkCreate(citiesToImport);

      alert(`✅ ${citiesToImport.length} cidades importadas com sucesso!`);
      loadCities();
      
      event.target.value = '';
    } catch (error) {
      console.error("Erro ao importar CSV:", error);
      alert("Erro ao importar arquivo CSV. Verifique o formato.\n\nO arquivo deve ser CSV com coluna: Nome (obrigatória)");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nome', 'Latitude', 'Longitude'];
    const csvContent = [
      headers.join(','),
      ...filteredCities.map(c => [
        `"${c.name || ''}"`,
        c.latitude_raw || '',
        c.longitude_raw || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cidades_${new Date().toISOString().split('T')[0]}.csv`);
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
              Cidades
            </h1>
            <p className="text-slate-600">
              Gerencie as cidades utilizadas nos formulários de missão
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Cidade
            </Button>
            <Button 
              onClick={() => document.getElementById('csv-upload-city').click()}
              disabled={isImporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importando..." : "Importar CSV"}
            </Button>
            <Button 
              onClick={handleDeleteAll}
              disabled={cities.length === 0}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Todas
            </Button>
            <input
              id="csv-upload-city"
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
            <CityForm
              city={editingCity}
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
                  Lista de Cidades ({filteredCities.length})
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    disabled={filteredCities.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <CityTable
                cities={filteredCities}
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