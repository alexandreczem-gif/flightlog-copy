import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Remove direct entity imports as they will now be accessed via base44.entities
// import { User } from '@/entities/User';
// import { DailyService } from '@/entities/DailyService';
// import { FlightLog } from '@/entities/FlightLog';
// import { Abastecimento } from '@/entities/Abastecimento';
// import { VictimRecord } from '@/entities/VictimRecord';
import { base44 } from '@/api/base44Client'; // Changed from '@/lib/base44'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Play, PowerOff, Plane, Layers, Droplets, Clock, Trash2, AlertTriangle, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logAction } from "@/components/utils/logger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AIRCRAFT_OPTIONS = ["Arcanjo 01", "Falcão 08", "Falcão 03", "Falcão 04", "Falcão 12", "Falcão 13", "Falcão 14", "Falcão 15"];
const BASE_OPTIONS = ["Litoral Resgate", "Litoral Policial", "Curitiba Resgate", "Curitiba Policial"];

const emptyAircraftService = {
  aircraft: '',
  base: '',
  service_start_time: '07:30',
  service_end_time: '18:30',
  commander: '',
  copilot: '',
  oat_1: '',
  oat_2: '',
  oat_3: '',
  osm_1: '',
  osm_2: '',
  tasa: ''
};

const emptyService = {
  date: format(new Date(), 'yyyy-MM-dd'),
  aircraft_services: [{ ...emptyAircraftService }],
  initial_fuel_supply_liters: '',
  drained_fuel_liters: '',
  service_notes: 'Sem alterações',
};

const UserSelect = ({ field, label, value, onChange, userList, required }) => {
  const normalizedValue = value || '_none_';
  
  const handleChange = (newValue) => {
    onChange(newValue === '_none_' ? '' : newValue);
  };
  
  return (
    <div>
      <Label htmlFor={field}>{label}</Label>
      <Select value={normalizedValue} onValueChange={handleChange} required={required}>
        <SelectTrigger id={field}><SelectValue placeholder="Selecione..." /></SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value="_none_">Nenhum</SelectItem>}
          {userList && userList.length > 0 ? (
            userList.map(tripulante => (
              <SelectItem key={tripulante.id} value={tripulante.nome_de_guerra}>
                {tripulante.trigrama} - {tripulante.nome_de_guerra}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="_empty_" disabled>Nenhum tripulante disponível</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

const StatDisplay = ({ title, value, icon: Icon }) => (
    <div className="bg-slate-100 p-3 rounded-lg flex items-center gap-4">
        <div className="bg-white p-2 rounded-md shadow-sm">
            <Icon className="w-5 h-5 text-red-600" />
        </div>
        <div>
            <p className="text-sm text-slate-600">{title}</p>
            <p className="font-bold text-lg text-slate-800">{value}</p>
        </div>
    </div>
);

export default function DailyServicePage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [serviceRecord, setServiceRecord] = useState(null);
  const [initialFormData, setInitialFormData] = useState(emptyService);
  const [endServiceData, setEndServiceData] = useState({
      final_fuel_supply_liters: '',
      maintenance_notes: 'Sem alterações',
      load_map_notes: 'Sem alterações',
      general_notes: 'Sem alterações'
  });

  const [operationalDates, setOperationalDates] = useState({
      operation_start_date: '',
      service_period_start_date: ''
  });

  const [savingField, setSavingField] = useState(null);

  const [dailyFlights, setDailyFlights] = useState([]);
  const [dailyAbastecimentos, setDailyAbastecimentos] = useState([]);
  const [allTimeLogs, setAllTimeLogs] = useState([]);
  const [pendingVictims, setPendingVictims] = useState([]);

  const [showNoFuelAlert, setShowNoFuelAlert] = useState(false);
  const [showVictimsAlert, setShowVictimsAlert] = useState(false);
  const [showDatesDialog, setShowDatesDialog] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const STORAGE_KEY = 'dailyServiceDraft';

  useEffect(() => {
    if (!serviceRecord && Object.values(initialFormData).some(v => v && v !== '' && v !== 'Sem alterações' && v !== '07:30' && v !== '18:30')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialFormData));
    }
  }, [initialFormData, serviceRecord]);

  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft && !serviceRecord) {
      try {
        const parsed = JSON.parse(savedDraft);
        setInitialFormData(prev => ({ ...emptyService, ...prev, ...parsed }));
      } catch (error) {
        console.error("Erro ao restaurar rascunho:", error);
      }
    }
  }, [serviceRecord]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setInitialFormData(emptyService);
  };

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me(); // Changed from User.me()
      setCurrentUser(user);
      
      if (user.flight_log_role === 'Indefinido' && user.role !== 'admin') {
        navigate(createPageUrl("Dashboard"));
        return;
      }
      
      const [tripulantesList, existingServices, allLogs] = await Promise.all([
        base44.entities.Tripulante.list(),
        base44.entities.DailyService.filter({ date: todayStr }),
        base44.entities.FlightLog.list()
      ]);

      const tripulanteList = tripulantesList.map(t => ({
        id: t.id,
        nome_de_guerra: t.nome_de_guerra,
        trigrama: t.trigrama,
        funcao: t.funcao
      }));

      setUsers(tripulanteList);
      setAllTimeLogs(allLogs);

      if (existingServices.length > 0) {
        const currentService = existingServices[0];
        setServiceRecord(currentService);
        setEndServiceData({
            final_fuel_supply_liters: currentService.final_fuel_supply_liters || '',
            maintenance_notes: currentService.maintenance_notes || 'Sem alterações',
            load_map_notes: currentService.load_map_notes || 'Sem alterações',
            general_notes: currentService.general_notes || 'Sem alterações'
        });

        if (currentService.operation_start_date) {
          setOperationalDates({
            operation_start_date: currentService.operation_start_date || '',
            service_period_start_date: currentService.service_period_start_date || ''
          });
        }

        const [flights, abastecimentos, victimRecords] = await Promise.all([
          base44.entities.FlightLog.filter({ date: todayStr }), // Changed from FlightLog.filter()
          base44.entities.Abastecimento.filter({ date: todayStr }), // Changed from Abastecimento.filter()
          base44.entities.VictimRecord.list() // Changed from VictimRecord.list()
        ]);
        setDailyFlights(flights);
        setDailyAbastecimentos(abastecimentos);

        const detailedVictimIds = new Set(
          victimRecords.map(r => `${r.flight_log_id}_${r.victim_index}`)
        );

        const pending = [];
        flights.forEach(flight => {
          if (flight.victims && Array.isArray(flight.victims) && flight.victims.length > 0) {
            flight.victims.forEach((victim, index) => {
              const victimId = `${flight.id}_${index}`;
              if (!detailedVictimIds.has(victimId) && victim.name) {
                pending.push({ flight_log_id: flight.id, victim_index: index, victim_name: victim.name });
              }
            });
          }
        });
        setPendingVictims(pending);

      } else {
        const [lastCompletedService] = await base44.entities.DailyService.filter({ status: 'completed' }, '-date', 1);
        
        let initialFuelValue = '';
        let combinedNotes = 'Sem alterações';
        
        if (lastCompletedService) {
          if (lastCompletedService.final_fuel_supply_liters !== null && lastCompletedService.final_fuel_supply_liters !== undefined) {
            initialFuelValue = lastCompletedService.final_fuel_supply_liters;
          }
          
          // Concatenar observações do dia anterior
          const notesArray = [];
          
          if (lastCompletedService.service_notes && lastCompletedService.service_notes !== 'Sem alterações') {
            notesArray.push(`OBSERVAÇÕES INICIAIS (${lastCompletedService.date}):\n${lastCompletedService.service_notes}`);
          }
          
          if (lastCompletedService.maintenance_notes && lastCompletedService.maintenance_notes !== 'Sem alterações') {
            notesArray.push(`MANUTENÇÃO (${lastCompletedService.date}):\n${lastCompletedService.maintenance_notes}`);
          }
          
          if (lastCompletedService.load_map_notes && lastCompletedService.load_map_notes !== 'Sem alterações') {
            notesArray.push(`MAPA-CARGA (${lastCompletedService.date}):\n${lastCompletedService.load_map_notes}`);
          }
          
          if (lastCompletedService.general_notes && lastCompletedService.general_notes !== 'Sem alterações') {
            notesArray.push(`OBSERVAÇÕES GERAIS (${lastCompletedService.date}):\n${lastCompletedService.general_notes}`);
          }
          
          if (notesArray.length > 0) {
            combinedNotes = notesArray.join('\n\n---\n\n');
          }
        }
        
        setInitialFormData(prev => ({ 
          ...prev, 
          initial_fuel_supply_liters: initialFuelValue,
          service_notes: combinedNotes
        }));
        
        if (lastCompletedService && lastCompletedService.operation_start_date) {
          setOperationalDates({
            operation_start_date: lastCompletedService.operation_start_date || '',
            service_period_start_date: lastCompletedService.service_period_start_date || ''
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, todayStr]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const userGroups = useMemo(() => {
    return {
      pilots: users.filter(u => u.funcao === 'Piloto'),
      oats: users.filter(u => u.funcao === 'OAT'),
      osms: users.filter(u => u.funcao === 'OSM'),
      tasas: users.filter(u => u.funcao === 'TASA')
    };
  }, [users]);
  
  const finalFuelCalculation = useMemo(() => {
      if (!serviceRecord) return 0;
      const initialFuel = Number(serviceRecord.initial_fuel_supply_liters) || 0;
      const drainedFuel = Number(serviceRecord.drained_fuel_liters) || 0;
      
      const aircraftFuelConsumed = dailyAbastecimentos
        .filter(item => !item.uaa_abastecimento)
        .reduce((sum, item) => sum + (Number(item.quantity_liters) || 0), 0);
      
      const uaaFuelSupplied = dailyAbastecimentos
        .filter(item => item.uaa_abastecimento)
        .reduce((sum, item) => sum + (Number(item.quantity_liters) || 0), 0);
      
      return initialFuel - drainedFuel - aircraftFuelConsumed + uaaFuelSupplied;
  }, [serviceRecord, dailyAbastecimentos]);

  useEffect(() => {
      if(serviceRecord) {
        setEndServiceData(prev => ({...prev, final_fuel_supply_liters: finalFuelCalculation}));
      }
  }, [finalFuelCalculation, serviceRecord]);

  const calculateStatsByPeriod = useCallback((startDate) => {
    if (!startDate) return { hoursByAircraft: {}, missionsByType: {} };
    
    const filteredLogs = allTimeLogs.filter(log => log.date >= startDate);
    
    const hoursByAircraft = filteredLogs.reduce((acc, log) => {
      acc[log.aircraft] = (acc[log.aircraft] || 0) + (log.flight_duration || 0);
      return acc;
    }, {});
    
    const missionsByType = filteredLogs.reduce((acc, log) => {
      acc[log.mission_type] = (acc[log.mission_type] || 0) + 1;
      return acc;
    }, {});
    
    return { hoursByAircraft, missionsByType };
  }, [allTimeLogs]);

  const stats = useMemo(() => {
      const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}min`;
      };

      const hoursTodayByAircraft = dailyFlights.reduce((acc, log) => {
          acc[log.aircraft] = (acc[log.aircraft] || 0) + log.flight_duration;
          return acc;
      }, {});

      const missionsTodayByType = dailyFlights.reduce((acc, log) => {
          acc[log.mission_type] = (acc[log.mission_type] || 0) + 1;
          return acc;
      }, {});

      const periodStats = serviceRecord?.service_period_start_date 
        ? calculateStatsByPeriod(serviceRecord.service_period_start_date)
        : { hoursByAircraft: {}, missionsByType: {} };

      const operationStats = serviceRecord?.operation_start_date
        ? calculateStatsByPeriod(serviceRecord.operation_start_date)
        : { hoursByAircraft: {}, missionsByType: {} };

      return { 
        formatDuration, 
        hoursTodayByAircraft, 
        missionsTodayByType,
        periodStats,
        operationStats
      };
  }, [dailyFlights, serviceRecord, calculateStatsByPeriod]);

  const handleInitialDataChange = (field, value) => {
    setInitialFormData({ ...initialFormData, [field]: value });
  };

  const handleAircraftServiceChange = (index, field, value) => {
    const newServices = [...initialFormData.aircraft_services];
    newServices[index] = { ...newServices[index], [field]: value };
    setInitialFormData({ ...initialFormData, aircraft_services: newServices });
  };

  const addAircraftService = () => {
    setInitialFormData({
      ...initialFormData,
      aircraft_services: [...initialFormData.aircraft_services, { ...emptyAircraftService }]
    });
  };

  const removeAircraftService = (index) => {
    if (initialFormData.aircraft_services.length > 1) {
      const newServices = initialFormData.aircraft_services.filter((_, i) => i !== index);
      setInitialFormData({ ...initialFormData, aircraft_services: newServices });
    }
  };

  const handleEndDataChange = (field, value) => {
    setEndServiceData({ ...endServiceData, [field]: value });
  };

  const handlePartialSave = async (field) => {
    if (!serviceRecord) return;
    
    setSavingField(field);
    try {
      await base44.entities.DailyService.update(serviceRecord.id, {
        [field]: endServiceData[field]
      });
      await logAction('update', 'DailyService', serviceRecord.id, { [field]: endServiceData[field] });
      alert(`${field === 'maintenance_notes' ? 'Manutenção' : field === 'load_map_notes' ? 'Mapa-Carga' : 'Observações Gerais'} salva com sucesso!`);
    } catch (error) {
      console.error(`Erro ao salvar ${field}:`, error);
      alert(`Erro ao salvar. Tente novamente.`);
    } finally {
      setSavingField(null);
    }
  };
  
  const handleStartService = async () => {
    setIsSaving(true);
    try {
      const dataToSend = { 
        ...initialFormData, 
        status: 'in_progress',
        initial_fuel_supply_liters: initialFormData.initial_fuel_supply_liters === '' ? null : Number(initialFormData.initial_fuel_supply_liters),
        drained_fuel_liters: initialFormData.drained_fuel_liters === '' ? null : Number(initialFormData.drained_fuel_liters)
      };
      
      const createdService = await base44.entities.DailyService.create(dataToSend);
      await logAction('create', 'DailyService', createdService?.id || 'unknown', dataToSend);
      localStorage.removeItem(STORAGE_KEY);
      await loadInitialData();
    } catch (error) {
      console.error("Erro ao iniciar serviço:", error);
      alert("Erro ao iniciar serviço. Verifique os dados e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndServiceClick = () => {
    if (pendingVictims.length > 0) {
      setShowVictimsAlert(true);
      return;
    }

    if (dailyAbastecimentos.length === 0) {
      setShowNoFuelAlert(true);
      return;
    }

    setShowDatesDialog(true);
  };

  const handleDatesConfirm = () => {
    setShowDatesDialog(false);
    setShowFinalConfirm(true);
  };

  const handleEndService = async () => {
      if(!serviceRecord) return;
      setIsSaving(true);
      try {
          const updateData = {
            ...endServiceData, 
            ...operationalDates,
            status: 'completed' 
          };
          await base44.entities.DailyService.update(serviceRecord.id, updateData);
          await logAction('update', 'DailyService', serviceRecord.id, { ...updateData, action: 'end_service' });
          
          try {
            await generateServicePDF();
          } catch (pdfError) {
            console.error("Erro ao gerar PDF:", pdfError);
            // Continua mesmo se o PDF falhar
          }
          
          await loadInitialData();
      } catch (error) {
          console.error("Erro ao encerrar serviço:", error);
          alert("Erro ao encerrar o serviço. Tente novamente.");
      } finally {
          setIsSaving(false);
          setShowFinalConfirm(false);
      }
  };

  const handleReopenService = async () => {
    if (!serviceRecord) return;
    
    const confirmReopen = window.confirm("Tem certeza que deseja reabrir este serviço? Isso permitirá edições e novos registros.");
    if (!confirmReopen) return;
    
    setIsSaving(true);
    try {
      await base44.entities.DailyService.update(serviceRecord.id, { status: 'in_progress' });
      await logAction('update', 'DailyService', serviceRecord.id, { status: 'in_progress', action: 'reopen_service' });
      await loadInitialData();
      alert("Serviço reaberto com sucesso!");
    } catch (error) {
      console.error("Erro ao reabrir serviço:", error);
      alert("Erro ao reabrir o serviço. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const canReopenService = () => {
    if (!serviceRecord || !currentUser) return false;
    return currentUser.role === 'admin' || currentUser.email === serviceRecord.created_by;
  };

  const generateServicePDF = async () => {
    // Prompt para nome do responsável com valor padrão do usuário atual
    const responsibleName = prompt(
      'Nome do Responsável pelo Preenchimento do Relatório:', 
      currentUser?.nome_de_guerra || currentUser?.full_name || ''
    );
    
    if (!responsibleName) {
      alert('É necessário informar o nome do responsável.');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar o relatório.');
      return;
    }
    
    const finalFuelForPdf = Number(endServiceData.final_fuel_supply_liters) || 0;
    
    const periodStatsForPdf = operationalDates.service_period_start_date
      ? calculateStatsByPeriod(operationalDates.service_period_start_date)
      : { hoursByAircraft: {}, missionsByType: {} };
    
    const operationStatsForPdf = operationalDates.operation_start_date
      ? calculateStatsByPeriod(operationalDates.operation_start_date)
      : { hoursByAircraft: {}, missionsByType: {} };
    
    const dailyHoursEvolution = {};
    if (operationalDates.operation_start_date) {
      allTimeLogs.filter(log => log.date >= operationalDates.operation_start_date).forEach(log => {
        if (!dailyHoursEvolution[log.date]) {
          dailyHoursEvolution[log.date] = 0;
        }
        dailyHoursEvolution[log.date] += log.flight_duration || 0;
      });
    }
    
    const sortedDates = Object.keys(dailyHoursEvolution).sort();
    const dailyHoursData = sortedDates.map(date => ({
      date,
      hours: (dailyHoursEvolution[date] / 60).toFixed(1)
    }));
    
    const missionTypeLabels = Object.keys(operationStatsForPdf.missionsByType);
    const missionTypeValues = Object.values(operationStatsForPdf.missionsByType);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Serviço Diário - ${format(new Date(serviceRecord.date + 'T12:00:00'), 'dd/MM/yyyy')}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
          @media print {
            body { margin: 0; }
            .page-break { page-break-after: always; }
            @page { margin: 15mm; }
          }
          
          body { 
            font-family: Arial, sans-serif; 
            margin: 15px;
            background: white;
            font-size: 11pt;
          }
          
          .cover-page {
            text-align: center;
            padding: 40px 20px;
            min-height: 85vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .cover-title {
            font-size: 2.2em;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 30px;
            border-bottom: 4px solid #b91c1c;
            padding-bottom: 15px;
          }
          
          .cover-date {
            font-size: 1.8em;
            color: #475569;
            margin: 20px 0;
          }
          
          .cover-info {
            font-size: 1.2em;
            color: #64748b;
            margin: 10px 0;
            padding: 12px;
            background: #f8fafc;
            border-radius: 6px;
          }
          
          h1 { 
            color: #1e293b; 
            border-bottom: 2px solid #b91c1c; 
            padding-bottom: 8px;
            margin: 20px 0 15px 0;
            font-size: 1.4em;
          }
          
          h2 { 
            color: #475569; 
            margin: 15px 0 10px 0;
            border-left: 4px solid #b91c1c;
            padding-left: 8px;
            font-size: 1.2em;
          }
          
          h3 { 
            color: #64748b; 
            margin: 12px 0 8px 0; 
            font-size: 1em; 
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
            font-size: 10pt;
          }
          
          th, td { 
            border: 1px solid #cbd5e1; 
            padding: 8px; 
            text-align: left; 
          }
          
          th { 
            background-color: #f1f5f9; 
            font-weight: bold;
            color: #1e293b;
          }
          
          .section { 
            margin: 15px 0; 
            page-break-inside: avoid; 
          }
          
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 10px;
            margin: 10px 0;
          }
          
          .info-item { 
            padding: 8px; 
            background: #f8fafc; 
            border-left: 3px solid #b91c1c;
            border-radius: 3px;
            font-size: 10pt;
          }
          
          .aircraft-section { 
            margin: 12px 0; 
            padding: 12px; 
            background: #f8fafc; 
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          
          .stats-container {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 15px;
            margin: 15px 0;
            align-items: start;
          }
          
          .chart-container {
            background: white;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            max-width: 250px;
          }
          
          .stats-table {
            margin: 8px 0;
            font-size: 10pt;
          }
          
          .stats-table td:first-child {
            font-weight: bold;
            color: #475569;
          }
          
          .stats-table td:last-child {
            text-align: right;
            color: #1e293b;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="cover-page page-break">
          <div class="cover-title">Relatório de Serviço Diário</div>
          <div class="cover-date">${format(new Date(serviceRecord.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
          
          ${operationalDates.operation_start_date ? `
            <div class="cover-info">
              <strong>Período da Operação:</strong><br>
              ${format(new Date(operationalDates.operation_start_date + 'T12:00:00'), 'dd/MM/yyyy')} até ${format(new Date(serviceRecord.date + 'T12:00:00'), 'dd/MM/yyyy')}
            </div>
            <div class="cover-info">
              <strong>Período de Serviço da Equipe:</strong><br>
              ${format(new Date(operationalDates.service_period_start_date + 'T12:00:00'), 'dd/MM/yyyy')} até ${format(new Date(serviceRecord.date + 'T12:00:00'), 'dd/MM/yyyy')}
            </div>
          ` : ''}
        </div>
        
        <div class="section">
          <h1>Informações do Serviço</h1>
          
          <h2>Aeronaves e Equipes</h2>
          ${(serviceRecord.aircraft_services || []).map((svc, idx) => `
            <div class="aircraft-section">
              <h3>Aeronave ${idx + 1}: ${svc.aircraft}</h3>
              <div class="info-grid">
                <div class="info-item"><strong>Base:</strong> ${svc.base || 'N/A'}</div>
                <div class="info-item"><strong>Horário:</strong> ${svc.service_start_time || 'N/A'} - ${svc.service_end_time || 'N/A'}</div>
                <div class="info-item"><strong>Comandante:</strong> ${svc.commander}</div>
                <div class="info-item"><strong>Copiloto:</strong> ${svc.copilot || 'N/A'}</div>
                <div class="info-item"><strong>OATs:</strong> ${[svc.oat_1, svc.oat_2, svc.oat_3].filter(Boolean).join(', ') || 'N/A'}</div>
                <div class="info-item"><strong>OSMs:</strong> ${[svc.osm_1, svc.osm_2].filter(Boolean).join(', ') || 'N/A'}</div>
                <div class="info-item"><strong>TASA:</strong> ${svc.tasa || 'N/A'}</div>
              </div>
            </div>
          `).join('')}
          
          <h3>Combustível</h3>
          <table class="stats-table">
            <tr><td>Inicial UAA</td><td>${serviceRecord.initial_fuel_supply_liters ?? 'N/A'} L</td></tr>
            <tr><td>Drenado</td><td>${serviceRecord.drained_fuel_liters ?? 'N/A'} L</td></tr>
            <tr><td>Final UAA</td><td>${finalFuelForPdf.toFixed(2)} L</td></tr>
          </table>
          
          ${serviceRecord.service_notes && serviceRecord.service_notes !== 'Sem alterações' ? `
            <h3>Observações Iniciais do Serviço</h3>
            <div style="padding: 10px; background: #f8fafc; border-left: 3px solid #b91c1c; border-radius: 3px; white-space: pre-wrap;">
              ${serviceRecord.service_notes}
            </div>
          ` : ''}
        </div>

        <div class="page-break"></div>

        <div class="section">
          <h1>Voos do Dia</h1>
          ${dailyFlights.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Missão</th>
                  <th>Tipo</th>
                  <th>Aeronave</th>
                  <th>Origem</th>
                  <th>Destino</th>
                  <th>Duração</th>
                </tr>
              </thead>
              <tbody>
                ${dailyFlights.map(f => `
                  <tr>
                    <td>${f.mission_id}</td>
                    <td>${f.mission_type}</td>
                    <td>${f.aircraft}</td>
                    <td>${f.origin}</td>
                    <td>${f.destination}</td>
                    <td>${f.flight_duration} min</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>Nenhum voo registrado.</p>'}
        </div>

        <div class="section">
          <h1>Abastecimentos</h1>
          ${dailyAbastecimentos.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Aeronave/UAA</th>
                  <th>Quantidade</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                ${dailyAbastecimentos.map(a => `
                  <tr>
                    <td>${a.time}</td>
                    <td>${a.aircraft_designator || 'UAA'}</td>
                    <td>${a.quantity_liters} L</td>
                    <td>${a.uaa_abastecimento ? 'UAA' : 'Aeronave'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>Nenhum abastecimento registrado.</p>'}
        </div>

        <div class="section">
          <h1>Estatísticas</h1>
          
          <h2>Dia</h2>
          <table class="stats-table">
            ${Object.entries(stats.hoursTodayByAircraft).map(([ac, dur]) => `
              <tr><td>${ac}</td><td>${stats.formatDuration(dur)}</td></tr>
            `).join('')}
          </table>
          
          ${operationalDates.service_period_start_date ? `
            <h2>Período de Serviço</h2>
            <table class="stats-table">
              ${Object.entries(periodStatsForPdf.hoursByAircraft).map(([ac, dur]) => `
                <tr><td>${ac}</td><td>${stats.formatDuration(dur)}</td></tr>
              `).join('')}
            </table>
          ` : ''}
          
          ${operationalDates.operation_start_date ? `
            <h2>Operação Completa</h2>
            
            <div class="stats-container">
              <div>
                <h3>Horas por Aeronave</h3>
                <table class="stats-table">
                  ${Object.entries(operationStatsForPdf.hoursByAircraft).map(([ac, dur]) => `
                    <tr><td>${ac}</td><td>${stats.formatDuration(dur)}</td></tr>
                  `).join('')}
                </table>
                
                <h3>Missões por Natureza</h3>
                <table class="stats-table">
                  ${Object.entries(operationStatsForPdf.missionsByType).map(([type, count]) => `
                    <tr><td>${type}</td><td>${count}</td></tr>
                  `).join('')}
                </table>
              </div>
              
              <div>
                ${missionTypeLabels.length > 0 ? `
                  <div class="chart-container">
                    <canvas id="missionsPieChart" width="200" height="200"></canvas>
                  </div>
                ` : ''}
                
                ${dailyHoursData.length > 0 ? `
                  <div class="chart-container" style="margin-top: 15px;">
                    <canvas id="hoursLineChart" width="200" height="150"></canvas>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="section">
          <h1>Observações Finais</h1>
          <table class="stats-table">
            <tr><td>Manutenção</td><td>${endServiceData.maintenance_notes}</td></tr>
            <tr><td>Mapa-Carga</td><td>${endServiceData.load_map_notes}</td></tr>
            <tr><td>Gerais</td><td>${endServiceData.general_notes}</td></tr>
          </table>
        </div>

        <script>
          ${missionTypeLabels.length > 0 ? `
          const pieCtx = document.getElementById('missionsPieChart');
          if (pieCtx) {
            new Chart(pieCtx, {
              type: 'pie',
              data: {
                labels: ${JSON.stringify(missionTypeLabels)},
                datasets: [{
                  data: ${JSON.stringify(missionTypeValues)},
                  backgroundColor: [
                    '#ef4444', '#f97316', '#f59e0b', '#eab308', 
                    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
                    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'
                  ]
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: 'Missões',
                    font: { size: 11, weight: 'bold' }
                  }
                }
              }
            });
          }
          ` : ''}
          
          ${dailyHoursData.length > 0 ? `
          const lineCtx = document.getElementById('hoursLineChart');
          if (lineCtx) {
            const dailyLabels = ${JSON.stringify(dailyHoursData.map(d => {
              const parts = d.date.split('-');
              return parts[2] + '/' + parts[1];
            }))};
            
            new Chart(lineCtx, {
              type: 'line',
              data: {
                labels: dailyLabels,
                datasets: [{
                  label: 'Horas',
                  data: ${JSON.stringify(dailyHoursData.map(d => d.hours))},
                  borderColor: '#b91c1c',
                  backgroundColor: 'rgba(185, 28, 28, 0.1)',
                  tension: 0.3,
                  fill: true
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { display: false },
                  title: {
                    display: true,
                    text: 'Evolução Diária',
                    font: { size: 11, weight: 'bold' }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { font: { size: 9 } }
                  },
                  x: {
                    ticks: { font: { size: 9 } }
                  }
                }
              }
            });
          }
          ` : ''}
          
          setTimeout(() => {
            window.print();
          }, 1000);
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isLoading && !serviceRecord) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-1/2 mb-8" />
          <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent className="space-y-4 mt-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><div className="flex justify-end"><Skeleton className="h-10 w-24" /></div></CardContent></Card>
        </div>
      </div>
    );
  }

  if (serviceRecord) {
    const finalFuelDisplay = Number(endServiceData.final_fuel_supply_liters) || 0;
    
    return (
      <div className="min-h-screen p-4 md:p-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Serviço Diário - {format(new Date(serviceRecord.date + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}</h1>
              <p className={`text-sm font-semibold ${serviceRecord.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                Status: {serviceRecord.status === 'completed' ? 'Encerrado' : 'Em Andamento'}
              </p>
            </div>
          </motion.div>

          <Card className="mb-8">
              <CardHeader><CardTitle>Informações do Serviço</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-4">
                      <strong>Combustível Inicial UAA:</strong> {serviceRecord.initial_fuel_supply_liters ?? 'N/A'} L | 
                      <strong>Drenado:</strong> {serviceRecord.drained_fuel_liters ?? 'N/A'} L
                    </p>
                  </div>
                  
                  {(serviceRecord.aircraft_services || []).map((svc, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-slate-50">
                      <h3 className="font-semibold text-lg mb-3">Aeronave {idx + 1}: {svc.aircraft}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <p><strong>Base:</strong> {svc.base || '-'}</p>
                        <p><strong>Horário:</strong> {svc.service_start_time} - {svc.service_end_time}</p>
                        <p><strong>Comandante:</strong> {svc.commander}</p>
                        <p><strong>Copiloto:</strong> {svc.copilot || '-'}</p>
                        <p><strong>OAT 1:</strong> {svc.oat_1 || '-'}</p>
                        <p><strong>OAT 2:</strong> {svc.oat_2 || '-'}</p>
                        <p><strong>OAT 3:</strong> {svc.oat_3 || '-'}</p>
                        <p><strong>OSM 1:</strong> {svc.osm_1 || '-'}</p>
                        <p><strong>OSM 2:</strong> {svc.osm_2 || '-'}</p>
                        <p><strong>TASA:</strong> {svc.tasa || '-'}</p>
                      </div>
                    </div>
                  ))}
                  
                  <p className="text-sm"><strong>Notas Iniciais:</strong> {serviceRecord.service_notes || 'Nenhuma'}</p>
              </CardContent>
          </Card>

          <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Voos do Dia</CardTitle></CardHeader>
                <CardContent>
                    {dailyFlights.length > 0 ? (
                        <ul className="divide-y">
                            {dailyFlights.map(flight => (
                                <li key={flight.id} className="py-2">Missão {flight.mission_id} - {flight.mission_type} ({flight.flight_duration} min)</li>
                            ))}
                        </ul>
                    ) : <p>Nenhum voo registrado hoje.</p>}
                </CardContent>
            </Card>

            {pendingVictims.length > 0 && serviceRecord.status !== 'completed' && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="w-5 h-5" />
                    Vítimas Aguardando Detalhamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-700 mb-3">
                    Há {pendingVictims.length} vítima(s) aguardando detalhamento. O serviço não pode ser encerrado enquanto houver vítimas pendentes.
                  </p>
                  <Button 
                    onClick={() => navigate(createPageUrl("VictimRecords"))}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Ir para Vítimas Atendidas
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
                <CardHeader><CardTitle>Estatísticas</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-semibold mb-3 text-slate-800">Estatísticas do Dia</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <StatDisplay title="Comb. Final UAA (L)" value={finalFuelDisplay.toFixed(2)} icon={Droplets} />
                            {Object.entries(stats.hoursTodayByAircraft).map(([ac, dur]) => (
                                <StatDisplay key={ac} title={`Horas Voadas ${ac}`} value={stats.formatDuration(dur)} icon={Clock} />
                            ))}
                        </div>
                        {Object.keys(stats.missionsTodayByType).length > 0 && (
                            <div>
                                <p className="font-medium text-sm mb-2">Missões do Dia por Natureza:</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {Object.entries(stats.missionsTodayByType).map(([type, count]) => (
                                        <p key={type}>{type}: {count}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {serviceRecord.service_period_start_date && (
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-3 text-slate-800">
                                Estatísticas do Período de Serviço
                                <span className="text-sm font-normal text-slate-600 ml-2">
                                    (desde {format(new Date(serviceRecord.service_period_start_date + 'T12:00:00'), 'dd/MM/yyyy')})
                                </span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                {Object.entries(stats.periodStats.hoursByAircraft).map(([ac, dur]) => (
                                    <StatDisplay key={ac} title={`${ac} Acumulado`} value={stats.formatDuration(dur)} icon={Plane} />
                                ))}
                            </div>
                            {Object.keys(stats.periodStats.missionsByType).length > 0 && (
                                <div>
                                    <p className="font-medium text-sm mb-2">Missões Acumuladas por Natureza:</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {Object.entries(stats.periodStats.missionsByType).map(([type, count]) => (
                                            <p key={type}>{type}: {count}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {serviceRecord.operation_start_date && (
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-3 text-slate-800">
                                Estatísticas da Operação
                                <span className="text-sm font-normal text-slate-600 ml-2">
                                    (desde {format(new Date(serviceRecord.operation_start_date + 'T12:00:00'), 'dd/MM/yyyy')})
                                </span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                {Object.entries(stats.operationStats.hoursByAircraft).map(([ac, dur]) => (
                                    <StatDisplay key={ac} title={`${ac} Total`} value={stats.formatDuration(dur)} icon={Layers} />
                                ))}
                            </div>
                            {Object.keys(stats.operationStats.missionsByType).length > 0 && (
                                <div>
                                    <p className="font-medium text-sm mb-2">Missões Totais por Natureza:</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {Object.entries(stats.operationStats.missionsByType).map(([type, count]) => (
                                            <p key={type}>{type}: {count}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Observações Finais do Serviço</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="maintenance_notes">Manutenção das Aeronaves</Label>
                            {serviceRecord.status !== 'completed' && (
                                <Button 
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePartialSave('maintenance_notes')}
                                    disabled={savingField === 'maintenance_notes'}
                                >
                                    <Save className="w-3 h-3 mr-1" />
                                    {savingField === 'maintenance_notes' ? 'Salvando...' : 'Salvar'}
                                </Button>
                            )}
                        </div>
                        <Textarea id="maintenance_notes" value={endServiceData.maintenance_notes} onChange={e => handleEndDataChange('maintenance_notes', e.target.value)} className="h-24" disabled={serviceRecord.status === 'completed'} />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="load_map_notes">Alterações de Mapa-Carga</Label>
                            {serviceRecord.status !== 'completed' && (
                                <Button 
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePartialSave('load_map_notes')}
                                    disabled={savingField === 'load_map_notes'}
                                >
                                    <Save className="w-3 h-3 mr-1" />
                                    {savingField === 'load_map_notes' ? 'Salvando...' : 'Salvar'}
                                </Button>
                            )}
                        </div>
                        <Textarea id="load_map_notes" value={endServiceData.load_map_notes} onChange={e => handleEndDataChange('load_map_notes', e.target.value)} className="h-24" disabled={serviceRecord.status === 'completed'}/>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="general_notes">Alterações de Caráter Geral</Label>
                            {serviceRecord.status !== 'completed' && (
                                <Button 
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePartialSave('general_notes')}
                                    disabled={savingField === 'general_notes'}
                                >
                                    <Save className="w-3 h-3 mr-1" />
                                    {savingField === 'general_notes' ? 'Salvando...' : 'Salvar'}
                                </Button>
                            )}
                        </div>
                        <Textarea id="general_notes" value={endServiceData.general_notes} onChange={e => handleEndDataChange('general_notes', e.target.value)} className="h-24" disabled={serviceRecord.status === 'completed'}/>
                    </div>
                </CardContent>
            </Card>

            {serviceRecord.status !== 'completed' && (
              <div className="flex justify-end pt-4">
                  <Button onClick={handleEndServiceClick} disabled={isSaving} className="bg-green-700 hover:bg-green-800 text-white">
                      <PowerOff className="w-4 h-4 mr-2" />
                      {isSaving ? "Encerrando..." : "Encerrar Serviço"}
                  </Button>
              </div>
            )}

            {serviceRecord.status === 'completed' && canReopenService() && (
              <div className="flex justify-end pt-4">
                  <Button onClick={handleReopenService} disabled={isSaving} className="bg-orange-600 hover:bg-orange-700 text-white">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {isSaving ? "Reabrindo..." : "Desfazer Encerramento"}
                  </Button>
              </div>
            )}
          </div>

          <AlertDialog open={showVictimsAlert} onOpenChange={setShowVictimsAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Vítimas Aguardando Detalhamento
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Há {pendingVictims.length} vítima(s) que ainda não foram detalhadas. O serviço diário não pode ser encerrado enquanto houver vítimas pendentes.
                  
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="font-semibold mb-2">Vítimas pendentes:</p>
                    <ul className="list-disc list-inside text-sm">
                      {pendingVictims.slice(0, 5).map((v, idx) => (
                        <li key={idx}>{v.victim_name}</li>
                      ))}
                      {pendingVictims.length > 5 && <li>... e mais {pendingVictims.length - 5}</li>}
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  setShowVictimsAlert(false);
                  navigate(createPageUrl("VictimRecords"));
                }} className="bg-orange-600 hover:bg-orange-700">
                  Ir para Vítimas Atendidas
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showNoFuelAlert} onOpenChange={setShowNoFuelAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Nenhum Abastecimento Registrado
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Não foram registrados abastecimentos no dia de hoje. Tem certeza que deseja encerrar o serviço diário sem registrar abastecimentos?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => navigate(createPageUrl("Abastecimentos"))}>
                  Ir para Abastecimentos
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  setShowNoFuelAlert(false);
                  setShowDatesDialog(true);
                }}>
                  Continuar Mesmo Assim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showDatesDialog} onOpenChange={setShowDatesDialog}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Informações do Período Operacional</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-4 mt-4">
                    <p className="text-sm">
                      Para gerar as estatísticas corretas, informe as datas de referência:
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="operation_start_date">Data de Início da Operação</Label>
                        <Input
                          id="operation_start_date"
                          type="date"
                          value={operationalDates.operation_start_date}
                          onChange={(e) => setOperationalDates({...operationalDates, operation_start_date: e.target.value})}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Data em que a operação atual iniciou
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="service_period_start_date">Data de Início do Período de Serviço da Equipe</Label>
                        <Input
                          id="service_period_start_date"
                          type="date"
                          value={operationalDates.service_period_start_date}
                          onChange={(e) => setOperationalDates({...operationalDates, service_period_start_date: e.target.value})}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Data em que a equipe atual iniciou o período de serviço
                        </p>
                      </div>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDatesConfirm}
                  disabled={!operationalDates.operation_start_date || !operationalDates.service_period_start_date}
                >
                  Confirmar e Continuar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Encerramento do Serviço</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-semibold text-blue-900 mb-2">Combustível Remanescente na UAA:</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {finalFuelDisplay.toFixed(2)} Litros
                      </p>
                    </div>
                    
                    <p className="text-sm">
                      Ao confirmar, o serviço diário será encerrado e um relatório em PDF será gerado automaticamente. Deseja continuar?
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => navigate(createPageUrl("Abastecimentos"))}>
                  Cancelar e Ir para Abastecimentos
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleEndService} className="bg-green-700 hover:bg-green-800">
                  Confirmar e Encerrar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Dashboard"))}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Iniciar Serviço Diário</h1>
            <p className="text-slate-600">Preencha os dados para iniciar o serviço de hoje. Você pode adicionar múltiplas aeronaves e equipes.</p>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-xl bg-white border-slate-200">
            <CardHeader className="bg-slate-50 border-b"><CardTitle>Formulário de Início de Serviço</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg text-slate-800">Informações Gerais</h3>
                <div className="grid md:grid-cols-1 gap-6">
                  <div><Label htmlFor="date">Data</Label><Input id="date" type="date" value={initialFormData.date} onChange={(e) => handleInitialDataChange('date', e.target.value)} required max={todayStr} /></div>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-slate-800">
                    Aeronaves e Equipes ({initialFormData.aircraft_services.length})
                  </h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addAircraftService}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Aeronave
                  </Button>
                </div>
                
                {initialFormData.aircraft_services.map((svc, index) => (
                  <Card key={index} className="border-slate-200">
                    <CardHeader className="pb-3 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Aeronave {index + 1}</CardTitle>
                        {initialFormData.aircraft_services.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeAircraftService(index)}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid md:grid-cols-4 gap-6">
                        <div>
                          <Label>Aeronave</Label>
                          <Select required value={svc.aircraft} onValueChange={(v) => handleAircraftServiceChange(index, 'aircraft', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{AIRCRAFT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Base</Label>
                          <Select required value={svc.base} onValueChange={(v) => handleAircraftServiceChange(index, 'base', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{BASE_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Horário de Início</Label>
                          <Input type="time" value={svc.service_start_time} onChange={(e) => handleAircraftServiceChange(index, 'service_start_time', e.target.value)} required />
                        </div>
                        <div>
                          <Label>Horário de Término</Label>
                          <Input type="time" value={svc.service_end_time} onChange={(e) => handleAircraftServiceChange(index, 'service_end_time', e.target.value)} required />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                        <UserSelect field={`commander_${index}`} label="Comandante" value={svc.commander} onChange={v => handleAircraftServiceChange(index, 'commander', v)} userList={userGroups.pilots} required />
                        <UserSelect field={`copilot_${index}`} label="Copiloto" value={svc.copilot} onChange={v => handleAircraftServiceChange(index, 'copilot', v)} userList={userGroups.pilots} />
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <UserSelect field={`oat_1_${index}`} label="OAT 1" value={svc.oat_1} onChange={v => handleAircraftServiceChange(index, 'oat_1', v)} userList={userGroups.oats} />
                        <UserSelect field={`oat_2_${index}`} label="OAT 2" value={svc.oat_2} onChange={v => handleAircraftServiceChange(index, 'oat_2', v)} userList={userGroups.oats} />
                        <UserSelect field={`oat_3_${index}`} label="OAT 3" value={svc.oat_3} onChange={v => handleAircraftServiceChange(index, 'oat_3', v)} userList={userGroups.oats} />
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <UserSelect field={`osm_1_${index}`} label="OSM 1" value={svc.osm_1} onChange={v => handleAircraftServiceChange(index, 'osm_1', v)} userList={userGroups.osms} />
                        <UserSelect field={`osm_2_${index}`} label="OSM 2" value={svc.osm_2} onChange={v => handleAircraftServiceChange(index, 'osm_2', v)} userList={userGroups.osms} />
                        <UserSelect field={`tasa_${index}`} label="TASA" value={svc.tasa} onChange={v => handleAircraftServiceChange(index, 'tasa', v)} userList={userGroups.tasas} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg text-slate-800">Combustível</h3>
                <div className="grid md:grid-cols-2 gap-6">
                   <div><Label htmlFor="initial_fuel_supply_liters">Combustível na UAA no início do serviço (L)</Label><Input id="initial_fuel_supply_liters" type="number" value={initialFormData.initial_fuel_supply_liters} onChange={(e) => handleInitialDataChange('initial_fuel_supply_liters', e.target.value)} /></div>
                  <div><Label htmlFor="drained_fuel_liters">Combustível Drenado (L)</Label><Input id="drained_fuel_liters" type="number" value={initialFormData.drained_fuel_liters} onChange={(e) => handleInitialDataChange('drained_fuel_liters', e.target.value)} /></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service_notes">Alterações e Demandas no Início do Serviço</Label>
                <Textarea id="service_notes" value={initialFormData.service_notes} onChange={(e) => handleInitialDataChange('service_notes', e.target.value)} placeholder="Descreva aqui quaisquer alterações ou demandas..." className="h-32"/>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button type="button" onClick={clearDraft} variant="outline" className="text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Dados
                </Button>
                <Button type="button" onClick={handleStartService} disabled={isSaving} className="w-auto bg-red-700 hover:bg-red-800 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  {isSaving ? "Iniciando..." : "Iniciar Serviço"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}