import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ServiceReportButton({ service }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Buscar missões do dia da aeronave/UAA
      const missions = await base44.entities.FlightLog.filter({ 
        date: service.date,
        aircraft: service.name 
      });

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

      // Buscar abastecimentos para UAA
      let fuelings = [];
      if (service.type === 'uaa') {
        fuelings = await base44.entities.Abastecimento.filter({
          date: service.date,
          uaa_plate: service.name
        });
      }

      // Gerar HTML do relatório
      const html = generateReportHTML(service, missions, fuelings, stats);
      
      // Criar janela de impressão
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Aguardar carregamento e imprimir
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportHTML = (service, missions, fuelings = [], stats = {}) => {
    const dateFormatted = format(new Date(service.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Serviço - ${service.name}</title>
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
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 24px;
          }
          .header h2 {
            color: #64748b;
            margin: 5px 0;
            font-size: 18px;
            font-weight: normal;
          }
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .section-title {
            background: #1e40af;
            color: white;
            padding: 8px 12px;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          .info-item {
            padding: 8px;
            background: #f1f5f9;
            border-left: 3px solid #1e40af;
          }
          .info-label {
            font-weight: bold;
            color: #475569;
            font-size: 12px;
            text-transform: uppercase;
          }
          .info-value {
            color: #1e293b;
            font-size: 14px;
            margin-top: 3px;
          }
          .mission-card {
            border: 1px solid #cbd5e1;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            background: #f8fafc;
            page-break-inside: avoid;
          }
          .mission-header {
            font-weight: bold;
            color: #1e40af;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
          }
          .victims-list {
            margin-top: 10px;
            padding-left: 20px;
          }
          .victim-item {
            margin-bottom: 8px;
            padding: 8px;
            background: white;
            border-left: 3px solid #10b981;
            font-size: 13px;
          }
          .notes-box {
            padding: 12px;
            background: #fffbeb;
            border: 1px solid #fbbf24;
            border-radius: 4px;
            margin-top: 10px;
            white-space: pre-wrap;
            font-size: 13px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 13px;
          }
          table th {
            background: #e2e8f0;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #cbd5e1;
          }
          table td {
            padding: 8px;
            border: 1px solid #cbd5e1;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RELATÓRIO DE SERVIÇO DIÁRIO</h1>
          <h2>${service.type === 'aircraft' ? 'AERONAVE' : 'UAA'}: ${service.name}</h2>
          <p style="margin: 10px 0; color: #64748b;">${dateFormatted}</p>
        </div>

        <div class="section">
          <div class="section-title">DADOS DO SERVIÇO</div>
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
              <div class="info-label">Horário de Início</div>
              <div class="info-value">${service.start_time}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Horário de Término</div>
              <div class="info-value">${service.end_time}</div>
            </div>
          </div>

          ${service.type === 'aircraft' ? `
            <div class="section-title" style="margin-top: 20px;">TRIPULAÇÃO</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Comandante</div>
                <div class="info-value">${service.commander || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Copiloto</div>
                <div class="info-value">${service.copilot || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">OAT 1</div>
                <div class="info-value">${service.oat_1 || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">OAT 2</div>
                <div class="info-value">${service.oat_2 || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">OAT 3</div>
                <div class="info-value">${service.oat_3 || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">OSM 1</div>
                <div class="info-value">${service.osm_1 || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">OSM 2</div>
                <div class="info-value">${service.osm_2 || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">TASA</div>
                <div class="info-value">${service.tasa || '-'}</div>
              </div>
            </div>
          ` : `
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Combustível Inicial</div>
                <div class="info-value">${service.initial_fuel || 0} L</div>
              </div>
              <div class="info-item">
                <div class="info-label">Combustível Final</div>
                <div class="info-value">${service.final_fuel || '-'} L</div>
              </div>
              <div class="info-item">
                <div class="info-label">Abastecimentos Realizados</div>
                <div class="info-value">${fuelings.length}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Total Abastecido</div>
                <div class="info-value">${fuelings.reduce((sum, f) => sum + (f.quantity_liters || 0), 0)} L</div>
              </div>
            </div>
          `}

          ${service.type === 'aircraft' ? `
            <div class="section-title" style="margin-top: 20px;">ESTATÍSTICAS DO SERVIÇO</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Missões Realizadas</div>
                <div class="info-value">${missions.length}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Vítimas Resgatadas</div>
                <div class="info-value">${stats.rescuedVictims || 0}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Pessoas Orientadas</div>
                <div class="info-value">${stats.orientedPeople || 0}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Água Lançada (Litros)</div>
                <div class="info-value">${stats.waterLaunched || 0} L</div>
              </div>
            </div>
          ` : ''}
        </div>

        ${missions.length > 0 ? `
          <div class="section">
            <div class="section-title">MISSÕES REALIZADAS (${missions.length})</div>
            ${missions.map((mission, idx) => `
              <div class="mission-card">
                <div class="mission-header">
                  Missão ${mission.mission_id} - ${mission.mission_type || mission.mission_type_pm || 'Tipo não especificado'}
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Origem</div>
                    <div class="info-value">${mission.origin_1 || '-'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Destino</div>
                    <div class="info-value">${mission.destination_1 || '-'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Duração</div>
                    <div class="info-value">${mission.flight_duration ? Math.floor(mission.flight_duration / 60) + 'h ' + (mission.flight_duration % 60) + 'min' : '-'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Horário</div>
                    <div class="info-value">${mission.departure_time_1 || ''} - ${mission.arrival_time_1 || ''}</div>
                  </div>
                </div>
                
                ${mission.victims && mission.victims.length > 0 ? `
                  <div style="margin-top: 15px;">
                    <strong style="color: #1e40af;">Vítimas/Pacientes Atendidos:</strong>
                    <div class="victims-list">
                      ${mission.victims.map(v => `
                        <div class="victim-item">
                          <strong>${v.name || 'Nome não informado'}</strong> - 
                          ${v.age || 'Idade não informada'} anos, 
                          Código: ${v.life_code || 'N/A'}<br>
                          <span style="font-size: 12px; color: #64748b;">
                            ${v.origin_city || ''} → ${v.destination_city || ''}
                          </span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
                
                ${mission.remarks ? `
                  <div style="margin-top: 10px;">
                    <strong style="color: #475569;">Observações:</strong>
                    <div class="notes-box">${mission.remarks}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : '<div class="section"><p style="text-align: center; color: #64748b; padding: 20px;">Nenhuma missão registrada neste serviço.</p></div>'}

        <div class="section">
          <div class="section-title">ALTERAÇÕES E OBSERVAÇÕES</div>
          ${service.type === 'aircraft' ? `
            ${service.notes_aircraft && service.notes_aircraft !== 'Sem alterações' ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #1e40af;">Alterações na Aeronave:</strong>
                <div class="notes-box">${service.notes_aircraft}</div>
              </div>
            ` : ''}
            ${service.notes_materials && service.notes_materials !== 'Sem alterações' ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #1e40af;">Alterações de Materiais:</strong>
                <div class="notes-box">${service.notes_materials}</div>
              </div>
            ` : ''}
            ${service.notes_general && service.notes_general !== 'Sem alterações' ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #1e40af;">Alterações de Caráter Geral:</strong>
                <div class="notes-box">${service.notes_general}</div>
              </div>
            ` : ''}
          ` : service.notes ? `
            <div class="notes-box">${service.notes}</div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p>Sistema FlightLog - Gestão de Voos</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Button
      onClick={generateReport}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      title="Gerar relatório PDF"
    >
      <FileText className="w-4 h-4 mr-2" />
      {isGenerating ? 'Gerando...' : 'Relatório'}
    </Button>
  );
}

export default ServiceReportButton;