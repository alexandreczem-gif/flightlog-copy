import jsPDF from 'jspdf';

export function generateRAMRAEPDF(victimData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let yPos = margin;

  // Helper para adicionar texto com quebra de linha
  const addText = (text, x, y, maxWidth, fontSize = 10, isBold = false) => {
    doc.setFontSize(fontSize);
    if (isBold) doc.setFont(undefined, 'bold');
    else doc.setFont(undefined, 'normal');
    
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line, index) => {
      if (y + (index * 5) > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, x, y + (index * 5));
    });
    return y + (lines.length * 5);
  };

  // Helper para checkbox
  const addCheckbox = (label, checked, x, y) => {
    doc.rect(x, y - 3, 3, 3);
    if (checked) {
      doc.text('X', x + 0.5, y);
    }
    doc.setFontSize(9);
    doc.text(label, x + 5, y);
  };

  // Cabeçalho
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('REGISTRO DE ATENDIMENTO MÉDICO E ENFERMAGEM', pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  doc.setFontSize(12);
  doc.text('RAM/RAE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Dados administrativos
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  doc.text(`Município: ${victimData.cidade_origem || ''}`, margin, yPos);
  doc.text(`Data: ${formatDate(victimData.data)}`, margin + 80, yPos);
  doc.text(`Base: ${victimData.base || ''}`, margin + 130, yPos);
  yPos += 6;
  doc.text(`Nº Ocorrência: ${victimData.ocorrencia_samu || ''}`, margin, yPos);
  doc.text(`USA: ${victimData.aeronave || ''}`, margin + 80, yPos);
  yPos += 8;

  // Endereço da Ocorrência
  doc.text(`Endereço: ${victimData.ram_rae_endereco_ocorrencia || ''}`, margin, yPos);
  yPos += 6;
  doc.text(`Bairro: ${victimData.ram_rae_bairro || ''}`, margin, yPos);
  yPos += 8;

  // Dados do paciente
  doc.setFont(undefined, 'bold');
  doc.text('DADOS DO PACIENTE', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  doc.text(`Nome: ${victimData.nome_paciente}`, margin, yPos);
  yPos += 6;
  doc.text(`Idade: ${victimData.idade || ''}`, margin, yPos);
  doc.text(`Gênero: ${victimData.sexo_paciente === 'M' ? 'Masculino' : victimData.sexo_paciente === 'F' ? 'Feminino' : 'N/A'}`, margin + 40, yPos);
  doc.text(`Cartão SUS: ${victimData.ram_rae_cartao_sus || ''}`, margin + 90, yPos);
  yPos += 6;
  doc.text(`Nome da Mãe: ${victimData.ram_rae_nome_mae || ''}`, margin, yPos);
  doc.text(`Data Nascimento: ${formatDate(victimData.ram_rae_data_nascimento)}`, margin + 100, yPos);
  yPos += 8;

  // Local da Ocorrência
  doc.setFont(undefined, 'bold');
  doc.text('LOCAL DA OCORRÊNCIA', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  const locais = ['Via Pública', 'Domicílio', 'Local de trabalho', 'Hospital', 'UPA', 'Unid. De Saúde', 'Outros'];
  let xPos = margin;
  locais.forEach(local => {
    addCheckbox(local, victimData.ram_rae_local_ocorrencia === local, xPos, yPos);
    xPos += 35;
    if (xPos > pageWidth - 40) {
      xPos = margin;
      yPos += 5;
    }
  });
  yPos += 8;

  // Natureza do Chamado
  doc.setFont(undefined, 'bold');
  doc.text('NATUREZA DO CHAMADO', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  const naturezas = victimData.ram_rae_natureza_chamado || [];
  const naturezaOpts = ['Acidente Trânsito', 'FAF', 'FAB', 'Trauma', 'Agressão', 'Queda', 'Afogamento', 'Clínico', 'Psiquiátrico', 'Outros'];
  xPos = margin;
  naturezaOpts.forEach(nat => {
    addCheckbox(nat, naturezas.includes(nat), xPos, yPos);
    xPos += 35;
    if (xPos > pageWidth - 40) {
      xPos = margin;
      yPos += 5;
    }
  });
  yPos += 6;
  if (victimData.ram_rae_natureza_detalhes) {
    doc.text(`Detalhes: ${victimData.ram_rae_natureza_detalhes}`, margin, yPos);
    yPos += 6;
  }
  yPos += 8;

  // Antecedentes
  if (victimData.ram_rae_antecedentes) {
    doc.setFont(undefined, 'bold');
    doc.text('ANTECEDENTES', margin, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    yPos = addText(victimData.ram_rae_antecedentes, margin, yPos, pageWidth - 2 * margin);
    yPos += 4;
  }

  // Internamentos
  if (victimData.ram_rae_internamentos) {
    doc.setFont(undefined, 'bold');
    doc.text('INTERNAMENTOS ANTERIORES', margin, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    yPos = addText(victimData.ram_rae_internamentos, margin, yPos, pageWidth - 2 * margin);
    yPos += 4;
  }

  // Medicamentos
  if (victimData.ram_rae_medicamentos) {
    doc.setFont(undefined, 'bold');
    doc.text('MEDICAMENTOS', margin, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    yPos = addText(victimData.ram_rae_medicamentos, margin, yPos, pageWidth - 2 * margin);
    yPos += 4;
  }

  // Nova página para avaliação clínica
  doc.addPage();
  yPos = margin;

  // Principais sintomas
  doc.setFont(undefined, 'bold');
  doc.text('PRINCIPAIS SINTOMAS / QUEIXAS', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  if (victimData.ram_rae_principais_sintomas) {
    yPos = addText(victimData.ram_rae_principais_sintomas, margin, yPos, pageWidth - 2 * margin);
  }
  yPos += 8;

  // Dados vitais
  doc.setFont(undefined, 'bold');
  doc.text('DADOS VITAIS', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  doc.text(`PA: ${victimData.pressao_arterial_sistolica || ''}/${''} mmHg`, margin, yPos);
  doc.text(`FC: ${victimData.frequencia_cardiaca || ''} bpm`, margin + 50, yPos);
  doc.text(`Glasgow: ${victimData.glasgow || ''}`, margin + 90, yPos);
  doc.text(`SpO2: ${victimData.ram_rae_spo2_1 || ''}%`, margin + 130, yPos);
  yPos += 8;

  // Vias aéreas
  doc.setFont(undefined, 'bold');
  doc.text('VIAS AÉREAS', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  const viasAereas = victimData.ram_rae_vias_aereas || [];
  xPos = margin;
  ['Livre', 'Obstrução parcial', 'Obstrução total', 'Corpo estranho'].forEach(opt => {
    addCheckbox(opt, viasAereas.includes(opt), xPos, yPos);
    xPos += 40;
  });
  yPos += 6;
  if (victimData.ram_rae_vias_aereas_obs) {
    doc.text(`Obs: ${victimData.ram_rae_vias_aereas_obs}`, margin, yPos);
    yPos += 6;
  }
  yPos += 6;

  // Respiração
  doc.setFont(undefined, 'bold');
  doc.text('RESPIRAÇÃO / VENTILAÇÃO', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  const respiracao = victimData.ram_rae_respiracao || [];
  xPos = margin;
  ['Espontânea', 'Dificuldade respiratória', 'Parada respiratória', 'Assistida'].forEach(opt => {
    addCheckbox(opt, respiracao.includes(opt), xPos, yPos);
    xPos += 45;
  });
  yPos += 8;

  // Ausculta pulmonar
  doc.setFont(undefined, 'bold');
  doc.text('AUSCULTA PULMONAR', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  const ausculta = victimData.ram_rae_ausculta_pulmonar || [];
  xPos = margin;
  ['Normal', 'Roncos/sibilos', 'Estertores', 'Diminuição MV'].forEach(opt => {
    addCheckbox(opt, ausculta.includes(opt), xPos, yPos);
    xPos += 40;
  });
  yPos += 8;

  // Exame neurológico
  doc.setFont(undefined, 'bold');
  doc.text('EXAME NEUROLÓGICO', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  const estadoMental = victimData.ram_rae_estado_mental || [];
  xPos = margin;
  ['Lúcido / Orientado', 'Agitação', 'Sonolência', 'Confusão', 'Coma'].forEach(opt => {
    addCheckbox(opt, estadoMental.includes(opt), xPos, yPos);
    xPos += 38;
    if (xPos > pageWidth - 40) {
      xPos = margin;
      yPos += 5;
    }
  });
  yPos += 6;
  
  doc.text('PUPILAS:', margin, yPos);
  const pupilas = victimData.ram_rae_pupilas || [];
  xPos = margin + 20;
  ['Isocóricas', 'Anisocóricas', 'Fotorreagentes'].forEach(opt => {
    addCheckbox(opt, pupilas.includes(opt), xPos, yPos);
    xPos += 40;
  });
  yPos += 10;

  // Diagnósticos / Procedimentos
  doc.setFont(undefined, 'bold');
  doc.text('DIAGNÓSTICOS / PROCEDIMENTOS / TERAPÊUTICO', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  if (victimData.ram_rae_diagnosticos) {
    yPos = addText(victimData.ram_rae_diagnosticos, margin, yPos, pageWidth - 2 * margin);
  }
  yPos += 8;

  // Anotações de enfermagem
  doc.setFont(undefined, 'bold');
  doc.text('ANOTAÇÕES DE ENFERMAGEM', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  if (victimData.ram_rae_anotacoes_enfermagem) {
    yPos = addText(victimData.ram_rae_anotacoes_enfermagem, margin, yPos, pageWidth - 2 * margin);
  }
  yPos += 8;

  // Evolução
  doc.setFont(undefined, 'bold');
  doc.text('EVOLUÇÃO / INTERCORRÊNCIAS', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  const evolucao = victimData.ram_rae_evolucao || [];
  xPos = margin;
  ['QTA no local', 'QTA no trajeto', 'Liberada após atendimento', 'Transporte', 'Óbito'].forEach(opt => {
    addCheckbox(opt, evolucao.includes(opt), xPos, yPos);
    xPos += 45;
    if (xPos > pageWidth - 40) {
      xPos = margin;
      yPos += 5;
    }
  });
  yPos += 10;

  // Encaminhamento
  doc.setFont(undefined, 'bold');
  doc.text('ENCAMINHAMENTO', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  doc.text(`Hospital/Unidade: ${victimData.hospital_destino || ''}`, margin, yPos);
  yPos += 6;
  doc.text(`Cidade: ${victimData.cidade_destino || ''}`, margin, yPos);
  yPos += 10;

  // Identificação da equipe
  doc.setFont(undefined, 'bold');
  doc.text('IDENTIFICAÇÃO DA EQUIPE', margin, yPos);
  yPos += 6;
  doc.setFont(undefined, 'normal');
  doc.text(`Médico/CRM: ${victimData.ram_rae_medico_assinatura || ''} / ${victimData.ram_rae_medico_crm || ''}`, margin, yPos);
  yPos += 6;
  doc.text(`Enfermeiro/COREN: ${victimData.ram_rae_enfermeiro_assinatura || ''} / ${victimData.ram_rae_enfermeiro_coren || ''}`, margin, yPos);
  yPos += 6;
  doc.text(`Socorrista: ${victimData.ram_rae_socorrista || ''}`, margin, yPos);
  yPos += 6;
  doc.text(`OSM: ${victimData.osm_1 || ''} ${victimData.osm_2 ? '/ ' + victimData.osm_2 : ''}`, margin, yPos);

  // Salvar PDF
  const fileName = `RAM-RAE_${victimData.nome_paciente}_${victimData.data}.pdf`;
  doc.save(fileName);
}