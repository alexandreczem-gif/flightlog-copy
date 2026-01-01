import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import html2canvas from 'html2canvas';

function MultiServiceReport({ services }) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputFormat, setOutputFormat] = useState('png');

  const completedServices = services.filter(s => s.status === 'completed');

  const toggleService = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const generateConsolidatedReport = async () => {
    if (selectedIds.length === 0) {
      alert('Selecione pelo menos um serviço para gerar o relatório.');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedServices = services.filter(s => selectedIds.includes(s.id));
      const serviceDate = selectedServices[0]?.date;
      
      // Buscar dados adicionais
      const [operationSettings, allFlightLogs, allVictimRecords, todayFuelings] = await Promise.all([
        base44.entities.OperationSettings.list(),
        base44.entities.FlightLog.list('-date', 1000),
        base44.entities.VictimRecord.list('-data', 2000),
        base44.entities.Abastecimento.filter({ date: serviceDate })
      ]);

      // Processar dados da operação
      let operationData = null;
      let weekData = null;
      
      if (operationSettings.length > 0) {
        const settings = operationSettings[0];
        const opStartDate = settings.operation_start_date;
        const opBase = settings.operation_base;

        if (opStartDate) {
          let operationLogs = allFlightLogs.filter(log => log.date >= opStartDate);
          if (opBase) {
            operationLogs = operationLogs.filter(log => log.base === opBase);
          }

          const operationVictims = allVictimRecords.filter(r => {
            if (!r.data || r.pending_registration !== false) return false;
            const matchesDate = r.data >= opStartDate;
            const matchesBase = opBase ? r.base === opBase : true;
            return matchesDate && matchesBase;
          });

          // Calcular estatísticas de afogamento - todas as opções
          const drowningStats = [];
          const grades = ['Somente Resgate', '1', '2', '3', '4', '5', '6'];
          grades.forEach(grade => {
            const count = operationVictims.filter(v => v.grau_afogamento === grade).length;
            drowningStats.push({ grade, count });
          });

          operationData = {
            startDate: opStartDate,
            base: opBase,
            logs: operationLogs,
            victims: operationVictims,
            stats: calculateStats(operationLogs, operationVictims),
            drowningStats
          };
        }
      }

      // Dados da última semana (desde quarta-feira)
      const today = new Date(serviceDate + 'T12:00:00');
      const dayOfWeek = today.getDay();
      const daysToWednesday = (dayOfWeek + 4) % 7;
      const lastWednesday = new Date(today);
      lastWednesday.setDate(today.getDate() - daysToWednesday);
      const lastWednesdayStr = format(lastWednesday, 'yyyy-MM-dd');

      const weekLogs = allFlightLogs.filter(log => log.date >= lastWednesdayStr && log.date <= serviceDate);
      const weekVictims = allVictimRecords.filter(r => r.data >= lastWednesdayStr && r.data <= serviceDate && r.pending_registration !== false);

      weekData = {
        startDate: lastWednesdayStr,
        logs: weekLogs,
        victims: weekVictims,
        stats: calculateStats(weekLogs, weekVictims)
      };
      
      // Agrupar serviços por aeronave/UAA
      const groupedServices = {};
      selectedServices.forEach(service => {
        const key = `${service.type}_${service.name}`;
        if (!groupedServices[key]) {
          groupedServices[key] = [];
        }
        groupedServices[key].push(service);
      });

      // Buscar todas as missões e abastecimentos agrupados
      const consolidatedData = [];
      for (const [key, servicesGroup] of Object.entries(groupedServices)) {
        const firstService = servicesGroup[0];
        
        // Buscar todas as missões do dia para essa aeronave/UAA
        const missions = await base44.entities.FlightLog.filter({ 
          date: firstService.date,
          aircraft: firstService.name 
        });
        
        // Ordenar missões cronologicamente
        missions.sort((a, b) => {
          const timeA = a.departure_time_1 || '00:00';
          const timeB = b.departure_time_1 || '00:00';
          return timeA.localeCompare(timeB);
        });
        
        let fuelings = [];
        if (firstService.type === 'uaa') {
          fuelings = await base44.entities.Abastecimento.filter({
            date: firstService.date,
            uaa_plate: firstService.name
          });
        }

        // Calcular estatísticas consolidadas
        const stats = {
          rescuedVictims: missions.reduce((sum, m) => sum + (Number(m.rescued_victims_count) || 0), 0),
          orientedPeople: missions.reduce((sum, m) => sum + (Number(m.oriented_people_count) || 0), 0),
          waterLaunched: missions.reduce((sum, m) => {
            const launches = Number(m.helibalde_launches) || 0;
            const load = Number(m.helibalde_load_liters) || 0;
            return sum + (launches * load);
          }, 0)
        };
        
        consolidatedData.push({ 
          services: servicesGroup, 
          missions, 
          fuelings, 
          stats,
          type: firstService.type,
          name: firstService.name,
          date: firstService.date
        });
      }
      
      // Separar aeronaves de UAAs
      const aircraftData = consolidatedData.filter(d => d.type === 'aircraft');
      const uaaData = consolidatedData.filter(d => d.type === 'uaa');

      const html = generateConsolidatedHTML(selectedServices, aircraftData, uaaData, operationData, weekData, todayFuelings);
      
      if (outputFormat === 'pdf') {
        // Gerar PDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.print();
          setOpen(false);
          setSelectedIds([]);
        }, 500);
      } else {
        // Gerar PNG
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.width = '210mm';
        tempDiv.style.background = 'white';
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);
        
        setTimeout(async () => {
          try {
            const canvas = await html2canvas(tempDiv, {
              scale: 2,
              backgroundColor: '#ffffff',
              logging: false,
              useCORS: true
            });
            
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `relatorio-consolidado-${format(new Date(), 'dd-MM-yyyy-HHmm')}.png`;
              a.click();
              URL.revokeObjectURL(url);
              
              document.body.removeChild(tempDiv);
              setOpen(false);
              setSelectedIds([]);
            });
          } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            alert('Erro ao gerar imagem do relatório.');
            document.body.removeChild(tempDiv);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado:', error);
      alert('Erro ao gerar relatório consolidado.');
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateStats = (logs, victims) => {
    const totalFlightHours = logs.reduce((sum, log) => sum + (log.flight_duration || 0), 0);
    const formattedHours = Math.floor(totalFlightHours / 60) + 'h ' + (totalFlightHours % 60) + 'min';
    
    const totalRescuedVictims = logs.reduce((sum, log) => sum + (Number(log.rescued_victims_count) || 0), 0);
    const totalOrientedPeople = logs.reduce((sum, log) => sum + (Number(log.oriented_people_count) || 0), 0);
    const totalWaterLaunched = logs.reduce((sum, log) => {
      const launches = Number(log.helibalde_launches) || 0;
      const load = Number(log.helibalde_load_liters) || 0;
      return sum + (launches * load);
    }, 0);
    const totalHeliOperations = logs.reduce((sum, log) => {
      if (log.heli_operations && Array.isArray(log.heli_operations)) {
        return sum + log.heli_operations.length;
      }
      return sum;
    }, 0);

    return {
      totalFlights: logs.length,
      formattedHours,
      totalVictims: victims.length,
      totalRescuedVictims,
      totalOrientedPeople,
      totalWaterLaunched,
      totalHeliOperations
    };
  };

  const generateConsolidatedHTML = (services, aircraftData, uaaData, operationData, weekData, todayFuelings) => {
    const dates = [...new Set(services.map(s => s.date))];
    const dateRange = dates.length === 1 
      ? format(new Date(dates[0] + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : `${format(new Date(Math.min(...dates.map(d => new Date(d)))), 'dd/MM/yyyy', { locale: ptBR })} a ${format(new Date(Math.max(...dates.map(d => new Date(d)))), 'dd/MM/yyyy', { locale: ptBR })}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório Consolidado de Serviços</title>
        <style>
          @media print {
            @page { margin: 1.5cm; }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #dc2626;
            margin: 0;
            font-size: 26px;
          }
          .header h2 {
            color: #64748b;
            margin: 10px 0;
            font-size: 18px;
            font-weight: normal;
          }
          .service-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
            border: 2px solid #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            background: #ffffff;
          }
          .service-header {
            background: #dc2626;
            color: white;
            padding: 10px;
            font-size: 16px;
            font-weight: bold;
            margin: -15px -15px 15px -15px;
            border-radius: 4px 4px 0 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;
          }
          .info-item {
            padding: 8px;
            background: #f1f5f9;
            border-left: 3px solid #dc2626;
            border-radius: 4px;
          }
          .info-label {
            font-weight: bold;
            color: #475569;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .info-value {
            color: #0f172a;
            font-size: 13px;
            margin-top: 3px;
            font-weight: 500;
          }
          .section-title {
            background: #64748b;
            color: white;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: bold;
            margin: 15px 0 10px 0;
            border-radius: 4px;
          }
          .mission-card {
            border: 1px solid #e2e8f0;
            padding: 14px;
            margin-bottom: 12px;
            border-radius: 6px;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .mission-header {
            font-weight: bold;
            color: #dc2626;
            font-size: 14px;
            margin-bottom: 10px;
            border-bottom: 2px solid #fee2e2;
            padding-bottom: 6px;
          }
          .victims-list {
            margin-top: 10px;
            padding-left: 15px;
          }
          .victim-item {
            margin-bottom: 6px;
            padding: 8px;
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            font-size: 12px;
            border-radius: 3px;
          }
          .notes-box {
            padding: 12px;
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            margin-top: 10px;
            white-space: pre-wrap;
            font-size: 12px;
            line-height: 1.6;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          .summary-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 6px;
          }
          .summary-box h3 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 15px;
          }
          .stats-section {
            background: #dbeafe;
            border: 2px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
            page-break-inside: avoid;
          }
          .stats-section h3 {
            margin: 0 0 12px 0;
            color: #1e40af;
            font-size: 16px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 6px;
          }

          .fueling-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 12px;
          }
          .fueling-table th {
            background: #dc2626;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 11px;
          }
          .fueling-table td {
            border: 1px solid #e2e8f0;
            padding: 6px;
            font-size: 11px;
          }
          .fueling-table tr:nth-child(even) {
            background: #f8fafc;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RELATÓRIO CONSOLIDADO DE SERVIÇOS</h1>
          <h2>Período: ${dateRange}</h2>
          <p style="margin: 10px 0; color: #64748b;">Total de Recursos: ${services.length}</p>
        </div>

        ${operationData ? `
          <div class="stats-section">
            <h3>📈 Dados da Operação Atual</h3>
            <p style="color: #1e40af; margin-bottom: 10px; font-size: 13px;">
              <strong>Período:</strong> Desde ${format(new Date(operationData.startDate + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
              ${operationData.base ? ` | <strong>Base:</strong> ${operationData.base}` : ''}
            </p>
            <div class="info-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr;"">
              <div class="info-item">
                <div class="info-label">Total de Voos</div>
                <div class="info-value">${operationData.stats.totalFlights}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Horas Voadas</div>
                <div class="info-value">${operationData.stats.formattedHours}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Vítimas/Pacientes</div>
                <div class="info-value">${operationData.stats.totalVictims}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Vítimas Resgatadas em Operações Helitransportadas</div>
                <div class="info-value">${operationData.stats.totalRescuedVictims}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Pessoas Orientadas</div>
                <div class="info-value">${operationData.stats.totalOrientedPeople}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Água Lançada</div>
                <div class="info-value">${operationData.stats.totalWaterLaunched} L</div>
              </div>
            </div>

            ${operationData.drowningStats && operationData.drowningStats.length > 0 ? `
              <div style="margin-top: 20px;">
                <h4 style="color: #1e40af; margin-bottom: 10px; font-size: 14px; font-weight: bold;">Afogamentos Atendidos por Grau</h4>
                <table class="fueling-table">
                  <thead>
                    <tr>
                      ${operationData.drowningStats.map(stat => `<th style="text-align: center; ${stat.grade === 'Somente Resgate' ? 'width: 80px;' : ''}">${stat.grade === 'Somente Resgate' ? 'S.Resgate' : stat.grade}</th>`).join('')}
                      <th style="background: #1e40af; text-align: center;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      ${operationData.drowningStats.map(stat => `<td style="text-align: center;"><strong>${stat.count}</strong></td>`).join('')}
                      <td style="text-align: center; background: #dbeafe; font-weight: bold;">${operationData.drowningStats.reduce((sum, s) => sum + s.count, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ` : ''}


          </div>
        ` : ''}

        <div class="summary-box">
          <h3>Resumo Geral</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Total de Aeronaves</div>
              <div class="info-value">${[...new Set(services.filter(s => s.type === 'aircraft').map(s => s.name))].length}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Total de UAAs</div>
              <div class="info-value">${[...new Set(services.filter(s => s.type === 'uaa').map(s => s.name))].length}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Total de Missões</div>
              <div class="info-value">${aircraftData.reduce((sum, ad) => sum + ad.missions.length, 0)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Bases Envolvidas</div>
              <div class="info-value">${[...new Set(services.map(s => s.base))].join(', ')}</div>
            </div>
          </div>
        </div>

        ${weekData ? `
          <div class="stats-section">
            <h3>👥 Dados de Voo da Tripulação da Semana</h3>
            <p style="color: #1e40af; margin-bottom: 15px;">
              <strong>Período:</strong> Desde ${format(new Date(weekData.startDate + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Total de Voos</div>
                <div class="info-value">${weekData.stats.totalFlights}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Horas Voadas</div>
                <div class="info-value">${weekData.stats.formattedHours}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Vítimas/Pacientes</div>
                <div class="info-value">${weekData.stats.totalVictims}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Vítimas Resgatadas em Operações Helitransportadas</div>
                <div class="info-value">${weekData.stats.totalRescuedVictims}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Pessoas Orientadas</div>
                <div class="info-value">${weekData.stats.totalOrientedPeople}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Operações Helitransportadas</div>
                <div class="info-value">${weekData.stats.totalHeliOperations}</div>
              </div>
            </div>
          </div>
        ` : ''}

        ${aircraftData.map(({ services: servicesGroup, missions, stats, name, date }) => {
          const dateFormatted = format(new Date(date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });
          
          // Coletar todas as tripulações das equipes
          const allCrew = [];
          servicesGroup.forEach(svc => {
            const crewEntry = `Equipe ${svc.team}: ${svc.commander || '-'} (Cmd)${svc.copilot ? `, ${svc.copilot} (Cop)` : ''}${svc.oat_1 ? `, ${svc.oat_1} (OAT)` : ''}${svc.oat_2 ? `, ${svc.oat_2} (OAT)` : ''}${svc.oat_3 ? `, ${svc.oat_3} (OAT)` : ''}${svc.osm_1 ? `, ${svc.osm_1} (OSM)` : ''}${svc.osm_2 ? `, ${svc.osm_2} (OSM)` : ''}`;
            allCrew.push(crewEntry);
          });
          
          // Coletar todas as alterações
          const allNotesAircraft = servicesGroup.map(s => s.notes_aircraft).filter(n => n && n !== 'Sem alterações');
          const allNotesMaterials = servicesGroup.map(s => s.notes_materials).filter(n => n && n !== 'Sem alterações');
          const allNotesGeneral = servicesGroup.map(s => s.notes_general).filter(n => n && n !== 'Sem alterações');
          
          return `
            <div class="service-section">
              <div class="service-header">
                ✈️ AERONAVE: ${name} - ${dateFormatted}
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Base</div>
                  <div class="info-value">${servicesGroup[0].base}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Equipes Escaladas</div>
                  <div class="info-value">${servicesGroup.length} equipe(s)</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Total de Missões</div>
                  <div class="info-value">${missions.length}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Vítimas Resgatadas em Op. Helitransportadas</div>
                  <div class="info-value">${stats?.rescuedVictims || 0}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Pessoas Orientadas</div>
                  <div class="info-value">${stats?.orientedPeople || 0}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Água Lançada (Litros)</div>
                  <div class="info-value">${stats?.waterLaunched || 0} L</div>
                </div>
              </div>

              <div class="section-title">Tripulação</div>
              <div style="padding: 10px; background: #f8fafc; border-radius: 4px; font-size: 13px;">
                ${allCrew.map(crew => `<div style="margin-bottom: 5px;">• ${crew}</div>`).join('')}
              </div>

              ${missions.length > 0 ? `
                <div class="section-title">Missões Realizadas</div>
                ${missions.map(mission => `
                  <div class="mission-card">
                    <div class="mission-header">
                      Missão ${mission.mission_id} - ${mission.mission_type || mission.mission_type_pm || 'Tipo não especificado'}
                    </div>
                    <div style="font-size: 12px; color: #475569;">
                      <strong>Origem:</strong> ${mission.origin_1 || '-'} | 
                      <strong>Destino:</strong> ${mission.destination_1 || '-'} | 
                      <strong>Duração:</strong> ${mission.flight_duration ? Math.floor(mission.flight_duration / 60) + 'h ' + (mission.flight_duration % 60) + 'min' : '-'}
                    </div>
                    ${mission.victims && mission.victims.length > 0 ? `
                      <div class="victims-list">
                        ${mission.victims.map(v => `
                          <div class="victim-item">
                            <strong>${v.name || 'Nome não informado'}</strong> - ${v.age || 'N/A'} anos
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              ` : '<p style="text-align: center; color: #64748b; padding: 10px;">Sem missões registradas</p>'}

              <div class="section-title">Alterações Registradas</div>
              ${allNotesAircraft.length > 0 ? `
                <div style="margin-bottom: 10px;">
                  <strong style="color: #475569;">Alterações na Aeronave:</strong>
                  ${allNotesAircraft.map((note, idx) => `
                    <div class="notes-box" style="margin-top: 5px;">
                      <strong>Equipe ${servicesGroup[servicesGroup.findIndex(s => s.notes_aircraft === note)].team}:</strong> ${note}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${allNotesMaterials.length > 0 ? `
                <div style="margin-bottom: 10px;">
                  <strong style="color: #475569;">Alterações de Materiais:</strong>
                  ${allNotesMaterials.map((note, idx) => `
                    <div class="notes-box" style="margin-top: 5px;">
                      <strong>Equipe ${servicesGroup[servicesGroup.findIndex(s => s.notes_materials === note)].team}:</strong> ${note}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${allNotesGeneral.length > 0 ? `
                <div style="margin-bottom: 10px;">
                  <strong style="color: #475569;">Alterações de Caráter Geral:</strong>
                  ${allNotesGeneral.map((note, idx) => `
                    <div class="notes-box" style="margin-top: 5px;">
                      <strong>Equipe ${servicesGroup[servicesGroup.findIndex(s => s.notes_general === note)].team}:</strong> ${note}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${allNotesAircraft.length === 0 && allNotesMaterials.length === 0 && allNotesGeneral.length === 0 ? 
                '<p style="text-align: center; color: #64748b; padding: 10px;">Sem alterações registradas</p>' : ''}
            </div>
          `;
        }).join('')}

        ${uaaData.map(({ services: servicesGroup, fuelings, name, date }) => {
          const dateFormatted = format(new Date(date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });
          const allNotesUAA = servicesGroup.map(s => s.notes).filter(n => n && n !== 'Sem alterações');
          
          return `
            <div class="service-section">
              <div class="service-header">
                🚗 UAA: ${name} - ${dateFormatted}
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Base</div>
                  <div class="info-value">${servicesGroup[0].base}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Equipes Escaladas</div>
                  <div class="info-value">${servicesGroup.length} equipe(s)</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Abastecimentos</div>
                  <div class="info-value">${fuelings.length}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Total Abastecido</div>
                  <div class="info-value">${fuelings.reduce((sum, f) => sum + (Number(f.quantity_liters) || 0), 0)} L</div>
                </div>
              </div>

              <div class="section-title">Alterações Registradas</div>
              ${allNotesUAA.length > 0 ? allNotesUAA.map((note, idx) => `
                <div class="notes-box" style="margin-bottom: 5px;">
                  <strong>Equipe ${servicesGroup[servicesGroup.findIndex(s => s.notes === note)].team}:</strong> ${note}
                </div>
              `).join('') : '<p style="text-align: center; color: #64748b; padding: 10px;">Sem alterações registradas</p>'}
            </div>
          `;
        }).join('')}

        ${todayFuelings && todayFuelings.length > 0 ? `
          <div class="stats-section">
            <h3>📊 Abastecimentos Realizados no Dia</h3>
            <table class="fueling-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Tipo</th>
                  <th>Aeronave/UAA</th>
                  <th>Quantidade (L)</th>
                  <th>Nota Fiscal</th>
                </tr>
              </thead>
              <tbody>
                ${todayFuelings.map(f => `
                  <tr>
                    <td>${f.time || '-'}</td>
                    <td>${f.uaa_abastecimento ? 'Entrada UAA' : 'Saída para Aeronave'}</td>
                    <td>${f.uaa_abastecimento ? f.uaa_plate || '-' : (f.aircraft_designator || f.aircraft_prefix || '-')}</td>
                    <td><strong>${f.quantity_liters || 0} L</strong></td>
                    <td>${f.nota_numero || '-'}</td>
                  </tr>
                `).join('')}
                <tr style="background: #fef3c7; font-weight: bold;">
                  <td colspan="3">Total Abastecido</td>
                  <td>${todayFuelings.reduce((sum, f) => sum + (Number(f.quantity_liters) || 0), 0)} L</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <p>Relatório consolidado gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p>Sistema FlightLog - Gestão de Voos</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-orange-50 border-orange-300 hover:bg-orange-100">
          <Download className="w-4 h-4 mr-2" />
          Relatório Consolidado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecione os Serviços para o Relatório</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {completedServices.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Nenhum serviço encerrado disponível.</p>
            ) : (
              completedServices.map(service => (
                <div key={service.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50">
                  <Checkbox 
                    checked={selectedIds.includes(service.id)}
                    onCheckedChange={() => toggleService(service.id)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">
                      {service.type === 'aircraft' ? '✈️' : '🚗'} {service.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {format(new Date(service.date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })} - 
                      {service.base} - Equipe {service.team}
                    </div>
                    {service.type === 'aircraft' && service.commander && (
                      <div className="text-xs text-slate-500">Cmd: {service.commander}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="pt-4 border-t space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Formato de Saída</Label>
            <RadioGroup value={outputFormat} onValueChange={setOutputFormat} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="png" />
                <Label htmlFor="png" className="cursor-pointer">Imagem PNG</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">PDF (Impressão)</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">
              {selectedIds.length} serviço(s) selecionado(s)
            </span>
            <Button 
            onClick={generateConsolidatedReport} 
            disabled={isGenerating || selectedIds.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
            >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Gerando...' : `Gerar ${outputFormat === 'png' ? 'PNG' : 'PDF'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { MultiServiceReport };
export default MultiServiceReport;