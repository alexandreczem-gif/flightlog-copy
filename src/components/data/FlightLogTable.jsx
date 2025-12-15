import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Função para formatar data corretamente
const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year.slice(2)}`;
};

export default function FlightLogTable({ logs, isLoading, onDelete }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportLog, setReportLog] = useState(null);
  const [reportResponsible, setReportResponsible] = useState('');
  const [reportCommander, setReportCommander] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Usuário não autenticado:", e);
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  const canModify = (log) => {
    if (!currentUser || !log || !log.id) return false;

    if (currentUser.role === 'admin') return true;

    if (currentUser.email === log.created_by) {
      const today = new Date();
      const logCreationDate = parseISO(log.created_date);

      if (isNaN(logCreationDate.getTime())) {
        console.warn("Invalid created_date found in log:", log.created_date);
        return false;
      }

      return differenceInDays(today, logCreationDate) <= 2;
    }
    return false;
  };
  
  const handleDeleteClick = (log) => {
    setLogToDelete(log);
    setShowDeleteConfirm(true);
  };

  const handleReportClick = (log) => {
    setReportLog(log);
    setReportResponsible('');
    setReportCommander('');
    setShowReportDialog(true);
  };

  const generateMissionReport = async () => {
    if (!reportLog || !reportResponsible || !reportCommander) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const includeVictimDetails = window.confirm(
      'Deseja incluir o detalhamento completo das vítimas no relatório?\n\n' +
      'Clique em "OK" para incluir todos os detalhes médicos.\n' +
      'Clique em "Cancelar" para incluir apenas informações básicas.'
    );

    setIsGeneratingReport(true);

    try {
      let victimRecords = [];
      if (includeVictimDetails && reportLog.victims && reportLog.victims.length > 0) {
        const allVictimRecords = await base44.entities.VictimRecord.list();
        victimRecords = allVictimRecords.filter(vr => vr.flight_log_id === reportLog.id);
      }

      const formatDuration = (minutes) => {
        if (!minutes) return '0h 0min';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}min`;
      };

      const formatDateReport = (dateStr) => {
        if (!dateStr) return '';
        try {
          return format(new Date(dateStr + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        } catch {
          return dateStr;
        }
      };

      const formatTime = (timeStr) => {
        if (!timeStr) return '';
        // Converter UTC para Horário de Brasília (UTC-3)
        const [hours, minutes] = timeStr.split(':').map(Number);
        let brasiliaHours = hours - 3;
        if (brasiliaHours < 0) brasiliaHours += 24;
        return `${String(brasiliaHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      };

      const stages = [];
      for (let i = 1; i <= 6; i++) {
        const depKey = `departure_time_${i}`;
        const arrKey = `arrival_time_${i}`;
        const origKey = `origin_${i}`;
        const destKey = `destination_${i}`;
        const origLatKey = `origin_lat_${i}`;
        const origLonKey = `origin_lon_${i}`;
        const destLatKey = `destination_lat_${i}`;
        const destLonKey = `destination_lon_${i}`;
        
        if (reportLog[depKey] && reportLog[arrKey]) {
          stages.push({
            num: i,
            departure: formatTime(reportLog[depKey]),
            arrival: formatTime(reportLog[arrKey]),
            origin: reportLog[origKey] || '',
            destination: reportLog[destKey] || '',
            origin_lat: reportLog[origLatKey] || '',
            origin_lon: reportLog[origLonKey] || '',
            dest_lat: reportLog[destLatKey] || '',
            dest_lon: reportLog[destLonKey] || ''
          });
        }
      }

      // Build HTML content with proper string concatenation
      let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Missão - ${reportLog.mission_id}</title>
  <style>
    @media print {
      body { margin: 0; }
      .page-break { page-break-after: always; }
      @page { 
        margin: 15mm 20mm; 
        @bottom-center {
          content: '';
        }
      }
    }
    
    body { 
      font-family: 'Arial', sans-serif; 
      margin: 15px;
      background: white;
      color: #1e293b;
      font-size: 10pt;
      line-height: 1.4;
    }
    
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 3px solid #b91c1c;
      padding-bottom: 15px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .header-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
    }
    
    .header-center {
      flex: 1;
      text-align: center;
      padding: 0 20px;
    }
    
    .header-org {
      font-size: 0.85em;
      font-weight: bold;
      color: #1e293b;
      margin: 5px 0;
      line-height: 1.3;
    }
    
    .header h1 {
      font-size: 1.4em;
      color: #b91c1c;
      margin: 10px 0 8px 0;
      font-weight: bold;
    }
    
    .header .mission-id {
      font-size: 1.2em;
      font-weight: bold;
      color: #475569;
      margin: 5px 0;
    }
    
    .header .date {
      font-size: 0.95em;
      color: #64748b;
      margin-top: 3px;
    }
    
    .section {
      margin: 15px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 1.1em;
      font-weight: bold;
      color: #1e293b;
      border-left: 4px solid #b91c1c;
      padding-left: 10px;
      margin-bottom: 10px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin: 10px 0;
    }
    
    .info-item {
      background: #f8fafc;
      padding: 6px 8px;
      border-left: 3px solid #cbd5e1;
      border-radius: 3px;
    }
    
    .info-item strong {
      color: #475569;
      display: block;
      font-size: 0.8em;
      margin-bottom: 2px;
    }
    
    .info-item span {
      color: #1e293b;
      font-weight: 600;
      font-size: 0.9em;
    }
    
    .crew-section {
      background: #f1f5f9;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    
    .crew-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-top: 8px;
    }
    
    .crew-item {
      background: white;
      padding: 5px 7px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
      font-size: 0.9em;
    }
    
    .stages-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9pt;
    }
    
    .stages-table th {
      background: #1e293b;
      color: white;
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 0.85em;
    }
    
    .stages-table th small {
      display: block;
      font-size: 0.75em;
      font-weight: normal;
      margin-top: 2px;
      opacity: 0.9;
    }
    
    .stages-table td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
    }
    
    .stages-table tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .operations-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0;
    }
    
    .badge {
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 10px;
      border-radius: 15px;
      font-size: 0.8em;
      font-weight: 600;
    }
    
    .victim-card {
      background: #fef2f2;
      border: 2px solid #fecaca;
      border-radius: 6px;
      padding: 10px;
      margin: 10px 0;
      page-break-inside: avoid;
    }
    
    .victim-header {
      font-size: 0.95em;
      font-weight: bold;
      color: #991b1b;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 2px solid #fecaca;
    }
    
    .victim-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      margin-top: 8px;
    }
    
    .remarks-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      border-radius: 4px;
      margin: 10px 0;
      white-space: pre-wrap;
      text-align: justify;
      text-indent: 1.5cm;
      line-height: 1.5;
    }
    
    .signatures {
      margin-top: 40px;
      page-break-inside: avoid;
    }
    
    .signature-line {
      border-top: 1px solid #1e293b;
      margin-top: 40px;
      padding-top: 8px;
      text-align: center;
    }
    
    .signature-name {
      font-weight: bold;
      color: #1e293b;
      font-size: 0.9em;
    }
    
    .signature-title {
      color: #64748b;
      font-size: 0.8em;
    }
    
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d9ff63e7ca5d7ec604e406/13f58b591_Braso_do_Paransvg.png" alt="Brasão do Paraná" class="header-logo" />
    <div class="header-center">
      <div class="header-org">ESTADO DO PARANÁ</div>
      <div class="header-org">CORPO DE BOMBEIROS MILITAR DO ESTADO DO PARANÁ</div>
      <h1>RELATÓRIO DE OCORRÊNCIA</h1>
      <div class="mission-id">Missão Nº ${reportLog.mission_id}</div>
      <div class="date">${formatDateReport(reportLog.date)}</div>
    </div>
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d9ff63e7ca5d7ec604e406/336a8edba_BRASAObombeiro.jpg" alt="Brasão Bombeiro" class="header-logo" />
  </div>

  <div class="section">
    <div class="section-title">Informações da Missão</div>
    <div class="info-grid">
      <div class="info-item">
        <strong>Data</strong>
        <span>${format(new Date(reportLog.date + 'T12:00:00'), 'dd/MM/yyyy')}</span>
      </div>
      <div class="info-item">
        <strong>Aeronave</strong>
        <span>${reportLog.aircraft || 'N/A'}</span>
      </div>
      <div class="info-item">
        <strong>Base</strong>
        <span>${reportLog.base || 'N/A'}</span>
      </div>
      <div class="info-item">
        <strong>Natureza da Missão</strong>
        <span>${reportLog.mission_type || 'N/A'}</span>
      </div>
      <div class="info-item">
        <strong>Duração Total</strong>
        <span>${formatDuration(reportLog.flight_duration)}</span>
      </div>
      <div class="info-item">
        <strong>Página Diário de Bordo</strong>
        <span>${reportLog.diario_bordo_pagina || 'N/A'}</span>
      </div>
      ${reportLog.sade_occurrence_number ? `<div class="info-item"><strong>Ocorrência SADE</strong><span>${reportLog.sade_occurrence_number}</span></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Tripulação</div>
    <div class="crew-section">
      <div class="crew-grid">
        <div class="crew-item"><strong>Comandante</strong><br>${reportLog.pilot_in_command || 'N/A'}</div>
        ${reportLog.copilot ? `<div class="crew-item"><strong>Copiloto</strong><br>${reportLog.copilot}</div>` : ''}
        ${reportLog.oat_1 ? `<div class="crew-item"><strong>OAT 1</strong><br>${reportLog.oat_1}</div>` : ''}
        ${reportLog.oat_2 ? `<div class="crew-item"><strong>OAT 2</strong><br>${reportLog.oat_2}</div>` : ''}
        ${reportLog.oat_3 ? `<div class="crew-item"><strong>OAT 3</strong><br>${reportLog.oat_3}</div>` : ''}
        ${reportLog.osm_1 ? `<div class="crew-item"><strong>OSM 1</strong><br>${reportLog.osm_1}</div>` : ''}
        ${reportLog.osm_2 ? `<div class="crew-item"><strong>OSM 2</strong><br>${reportLog.osm_2}</div>` : ''}
      </div>
    </div>
    ${reportLog.pax ? `<div class="info-item" style="grid-column: span 2;"><strong>Passageiros a Bordo</strong><span>${reportLog.pax}</span></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Etapas de Voo</div>
    <table class="stages-table">
      <thead>
        <tr>
          <th>Etapa</th>
          <th>Origem</th>
          <th>Destino</th>
          <th>Decolagem<small>(Horário de Brasília)</small></th>
          <th>Pouso<small>(Horário de Brasília)</small></th>
        </tr>
      </thead>
      <tbody>`;
      
      stages.forEach(stage => {
        htmlContent += `<tr>
          <td><strong>Etapa ${stage.num}</strong></td>
          <td>${stage.origin}${stage.origin_lat && stage.origin_lon ? '<br><small>' + stage.origin_lat + ' / ' + stage.origin_lon + '</small>' : ''}</td>
          <td>${stage.destination}${stage.dest_lat && stage.dest_lon ? '<br><small>' + stage.dest_lat + ' / ' + stage.dest_lon + '</small>' : ''}</td>
          <td>${stage.departure}</td>
          <td>${stage.arrival}</td>
        </tr>`;
      });
      
      htmlContent += `</tbody>
    </table>
  </div>`;

      if (reportLog.heli_operations && reportLog.heli_operations.length > 0) {
        htmlContent += `<div class="section">
    <div class="section-title">Operações Helitransportadas</div>
    <div class="operations-badges">`;
        reportLog.heli_operations.forEach(op => {
          htmlContent += `<span class="badge">${op}</span>`;
        });
        htmlContent += `</div>`;
        
        if (reportLog.rescued_victims_count) {
          htmlContent += `<div class="info-item" style="margin-top: 15px;"><strong>Vítimas Resgatadas</strong><span>${reportLog.rescued_victims_count}</span></div>`;
        }
        
        if (reportLog.helibalde_launches) {
          htmlContent += `<div class="info-grid" style="margin-top: 10px;">
        <div class="info-item"><strong>Lançamentos Helibalde</strong><span>${reportLog.helibalde_launches}</span></div>
        <div class="info-item"><strong>Carga Helibalde</strong><span>${reportLog.helibalde_load_liters} L</span></div>
      </div>`;
        }
        
        if (reportLog.external_load_time_min || reportLog.external_load_kg) {
          htmlContent += `<div class="info-grid" style="margin-top: 10px;">`;
          if (reportLog.external_load_time_min) {
            htmlContent += `<div class="info-item"><strong>Tempo Carga Externa</strong><span>${reportLog.external_load_time_min} min</span></div>`;
          }
          if (reportLog.external_load_kg) {
            htmlContent += `<div class="info-item"><strong>Peso Carga Externa</strong><span>${reportLog.external_load_kg} kg</span></div>`;
          }
          htmlContent += `</div>`;
        }
        
        htmlContent += `</div>`;
      }

      if (reportLog.victims && reportLog.victims.length > 0) {
        htmlContent += `<div class="section page-break"><div class="section-title">Vítimas Atendidas</div>`;
        
        reportLog.victims.forEach((victim, idx) => {
          const victimRecord = victimRecords.find(vr => vr.victim_index === idx);
          
          htmlContent += `<div class="victim-card">
  <div class="victim-header">Vítima ${idx + 1}: ${victim.name || 'Não identificado'}</div>
  <div class="victim-details">
    <div class="info-item"><strong>Sexo</strong><span>${victim.sex === 'M' ? 'Masculino' : victim.sex === 'F' ? 'Feminino' : 'N/A'}</span></div>
    <div class="info-item"><strong>Idade</strong><span>${victim.age || 'N/A'}</span></div>
    <div class="info-item"><strong>Código de Vida</strong><span>${victim.life_code || 'N/A'}</span></div>`;
          
          if (includeVictimDetails && victimRecord) {
            htmlContent += `<div class="info-item"><strong>Grau de Afogamento</strong><span>${victimRecord.grau_afogamento || 'N/A'}</span></div>`;
          } else {
            htmlContent += `<div class="info-item"><strong>Grau de Afogamento</strong><span>${victim.drowning_grade || 'N/A'}</span></div>`;
          }
          
          htmlContent += `</div>`;
          
          if (includeVictimDetails && victimRecord) {
            htmlContent += `<div style="margin-top: 10px;">
    <strong style="color: #991b1b; font-size: 0.9em;">Detalhamento Clínico:</strong>
    <div class="victim-details" style="margin-top: 8px;">`;
            
            if (victimRecord.diagnostico_lesao_principal) {
              htmlContent += `<div class="info-item" style="grid-column: span 2;"><strong>Diagnóstico</strong><span>${victimRecord.diagnostico_lesao_principal}</span></div>`;
            }
            if (victimRecord.tipo_transporte) {
              htmlContent += `<div class="info-item"><strong>Tipo de Transporte</strong><span>${victimRecord.tipo_transporte}</span></div>`;
            }
            if (victimRecord.status_transporte) {
              htmlContent += `<div class="info-item"><strong>Status do Transporte</strong><span>${victimRecord.status_transporte}</span></div>`;
            }
            if (victimRecord.suporte_ventilatorio) {
              htmlContent += `<div class="info-item"><strong>Suporte Ventilatório</strong><span>${victimRecord.suporte_ventilatorio}</span></div>`;
            }
            if (victimRecord.glasgow) {
              htmlContent += `<div class="info-item"><strong>Glasgow</strong><span>${victimRecord.glasgow}</span></div>`;
            }
            if (victimRecord.pressao_arterial_sistolica) {
              htmlContent += `<div class="info-item"><strong>PA Sistólica</strong><span>${victimRecord.pressao_arterial_sistolica} mmHg</span></div>`;
            }
            if (victimRecord.frequencia_cardiaca) {
              htmlContent += `<div class="info-item"><strong>Frequência Cardíaca</strong><span>${victimRecord.frequencia_cardiaca} bpm</span></div>`;
            }
            
            htmlContent += `</div></div>`;
          }
          
          htmlContent += `<div style="margin-top: 10px;">
    <strong style="color: #991b1b; font-size: 0.9em;">Origem:</strong>
    <div class="victim-details" style="margin-top: 6px;">`;
          
          if (victim.origin_city) htmlContent += `<div class="info-item"><strong>Cidade</strong><span>${victim.origin_city}</span></div>`;
          if (victim.origin_hospital) htmlContent += `<div class="info-item"><strong>Hospital</strong><span>${victim.origin_hospital}</span></div>`;
          if (victim.origin_landing_site) htmlContent += `<div class="info-item" style="grid-column: span 2;"><strong>Local de Pouso</strong><span>${victim.origin_landing_site}</span></div>`;
          
          htmlContent += `</div></div>`;
          
          htmlContent += `<div style="margin-top: 10px;">
    <strong style="color: #991b1b; font-size: 0.9em;">Destino:</strong>
    <div class="victim-details" style="margin-top: 6px;">`;
          
          if (victim.destination_city) htmlContent += `<div class="info-item"><strong>Cidade</strong><span>${victim.destination_city}</span></div>`;
          if (victim.destination_hospital) htmlContent += `<div class="info-item"><strong>Hospital</strong><span>${victim.destination_hospital}</span></div>`;
          if (victim.destination_landing_site) htmlContent += `<div class="info-item" style="grid-column: span 2;"><strong>Local de Pouso</strong><span>${victim.destination_landing_site}</span></div>`;
          
          htmlContent += `</div></div></div>`;
        });
        
        htmlContent += `</div>`;
      }

      if (reportLog.remarks) {
        htmlContent += `<div class="section">
    <div class="section-title">Observações</div>
    <div class="remarks-box">${reportLog.remarks}</div>
  </div>`;
      }

      htmlContent += `<div class="signatures">
    <div class="signatures-grid">
      <div>
        <div class="signature-line">
          <div class="signature-name">${reportResponsible}</div>
          <div class="signature-title">Responsável pelo Preenchimento do Relatório</div>
        </div>
      </div>
      <div>
        <div class="signature-line">
          <div class="signature-name">${reportCommander}</div>
          <div class="signature-title">Comandante da Unidade Aérea</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Por favor, permita pop-ups para gerar o relatório.');
        return;
      }
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setShowReportDialog(false);
      setReportLog(null);
      setReportResponsible('');
      setReportCommander('');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const confirmDelete = async () => {
    if (logToDelete) {
      onDelete(logToDelete.id);
      await logAction('delete', 'FlightLog', logToDelete.id, `Deletado voo da missão ${logToDelete.mission_id}`);
      setShowDeleteConfirm(false);
      setLogToDelete(null);
    }
  };

  const getFlightStages = (log) => {
    const stages = [];
    for (let i = 1; i <= 6; i++) {
      if (log[`departure_time_${i}`] && log[`arrival_time_${i}`]) {
        stages.push({
          departure: log[`departure_time_${i}`],
          arrival: log[`arrival_time_${i}`],
          stage: i
        });
      }
    }
    return stages;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        {Array(10).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full my-2" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        Nenhum registro encontrado.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-20">Data</TableHead>
              <TableHead className="w-16">Missão</TableHead>
              <TableHead className="w-24">Aeronave</TableHead>
              <TableHead className="w-32">Tipo</TableHead>
              <TableHead className="w-32">Origem/Destino</TableHead>
              <TableHead className="w-28">Etapas</TableHead>
              <TableHead className="w-20">Duração</TableHead>
              <TableHead className="w-32">Vítimas</TableHead>
              <TableHead className="text-right w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => {
              const stages = getFlightStages(log);
              const isModifiable = canModify(log);
              const victimsCount = log.victims?.length || 0;

              return (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">{formatDate(log.date)}</TableCell>
                  <TableCell className="font-medium text-sm">{log.mission_id}</TableCell>
                  <TableCell className="text-xs">{log.aircraft}</TableCell>
                  <TableCell className="text-xs truncate max-w-[120px]" title={log.mission_type}>{log.mission_type}</TableCell>
                  <TableCell className="text-xs">{log.origin} → {log.destination}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {stages.map((stage, index) => (
                        <Badge key={index} variant="outline" className="text-[10px] px-1 py-0">
                          {stage.departure}-{stage.arrival}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {log.flight_duration}m
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {victimsCount > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {log.victims.map((victim, index) => (
                          <Badge key={index} className="bg-red-100 text-red-800 text-[10px] px-1 py-0">
                            {victim.name || `V${index + 1}`} 
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Emitir Relatório"
                        onClick={() => handleReportClick(log)}
                        className="h-7 w-7"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                      </Button>
                      {isModifiable && log.id && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Editar"
                            onClick={() => navigate(`${createPageUrl("EditFlightLog")}?id=${log.id}`)}
                            className="h-7 w-7"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Excluir"
                            onClick={() => handleDeleteClick(log)}
                            className="h-7 w-7"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de voo da missão{' '}
              <strong>{logToDelete?.mission_id}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Emitir Relatório de Missão</AlertDialogTitle>
            <AlertDialogDescription>
              Preencha os dados necessários para gerar o relatório da Missão {reportLog?.mission_id}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4">
            <div>
              <Label htmlFor="responsible">Responsável pelo Preenchimento do Relatório *</Label>
              <Input
                id="responsible"
                value={reportResponsible}
                onChange={(e) => setReportResponsible(e.target.value)}
                placeholder="Nome completo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="commander">Comandante da Unidade Aérea *</Label>
              <Input
                id="commander"
                value={reportCommander}
                onChange={(e) => setReportCommander(e.target.value)}
                placeholder="Nome completo"
                className="mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGeneratingReport}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={generateMissionReport}
              disabled={isGeneratingReport || !reportResponsible || !reportCommander}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGeneratingReport ? 'Gerando...' : 'Gerar Relatório'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}