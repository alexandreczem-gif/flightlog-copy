import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download, Upload, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import HospitalTable from '../components/hospital/HospitalTable';
import HospitalForm from '../components/hospital/HospitalForm';

export default function Hospitais() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
        } else {
          loadHospitals();
        }
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        navigate(createPageUrl("Dashboard"));
      }
    };
    checkAccess();
  }, [navigate]);

  useEffect(() => {
    const results = hospitals.filter(hosp =>
      hosp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hosp.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hosp.municipality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hosp.bairro?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredHospitals(results);
  }, [searchTerm, hospitals]);

  const loadHospitals = async () => {
    setIsLoading(true);
    try {
      // Aumentando o limite para garantir que carregue todos os hospitais
      const data = await base44.entities.Hospital.list(null, 20000);
      setHospitals(data);
      setFilteredHospitals(data);
    } catch (error) {
      console.error("Erro ao carregar hospitais:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (hospitalData) => {
    setIsSaving(true);
    try {
      if (editingHospital) {
        await base44.entities.Hospital.update(editingHospital.id, hospitalData);
        alert("Hospital atualizado com sucesso!");
      } else {
        await base44.entities.Hospital.create(hospitalData);
        alert("Hospital cadastrado com sucesso!");
      }
      setShowForm(false);
      setEditingHospital(null);
      loadHospitals();
    } catch (error) {
      console.error("Erro ao salvar hospital:", error);
      alert("Erro ao salvar hospital. Verifique os dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (hospital) => {
    setEditingHospital(hospital);
    setShowForm(true);
  };

  const handleDelete = async (hospitalId) => {
    try {
      await base44.entities.Hospital.delete(hospitalId);
      alert("Hospital excluído com sucesso!");
      loadHospitals();
    } catch (error) {
      console.error("Erro ao excluir hospital:", error);
      alert("Erro ao excluir hospital.");
    }
  };

  const handleDeleteAll = async () => {
    const confirm = window.confirm(
      `⚠️ ATENÇÃO: Você está prestes a excluir TODOS os ${hospitals.length} hospitais cadastrados.\n\nEsta ação é IRREVERSÍVEL!\n\nDeseja realmente continuar?`
    );
    
    if (!confirm) return;

    const doubleConfirm = window.confirm(
      "Confirme novamente: Tem CERTEZA ABSOLUTA que deseja excluir todos os hospitais?"
    );
    
    if (!doubleConfirm) return;

    setIsLoading(true);
    try {
      // Fetch latest list to ensure we have everything
      let allHospitals = await base44.entities.Hospital.list(null, 20000);
      let deletedCount = 0;
      const total = allHospitals.length;

      // Process sequentially with robust rate limit handling
      for (const hospital of allHospitals) {
        let retries = 3;
        while (retries > 0) {
          try {
            await base44.entities.Hospital.delete(hospital.id);
            deletedCount++;
            // Safe delay between requests to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 600));
            break; // Success, move to next
          } catch (err) {
            // Ignore if not found (already deleted)
            if (err.message && (err.message.includes('not found') || err.message.includes('404'))) {
              break;
            }
            
            // Check for rate limit
            if (err.message && (err.message.includes('Rate limit') || err.message.includes('429'))) {
               console.warn(`Rate limit hit for ${hospital.id}, retrying... (${retries} left)`);
               // Wait longer before retrying
               await new Promise(resolve => setTimeout(resolve, 3000));
               retries--;
            } else {
              console.error(`Failed to delete hospital ${hospital.id}:`, err);
              break; // Other error, skip
            }
          }
        }
      }
      
      alert(`✅ Todos os ${total} hospitais foram excluídos com sucesso!`);
      loadHospitals();
    } catch (error) {
      console.error("Erro ao excluir todos os hospitais:", error);
      alert("Erro ao excluir hospitais. Alguns podem não ter sido excluídos.");
      loadHospitals();
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingHospital(null);
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
      const hospitalsToImport = csvData.map(row => {
        const municipio = row['Município'] || row['Municipio'] || row['municipality'] || '';
        const estado = row['Estado'] || row['state'] || '';
        const municipality = estado ? `${municipio}-${estado}` : municipio;
        
        return {
          name: row['Nome'] || row['name'] || '',
          razao_social: row['Razão Social'] || row['Razao Social'] || row['razao_social'] || '',
          cep: row['CEP'] || row['cep'] || '',
          logradouro: row['Logradouro'] || row['logradouro'] || '',
          numero: row['Número'] || row['Numero'] || row['numero'] || '',
          bairro: row['Bairro'] || row['bairro'] || '',
          municipality: municipality,
          phone: row['Telefone'] || row['phone'] || '',
          latitude: row['Latitude'] || row['latitude'] ? parseFloat(row['Latitude'] || row['latitude']) : null,
          longitude: row['Longitude'] || row['longitude'] ? parseFloat(row['Longitude'] || row['longitude']) : null,
          esfera_administrativa: row['Esfera Administrativa'] || row['esfera_administrativa'] || ''
        };
      }).filter(h => h.name && h.municipality);

      if (hospitalsToImport.length === 0) {
        alert("Nenhum hospital válido encontrado no arquivo.\n\nVerifique se as colunas necessárias estão presentes: Nome, Município (ou Município + Estado)");
        return;
      }

      const confirm = window.confirm(
        `Tem certeza que deseja importar ${hospitalsToImport.length} ${hospitalsToImport.length === 1 ? 'hospital' : 'hospitais'}?`
      );

      if (!confirm) {
        setIsImporting(false);
        event.target.value = '';
        return;
      }

      // Importar em lote
      await base44.entities.Hospital.bulkCreate(hospitalsToImport);

      alert(`✅ ${hospitalsToImport.length} hospitais importados com sucesso!`);
      loadHospitals();
      
      event.target.value = '';
    } catch (error) {
      console.error("Erro ao importar CSV:", error);
      alert("Erro ao importar arquivo CSV. Verifique o formato.\n\nO arquivo deve ser CSV com colunas: Nome, Município, Estado (obrigatórias)");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nome', 'Razão Social', 'CEP', 'Logradouro', 'Número', 'Bairro', 'Município', 'Telefone', 'Latitude', 'Longitude', 'Esfera Administrativa'];
    const csvContent = [
      headers.join(','),
      ...filteredHospitals.map(h => [
        `"${h.name || ''}"`,
        `"${h.razao_social || ''}"`,
        h.cep || '',
        `"${h.logradouro || ''}"`,
        h.numero || '',
        `"${h.bairro || ''}"`,
        `"${h.municipality || ''}"`,
        h.phone || '',
        h.latitude || '',
        h.longitude || '',
        h.esfera_administrativa || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hospitais_${new Date().toISOString().split('T')[0]}.csv`);
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
              Hospitais
            </h1>
            <p className="text-slate-600">
              Gerencie informações dos hospitais para referência nas missões
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Hospital
            </Button>
            <Button 
              onClick={() => document.getElementById('csv-upload-hospital').click()}
              disabled={isImporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importando..." : "Importar CSV"}
            </Button>
            <Button 
              onClick={handleDeleteAll}
              disabled={hospitals.length === 0}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Todos
            </Button>
            <input
              id="csv-upload-hospital"
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
            <HospitalForm
              hospital={editingHospital}
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
                  Lista de Hospitais ({filteredHospitals.length})
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome, razão social, município..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    disabled={filteredHospitals.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <HospitalTable
                hospitals={filteredHospitals}
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