import React, { useState, useEffect } from "react";
import { FlightLog } from "@/entities/all";
import { VictimRecord } from "@/entities/VictimRecord";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { createPageUrl } from "@/utils";
import { Plus, Gauge, Clock, ShieldQuestion, Plane, Users, Layers, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from '@/api/base44Client'; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import StatsCard from "../components/dashboard/StatsCard";
import MissionChart from "../components/dashboard/MissionChart";
import RecentFlights from "../components/dashboard/RecentFlights";

export default function Dashboard() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [logs, setLogs] = useState([]);
  const [operationLogs, setOperationLogs] = useState([]);
  const [allVictimRecords, setAllVictimRecords] = useState([]);
  const [operationStartDate, setOperationStartDate] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSettings, setAdminSettings] = useState({ operation_start_date: '', operation_base: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const checkAccessAndLoad = async () => {
  setError(null);
  try {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    setHasAccess(true);
    setIsAdmin(currentUser.role === 'admin');
    loadData();
  } catch (error) {
    console.error("Erro ao verificar acesso:", error);
    setError(error.message || "Erro de conexão");
  }
  };

  useEffect(() => {
    checkAccessAndLoad();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch settings, all logs, and victim records
      const [allLogs, settingsList, victimRecords] = await Promise.all([
        FlightLog.list('-date', 1000),
        base44.entities.OperationSettings.list(),
        VictimRecord.list('-data', 2000)
      ]);
      
      setLogs(allLogs);
      setAllVictimRecords(victimRecords);
      
      // Handle Settings
      let opStartDate = null;
      let opBase = null;

      if (settingsList.length > 0) {
        const settings = settingsList[0];
        setAdminSettings(settings);
        opStartDate = settings.operation_start_date;
        opBase = settings.operation_base;
      }

      if (opStartDate) {
        setOperationStartDate(opStartDate);
        let filteredLogs = allLogs.filter(log => log.date >= opStartDate);
        
        if (opBase) {
          // Filter by base if set (assuming logs have base)
          filteredLogs = filteredLogs.filter(log => log.base === opBase);
        }
        
        setOperationLogs(filteredLogs);
      } else {
        setOperationLogs([]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const handleSettingsChange = async (field, value) => {
    const newSettings = { ...adminSettings, [field]: value };
    setAdminSettings(newSettings);
    
    try {
      const list = await base44.entities.OperationSettings.list();
      if (list.length > 0) {
        await base44.entities.OperationSettings.update(list[0].id, { [field]: value });
      } else {
        await base44.entities.OperationSettings.create({ [field]: value });
      }
      loadData(); // Reload to apply filters
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  // Função para calcular estatísticas de um conjunto de logs
  const calculateStats = (logsList, isOperationStats = false) => {
    const totalFlightHours = logsList.reduce((sum, log) => sum + (log.flight_duration || 0), 0);
    const formattedHours = Math.floor(totalFlightHours / 60) + 'h ' + (totalFlightHours % 60) + 'min';
    
    // Para operação: contar todas as missões desde operation_start_date
    // Para totais: contar missões do mês atual
    let missionsCount;
    if (isOperationStats) {
      missionsCount = logsList.length; // Todas as missões da operação
    } else {
      const today = new Date();
      missionsCount = logsList.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear();
      }).length;
    }

    // Contagem de Vítimas Resgatadas (campo rescued_victims_count do FlightLog)
    const totalRescuedVictims = logsList.reduce((sum, log) => {
      return sum + (Number(log.rescued_victims_count) || 0);
    }, 0);

    // Contagem de Pessoas Orientadas
    const totalOrientedPeople = logsList.reduce((sum, log) => {
      return sum + (Number(log.oriented_people_count) || 0);
    }, 0);

    // Cálculo de Água Lançada (lançamentos * carga helibalde)
    const totalWaterLaunched = logsList.reduce((sum, log) => {
      const launches = Number(log.helibalde_launches) || 0;
      const load = Number(log.helibalde_load_liters) || 0;
      return sum + (launches * load);
    }, 0);

    // Contagem de Vítimas/Pacientes Atendidos (da entidade VictimRecord)
    // Apenas vítimas com pending_registration: false (registros completos)
    let relevantVictimRecords = [];
    if (isOperationStats) {
       // Filtra por data >= operationStartDate, base se houver, e pending_registration: false
       relevantVictimRecords = allVictimRecords.filter(r => {
         if (!r.data || r.pending_registration !== false) return false;
         const isAfterStart = r.data >= operationStartDate;

         let matchesBase = true;
         if (adminSettings.operation_base) {
           matchesBase = r.base === adminSettings.operation_base;
         }
         return isAfterStart && matchesBase;
       });
    } else {
       // Para dados totais, considera todos os registros completos (pending_registration: false) da aeronave
       relevantVictimRecords = allVictimRecords.filter(r => {
         if (r.pending_registration !== false) return false;
         // Filtra apenas vítimas da aeronave específica (Arcanjo 01 para totalStats)
         return r.aeronave === 'Arcanjo 01';
       });
    }
    const totalVictims = relevantVictimRecords.length;

    const totalHeliOperations = logsList.reduce((sum, log) => {
      if (log.heli_operations && Array.isArray(log.heli_operations)) {
        return sum + log.heli_operations.length;
      }
      return sum;
    }, 0);

    // Calcular missão mais frequente com contagem
    let mostFrequentMission = '-';
    let mostFrequentCount = 0;
    if (logsList.length > 0) {
      const missionCounts = logsList.reduce((acc, log) => {
        acc[log.mission_type] = (acc[log.mission_type] || 0) + 1;
        return acc;
      }, {});
      
      const maxMission = Object.keys(missionCounts).reduce((a, b) => 
        missionCounts[a] > missionCounts[b] ? a : b
      );
      
      mostFrequentMission = maxMission;
      mostFrequentCount = missionCounts[maxMission];
    }

    return {
      totalFlights: logsList.length,
      formattedHours,
      missionsCount,
      totalVictims,
      totalRescuedVictims,
      totalOrientedPeople,
      totalWaterLaunched,
      totalHeliOperations,
      mostFrequentMission,
      mostFrequentCount
    };
  };

  const arcanjo01Logs = logs.filter(log => log.aircraft === 'Arcanjo 01');
  const totalStats = calculateStats(arcanjo01Logs, false);
  const operationStats = operationStartDate ? calculateStats(operationLogs, true) : null;

  if (error) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 font-semibold">Erro ao carregar dashboard: {error}</div>
        <Button onClick={checkAccessAndLoad} variant="outline">Tentar Novamente</Button>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-slate-600">Verificando acesso...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Dashboard de Voos
            </h1>
            <p className="text-slate-600">
              Visão geral das operações da unidade aérea.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("UserProfile")}>
              <Button variant="outline" className="border-slate-300">
                <Settings className="w-4 h-4 mr-2" />
                Editar Meu Perfil
              </Button>
            </Link>
            {user?.flight_log_role === 'OSM' && (
              <Link to={createPageUrl("NewPendingVictim")}>
                <Button className="bg-green-700 hover:bg-green-800 text-white shadow-lg shadow-green-500/30">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Vítima Não Registrada
                </Button>
              </Link>
            )}
            <Link to={createPageUrl("NewFlightLog")}>
              <Button className="bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-500/30">
                <Plus className="w-4 h-4 mr-2" />
                Novo Registro de Voo
              </Button>
            </Link>
          </div>
        </motion.div>

        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                  <Settings className="w-4 h-4" />
                  Configurações da Operação (Admin)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="opDate">Data Início Operação</Label>
                    <Input 
                      id="opDate" 
                      type="date" 
                      value={adminSettings.operation_start_date || ''} 
                      onChange={(e) => handleSettingsChange('operation_start_date', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="opBase">Base da Operação</Label>
                    <Select 
                      value={adminSettings.operation_base || ''} 
                      onValueChange={(v) => handleSettingsChange('operation_base', v)}
                    >
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Litoral Resgate">Litoral Resgate</SelectItem>
                        <SelectItem value="Litoral Policial">Litoral Policial</SelectItem>
                        <SelectItem value="Curitiba Resgate">Curitiba Resgate</SelectItem>
                        <SelectItem value="Curitiba Policial">Curitiba Policial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Dados da Operação Atual - PRIMEIRO */}
        {operationStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="h-1 w-8 bg-blue-600 rounded"></div>
              Dados da Operação Atual
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatsCard 
                title="Total de Voos"
                value={operationStats.totalFlights}
                icon={Plane}
                color="blue"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Horas Voadas"
                value={operationStats.formattedHours}
                icon={Gauge}
                color="green"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Missões da Operação"
                value={operationStats.missionsCount}
                icon={Clock}
                color="orange"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Vítimas/Pacientes Atendidos"
                value={operationStats.totalVictims}
                icon={Users}
                color="red"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Vítimas Resgatadas"
                value={operationStats.totalRescuedVictims}
                icon={Users}
                color="teal"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Pessoas Orientadas"
                value={operationStats.totalOrientedPeople}
                icon={Users}
                color="cyan"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Água Lançada (Litros)"
                value={operationStats.totalWaterLaunched}
                icon={Gauge}
                color="sky"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Operações Helitransportadas"
                value={operationStats.totalHeliOperations}
                icon={Layers}
                color="purple"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Missão Mais Frequente"
                value={operationStats.mostFrequentMission}
                subtitle={`${operationStats.mostFrequentCount} voos`}
                icon={ShieldQuestion}
                color="indigo"
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Dados Totais - SEGUNDO */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <div className="h-1 w-8 bg-red-600 rounded"></div>
            Dados Totais - Arcanjo 01
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard 
              title="Total de Voos"
              value={totalStats.totalFlights}
              icon={Plane}
              color="blue"
              isLoading={isLoading}
            />
            <StatsCard 
              title="Horas Voadas"
              value={totalStats.formattedHours}
              icon={Gauge}
              color="green"
              isLoading={isLoading}
            />
            <StatsCard 
              title="Missões no Mês"
              value={totalStats.missionsCount}
              icon={Clock}
              color="orange"
              isLoading={isLoading}
            />
            <StatsCard 
              title="Vítimas/Pacientes Atendidos"
              value={totalStats.totalVictims}
              icon={Users}
              color="red"
              isLoading={isLoading}
              />
              <StatsCard 
                title="Vítimas Resgatadas"
                value={totalStats.totalRescuedVictims}
                icon={Users}
                color="teal"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Pessoas Orientadas"
                value={totalStats.totalOrientedPeople}
                icon={Users}
                color="cyan"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Água Lançada (Litros)"
                value={totalStats.totalWaterLaunched}
                icon={Gauge}
                color="sky"
                isLoading={isLoading}
              />
              <StatsCard 
                title="Operações Helitransportadas"
                value={totalStats.totalHeliOperations}
                icon={Layers}
                color="purple"
                isLoading={isLoading}
              />
            <StatsCard 
              title="Missão Mais Frequente"
              value={totalStats.mostFrequentMission}
              subtitle={`${totalStats.mostFrequentCount} voos`}
              icon={ShieldQuestion}
              color="indigo"
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <RecentFlights logs={logs.slice(0, 5)} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <MissionChart logs={logs} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}