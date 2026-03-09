import React, { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { differenceInDays } from "date-fns";
import { logAction } from "@/components/utils/logger";

import FlightLogForm from "../components/forms/FlightLogForm";

export default function EditFlightLog() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [logToEdit, setLogToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logId, setLogId] = useState(null);
  const [dailyServiceData, setDailyServiceData] = useState(null);
  const [missionInOperation, setMissionInOperation] = useState(false);

  useEffect(() => {
    const fetchLogAndCheckAccess = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const id = urlParams.get('id');
        
        if (!id) {
          console.error("ID do registro não fornecido na URL.");
          alert("ID do registro não fornecido.");
          navigate(createPageUrl("FlightLogs"));
          return;
        }
        
        setLogId(id);
        
        const [user, results] = await Promise.all([
          base44.auth.me(),
          base44.entities.FlightLog.filter({ id })
        ]);
        
        if (results.length === 0) {
          console.error("Registro não encontrado.");
          alert("Registro não encontrado.");
          navigate(createPageUrl("FlightLogs"));
          return;
        }
        
        const log = results[0];
        
        const canModify = () => {
          if (user.role === 'admin') {
            return true;
          }
          if (user.email === log.created_by) {
            const createdDate = new Date(log.created_date);
            const now = new Date();
            return differenceInDays(now, createdDate) <= 2;
          }
          return false;
        };

        if (!canModify()) {
          console.error("Acesso negado: Você não tem permissão para editar este registro ou o período de edição expirou.");
          alert("Acesso negado: Você não tem permissão para editar este registro ou o período de edição expirou.");
          navigate(createPageUrl("FlightLogs"));
          return;
        }

        setLogToEdit(log);
        setMissionInOperation(log.is_regular_scale || false);
        
        // Buscar serviços do dia para permitir seleção de aeronave
        if (log.date) {
          const services = await base44.entities.DailyService.filter({ date: log.date });
          setDailyServiceData(services);
        }
      } catch (error) {
        console.error("Erro ao buscar registro ou verificar acesso:", error);
        alert("Erro ao buscar registro ou verificar permissões. Tente novamente.");
        navigate(createPageUrl("FlightLogs"));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogAndCheckAccess();
  }, [navigate, location]);

  const buildVictimFlightData = (logData) => ({
    data: logData.date,
    base: logData.base,
    ano: new Date(logData.date).getFullYear(),
    mes: new Date(logData.date).toLocaleString('pt-BR', { month: 'long' }),
    aeronave: logData.aircraft,
    comandante: logData.pilot_in_command,
    copiloto: logData.copilot || '',
    oat_1: logData.oat_1 || '',
    osm_1: logData.osm_1 || '',
    osm_2: logData.osm_2 || '',
    diario_bordo_pagina: logData.diario_bordo_pagina || '',
    departure_time_1: logData.departure_time_1 || '',
    arrival_time_1: logData.arrival_time_1 || '',
    departure_time_2: logData.departure_time_2 || '',
    arrival_time_2: logData.arrival_time_2 || '',
    departure_time_3: logData.departure_time_3 || '',
    arrival_time_3: logData.arrival_time_3 || '',
    departure_time_4: logData.departure_time_4 || '',
    arrival_time_4: logData.arrival_time_4 || '',
    departure_time_5: logData.departure_time_5 || '',
    arrival_time_5: logData.arrival_time_5 || '',
    duracao_total_min: logData.flight_duration,
  });

  const handleSave = async (logData) => {
    if (!logId) {
      alert("Erro: ID do registro não encontrado.");
      return;
    }
    
    setIsSaving(true);
    try {
      const { id, created_date, updated_date, created_by, ...dataToUpdate } = logData;
      
      // Atualizar FlightLog
      await base44.entities.FlightLog.update(logId, dataToUpdate);
      await logAction('update', 'FlightLog', logId, dataToUpdate);

      const flightData = buildVictimFlightData(logData);
      const currentVictims = logData.victims || [];

      // Buscar VictimRecords já vinculados a este FlightLog
      const existingVictimRecords = await base44.entities.VictimRecord.filter({ flight_log_id: logId });

      for (let i = 0; i < currentVictims.length; i++) {
        const victim = currentVictims[i];
        if (!victim.name) continue;

        const victimData = {
          ...flightData,
          flight_log_id: logId,
          victim_index: i,
          mission_id: logData.mission_id,
          pending_registration: false,
          nome_paciente: victim.name,
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

        if (victim.pending_victim_id) {
          // Vítima OSM pré-detalhada: incorporar dados do voo
          await base44.entities.VictimRecord.update(victim.pending_victim_id, victimData);
          await logAction('update', 'VictimRecord', victim.pending_victim_id, { linked_to_flight: logId });
        } else {
          // Vítima do Piloto/OAT: verificar se já existe registro vinculado pelo índice
          const existingRecord = existingVictimRecords.find(vr => vr.victim_index === i);
          if (existingRecord) {
            // Atualizar registro existente com novos dados do voo
            await base44.entities.VictimRecord.update(existingRecord.id, victimData);
            await logAction('update', 'VictimRecord', existingRecord.id, { updated_from_flight_edit: logId });
          } else {
            // Nova vítima adicionada nesta edição: criar registro completo
            const created = await base44.entities.VictimRecord.create(victimData);
            await logAction('create', 'VictimRecord', created.id, victimData);
          }
        }
      }

      // Remover VictimRecords de vítimas que foram excluídas da missão
      for (const existingRecord of existingVictimRecords) {
        const stillExists = currentVictims.some((cv, idx) => {
          if (existingRecord.victim_index === idx && cv.name) return true;
          if (cv.pending_victim_id && cv.pending_victim_id === existingRecord.id) return true;
          return false;
        });
        if (!stillExists) {
          await base44.entities.VictimRecord.delete(existingRecord.id);
          await logAction('delete', 'VictimRecord', existingRecord.id, { reason: 'Removed from flight log edit' });
        }
      }
      
      alert("Registro atualizado com sucesso!");
      navigate(createPageUrl("FlightLogs"));
    } catch (error) {
      console.error("Erro ao atualizar registro de voo:", error);
      alert("Erro ao atualizar registro. Verifique os dados e tente novamente.");
    }
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }
  
  if (!logToEdit) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("FlightLogs"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Editar Registro de Voo</h1>
            <p className="text-slate-600">Modifique os detalhes da missão.</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl bg-white border-slate-200">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle>Formulário de Voo</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <FlightLogForm 
                onSave={handleSave} 
                isSaving={isSaving} 
                initialData={logToEdit}
                isHistoricalFlight={true}
                missionInOperation={missionInOperation}
                setMissionInOperation={setMissionInOperation}
                dailyServiceData={dailyServiceData}
                filteredAircraft={[
                  { label: "Arcanjo 01", value: "Arcanjo 01" },
                  { label: "Falcão 08", value: "Falcão 08" },
                  { label: "Falcão 03", value: "Falcão 03" },
                  { label: "Falcão 04", value: "Falcão 04" },
                  { label: "Falcão 12", value: "Falcão 12" },
                  { label: "Falcão 13", value: "Falcão 13" },
                  { label: "Falcão 14", value: "Falcão 14" },
                  { label: "Falcão 15", value: "Falcão 15" }
                ]}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}