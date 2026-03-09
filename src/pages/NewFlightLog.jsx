import React, { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { logAction } from "@/components/utils/logger";

import FlightLogForm from "../components/forms/FlightLogForm";

const STORAGE_KEY = 'newFlightLogDraft';

export default function NewFlightLog() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [nextMissionId, setNextMissionId] = useState(null);
  const [isLoadingMissionId, setIsLoadingMissionId] = useState(true);
  const [dailyService, setDailyService] = useState(null);
  const [availableAircraft, setAvailableAircraft] = useState([]);
  const [selectedAircraftBase, setSelectedAircraftBase] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHistoricalFlight, setIsHistoricalFlight] = useState(false);
  const [dailyServiceData, setDailyServiceData] = useState(null);
  const [missionInOperation, setMissionInOperation] = useState(true);
  const [filteredAircraft, setFilteredAircraft] = useState([]);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();
        if (user.flight_log_role === 'Indefinido' && user.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        navigate(createPageUrl("Dashboard"));
      }
    };
    checkAccess();
  }, [navigate]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const logs = await base44.entities.FlightLog.list('-mission_id', 1);
        const maxMissionId = logs.length > 0 && logs[0].mission_id ? Number(logs[0].mission_id) : 0;
        setNextMissionId(maxMissionId + 1);
      } catch (error) {
        console.error("Erro ao buscar dados iniciais:", error);
        setNextMissionId(1);
      } finally {
        setIsLoadingMissionId(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch daily service based on selected date
  useEffect(() => {
    const fetchDailyServiceForDate = async () => {
      try {
        // Buscar serviços para a data selecionada
        const services = await base44.entities.DailyService.filter({ date: selectedDate });
        setDailyServiceData(services);
      } catch (error) {
        console.error("Erro ao buscar serviço diário:", error);
        setDailyServiceData([]);
      }
    };
    
    if (!isLoadingMissionId) {
      fetchDailyServiceForDate();
    }
  }, [selectedDate, isLoadingMissionId]);

  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft && !isLoadingMissionId) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (nextMissionId && (!parsed.mission_id || parsed.mission_id !== nextMissionId)) {
          parsed.mission_id = nextMissionId;
        }
        setInitialData(parsed);
        
        if (parsed.date) {
          setSelectedDate(parsed.date);
        }
        
        if (parsed.aircraft && availableAircraft.length > 0) {
          const aircraftData = availableAircraft.find(a => a.aircraft === parsed.aircraft);
          if (aircraftData) setSelectedAircraftBase(aircraftData.base);
        }
      } catch (error) {
        console.error("Erro ao restaurar rascunho:", error);
      }
    } else if (nextMissionId && !savedDraft) {
      setInitialData({ mission_id: nextMissionId, date: selectedDate });
    }
  }, [nextMissionId, isLoadingMissionId, availableAircraft, selectedDate]);

  // Filter aircraft based on mission type and selected date
  useEffect(() => {
    const AIRCRAFT_OPTIONS = ["Arcanjo 01", "Falcão 08", "Falcão 03", "Falcão 04", "Falcão 12", "Falcão 13", "Falcão 14", "Falcão 15"];
    
    // Se "Missão em escala regular" está desmarcada, mostrar todas as aeronaves
    if (!missionInOperation) {
      setFilteredAircraft(AIRCRAFT_OPTIONS.map(a => ({ label: a, value: a })));
      return;
    }

    // Se "Missão em escala regular" está marcada, buscar no mapa da força da data selecionada
    if (dailyServiceData && Array.isArray(dailyServiceData)) {
      const aircraftServices = dailyServiceData.filter(s => s.type === 'aircraft');
      
      if (aircraftServices.length > 0) {
        // Encontrou aeronaves no mapa da força para esta data
        const aircraftList = aircraftServices.map(svc => ({
          label: `${svc.name} - Equipe ${svc.team}`,
          value: svc.name, 
          service: svc
        }));
        setFilteredAircraft(aircraftList);
      } else {
        // Não encontrou aeronaves para esta data
        setFilteredAircraft([]);
      }
    } else {
      setFilteredAircraft([]);
    }
  }, [dailyServiceData, missionInOperation]);

  const handleAircraftChange = (aircraft) => {
    // Logic moved to form or handled via filteredAircraft
    // But we might need to set base here if possible
    // Since we use FlightLogForm to handle change, this might be redundant or needs update
    // For now keeping it simple or empty as FlightLogForm handles most logic
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setInitialData(prev => ({ ...prev, date: newDate }));
  };

  const handleDataChange = (data) => {
    if (data.date && data.date !== selectedDate) {
      setSelectedDate(data.date);
    }
  };

  const buildVictimRecordData = (victim, flightLogId, victimIndex, dataToSave, missionId) => {
    const year = new Date(dataToSave.date).getFullYear();
    const month = new Date(dataToSave.date).toLocaleString('pt-BR', { month: 'long' });
    return {
      flight_log_id: flightLogId,
      victim_index: victimIndex,
      mission_id: missionId,
      pending_registration: false,
      data: dataToSave.date,
      base: dataToSave.base,
      ano: year,
      mes: month,
      aeronave: dataToSave.aircraft,
      comandante: dataToSave.pilot_in_command,
      copiloto: dataToSave.copilot || '',
      oat_1: dataToSave.oat_1 || '',
      osm_1: dataToSave.osm_1 || '',
      osm_2: dataToSave.osm_2 || '',
      diario_bordo_pagina: dataToSave.diario_bordo_pagina || '',
      departure_time_1: dataToSave.departure_time_1 || '',
      arrival_time_1: dataToSave.arrival_time_1 || '',
      departure_time_2: dataToSave.departure_time_2 || '',
      arrival_time_2: dataToSave.arrival_time_2 || '',
      departure_time_3: dataToSave.departure_time_3 || '',
      arrival_time_3: dataToSave.arrival_time_3 || '',
      departure_time_4: dataToSave.departure_time_4 || '',
      arrival_time_4: dataToSave.arrival_time_4 || '',
      departure_time_5: dataToSave.departure_time_5 || '',
      arrival_time_5: dataToSave.arrival_time_5 || '',
      duracao_total_min: dataToSave.flight_duration,
      nome_paciente: victim.name || '',
      sexo_paciente: victim.sex || 'NA',
      idade: victim.age || '',
      grau_afogamento: victim.drowning_grade || 'NA',
      cidade_origem: victim.origin_city || '',
      hospital_origem: victim.origin_hospital || '',
      local_pouso_origem: victim.origin_landing_site || '',
      cidade_destino: victim.destination_city || '',
      hospital_destino: victim.destination_hospital || '',
      local_pouso_destino: victim.destination_landing_site || ''
    };
  };

  const handleSave = async (logData) => {
    setIsSaving(true);
    try {
      const dataToSave = { 
        ...logData, 
        mission_id: nextMissionId, 
        base: selectedAircraftBase || logData.base,
        is_regular_scale: missionInOperation
      };

      const createdLog = await base44.entities.FlightLog.create(dataToSave);
      
      if (createdLog && createdLog.id) {
        await logAction('create', 'FlightLog', createdLog.id, dataToSave);
        
        if (logData.victims && logData.victims.length > 0) {
          for (let i = 0; i < logData.victims.length; i++) {
            const victim = logData.victims[i];
            const recordData = buildVictimRecordData(victim, createdLog.id, i, dataToSave, nextMissionId);

            if (victim.pending_victim_id) {
              // Vítima pré-detalhada pelo OSM: incorporar dados do voo e marcar como completo
              await base44.entities.VictimRecord.update(victim.pending_victim_id, {
                ...recordData,
                // Preservar dados clínicos já preenchidos pelo OSM (não sobrescrever com vazios)
              });
            } else if (victim.name) {
              // Vítima adicionada do zero pelo Piloto/OAT: criar registro completo direto
              await base44.entities.VictimRecord.create(recordData);
            }
          }
        }
      }
      
      localStorage.removeItem(STORAGE_KEY);
      alert("Registro salvo com sucesso!");
      navigate(createPageUrl("FlightLogs"));
    } catch (error) {
      console.error("Erro ao salvar registro de voo:", error);
      alert(`Erro ao salvar registro: ${error.message || 'Verifique os dados e tente novamente.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setInitialData({ mission_id: nextMissionId, date: new Date().toISOString().split('T')[0] });
    setSelectedAircraftBase('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    window.location.reload(); 
  };

  if (isLoadingMissionId) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Carregando próximo ID de missão...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Dashboard"))}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nova Missão</h1>
            <p className="text-slate-600">Registre uma nova missão de voo.</p>
            {nextMissionId && (
              <p className="text-sm text-blue-600 font-semibold mt-1">ID da Missão: {nextMissionId}</p>
            )}
          </div>
        </motion.div>

        {selectedAircraftBase && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-900">Base da Missão:</span>
                  <span className="text-blue-700 font-medium">{selectedAircraftBase}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl bg-white border-slate-200">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle>Formulário de Registro de Voo</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <FlightLogForm 
                onSave={handleSave} 
                isSaving={isSaving} 
                initialData={initialData}
                storageKey={STORAGE_KEY}
                missionId={nextMissionId}
                availableAircraft={availableAircraft}
                onAircraftChange={handleAircraftChange}
                onDataChange={handleDataChange}
                isHistoricalFlight={isHistoricalFlight}
                onDateChange={handleDateChange}
                dailyServiceData={dailyServiceData}
                missionInOperation={missionInOperation}
                setMissionInOperation={setMissionInOperation}
                filteredAircraft={filteredAircraft}
              />
              {initialData && Object.keys(initialData).length > 1 && (
                <div className="mt-6 pt-6 border-t flex justify-center">
                  <Button variant="outline" onClick={clearDraft} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Dados Salvos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}