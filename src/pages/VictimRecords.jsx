import React, { useState, useEffect, useCallback } from 'react';
import { FlightLog } from "@/entities/FlightLog";
import { VictimRecord } from "@/entities/VictimRecord";
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, UserPlus, Download, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { logAction } from "@/components/utils/logger";

import VictimRecordTable from '../components/data/VictimRecordTable';
import VictimRecordFilters from '../components/data/VictimRecordFilters';

// Função auxiliar para formatar datas localmente
const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

const formatLocalDate = (dateString) => {
    const date = parseLocalDate(dateString);
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export default function VictimRecords() {
    const navigate = useNavigate();
    const [pendingVictims, setPendingVictims] = useState([]);
    const [completedRecords, setCompletedRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [filters, setFilters] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const fileInputRef = React.useRef(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            setIsAdmin(user.role === 'admin');
            const allowedRoles = ["Administrador", "OSM"];
            if (!allowedRoles.includes(user.flight_log_role) && user.role !== 'admin') {
                navigate(createPageUrl("Dashboard"));
                return;
            }

            const [allFlights, detailedRecords] = await Promise.all([
                FlightLog.list('-date'),
                VictimRecord.list('-created_date')
            ]);
            
            // Separar registros completos e pendentes
            const completed = detailedRecords.filter(r => !r.pending_registration);
            const pendingPreDetailed = detailedRecords.filter(r => r.pending_registration);
            
            setCompletedRecords(completed);

            // Criar um Set de identificadores únicos de vítimas que já têm registro detalhado
            const detailedVictimIds = new Set(
                completed.map(r => `${r.flight_log_id}_${r.victim_index}`)
            );

            // Iterar sobre todos os voos e suas vítimas
            const pending = [];
            allFlights.forEach(flight => {
                if (flight.victims && Array.isArray(flight.victims) && flight.victims.length > 0) {
                    flight.victims.forEach((victim, index) => {
                        const victimId = `${flight.id}_${index}`;
                        // Se esta vítima ainda não tem registro detalhado
                        if (!detailedVictimIds.has(victimId) && victim.name) {
                            pending.push({
                                flight_log_id: flight.id,
                                victim_index: index,
                                victim_name: victim.name,
                                victim_age: victim.age,
                                victim_sex: victim.sex,
                                mission_id: flight.mission_id,
                                date: flight.date,
                                aircraft: flight.aircraft
                            });
                        }
                    });
                }
            });

            // Adicionar vítimas pré-detalhadas às pendentes
            pendingPreDetailed.forEach(preDetailed => {
                pending.push({
                    id: preDetailed.id,
                    flight_log_id: 'pending',
                    victim_index: 0,
                    victim_name: preDetailed.nome_paciente,
                    victim_age: preDetailed.idade,
                    victim_sex: preDetailed.sexo_paciente,
                    date: preDetailed.data,
                    isPending: true
                });
            });

            setPendingVictims(pending);
        } catch (error) {
            console.error("Erro ao carregar dados ou verificar acesso:", error);
            navigate(createPageUrl("Dashboard"));
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Aplicar filtros
    useEffect(() => {
        let results = completedRecords;

        // Filtro de ano
        if (filters.ano) {
            results = results.filter(r => r.ano == filters.ano);
        }

        // Filtro de mês
        if (filters.mes) {
            results = results.filter(r => r.mes === filters.mes);
        }

        // Filtros de data
        if (filters.dateFrom) {
            results = results.filter(r => {
                const recordDate = parseLocalDate(r.data);
                const filterDate = parseLocalDate(filters.dateFrom);
                return recordDate >= filterDate;
            });
        }
        if (filters.dateTo) {
            results = results.filter(r => {
                const recordDate = parseLocalDate(r.data);
                const filterDate = parseLocalDate(filters.dateTo);
                return recordDate <= filterDate;
            });
        }

        // Filtro de base
        if (filters.base) {
            results = results.filter(r => r.base === filters.base);
        }

        // Filtro de ocorrência SAMU
        if (filters.samu_occurrence) {
            results = results.filter(r => r.ocorrencia_samu && r.ocorrencia_samu.includes(filters.samu_occurrence));
        }

        // Filtro de mission_id
        if (filters.mission_id) {
            results = results.filter(r => r.mission_id == filters.mission_id);
        }

        // Filtros de transporte
        if (filters.transport_type) {
            results = results.filter(r => r.tipo_transporte === filters.transport_type);
        }
        if (filters.transport_status) {
            results = results.filter(r => r.status_transporte === filters.transport_status);
        }

        // Filtros do paciente
        if (filters.nome_paciente) {
            results = results.filter(r => r.nome_paciente && r.nome_paciente.toLowerCase().includes(filters.nome_paciente.toLowerCase()));
        }
        if (filters.sexo_paciente) {
            results = results.filter(r => r.sexo_paciente === filters.sexo_paciente);
        }
        if (filters.idade) {
            results = results.filter(r => r.idade && r.idade.includes(filters.idade));
        }
        if (filters.faixa_etaria) {
            results = results.filter(r => r.faixa_etaria === filters.faixa_etaria);
        }

        // Filtros clínicos
        if (filters.diagnostico) {
            results = results.filter(r => r.diagnostico_lesao_principal && r.diagnostico_lesao_principal.toLowerCase().includes(filters.diagnostico.toLowerCase()));
        }
        if (filters.grupo_patologias) {
            results = results.filter(r => r.grupo_patologias === filters.grupo_patologias);
        }
        if (filters.suporte_ventilatorio) {
            results = results.filter(r => r.suporte_ventilatorio === filters.suporte_ventilatorio);
        }
        if (filters.uso_sedacao) {
            results = results.filter(r => r.uso_sedacao === filters.uso_sedacao);
        }
        if (filters.uso_droga_vasoativa) {
            results = results.filter(r => r.uso_droga_vasoativa === filters.uso_droga_vasoativa);
        }
        if (filters.glasgow_min) {
            results = results.filter(r => r.glasgow >= Number(filters.glasgow_min));
        }
        if (filters.glasgow_max) {
            results = results.filter(r => r.glasgow <= Number(filters.glasgow_max));
        }
        if (filters.transfusao) {
            results = results.filter(r => r.transfusao === filters.transfusao);
        }

        // Filtros de localização
        if (filters.cidade_origem) {
            results = results.filter(r => r.cidade_origem && r.cidade_origem.toLowerCase().includes(filters.cidade_origem.toLowerCase()));
        }
        if (filters.hospital_origem) {
            results = results.filter(r => r.hospital_origem && r.hospital_origem.toLowerCase().includes(filters.hospital_origem.toLowerCase()));
        }
        if (filters.local_pouso_origem) {
            results = results.filter(r => r.local_pouso_origem && r.local_pouso_origem.toLowerCase().includes(filters.local_pouso_origem.toLowerCase()));
        }
        if (filters.cidade_destino) {
            results = results.filter(r => r.cidade_destino && r.cidade_destino.toLowerCase().includes(filters.cidade_destino.toLowerCase()));
        }
        if (filters.hospital_destino) {
            results = results.filter(r => r.hospital_destino && r.hospital_destino.toLowerCase().includes(filters.hospital_destino.toLowerCase()));
        }
        if (filters.local_pouso_destino) {
            results = results.filter(r => r.local_pouso_destino && r.local_pouso_destino.toLowerCase().includes(filters.local_pouso_destino.toLowerCase()));
        }

        // Filtros de tripulação
        if (filters.aeronave) {
            results = results.filter(r => r.aeronave === filters.aeronave);
        }
        if (filters.comandante) {
            results = results.filter(r => r.comandante && r.comandante.toLowerCase().includes(filters.comandante.toLowerCase()));
        }
        if (filters.copiloto) {
            results = results.filter(r => r.copiloto && r.copiloto.toLowerCase().includes(filters.copiloto.toLowerCase()));
        }
        if (filters.oat) {
            results = results.filter(r => r.oat_1 && r.oat_1.toLowerCase().includes(filters.oat.toLowerCase()));
        }
        if (filters.osm) {
            results = results.filter(r => (r.osm_1 && r.osm_1.toLowerCase().includes(filters.osm.toLowerCase())) || 
                                          (r.osm_2 && r.osm_2.toLowerCase().includes(filters.osm.toLowerCase())));
        }

        setFilteredRecords(results);
    }, [filters, completedRecords]);

    const handleDelete = async (recordId) => {
        try {
            await VictimRecord.delete(recordId);
            await logAction('delete', 'VictimRecord', recordId, 'Registro de vítima excluído');
            loadData();
        } catch (error) {
            console.error("Erro ao excluir registro:", error);
            alert("Ocorreu um erro ao excluir o registro.");
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        
        // Função para formatar duração em hh:mm
        const formatDuration = (minutes) => {
            if (minutes === null || minutes === undefined || isNaN(minutes)) return '';
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        };
        
        try {
            // Exportar apenas os registros filtrados
            const recordsToExport = filteredRecords;
            let headers = recordsToExport.length > 0 ? Object.keys(recordsToExport[0]) : [];
            
            // Mover grau_afogamento para o final
            headers = headers.filter(h => h !== 'grau_afogamento');
            headers.push('grau_afogamento');
            
            const csvContent = [
                headers.join(','),
                ...recordsToExport.map(rec => 
                    headers.map(header => {
                        let value = rec[header] !== undefined && rec[header] !== null ? String(rec[header]) : '';
                        
                        // Formatar duracao_total_min para hh:mm
                        if (header === 'duracao_total_min' && rec[header] !== undefined && rec[header] !== null) {
                            value = formatDuration(rec[header]);
                        }
                        
                        return `"${value.replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `registros_vitimas_filtrados_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Erro ao exportar dados:", error);
            alert("Ocorreu um erro ao gerar o arquivo CSV.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportSESA = async () => {
        setIsExporting(true);
        try {
            const sesaHeaders = ['base', 'data', 'ocorrencia_samu', 'tipo_transporte', 'status_transporte', 'motivo_qta', 'nome_paciente', 'sexo_paciente', 'idade', 'faixa_etaria', 'diagnostico_lesao_principal', 'grupo_patologias', 'cidade_origem', 'hospital_origem', 'local_pouso_origem', 'cidade_destino', 'hospital_destino', 'local_pouso_destino', 'departure_time_1', 'arrival_time_1', 'departure_time_2', 'arrival_time_2', 'departure_time_3', 'arrival_time_3', 'departure_time_4', 'arrival_time_4', 'departure_time_5', 'arrival_time_5', 'duracao_total_min', 'osm_1', 'osm_2', 'comandante', 'copiloto', 'oat_1', 'aeronave', 'diario_bordo_pagina', 'observacoes', 'suporte_ventilatorio', 'uso_sedacao', 'uso_droga_vasoativa', 'glasgow', 'transfusao', 'transfusao_bolsas'];

            const csvContent = [
                sesaHeaders.join(','),
                ...filteredRecords.map(rec => {
                    // Concatenar diagnóstico principal e secundária com hífen
                    const diagnostico = [rec.diagnostico_principal, rec.diagnostico_lesao_secundaria]
                        .filter(d => d && d.trim())
                        .join(' - ');

                    return sesaHeaders.map(header => {
                        let value = '';
                        if (header === 'diagnostico_lesao_principal') {
                            value = diagnostico;
                        } else {
                            value = rec[header] !== undefined && rec[header] !== null ? String(rec[header]) : '';
                        }
                        return `"${value.replace(/"/g, '""')}"`;
                    }).join(',');
                })
            ].join('\n');

            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `export_sesa_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Erro ao exportar para SESA:", error);
            alert("Erro ao exportar para SESA.");
        } finally {
            setIsExporting(false);
        }
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

                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const dataToImport = [];

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    const rowValues = [];
                    let currentVal = '';
                    let inQuotes = false;
                    
                    for (let char of lines[i]) {
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            rowValues.push(currentVal.trim().replace(/^"|"$/g, ''));
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

                const parsedData = dataToImport.map(row => {
                    const newRow = { ...row };
                    // Number conversion
                    ['victim_index', 'mission_id', 'ano', 'duracao_total_min', 'glasgow', 'transfusao_bolsas', 'pressao_arterial_sistolica', 'frequencia_cardiaca', 'indice_choque'].forEach(field => {
                        if (newRow[field]) newRow[field] = Number(newRow[field]);
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

                await Promise.all(parsedData.map(d => VictimRecord.create(d)));
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
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Vítimas/Pacientes Atendidos</h1>
                        <p className="text-slate-600">Detalhe o atendimento das vítimas e gerencie os registros completos.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => navigate(createPageUrl("NewPendingVictim"))}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Adicionar Vítima Não Registrada
                        </Button>
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
                                <Button onClick={handleExport} disabled={isExporting || filteredRecords.length === 0} variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    {isExporting ? "Exportando..." : `Exportar Filtrados (${filteredRecords.length})`}
                                </Button>
                                <Button onClick={handleExportSESA} disabled={isExporting || filteredRecords.length === 0} className="bg-green-600 hover:bg-green-700">
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar para SESA
                                </Button>
                            </>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="shadow-xl bg-white border-slate-200 mb-8">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-orange-600" />
                                Vítimas Aguardando Detalhamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                           {isLoading ? (
                                <div className="p-6 text-center text-slate-500">Carregando...</div>
                           ) : pendingVictims.length > 0 ? (
                               <div className="divide-y divide-slate-100">
                                   {pendingVictims.map((victim, idx) => (
                                       <div key={`${victim.flight_log_id}_${victim.victim_index}_${idx}`} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                           <div>
                                               <p className="font-semibold">{victim.victim_name}</p>
                                               <p className="text-sm text-slate-500">
                                                   {victim.isPending ? (
                                                       <>
                                                           <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs mr-2">Pré-detalhada</span>
                                                           {formatLocalDate(victim.date)}
                                                       </>
                                                   ) : (
                                                       <>
                                                           Missão {victim.mission_id} - {formatLocalDate(victim.date)}
                                                       </>
                                                   )}
                                                   {victim.victim_age && ` - ${victim.victim_age} anos`}
                                                   {victim.victim_sex && victim.victim_sex !== 'NA' && ` - ${victim.victim_sex === 'M' ? 'Masculino' : 'Feminino'}`}
                                                   </p>
                                                   {!victim.isPending && victim.aircraft && (
                                                   <p className="text-xs text-slate-400">
                                                       Aeronave: {victim.aircraft}
                                                   </p>
                                                   )}
                                                   </div>
                                                   {!victim.isPending ? (
                                                   <Button 
                                                   onClick={() => navigate(createPageUrl("NewVictimRecord") + `?flight_log_id=${victim.flight_log_id}&victim_index=${victim.victim_index}`)}
                                                   >
                                                   Detalhar Atendimento
                                                   </Button>
                                                   ) : (
                                                   <div className="flex gap-2">
                                                   <Button 
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => navigate(createPageUrl("EditVictimRecord") + `?id=${victim.id}`)}
                                                   >
                                                       <Edit className="w-4 h-4 mr-1" />
                                                       Editar
                                                   </Button>
                                                   <Button 
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => handleDelete(victim.id)}
                                                       className="text-red-600 hover:text-red-800"
                                                   >
                                                       <Trash2 className="w-4 h-4 mr-1" />
                                                       Excluir
                                                   </Button>
                                                   </div>
                                                   )}
                                                   </div>
                                   ))}
                               </div>
                           ) : (
                               <div className="p-6 text-center text-slate-500">Nenhuma vítima aguardando detalhamento.</div>
                           )}
                        </CardContent>
                    </Card>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <VictimRecordFilters onFilterChange={setFilters} />
                    
                    <Card className="shadow-xl bg-white border-slate-200">
                         <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2 justify-between">
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5 text-green-600" />
                                    Registros de Atendimento Completos
                                </div>
                                <span className="text-sm text-slate-500 font-normal">
                                    {filteredRecords.length} de {completedRecords.length} registros
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <VictimRecordTable records={filteredRecords} isLoading={isLoading} onDelete={handleDelete} />
                        </CardContent>
                    </Card>
                </motion.div>

            </div>
        </div>
    );
}