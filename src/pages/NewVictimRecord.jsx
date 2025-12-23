import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logAction } from "@/components/utils/logger";

import VictimRecordForm from '../components/forms/VictimRecordForm';

function getAgeRange(age) {
    if (age === null || age === undefined || age === '') return "sem registo de idade";
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) return "sem registo de idade";
    if (age.toString().toLowerCase().includes('dias') || age.toString().toLowerCase().includes('dia')) {
        return "RN (0-89 dias)";
    }
    if (ageNum < 3) return "Lactante (90 dias a 2 anos)";
    if (ageNum >= 3 && ageNum <= 18) return "Pediátrico/Adolecente (3 a 18 anos)";
    if (ageNum >= 19 && ageNum <= 59) return "Adulto (19 a 59 anos)";
    if (ageNum >= 60) return "Idoso (60 anos +)";
    return "sem registo de idade";
}

export default function NewVictimRecord() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSaving, setIsSaving] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const flightLogId = urlParams.get('flight_log_id');
        const victimIndex = urlParams.get('victim_index');

        if (!flightLogId || victimIndex === null) {
            alert("Informações da vítima não fornecidas.");
            navigate(createPageUrl("VictimRecords"));
            return;
        }

        const getWarName = async (fullName) => {
            if (!fullName) return null;
            try {
                const tripulantes = await base44.entities.Tripulante.list();
                const tripulante = tripulantes.find(t => 
                    t.nome_de_guerra === fullName || 
                    t.nome_completo === fullName
                );
                return tripulante?.nome_de_guerra || fullName;
            } catch(error) {
                console.error("Error resolving war name for:", fullName, error);
                return fullName;
            }
        };

        const loadData = async () => {
            try {
                const [user, flightLogs] = await Promise.all([
                    base44.auth.me(),
                    base44.entities.FlightLog.filter({ id: flightLogId })
                ]);

                const allowedRoles = ["Administrador", "OSM"];
                if (!allowedRoles.includes(user.flight_log_role) && user.role !== 'admin') {
                    navigate(createPageUrl("Dashboard"));
                    return;
                }

                if (flightLogs.length === 0) {
                    alert("Registro de voo não encontrado.");
                    navigate(createPageUrl("VictimRecords"));
                    return;
                }
                
                const flight = flightLogs[0];
                const victimIdx = parseInt(victimIndex);
                
                if (!flight.victims || !Array.isArray(flight.victims) || victimIdx >= flight.victims.length) {
                    alert("Vítima não encontrada neste registro de voo.");
                    navigate(createPageUrl("VictimRecords"));
                    return;
                }
                
                const victim = flight.victims[victimIdx];
                const now = new Date();

                // Parse the flight date correctly to avoid timezone issues
                const flightDate = flight.date; // Already in YYYY-MM-DD format
                
                const prefilledData = {
                    flight_log_id: flight.id,
                    victim_index: victimIdx,
                    mission_id: flight.mission_id,
                    ano: now.getFullYear(),
                    mes: format(now, 'MMMM', { locale: ptBR }),
                    base: flight.base || "Operação Verão",
                    data: flightDate,
                    ocorrencia_samu: flight.sade_occurrence_number || '',
                    tipo_transporte: flight.mission_type,
                    status_transporte: "Completo",
                    motivo_qta: 'NA',
                    nome_paciente: victim.name || '',
                    sexo_paciente: victim.sex || 'NA',
                    idade: victim.age || '',
                    faixa_etaria: getAgeRange(victim.age),
                    diagnostico_lesao_principal: '',
                    grupo_patologias: '',
                    grau_afogamento: victim.drowning_grade || 'NA',
                    cidade_origem: victim.origin_city || '',
                    hospital_origem: victim.origin_hospital || '',
                    local_pouso_origem: victim.origin_landing_site || '',
                    cidade_destino: victim.destination_city || '',
                    hospital_destino: victim.destination_hospital || '',
                    local_pouso_destino: victim.destination_landing_site || '',
                    departure_time_1: flight.departure_time_1 || '',
                    arrival_time_1: flight.arrival_time_1 || '',
                    departure_time_2: flight.departure_time_2 || '',
                    arrival_time_2: flight.arrival_time_2 || '',
                    departure_time_3: flight.departure_time_3 || '',
                    arrival_time_3: flight.arrival_time_3 || '',
                    departure_time_4: flight.departure_time_4 || '',
                    arrival_time_4: flight.arrival_time_4 || '',
                    departure_time_5: flight.departure_time_5 || '',
                    arrival_time_5: flight.arrival_time_5 || '',
                    duracao_total_min: flight.flight_duration,
                    
                    osm_1: await getWarName(flight.osm_1) || flight.osm_1,
                    osm_2: await getWarName(flight.osm_2) || flight.osm_2,
                    comandante: await getWarName(flight.pilot_in_command) || flight.pilot_in_command,
                    copiloto: await getWarName(flight.copilot) || flight.copilot,
                    oat_1: await getWarName(flight.oat_1) || flight.oat_1,
                    
                    aeronave: flight.aircraft,
                    diario_bordo_pagina: flight.diario_bordo_pagina || '',
                    observacoes: flight.remarks || '',
                    suporte_ventilatorio: '',
                    uso_sedacao: '',
                    uso_droga_vasoativa: '',
                    glasgow: '',
                    transfusao: 'NA',
                    transfusao_bolsas: 0,
                    pressao_arterial_sistolica: '',
                    frequencia_cardiaca: '',
                    indice_choque: ''
                };
                setInitialData(prefilledData);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                navigate(createPageUrl("VictimRecords"));
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    const handleSave = async (data) => {
        setIsSaving(true);
        try {
            const createdRecord = await base44.entities.VictimRecord.create(data);
            if (createdRecord && createdRecord.id) {
                await logAction('create', 'VictimRecord', createdRecord.id, data);
            }
            alert("Registro de atendimento da vítima salvo com sucesso!");
            navigate(createPageUrl("VictimRecords"));
        } catch (error) {
            console.error("Erro ao salvar registro da vítima:", error);
            alert("Erro ao salvar. Verifique os dados e tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen p-8 text-center">Carregando dados da missão...</div>;
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-slate-50">
            <div className="max-w-5xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("VictimRecords"))}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Detalhar Atendimento da Vítima</h1>
                        <p className="text-slate-600">Complemente as informações clínicas do atendimento.</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="shadow-xl bg-white border-slate-200">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>Formulário de Atendimento Aeromédico</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {initialData ? (
                                <VictimRecordForm initialData={initialData} onSave={handleSave} isSaving={isSaving} />
                            ) : (
                                <p>Carregando formulário...</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}