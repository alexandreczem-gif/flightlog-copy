import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MultiServiceReport({ services }) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
      
      // Buscar todas as missões relacionadas e abastecimentos
      const allMissions = [];
      for (const service of selectedServices) {
        const missions = await base44.entities.FlightLog.filter({ 
          date: service.date,
          aircraft: service.name 
        });
        
        let fuelings = [];
        if (service.type === 'uaa') {
          fuelings = await base44.entities.Abastecimento.filter({
            date: service.date,
            uaa_plate: service.name
          });
        }

        // Calcular estatísticas
        const stats = {
          rescuedVictims: missions.reduce((sum, m) => sum + (Number(m.rescued_victims_count) || 0), 0),
          orientedPeople: missions.reduce((sum, m) => sum + (Number(m.oriented_people_count) || 0), 0),
          waterLaunched: missions.reduce((sum, m) => {
            const launches = Number(m.helibalde_launches) || 0;
            const load = Number(m.helibalde_load_liters) || 0;
            return sum + (launches * load);
          }, 0)
        };
        
        allMissions.push({ service, missions, fuelings, stats });
      }

      const html = generateConsolidatedHTML(selectedServices, allMissions);
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        setOpen(false);
        setSelectedIds([]);
      }, 500);
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado:', error);
      alert('Erro ao gerar relatório consolidado.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateConsolidatedHTML = (services, serviceMissions) => {
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
            margin-bottom: 40px;
            page-break-inside: avoid;
            border: 2px solid #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            background: #ffffff;
          }
          .service-header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 12px;
            font-size: 18px;
            font-weight: bold;
            margin: -20px -20px 20px -20px;
            border-radius: 6px 6px 0 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          .info-item {
            padding: 10px;
            background: #f8fafc;
            border-left: 4px solid #dc2626;
            border-radius: 4px;
          }
          .info-label {
            font-weight: bold;
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-value {
            color: #0f172a;
            font-size: 14px;
            margin-top: 4px;
            font-weight: 500;
          }
          .section-title {
            background: linear-gradient(135deg, #64748b 0%, #475569 100%);
            color: white;
            padding: 10px 14px;
            font-size: 14px;
            font-weight: bold;
            margin: 20px 0 15px 0;
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
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            padding: 18px;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1);
          }
          .summary-box h3 {
            margin: 0 0 12px 0;
            color: #92400e;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RELATÓRIO CONSOLIDADO DE SERVIÇOS</h1>
          <h2>Período: ${dateRange}</h2>
          <p style="margin: 10px 0; color: #64748b;">Total de Recursos: ${services.length}</p>
        </div>

        <div class="summary-box">
          <h3>Resumo Geral</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Total de Aeronaves</div>
              <div class="info-value">${services.filter(s => s.type === 'aircraft').length}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Total de UAAs</div>
              <div class="info-value">${services.filter(s => s.type === 'uaa').length}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Total de Missões</div>
              <div class="info-value">${serviceMissions.reduce((sum, sm) => sum + sm.missions.length, 0)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Bases Envolvidas</div>
              <div class="info-value">${[...new Set(services.map(s => s.base))].join(', ')}</div>
            </div>
          </div>
        </div>

        ${serviceMissions.map(({ service, missions, fuelings, stats }) => {
          const dateFormatted = format(new Date(service.date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });
          
          return `
            <div class="service-section">
              <div class="service-header">
                ${service.type === 'aircraft' ? '✈️ AERONAVE' : '🚗 UAA'}: ${service.name} - ${dateFormatted}
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Base</div>
                  <div class="info-value">${service.base}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Equipe</div>
                  <div class="info-value">Equipe ${service.team}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Horário</div>
                  <div class="info-value">${service.start_time} - ${service.end_time}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">${service.type === 'aircraft' ? 'Missões' : 'Abastecimentos'}</div>
                  <div class="info-value">${service.type === 'aircraft' ? missions.length : (fuelings || []).length}</div>
                </div>
                ${service.type === 'aircraft' ? `
                  <div class="info-item">
                    <div class="info-label">Vítimas Resgatadas</div>
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
                ` : `
                  <div class="info-item">
                    <div class="info-label">Combustível Final</div>
                    <div class="info-value">${service.final_fuel || '-'} L</div>
                  </div>
                `}
              </div>

              ${service.type === 'aircraft' ? `
                <div class="section-title">Tripulação</div>
                <div class="info-grid">
                  ${service.commander ? `<div class="info-item"><div class="info-label">Comandante</div><div class="info-value">${service.commander}</div></div>` : ''}
                  ${service.copilot ? `<div class="info-item"><div class="info-label">Copiloto</div><div class="info-value">${service.copilot}</div></div>` : ''}
                  ${service.oat_1 ? `<div class="info-item"><div class="info-label">OAT 1</div><div class="info-value">${service.oat_1}</div></div>` : ''}
                  ${service.oat_2 ? `<div class="info-item"><div class="info-label">OAT 2</div><div class="info-value">${service.oat_2}</div></div>` : ''}
                  ${service.osm_1 ? `<div class="info-item"><div class="info-label">OSM 1</div><div class="info-value">${service.osm_1}</div></div>` : ''}
                  ${service.osm_2 ? `<div class="info-item"><div class="info-label">OSM 2</div><div class="info-value">${service.osm_2}</div></div>` : ''}
                </div>
              ` : ''}

              ${service.type === 'aircraft' && missions.length > 0 ? `
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
              ` : service.type === 'aircraft' ? '<p style="text-align: center; color: #64748b; padding: 10px;">Sem missões registradas</p>' : ''}

              <div class="section-title">Alterações Registradas</div>
              ${service.type === 'aircraft' ? `
                ${service.notes_aircraft && service.notes_aircraft !== 'Sem alterações' ? `
                  <div style="margin-bottom: 10px;">
                    <strong style="color: #475569;">Alterações na Aeronave:</strong>
                    <div class="notes-box">${service.notes_aircraft}</div>
                  </div>
                ` : ''}
                ${service.notes_materials && service.notes_materials !== 'Sem alterações' ? `
                  <div style="margin-bottom: 10px;">
                    <strong style="color: #475569;">Alterações de Materiais:</strong>
                    <div class="notes-box">${service.notes_materials}</div>
                  </div>
                ` : ''}
                ${service.notes_general && service.notes_general !== 'Sem alterações' ? `
                  <div style="margin-bottom: 10px;">
                    <strong style="color: #475569;">Alterações de Caráter Geral:</strong>
                    <div class="notes-box">${service.notes_general}</div>
                  </div>
                ` : ''}
                ${(!service.notes_aircraft || service.notes_aircraft === 'Sem alterações') && 
                  (!service.notes_materials || service.notes_materials === 'Sem alterações') && 
                  (!service.notes_general || service.notes_general === 'Sem alterações') ? 
                  '<p style="text-align: center; color: #64748b; padding: 10px;">Sem alterações registradas</p>' : ''}
              ` : service.notes && service.notes !== 'Sem alterações' ? `
                <div class="notes-box">${service.notes}</div>
              ` : '<p style="text-align: center; color: #64748b; padding: 10px;">Sem alterações registradas</p>'}
            </div>
          `;
        }).join('')}

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
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-slate-600">
            {selectedIds.length} serviço(s) selecionado(s)
          </span>
          <Button 
            onClick={generateConsolidatedReport} 
            disabled={isGenerating || selectedIds.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar Relatório PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MultiServiceReport;