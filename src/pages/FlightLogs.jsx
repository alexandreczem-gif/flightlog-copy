import React, { useState, useEffect } from "react";
import { FlightLog } from "@/entities/all";
import { VictimRecord } from "@/entities/VictimRecord"; // Import VictimRecord entity
import { User } from "@/entities/User"; // Import User entity
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
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
      if (filters.dateFrom) {
        const logDate = new Date(log.date);
        const filterFromDate = new Date(filters.dateFrom);
        if (logDate < filterFromDate) return false;
      }
      if (filters.dateTo) {
        const logDate = new Date(log.date);
        const filterToDate = new Date(filters.dateTo);
        if (logDate > filterToDate) return false;
      }
      
      // Mission filters
      if (filters.mission_id && !String(log.mission_id).includes(filters.mission_id)) return false;
      if (filters.sade_occurrence && (!log.sade_occurrence_number || !log.sade_occurrence_number.toLowerCase().includes(filters.sade_occurrence.toLowerCase()))) return false;
      if (filters.aircraft && log.aircraft !== filters.aircraft) return false;
      if (filters.mission_type && log.mission_type !== filters.mission_type) return false;
      
      // Crew filters
      if (filters.commander && (!log.pilot_in_command || !log.pilot_in_command.toLowerCase().includes(filters.commander.toLowerCase()))) return false;
      if (filters.crew_member) {
        const crewMembers = [
          log.pilot_in_command,
          log.copilot,
          log.oat_1, log.oat_2, log.oat_3,
          log.osm_1, log.osm_2,
          ...(log.crew_members || []) // Ensure crew_members is an array before spread
        ].filter(Boolean); // Remove any null/undefined entries
        if (!crewMembers.some(m => m.toLowerCase().includes(filters.crew_member.toLowerCase()))) return false;
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
      
      // Victim detailed record filters (need to match with VictimRecord)
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
          // If we're filtering by victim record fields but there's no record, exclude this log
          return false;
        }
      }
      
      return true;
    });
    
    setFilteredLogs(results);
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
    
    // Exportar apenas os logs filtrados
    const headers = Object.keys(FlightLog.schema().properties);
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
            return `"${log[header].map(item => String(item).replace(/"/g, '""')).join(';')}"`;
          }
          return `"${value.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
          '', // Ordemdecolagem - em branco
          getTrigramaOrName(log.copilot || ''), // Copiloto
          getTrigramaOrName(log.oat_1 || ''), // Tom1
          getTrigramaOrName(log.oat_2 || ''), // Tom2
          '', // Apoiosolo - em branco
          getPassengers(log), // Passageiro
          convertUTCtoBrasilia(log.departure_time_1 || ''), // Horainicio
          log.date || '', // Dataencerramento
          convertUTCtoBrasilia(getLastArrivalTime(log)), // Horaencerramento
          '', // Motivovoo - em branco
          log.flight_duration || '', // Tempovoo
          '', // Abastecimentolitros - em branco
          convertUTCtoBrasilia(log.departure_time_1 || ''), // Horaforasolo
          log.origin_1 || '', // Decolagem
          '', // Horalocalocorrencia - em branco
          '', // Horahospital - em branco
          log.destination || '', // Destino
          getLastDestination(log), // Pousofinal
          log.destination_1 || '', // Localocorrencia
          '', // Bairro - em branco
          '', // Cidade - em branco
          log.sade_occurrence_number || '', // Numerobou
          '', // Descricaoinicial - em branco
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
        // Parse simple CSV - careful with quoted strings containing commas
        // This is a basic parser, might need a library for robust CSV parsing
        // For now, assuming simple CSV or standard quotes
        const lines = text.split('\n');
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataToImport = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          // Basic split logic handling quotes
          const rowValues = [];
          let currentVal = '';
          let inQuotes = false;
          
          for (let char of lines[i]) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              rowValues.push(currentVal.trim().replace(/^"|"$/g, '')); // Trim quotes
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          rowValues.push(currentVal.trim().replace(/^"|"$/g, ''));

          const row = {};
          headers.forEach((h, idx) => {
            if (rowValues[idx] !== undefined) row[h] = rowValues[idx];
          });
          
          if (Object.keys(row).length > 0) dataToImport.push(row);
        }

        // Batch create or sequential create
        // FlightLog requires arrays for some fields, CSV usually flattens them.
        // If importing previously exported data, we handled array as semicolon joined string in handleExport.
        // We need to reverse that.
        
        const parsedData = dataToImport.map(row => {
          const newRow = { ...row };
          
          // Handle array fields
          ['heli_operations', 'crew_members', 'victims'].forEach(field => {
            if (!newRow[field]) {
              newRow[field] = [];
            } else if (typeof newRow[field] === 'string') {
              // If it looks like a JSON array, parse it
              if (newRow[field].trim().startsWith('[')) {
                try {
                  newRow[field] = JSON.parse(newRow[field]);
                } catch (e) {
                  newRow[field] = [];
                }
              } else {
                // Otherwise treat as semicolon separated string
                newRow[field] = newRow[field].split(';').map(s => s.trim()).filter(Boolean);
              }
            }
          });
          
          // Handle numbers
          ['mission_id', 'flight_duration', 'rescued_victims_count', 'helibalde_launches', 'helibalde_load_liters', 'external_load_time_min', 'external_load_kg'].forEach(field => {
            const val = newRow[field];
            if (val === undefined || val === null || val === '' || isNaN(Number(val))) {
              // For required fields like flight_duration, 0 is a safer fallback than null
              // For counts, 0 is also appropriate
              newRow[field] = 0;
            } else {
              newRow[field] = Number(val);
            }
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