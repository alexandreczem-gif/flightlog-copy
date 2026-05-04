import React, { useState, useEffect } from "react";
import { FlightLog } from "@/entities/all";
import { VictimRecord } from "@/entities/VictimRecord"; // Import VictimRecord entity
import { User } from "@/entities/User"; // Import User entity
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { createPageUrl } from "@/utils"; // Import createPageUrl

import FlightLogTable from "../components/data/FlightLogTable";
import AdvancedFilters from "../components/data/AdvancedFilters"; // Import AdvancedFilters component

export default function FlightLogs() {
  const [logs, setLogs] = useState([]);
  const [victimRecords, setVictimRecords] = useState([]); // New state for victim records
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({}); // New state for advanced filters
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate

  // New useEffect for access control
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await User.me();
        // Check if user has 'Indefinido' role and is not an admin
        setIsAdmin(user.role === 'admin');
        if (user.flight_log_role === 'Indefinido' && user.role !== 'admin') {
          navigate(createPageUrl("Dashboard")); // Redirect to Dashboard
        } else {
          loadData(); // Load data only if access is granted
        }
      } catch (error) {
        // If User.me() fails (e.g., not logged in, token expired, API error),
        // assume no access or need to be redirected.
        console.error("Access check failed:", error);
        navigate(createPageUrl("Dashboard")); // Redirect to Dashboard
      }
    };
    checkAccess();
  }, [navigate]); // Add navigate to dependency array

  // New useEffect to apply filters whenever filters, logs, or victimRecords change
  useEffect(() => {
    applyFilters();
  }, [filters, logs, victimRecords]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch both flight logs and victim records concurrently
      const [flightData, victimData] = await Promise.all([
        FlightLog.list('-date'),
        VictimRecord.list()
      ]);
      setLogs(flightData);
      setVictimRecords(victimData);
      setFilteredLogs(flightData); // Initially set filtered logs to all logs
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };
  
  const applyFilters = () => {
    let results = logs.filter(log => {
      // Date filters
      if (filters.dateFrom && log.date < filters.dateFrom) return false;
      if (filters.dateTo && log.date > filters.dateTo) return false;

      // Time filters (based on departure_time_1)
      if (filters.timeFrom || filters.timeTo) {
        const depTime = log.departure_time_1;
        if (!depTime) return false;
        if (filters.timeFrom && depTime < filters.timeFrom) return false;
        if (filters.timeTo && depTime > filters.timeTo) return false;
      }
      
      // Mission filters
      if (filters.mission_id && !String(log.mission_id).includes(filters.mission_id)) return false;
      if (filters.sade_occurrence && (!log.sade_occurrence_number || !log.sade_occurrence_number.toLowerCase().includes(filters.sade_occurrence.toLowerCase()))) return false;
      if (filters.aircraft && log.aircraft !== filters.aircraft) return false;
      if (filters.municipality && (!log.municipality || !log.municipality.toLowerCase().includes(filters.municipality.toLowerCase()))) return false;

      // Multi-select mission types (BM or PM)
      if (filters.mission_types && filters.mission_types.length > 0) {
        const matchesBM = filters.mission_types.includes(log.mission_type);
        const matchesPM = filters.mission_types.includes(log.mission_type_pm);
        if (!matchesBM && !matchesPM) return false;
      }
      
      // Crew filters
      if (filters.pilot && (!log.pilot_in_command || !log.pilot_in_command.toLowerCase().includes(filters.pilot.toLowerCase()))) return false;
      if (filters.oat) {
        const oatMatch = [log.oat_1, log.oat_2, log.oat_3].filter(Boolean).some(o => o.toLowerCase().includes(filters.oat.toLowerCase()));
        if (!oatMatch) return false;
      }
      if (filters.osm) {
        const osmMatch = [log.osm_1, log.osm_2].filter(Boolean).some(o => o.toLowerCase().includes(filters.osm.toLowerCase()));
        if (!osmMatch) return false;
      }
      if (filters.pax && (!log.pax || !log.pax.toLowerCase().includes(filters.pax.toLowerCase()))) return false;
      
      // Operations filter
      if (filters.heli_operations && (!log.heli_operations || !Array.isArray(log.heli_operations) || !log.heli_operations.some(op => op.toLowerCase().includes(filters.heli_operations.toLowerCase())))) return false;
      
      // Victim filters (from FlightLog)
      if (filters.victim_name && (!log.victim_name || !log.victim_name.toLowerCase().includes(filters.victim_name.toLowerCase()))) return false;
      if (filters.victim_origin_city && (!log.victim_origin_city || !log.victim_origin_city.toLowerCase().includes(filters.victim_origin_city.toLowerCase()))) return false;
      if (filters.victim_origin_hospital && (!log.victim_origin_hospital || !log.victim_origin_hospital.toLowerCase().includes(filters.victim_origin_hospital.toLowerCase()))) return false;
      if (filters.victim_destination_city && (!log.victim_destination_city || !log.victim_destination_city.toLowerCase().includes(filters.victim_destination_city.toLowerCase()))) return false;
      if (filters.victim_destination_hospital && (!log.victim_destination_hospital || !log.victim_destination_hospital.toLowerCase().includes(filters.victim_destination_hospital.toLowerCase()))) return false;
      
      // Victim detailed record filters
      const hasVictimRecordFilters = filters.base || filters.samu_occurrence || filters.transport_type || filters.transport_status || filters.diagnosis;
      if (hasVictimRecordFilters) {
        const victimRecord = victimRecords.find(vr => vr.flight_log_id === log.id);
        if (victimRecord) {
          if (filters.base && victimRecord.base !== filters.base) return false;
          if (filters.samu_occurrence && (!victimRecord.ocorrencia_samu || !victimRecord.ocorrencia_samu.includes(filters.samu_occurrence))) return false;
          if (filters.transport_type && victimRecord.tipo_transporte !== filters.transport_type) return false;
          if (filters.transport_status && victimRecord.status_transporte !== filters.transport_status) return false;
          if (filters.diagnosis && (!victimRecord.diagnostico_lesao_principal || !victimRecord.diagnostico_lesao_principal.toLowerCase().includes(filters.diagnosis.toLowerCase()))) return false;
        } else {
          return false;
        }
      }
      
      return true;
    });
    
    setFilteredLogs(results);
  };

  const handleDeleteAll = async () => {
    const first = window.confirm(`Tem certeza que deseja EXCLUIR TODOS os ${logs.length} registros de voo? Esta ação não pode ser desfeita.`);
    if (!first) return;
    const second = window.confirm(`CONFIRMAÇÃO FINAL: Todos os ${logs.length} registros serão permanentemente excluídos. Continuar?`);
    if (!second) return;
    try {
      await Promise.all(logs.map(log => FlightLog.delete(log.id)));
      loadData();
    } catch (error) {
      console.error("Erro ao excluir registros:", error);
      alert("Ocorreu um erro ao excluir os registros.");
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      // Assuming FlightLog.delete returns a promise
      await FlightLog.delete(logId);
      loadData(); // Recarrega os dados após a exclusão
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      alert("Ocorreu um erro ao excluir o registro. Tente novamente.");
    }
  };


  const handleExport = () => {
    setIsExporting(true);
    
    // Função para formatar duração em hh:mm
    const formatDuration = (minutes) => {
      if (minutes === null || minutes === undefined) return '';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };
    
    // Coletar todos os campos únicos de todos os logs filtrados
    const allFields = new Set();
    filteredLogs.forEach(log => {
      Object.keys(log).forEach(key => allFields.add(key));
    });
    const headers = Array.from(allFields).sort();
    
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => 
        headers.map(header => {
          let value = log[header] !== undefined && log[header] !== null ? String(log[header]) : '';
          
          // Formatar flight_duration para hh:mm
          if (header === 'flight_duration' && log[header] !== undefined && log[header] !== null) {
            value = formatDuration(log[header]);
          }
          
          if (Array.isArray(log[header])) {
            return `"${log[header].map(item => {
              if (typeof item === 'object') {
                return JSON.stringify(item).replace(/"/g, '""');
              }
              return String(item).replace(/"/g, '""');
            }).join(';')}"`;
          }
          
          if (typeof log[header] === 'object' && log[header] !== null) {
            return `"${JSON.stringify(log[header]).replace(/"/g, '""')}"`;
          }
          
          return `"${value.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registros_de_voo_filtrados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  const handleExportRBE = async () => {
    setIsExporting(true);
    
    // Buscar tripulantes para mapear nomes para trigramas
    let nameToTrigramaMap = {};
    try {
      const tripulantes = await base44.entities.Tripulante.list();
      nameToTrigramaMap = tripulantes.reduce((acc, t) => {
        if (t.nome_de_guerra && t.trigrama) {
          acc[t.nome_de_guerra.toLowerCase()] = t.trigrama;
        }
        return acc;
      }, {});
    } catch (error) {
      console.error("Erro ao buscar tripulantes:", error);
    }
    
    // Função para converter nome em trigrama
    const getTrigramaOrName = (name) => {
      if (!name) return '';
      const trigrama = nameToTrigramaMap[name.toLowerCase()];
      return trigrama || name;
    };
    
    // Função para converter hora UTC para Brasília (UTC-3)
    const convertUTCtoBrasilia = (timeUTC) => {
      if (!timeUTC) return '';
      const [hours, minutes] = timeUTC.split(':').map(Number);
      let brasiliaHours = hours - 3;
      if (brasiliaHours < 0) brasiliaHours += 24;
      return `${String(brasiliaHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };
    
    // Função auxiliar para obter último arrival_time preenchido
    const getLastArrivalTime = (log) => {
      for (let i = 6; i >= 1; i--) {
        const arrivalTime = log[`arrival_time_${i}`];
        if (arrivalTime) return arrivalTime;
      }
      return '';
    };
    
    // Função auxiliar para obter último destination preenchido
    const getLastDestination = (log) => {
      for (let i = 6; i >= 1; i--) {
        const destination = log[`destination_${i}`];
        if (destination) return destination;
      }
      return '';
    };
    
    // Função auxiliar para combinar Pax e victims
    const getPassengers = (log) => {
      let passengers = log.pax || '';
      if (log.victims && Array.isArray(log.victims) && log.victims.length > 0) {
        const victimNames = log.victims.map(v => v.name).filter(Boolean).join('; ');
        if (victimNames) {
          passengers = passengers ? `${passengers}; ${victimNames}` : victimNames;
        }
      }
      return passengers;
    };
    
    // Cabeçalhos CSV para RBE
    const headers = [
      'Id', 'Datainicio', 'Base', 'Aeronave', 'Naturezapm', 'Naturezabm', 
      'Atividadesaereas', 'Comandanteaeronave', 'Ordemdecolagem', 'Copiloto', 
      'Tom1', 'Tom2', 'Apoiosolo', 'Passageiro', 'Horainicio', 'Dataencerramento', 
      'Horaencerramento', 'Motivovoo', 'Tempovoo', 'Abastecimentolitros', 
      'Horaforasolo', 'Decolagem', 'Horalocalocorrencia', 'Horahospital', 
      'Destino', 'Pousofinal', 'Localocorrencia', 'Bairro', 'Cidade', 
      'Numerobou', 'Descricaoinicial', 'Operacoesaereasespeciais', 'Descricaoservicoprestado'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => {
        const row = [
          '', // Id - em branco
          log.date || '', // Datainicio
          log.base || '', // Base
          log.aircraft || '', // Aeronave
          log.mission_type_pm || '', // Naturezapm
          log.mission_type || '', // Naturezabm
          '', // Atividadesaereas - em branco
          getTrigramaOrName(log.pilot_in_command || ''), // Comandanteaeronave
          'Acionamento', // Ordemdecolagem
          getTrigramaOrName(log.copilot || ''), // Copiloto
          getTrigramaOrName(log.oat_1 || ''), // Tom1
          getTrigramaOrName(log.oat_2 || ''), // Tom2
          '', // Apoiosolo - em branco
          getPassengers(log), // Passageiro
          convertUTCtoBrasilia(log.departure_time_1 || ''), // Horainicio
          log.date || '', // Dataencerramento
          convertUTCtoBrasilia(getLastArrivalTime(log)), // Horaencerramento
          'Operacao Verão', // Motivovoo
          log.flight_duration || '', // Tempovoo
          '0', // Abastecimentolitros
          convertUTCtoBrasilia(log.departure_time_1 || ''), // Horaforasolo
          log.origin_1 || '', // Decolagem
          convertUTCtoBrasilia(log.arrival_time_1 || ''), // Horalocalocorrencia
          log.arrival_time_2 ? convertUTCtoBrasilia(log.arrival_time_2) : '00:00', // Horahospital
          log.destination || '', // Destino
          getLastDestination(log), // Pousofinal
          log.destination_1 || '', // Localocorrencia
          '', // Bairro - em branco
          log.municipality || 'Curitiba/PR', // Cidade
          log.sade_occurrence_number || '', // Numerobou
          log.remarks || '', // Descricaoinicial
          (log.heli_operations && Array.isArray(log.heli_operations)) ? log.heli_operations.join('; ') : '', // Operacoesaereasespeciais
          log.remarks || '' // Descricaoservicoprestado
        ];
        
        return row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registros_rbe_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        if (lines.length < 2) return;

        // Strip BOM and quotes from headers
        const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const dataToImport = [];

        // Fields to skip on import (system/read-only fields)
        const SKIP_FIELDS = new Set(['id', 'created_by', 'created_by_id', 'created_date', 'updated_date', 'is_sample']);

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const rowValues = [];
          let currentVal = '';
          let inQuotes = false;
          
          for (let char of lines[i]) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              rowValues.push(currentVal.replace(/^"|"$/g, ''));
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          rowValues.push(currentVal.replace(/^"|"$/g, ''));

          const row = {};
          headers.forEach((h, idx) => {
            if (rowValues[idx] !== undefined && !SKIP_FIELDS.has(h)) row[h] = rowValues[idx].trim();
          });
          
          if (Object.keys(row).length > 0) dataToImport.push(row);
        }

        // Batch create or sequential create
        // FlightLog requires arrays for some fields, CSV usually flattens them.
        // If importing previously exported data, we handled array as semicolon joined string in handleExport.
        // We need to reverse that.
        
        const parsedData = dataToImport.map(row => {
          const newRow = { ...row };
          
          // Handle array/object fields
          ['heli_operations', 'crew_members'].forEach(field => {
            if (!newRow[field]) {
              newRow[field] = [];
            } else if (typeof newRow[field] === 'string') {
              if (newRow[field].trim().startsWith('[')) {
                try { newRow[field] = JSON.parse(newRow[field]); } catch (e) { newRow[field] = []; }
              } else {
                newRow[field] = newRow[field].split(';').map(s => s.trim()).filter(Boolean);
              }
            }
          });

          // Handle victims: can be a JSON object {}, JSON array [], semicolon-separated, or empty
          if (!newRow['victims']) {
            newRow['victims'] = [];
          } else if (typeof newRow['victims'] === 'string' && newRow['victims'].trim()) {
            const v = newRow['victims'].trim();
            if (v.startsWith('[')) {
              try { newRow['victims'] = JSON.parse(v); } catch (e) { newRow['victims'] = []; }
            } else if (v.startsWith('{')) {
              try { newRow['victims'] = [JSON.parse(v)]; } catch (e) { newRow['victims'] = []; }
            } else {
              newRow['victims'] = v.split(';').map(s => s.trim()).filter(Boolean);
            }
          }

          // Handle flight_duration: convert HH:MM to minutes if needed
          if (newRow['flight_duration']) {
            const durVal = String(newRow['flight_duration']);
            if (durVal.includes(':')) {
              const [h, m] = durVal.split(':').map(Number);
              newRow['flight_duration'] = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
            } else {
              newRow['flight_duration'] = Number(durVal) || 0;
            }
          } else {
            newRow['flight_duration'] = 0;
          }

          // Handle other numeric fields
          ['mission_id', 'rescued_victims_count', 'helibalde_launches', 'helibalde_load_liters', 'external_load_time_min', 'external_load_kg', 'oriented_people_count'].forEach(field => {
            const val = newRow[field];
            newRow[field] = (val === undefined || val === null || val === '' || isNaN(Number(val))) ? 0 : Number(val);
          });

          // Handle booleans
          ['is_regular_scale'].forEach(field => {
            if (newRow[field] !== undefined) newRow[field] = newRow[field] === 'true' || newRow[field] === true;
          });

          return newRow;
        });

        // Confirmação antes de importar
        const confirmImport = window.confirm(
          `Tem certeza que deseja importar ${parsedData.length} ${parsedData.length === 1 ? 'registro' : 'registros'}?`
        );

        if (!confirmImport) {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        await Promise.all(parsedData.map(d => FlightLog.create(d)));
        alert(`${parsedData.length} registros importados com sucesso!`);
        loadData();
      } catch (error) {
        console.error('Erro na importação:', error);
        alert('Erro ao processar arquivo.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
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
              Registros de Voo
            </h1>
            <p className="text-slate-600">
              Visualize, filtre e exporte todos os voos realizados.
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".csv" 
                  className="hidden" 
                />
                <Button 
                  onClick={handleImportClick}
                  disabled={isImporting}
                  variant="outline"
                  className="border-slate-300 text-slate-700"
                >
                  {isImporting ? 'Importando...' : 'Importar CSV'}
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting || filteredLogs.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Exportando..." : `Exportar Filtrados (${filteredLogs.length})`}
                </Button>
                <Button
                 onClick={handleExportRBE}
                 disabled={isExporting || filteredLogs.length === 0}
                 className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                 <Download className="w-4 h-4 mr-2" />
                 {isExporting ? "Exportando..." : `Exportar CSV para RBE`}
                </Button>
                <Button
                 onClick={handleDeleteAll}
                 disabled={logs.length === 0}
                 variant="destructive"
                >
                 <Trash2 className="w-4 h-4 mr-2" />
                 Excluir Todos
                </Button>
                </>
                )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Advanced Filters Component */}
          <AdvancedFilters onFilterChange={setFilters} />
          
          <Card className="shadow-xl bg-white border-slate-200 mt-4">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Voos</CardTitle>
                <p className="text-sm text-slate-500">
                  {filteredLogs.length} {filteredLogs.length === 1 ? 'registro' : 'registros'}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <FlightLogTable 
                logs={filteredLogs}
                isLoading={isLoading}
                onDelete={handleDeleteLog}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}