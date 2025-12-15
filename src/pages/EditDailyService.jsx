import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Plus, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { differenceInDays, parseISO } from 'date-fns';

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
            userList.map(user => {
              const displayName = user.trigrama && user.nome_de_guerra 
                ? `${user.trigrama} - ${user.nome_de_guerra}`.trim()
                : user.nome_de_guerra || user.nome_completo || user.full_name;
              const selectValue = user.nome_de_guerra || user.nome_completo || user.full_name;
              
              return (
                <SelectItem key={user.id} value={selectValue}>
                  {displayName}
                </SelectItem>
              );
            })
          ) : (
            <SelectItem value="_empty_" disabled>Nenhum usuário disponível</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default function EditDailyService() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [serviceData, setServiceData] = useState(null);
  const [serviceId, setServiceId] = useState(null);
  const [dailyFlights, setDailyFlights] = useState([]);
  const [dailyAbastecimentos, setDailyAbastecimentos] = useState([]);
  const [allTimeLogs, setAllTimeLogs] = useState([]);

  useEffect(() => {
    const fetchServiceAndCheckAccess = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const id = urlParams.get('id');
        
        if (!id) {
          console.error("ID do registro não fornecido na URL.");
          alert("ID do registro não fornecido.");
          navigate(createPageUrl("ServiceRecords"));
          return;
        }
        
        setServiceId(id);
        
        const [currentUser, tripulantesList, results, allLogs] = await Promise.all([
          base44.auth.me(),
          base44.entities.Tripulante.list(),
          base44.entities.DailyService.filter({ id }),
          base44.entities.FlightLog.list()
        ]);
        
        // Converter tripulantes para o formato esperado
        const userList = tripulantesList.map(t => ({
          id: t.id,
          email: t.user_email,
          full_name: t.nome_completo,
          nome_completo: t.nome_completo,
          nome_de_guerra: t.nome_de_guerra,
          trigrama: t.trigrama,
          flight_log_role: t.funcao === 'Visitante' ? 'Indefinido' : t.funcao
        }));
        
        if (results.length === 0) {
          console.error("Registro não encontrado.");
          alert("Registro não encontrado.");
          navigate(createPageUrl("ServiceRecords"));
          return;
        }
        
        const service = results[0];
        
        const canModify = () => {
          if (currentUser.role === 'admin') {
            return true;
          }
          if (currentUser.email === service.created_by) {
            const createdDate = parseISO(service.created_date);
            const now = new Date();
            return differenceInDays(now, createdDate) <= 2;
          }
          return false;
        };

        if (!canModify()) {
          console.error("Acesso negado: Você não tem permissão para editar este registro ou o período de edição expirou.");
          alert("Acesso negado: Você não tem permissão para editar este registro ou o período de edição expirou.");
          navigate(createPageUrl("ServiceRecords"));
          return;
        }

        let aircraftServices = service.aircraft_services;
        if (!Array.isArray(aircraftServices) || aircraftServices.length === 0) {
          aircraftServices = [{
            aircraft: service.aircraft || '',
            base: service.base || '',
            service_start_time: service.service_start_time || '07:30',
            service_end_time: service.service_end_time || '18:30',
            commander: service.commander || '',
            copilot: service.copilot || '',
            oat_1: service.oat_1 || '',
            oat_2: service.oat_2 || '',
            oat_3: service.oat_3 || '',
            osm_1: service.osm_1 || '',
            osm_2: service.osm_2 || '',
            tasa: service.tasa || ''
          }];
        }

        const normalizedService = {
          ...service,
          aircraft_services: aircraftServices,
          service_notes: service.service_notes || 'Sem alterações',
          maintenance_notes: service.maintenance_notes || 'Sem alterações',
          load_map_notes: service.load_map_notes || 'Sem alterações',
          general_notes: service.general_notes || 'Sem alterações'
        };
        delete normalizedService.base;

        setUsers(userList);
        setServiceData(normalizedService);
        setAllTimeLogs(allLogs);
        
        // Load flights and abastecimentos for this date
        const [flights, abastecimentos] = await Promise.all([
          base44.entities.FlightLog.filter({ date: service.date }),
          base44.entities.Abastecimento.filter({ date: service.date })
        ]);
        setDailyFlights(flights);
        setDailyAbastecimentos(abastecimentos);
      } catch (error) {
        console.error("Erro ao buscar registro ou verificar acesso:", error);
        alert("Erro ao buscar registro ou verificar permissões. Tente novamente.");
        navigate(createPageUrl("ServiceRecords"));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServiceAndCheckAccess();
  }, [navigate, location]);

  const userGroups = useMemo(() => {
    const pilots = users.filter(u => ['Piloto', 'Administrador'].includes(u.flight_log_role));
    const oats = users.filter(u => u.flight_log_role === 'OAT');
    const osms = users.filter(u => u.flight_log_role === 'OSM');
    const tasas = users.filter(u => u.flight_log_role === 'TASA');
    return { pilots, oats, osms, tasas };
  }, [users]);

  const handleChange = (field, value) => {
    setServiceData({ ...serviceData, [field]: value });
  };

  const handleAircraftServiceChange = (index, field, value) => {
    const newServices = [...serviceData.aircraft_services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServiceData({ ...serviceData, aircraft_services: newServices });
  };

  const addAircraftService = () => {
    setServiceData({
      ...serviceData,
      aircraft_services: [...serviceData.aircraft_services, { ...emptyAircraftService }]
    });
  };

  const removeAircraftService = (index) => {
    if (serviceData.aircraft_services.length > 1) {
      const newServices = serviceData.aircraft_services.filter((_, i) => i !== index);
      setServiceData({ ...serviceData, aircraft_services: newServices });
    }
  };

  const handleSave = async () => {
    if (!serviceId) {
      alert("Erro: ID do registro não encontrado.");
      return;
    }
    
    // Validate that each aircraft service has a base selected
    if (serviceData.aircraft_services.some(svc => !svc.base)) {
      alert("Por favor, selecione a Base para todas as aeronaves.");
      return;
    }
    
    setIsSaving(true);
    try {
      // Destructure 'base' out as it's no longer a top-level field
      const { id, created_date, updated_date, created_by, base, ...dataToUpdate } = serviceData;
      
      // Converter valores numéricos, tratando strings vazias como null
      if (dataToUpdate.initial_fuel_supply_liters !== null && dataToUpdate.initial_fuel_supply_liters !== undefined) {
        dataToUpdate.initial_fuel_supply_liters = dataToUpdate.initial_fuel_supply_liters === '' ? null : Number(dataToUpdate.initial_fuel_supply_liters);
      }
      if (dataToUpdate.drained_fuel_liters !== null && dataToUpdate.drained_fuel_liters !== undefined) {
        dataToUpdate.drained_fuel_liters = dataToUpdate.drained_fuel_liters === '' ? null : Number(dataToUpdate.drained_fuel_liters);
      }
      if (dataToUpdate.final_fuel_supply_liters !== null && dataToUpdate.final_fuel_supply_liters !== undefined) {
        dataToUpdate.final_fuel_supply_liters = dataToUpdate.final_fuel_supply_liters === '' ? null : Number(dataToUpdate.final_fuel_supply_liters);
      }
      
      await base44.entities.DailyService.update(serviceId, dataToUpdate);
      alert("Registro atualizado com sucesso!");
      navigate(createPageUrl("ServiceRecords"));
    } catch (error) {
      console.error("Erro ao atualizar registro de serviço:", error);
      alert("Erro ao atualizar registro. Verifique os dados e tente novamente.");
    }
    setIsSaving(false);
  };

  const generateServicePDF = async () => {
    if (!serviceData) return;
    
    const formatDuration = (minutes) => {
      if (minutes === null || minutes === undefined) return '0h 0min';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    };

    const calculateStatsByPeriod = (startDate) => {
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
    };

    const hoursTodayByAircraft = dailyFlights.reduce((acc, log) => {
      acc[log.aircraft] = (acc[log.aircraft] || 0) + log.flight_duration;
      return acc;
    }, {});

    const periodStats = serviceData.service_period_start_date 
      ? calculateStatsByPeriod(serviceData.service_period_start_date)
      : { hoursByAircraft: {}, missionsByType: {} };

    const operationStats = serviceData.operation_start_date
      ? calculateStatsByPeriod(serviceData.operation_start_date)
      : { hoursByAircraft: {}, missionsByType: {} };

    const finalFuelForPdf = Number(serviceData.final_fuel_supply_liters) || 0;

    const dailyHoursEvolution = {};
    if (serviceData.operation_start_date) {
      allTimeLogs.filter(log => log.date >= serviceData.operation_start_date).forEach(log => {
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
    
    const missionTypeLabels = Object.keys(operationStats.missionsByType);
    const missionTypeValues = Object.values(operationStats.missionsByType);

    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Serviço Diário - ${format(new Date(serviceData.date + 'T12:00:00'), 'dd/MM/yyyy')}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
          @media print {
            body { margin: 0; }
            .page-break { page-break-after: always; }
            @page { 
              margin: 12mm;
              size: A4;
            }
          }
          
          * {
            box-sizing: border-box;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
            margin: 0;
            padding: 20px;
            background: #f8fafc;
            font-size: 10pt;
            line-height: 1.5;
            color: #1e293b;
          }
          
          .cover-page {
            background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
            text-align: center;
            padding: 60px 40px;
            min-height: 90vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          }
          
          .cover-title {
            font-size: 2.5em;
            font-weight: 800;
            color: white;
            margin-bottom: 40px;
            text-shadow: 0 4px 12px rgba(0,0,0,0.3);
            letter-spacing: -0.5px;
          }
          
          .cover-date {
            font-size: 2em;
            color: #e2e8f0;
            margin: 30px 0;
            font-weight: 600;
          }
          
          .cover-info {
            font-size: 1.1em;
            color: #cbd5e1;
            margin: 15px auto;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 600px;
          }
          
          h1 { 
            color: #1e293b;
            background: linear-gradient(90deg, #b91c1c, #dc2626);
            color: white;
            padding: 16px 20px;
            margin: 30px 0 20px 0;
            font-size: 1.5em;
            font-weight: 700;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(185, 28, 28, 0.2);
          }
          
          h2 { 
            color: #1e293b;
            margin: 25px 0 15px 0;
            padding: 12px 16px;
            background: #f1f5f9;
            border-left: 5px solid #b91c1c;
            border-radius: 6px;
            font-size: 1.2em;
            font-weight: 600;
          }
          
          h3 { 
            color: #475569; 
            margin: 18px 0 12px 0; 
            font-size: 1.05em;
            font-weight: 600;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
          }
          
          table { 
            width: 100%; 
            border-collapse: separate;
            border-spacing: 0;
            margin: 16px 0;
            font-size: 9.5pt;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-radius: 8px;
            overflow: hidden;
          }
          
          th, td { 
            border: none;
            padding: 12px 14px; 
            text-align: left; 
          }
          
          th { 
            background: linear-gradient(180deg, #1e293b, #334155);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 9pt;
          }
          
          tbody tr {
            background: white;
            border-bottom: 1px solid #e2e8f0;
          }
          
          tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          
          tbody tr:hover {
            background: #f1f5f9;
          }
          
          tbody tr:last-child {
            border-bottom: none;
          }
          
          .section { 
            background: white;
            padding: 24px;
            margin: 20px 0;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            page-break-inside: avoid;
          }
          
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 14px;
            margin: 16px 0;
          }
          
          .info-item { 
            padding: 14px 16px; 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-left: 4px solid #b91c1c;
            border-radius: 8px;
            font-size: 9.5pt;
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            transition: transform 0.2s;
          }
          
          .info-item strong {
            color: #475569;
            display: block;
            margin-bottom: 4px;
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .aircraft-section { 
            margin: 20px 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          }
          
          .aircraft-section h3 {
            background: linear-gradient(90deg, #1e293b, #475569);
            color: white;
            padding: 10px 16px;
            margin: -20px -20px 16px -20px;
            border-radius: 10px 10px 0 0;
            font-size: 1.1em;
          }
          
          .stats-container {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin: 20px 0;
            align-items: start;
          }
          
          .chart-container {
            background: white;
            padding: 16px;
            border-radius: 10px;
            border: 2px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            max-width: 280px;
          }
          
          .stats-table {
            margin: 12px 0;
            font-size: 9.5pt;
            background: white;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .stats-table tr {
            border-bottom: 1px solid #f1f5f9;
          }
          
          .stats-table tr:last-child {
            border-bottom: none;
          }
          
          .stats-table td {
            padding: 10px 14px;
          }
          
          .stats-table td:first-child {
            font-weight: 600;
            color: #475569;
            background: #f8fafc;
          }
          
          .stats-table td:last-child {
            text-align: right;
            color: #1e293b;
            font-weight: 600;
            background: white;
          }
          
          .notes-box {
            padding: 16px; 
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            border-radius: 8px; 
            white-space: pre-wrap;
            font-size: 9.5pt;
            line-height: 1.6;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
          }
        </style>
      </head>
      <body>
        <div class="cover-page page-break">
          <div class="cover-title">Relatório de Serviço Diário</div>
          <div class="cover-date">${format(new Date(serviceData.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
          
          ${serviceData.operation_start_date ? `
            <div class="cover-info">
              <strong>Período da Operação:</strong><br>
              ${format(new Date(serviceData.operation_start_date + 'T12:00:00'), 'dd/MM/yyyy')} até ${format(new Date(serviceData.date + 'T12:00:00'), 'dd/MM/yyyy')}
            </div>
            <div class="cover-info">
              <strong>Período de Serviço da Equipe:</strong><br>
              ${format(new Date(serviceData.service_period_start_date + 'T12:00:00'), 'dd/MM/yyyy')} até ${format(new Date(serviceData.date + 'T12:00:00'), 'dd/MM/yyyy')}
            </div>
          ` : ''}
        </div>
        
        <div class="section">
          <h1>Informações do Serviço</h1>
          
          <h2>Aeronaves e Equipes</h2>
          ${(serviceData.aircraft_services || []).map((svc, idx) => `
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
            <tr><td>Inicial UAA</td><td>${serviceData.initial_fuel_supply_liters ?? 'N/A'} L</td></tr>
            <tr><td>Drenado</td><td>${serviceData.drained_fuel_liters ?? 'N/A'} L</td></tr>
            <tr><td>Final UAA</td><td>${finalFuelForPdf.toFixed(2)} L</td></tr>
          </table>
          
          ${serviceData.service_notes && serviceData.service_notes !== 'Sem alterações' ? `
            <h3>Observações Iniciais do Serviço</h3>
            <div class="notes-box">
              ${serviceData.service_notes}
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
            ${Object.entries(hoursTodayByAircraft).map(([ac, dur]) => `
              <tr><td>${ac}</td><td>${formatDuration(dur)}</td></tr>
            `).join('')}
          </table>
          
          ${serviceData.service_period_start_date ? `
            <h2>Período de Serviço</h2>
            <table class="stats-table">
              ${Object.entries(periodStats.hoursByAircraft).map(([ac, dur]) => `
                <tr><td>${ac}</td><td>${formatDuration(dur)}</td></tr>
              `).join('')}
            </table>
          ` : ''}
          
          ${serviceData.operation_start_date ? `
            <h2>Operação Completa</h2>
            
            <div class="stats-container">
              <div>
                <h3>Horas por Aeronave</h3>
                <table class="stats-table">
                  ${Object.entries(operationStats.hoursByAircraft).map(([ac, dur]) => `
                    <tr><td>${ac}</td><td>${formatDuration(dur)}</td></tr>
                  `).join('')}
                </table>
                
                <h3>Missões por Natureza</h3>
                <table class="stats-table">
                  ${Object.entries(operationStats.missionsByType).map(([type, count]) => `
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
            <tr><td>Manutenção</td><td>${serviceData.maintenance_notes}</td></tr>
            <tr><td>Mapa-Carga</td><td>${serviceData.load_map_notes}</td></tr>
            <tr><td>Gerais</td><td>${serviceData.general_notes}</td></tr>
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }
  
  if (!serviceData) {
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
            onClick={() => navigate(createPageUrl("ServiceRecords"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Editar Serviço Diário</h1>
            <p className="text-slate-600">Modifique os detalhes do serviço.</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl bg-white border-slate-200">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle>Formulário de Serviço</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg text-slate-800">Informações Básicas</h3>
                <div className="grid md:grid-cols-1 gap-6">
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={serviceData.date} 
                      onChange={(e) => handleChange('date', e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-slate-800">
                    Aeronaves e Equipes ({serviceData.aircraft_services.length})
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
                
                {serviceData.aircraft_services.map((svc, index) => (
                  <Card key={index} className="border-slate-200">
                    <CardHeader className="pb-3 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Aeronave {index + 1}</CardTitle>
                        {serviceData.aircraft_services.length > 1 && (
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
                  <div>
                    <Label htmlFor="initial_fuel_supply_liters">Combustível na UAA no início do serviço (L)</Label>
                    <Input 
                      id="initial_fuel_supply_liters" 
                      type="number" 
                      value={serviceData.initial_fuel_supply_liters || ''} 
                      onChange={(e) => handleChange('initial_fuel_supply_liters', e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="drained_fuel_liters">Combustível Drenado (L)</Label>
                    <Input 
                      id="drained_fuel_liters" 
                      type="number" 
                      value={serviceData.drained_fuel_liters || ''} 
                      onChange={(e) => handleChange('drained_fuel_liters', e.target.value)} 
                    />
                  </div>
                  {serviceData.final_fuel_supply_liters !== null && serviceData.final_fuel_supply_liters !== undefined && (
                    <div>
                      <Label htmlFor="final_fuel_supply_liters">Combustível Final na UAA (L)</Label>
                      <Input 
                        id="final_fuel_supply_liters" 
                        type="number" 
                        value={serviceData.final_fuel_supply_liters || ''} 
                        onChange={(e) => handleChange('final_fuel_supply_liters', e.target.value)} 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_notes">Alterações e Demandas no Início do Serviço</Label>
                <Textarea 
                  id="service_notes" 
                  value={serviceData.service_notes} 
                  onChange={(e) => handleChange('service_notes', e.target.value)} 
                  className="h-32"
                />
              </div>

              {serviceData.status === 'completed' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_notes">Manutenção das Aeronaves</Label>
                    <Textarea 
                      id="maintenance_notes" 
                      value={serviceData.maintenance_notes} 
                      onChange={(e) => handleChange('maintenance_notes', e.target.value)} 
                      className="h-24"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="load_map_notes">Alterações de Mapa-Carga</Label>
                    <Textarea 
                      id="load_map_notes" 
                      value={serviceData.load_map_notes} 
                      onChange={(e) => handleChange('load_map_notes', e.target.value)} 
                      className="h-24"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="general_notes">Alterações de Caráter Geral</Label>
                    <Textarea 
                      id="general_notes" 
                      value={serviceData.general_notes} 
                      onChange={(e) => handleChange('general_notes', e.target.value)} 
                      className="h-24"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-between pt-4">
                {serviceData.status === 'completed' && (
                  <Button 
                    type="button" 
                    onClick={generateServicePDF}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Emitir Relatório PDF
                  </Button>
                )}
                <Button 
                  type="button" 
                  onClick={handleSave} 
                  disabled={isSaving || serviceData.aircraft_services.some(svc => !svc.base)}
                  className={`${serviceData.status === 'completed' ? '' : 'w-full md:w-auto'} bg-red-700 hover:bg-red-800 text-white`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}