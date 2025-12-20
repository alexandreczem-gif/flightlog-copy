import jsPDF from 'jspdf';

export function generateRAMRAEPDF(victimData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const marginY = 10;
  let currentY = marginY;

  // Helper para adicionar texto
  const addText = (text, x, y, maxWidth, fontSize = 8, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);
    lines.forEach((line, index) => {
      if (y + (index * 3.5) > pageHeight - marginY) {
        doc.addPage();
        y = marginY;
      }
      doc.text(line, x, y + (index * 3.5));
    });
    return y + (lines.length * 3.5);
  };

  // Helper para checkbox
  const addCheckbox = (label, checked, x, y, fontSize = 7) => {
    const boxSize = 2.5;
    doc.rect(x, y - boxSize + 0.5, boxSize, boxSize, 'S');
    if (checked) {
      doc.setFontSize(fontSize);
      doc.text('X', x + boxSize / 2, y + 0.5, { align: 'center', baseline: 'middle' });
    }
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + boxSize + 1.5, y + 0.5, { baseline: 'middle' });
  };

  // Formatar data
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Formatar hora
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  // --- CABEÇALHO ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("SERVIÇO INTEGRADO DE ATENDIMENTO AO TRAUMA EM EMERGÊNCIA", pageWidth / 2, currentY + 5, { align: 'center' });
  currentY += 4;
  doc.text("SERVIÇO DE ATENDIMENTO MÓVEL DE URGÊNCIA - SAMU", pageWidth / 2, currentY + 5, { align: 'center' });
  currentY += 4;
  doc.text("REGISTRO DE ATENDIMENTO MÉDICO E ENFERMAGEM RAM/RAE", pageWidth / 2, currentY + 5, { align: 'center' });
  currentY += 8;

  // --- LINHA 1: Dados Administrativos ---
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Município: ${victimData.cidade_origem || ''}`, marginX, currentY);
  doc.text(`Data: ${formatDate(victimData.data)}`, marginX + 60, currentY);
  doc.text(`Hora: ${formatTime(victimData.departure_time_1 || '')}`, marginX + 85, currentY);
  doc.text(`USA: ${victimData.aeronave || ''}`, marginX + 110, currentY);
  doc.text(`Base: ${victimData.base || ''}`, marginX + 135, currentY);
  doc.text(`Nº Ocorrência: ${victimData.ocorrencia_samu || ''}`, marginX + 165, currentY);
  currentY += 5;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- LINHA 2: Endereço ---
  doc.text(`Endereço da Ocorrência: ${victimData.ram_rae_endereco_ocorrencia || ''}`, marginX, currentY);
  doc.text(`Bairro: ${victimData.ram_rae_bairro || ''}`, marginX + 140, currentY);
  currentY += 5;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- LINHA 3: Dados do Paciente ---
  doc.text(`Nome da vítima: ${victimData.nome_paciente || ''}`, marginX, currentY);
  doc.text(`Idade: ${victimData.idade || ''}`, marginX + 100, currentY);
  doc.text(`Gênero: ${victimData.sexo_paciente || ''}`, marginX + 120, currentY);
  doc.text(`Cartão SUS/Convênio: ${victimData.ram_rae_cartao_sus || ''}`, marginX + 145, currentY);
  currentY += 5;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- LINHA 4: Nome da Mãe ---
  doc.text(`Nome da mãe: ${victimData.ram_rae_nome_mae || ''}`, marginX, currentY);
  doc.text(`Data de nascimento: ${formatDate(victimData.ram_rae_data_nascimento)}`, marginX + 120, currentY);
  currentY += 5;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- LOCAL DA OCORRÊNCIA ---
  doc.text("Local da Ocorrência:", marginX, currentY);
  currentY += 3;
  const locais = ["Via Pública", "Domicílio", "Local de trabalho", "Hospital", "UPA", "Unid. De Saúde", "Outros"];
  let xPos = marginX;
  locais.forEach(local => {
    addCheckbox(local, victimData.ram_rae_local_ocorrencia === local, xPos, currentY);
    xPos += 28;
  });
  currentY += 5;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- NATUREZA DO CHAMADO ---
  doc.setFont('helvetica', 'bold');
  doc.text("NATUREZA DO CHAMADO", marginX, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 3;

  // Coluna 1
  const naturezaCol1 = ["Acidente Trânsito", "FAF", "FAB", "Trauma", "Agressão", "Queda", "Afogamento", "Desab/soterramento"];
  let yNat = currentY;
  naturezaCol1.forEach(nat => {
    addCheckbox(nat, (victimData.ram_rae_natureza_chamado || []).includes(nat), marginX, yNat);
    yNat += 3.5;
  });

  // Coluna 2: Transporte Secundário
  const col2X = marginX + 60;
  let yCol2 = currentY;
  doc.setFont('helvetica', 'bold');
  doc.text("Transporte Secundário", col2X, yCol2);
  doc.setFont('helvetica', 'normal');
  yCol2 += 3;
  doc.text(`Origem: ${victimData.ram_rae_transporte_origem || ''}`, col2X, yCol2);
  yCol2 += 3;
  doc.text(`Serviço Médico: ${victimData.ram_rae_transporte_servico_medico || ''}`, col2X, yCol2);
  yCol2 += 3;
  doc.text(`Responsável: ${victimData.ram_rae_transporte_responsavel || ''}`, col2X, yCol2);
  yCol2 += 3;
  doc.text("Motivo:", col2X, yCol2);
  yCol2 += 3;
  const motivoTransp = ["Serviço de maior complexidade", "Apoio", "Transferência Simples", "Outros"];
  motivoTransp.forEach(mot => {
    addCheckbox(mot, (victimData.ram_rae_transporte_motivo || []).includes(mot), col2X, yCol2, 6);
    yCol2 += 3;
  });

  // Coluna 3: Destino
  const col3X = marginX + 125;
  let yCol3 = currentY;
  doc.setFont('helvetica', 'bold');
  doc.text("Destino", col3X, yCol3);
  doc.setFont('helvetica', 'normal');
  yCol3 += 3;
  doc.text(`Local: ${victimData.ram_rae_destino_local || ''}`, col3X, yCol3);
  yCol3 += 3;
  doc.text(`Responsável: ${victimData.ram_rae_destino_responsavel || ''}`, col3X, yCol3);
  yCol3 += 3;
  doc.text(`Função: ${victimData.ram_rae_destino_funcao || ''}`, col3X, yCol3);
  yCol3 += 3;
  doc.text("Assinatura: __________", col3X, yCol3);

  currentY = Math.max(yNat, yCol2, yCol3) + 2;

  // Continua Natureza do Chamado - linha 2
  const naturezaCol1_2 = ["Eletrocussão", "Queimadura", "Clínico", "Psiquiátrico", "Pediátrico", "Gineco/Obstétrico", "Outros"];
  let xNat2 = marginX;
  naturezaCol1_2.forEach(nat => {
    addCheckbox(nat, (victimData.ram_rae_natureza_chamado || []).includes(nat), xNat2, currentY, 6);
    xNat2 += 28;
  });
  currentY += 5;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- ANTECEDENTES / INTERNAMENTOS / MEDICAMENTOS ---
  doc.text(`Antecedentes: ${victimData.ram_rae_antecedentes || ''}`, marginX, currentY);
  currentY += 3;
  doc.text(`Internamentos anteriores: ${victimData.ram_rae_internamentos || ''}`, marginX, currentY);
  currentY += 3;
  doc.text(`Medicamentos: ${victimData.ram_rae_medicamentos || ''}`, marginX, currentY);
  currentY += 5;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- AVALIAÇÃO E EXAME CLÍNICO ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("AVALIAÇÃO E EXAME CLÍNICO", marginX, currentY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  currentY += 3;
  doc.text(`Principais sintomas / Queixas: ${victimData.ram_rae_principais_sintomas || ''}`, marginX, currentY);
  currentY += 8;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- DADOS VITAIS ---
  doc.text("Dados vitais:", marginX, currentY);
  currentY += 3;
  doc.text(`Hora: ${formatTime(victimData.ram_rae_hora_1)}`, marginX, currentY);
  doc.text(`PA: ${victimData.ram_rae_pa_1 || ''}`, marginX + 20, currentY);
  doc.text(`FC: ${victimData.ram_rae_fc_1 || ''}`, marginX + 40, currentY);
  doc.text(`FR: ${victimData.ram_rae_fr_1 || ''}`, marginX + 55, currentY);
  doc.text(`Temp: ${victimData.ram_rae_temp_1 || ''}`, marginX + 70, currentY);
  doc.text(`SpO2: ${victimData.ram_rae_spo2_1 || ''}`, marginX + 90, currentY);
  doc.text(`Glasgow/RASS: ${victimData.ram_rae_glasgow_rass_1 || ''}`, marginX + 110, currentY);
  doc.text(`Glicemia: ${victimData.ram_rae_glicemia_1 || ''}`, marginX + 145, currentY);
  doc.text(`Escala de Trauma: ${victimData.ram_rae_escala_trauma_1 || ''}`, marginX + 170, currentY);
  currentY += 3;
  doc.text(`Hora: ${formatTime(victimData.ram_rae_hora_2)}`, marginX, currentY);
  doc.text(`PA: ${victimData.ram_rae_pa_2 || ''}`, marginX + 20, currentY);
  doc.text(`FC: ${victimData.ram_rae_fc_2 || ''}`, marginX + 40, currentY);
  doc.text(`FR: ${victimData.ram_rae_fr_2 || ''}`, marginX + 55, currentY);
  doc.text(`Temp: ${victimData.ram_rae_temp_2 || ''}`, marginX + 70, currentY);
  doc.text(`SpO2: ${victimData.ram_rae_spo2_2 || ''}`, marginX + 90, currentY);
  doc.text(`Glasgow/RASS: ${victimData.ram_rae_glasgow_rass_2 || ''}`, marginX + 110, currentY);
  doc.text(`Glicemia: ${victimData.ram_rae_glicemia_2 || ''}`, marginX + 145, currentY);
  doc.text(`Escala de Trauma: ${victimData.ram_rae_escala_trauma_2 || ''}`, marginX + 170, currentY);
  doc.text(`NEWS: ${victimData.ram_rae_news_2 || ''}`, marginX + 180, currentY);
  currentY += 5;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- VIAS AÉREAS ---
  doc.text("Vias aéreas", marginX, currentY);
  currentY += 3;
  const viasAereas = ["Livre", "Obstrução parcial", "Obstrução total", "Corpo estranho", "Bronco aspiração"];
  xPos = marginX;
  viasAereas.forEach(via => {
    addCheckbox(via, (victimData.ram_rae_vias_aereas || []).includes(via), xPos, currentY, 6);
    xPos += 38;
  });
  currentY += 3;
  doc.text(`Obs: ${victimData.ram_rae_vias_aereas_obs || ''}`, marginX, currentY);
  currentY += 5;

  // --- RESPIRAÇÃO / VENTILAÇÃO (Coluna 2) ---
  const respY = currentY - 11;
  const respX = marginX + 80;
  doc.text("Respiração / Ventilação", respX, respY);
  let yResp = respY + 3;
  const respiracao = ["Espontânea", "Dificuldade respiratória", "Parada respiratória", "Ritmo irregular", "Assistida"];
  respiracao.forEach(resp => {
    addCheckbox(resp, (victimData.ram_rae_respiracao || []).includes(resp), respX, yResp, 6);
    yResp += 3;
  });

  // --- AUSCULTA PULMONAR (Coluna 3) ---
  const auscultaY = currentY - 11;
  const auscultaX = marginX + 130;
  doc.text("Ausculta pulmonar", auscultaX, auscultaY);
  let yAusculta = auscultaY + 3;
  const ausculta = ["Normal", "Roncos/sibilos", "Estertores", "Diminuição MV", "Ausência MV"];
  ausculta.forEach(ausc => {
    addCheckbox(ausc, (victimData.ram_rae_ausculta_pulmonar || []).includes(ausc), auscultaX, yAusculta, 6);
    yAusculta += 3;
  });
  doc.text("Expansibilidade:", auscultaX, yAusculta);
  yAusculta += 3;
  const expansibilidade = ["Normal", "Superficial", "Regular", "Irregular"];
  expansibilidade.forEach(exp => {
    addCheckbox(exp, (victimData.ram_rae_expansibilidade || []).includes(exp), auscultaX, yAusculta, 6);
    yAusculta += 3;
  });

  currentY = Math.max(currentY, yResp, yAusculta) + 2;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- CIRCULAÇÃO ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("CIRCULAÇÃO", marginX, currentY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  currentY += 3;

  // PELE (Coluna 1)
  doc.text("PELE:", marginX, currentY);
  let yPele = currentY + 3;
  const pele = ["Normal", "Palidez", "Cianose", "Quente", "Fria", "Úmida", "Seca"];
  pele.forEach(p => {
    addCheckbox(p, (victimData.ram_rae_pele || []).includes(p), marginX, yPele, 6);
    yPele += 3;
  });
  doc.text("Outros: __________", marginX, yPele);
  yPele += 4;

  // EDEMA
  doc.text("EDEMA:", marginX, yPele);
  yPele += 3;
  const edema = ["Ausente", "Palpebral", "M. Inferiores", "Anasarca"];
  edema.forEach(e => {
    addCheckbox(e, (victimData.ram_rae_edema || []).includes(e), marginX, yPele, 6);
    yPele += 3;
  });

  // PULSO (Coluna 2)
  const pulsoX = marginX + 65;
  let yPulso = currentY;
  doc.text("PULSO:", pulsoX, yPulso);
  yPulso += 3;
  const pulso = ["Regular", "Irregular", "Fino", "Cheio", "Ausente"];
  pulso.forEach(p => {
    addCheckbox(p, (victimData.ram_rae_pulso || []).includes(p), pulsoX, yPulso, 6);
    yPulso += 3;
  });

  // AUSCULTA CARDÍACA
  doc.text("AUSCULTA:", pulsoX, yPulso);
  yPulso += 3;
  const auscultaCard = ["Normal", "Hipofonese", "Atrito pericárdico", "Arritmia", "Sopro"];
  auscultaCard.forEach(a => {
    addCheckbox(a, (victimData.ram_rae_ausculta_cardiaca || []).includes(a), pulsoX, yPulso, 6);
    yPulso += 3;
  });

  // ECG
  doc.text("ECG:", pulsoX, yPulso);
  yPulso += 3;
  const ecg = ["Não realizado", "Normal", "Alterado"];
  ecg.forEach(e => {
    addCheckbox(e, victimData.ram_rae_ecg === e, pulsoX, yPulso, 6);
    yPulso += 3;
  });

  currentY = Math.max(yPele, yPulso) + 2;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- EXAME NEUROLÓGICO ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("Exame neurológico:", marginX, currentY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  currentY += 3;

  const estadoMental = ["Lúcido / Orientado", "Agitação", "Sonolência", "Confusão", "Coma", "Convulsão", "Rigidez de nuca", "Disartria", "Afasia"];
  xPos = marginX;
  let yEstado = currentY;
  estadoMental.forEach((estado, idx) => {
    addCheckbox(estado, (victimData.ram_rae_estado_mental || []).includes(estado), xPos, yEstado, 6);
    xPos += 28;
    if ((idx + 1) % 3 === 0) {
      xPos = marginX;
      yEstado += 3;
    }
  });
  currentY = yEstado + 3;

  doc.text("Pupilas:", marginX, currentY);
  currentY += 3;
  const pupilas = ["Isocóricas", "Anisocóricas", "Midriáticas", "Mióticas", "Fotorreagentes", "Não reagente"];
  xPos = marginX;
  pupilas.forEach(pup => {
    addCheckbox(pup, (victimData.ram_rae_pupilas || []).includes(pup), xPos, currentY, 6);
    xPos += 32;
  });
  currentY += 5;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- SEGMENTOS ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("Segmentos", marginX, currentY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  currentY += 3;

  // PESCOÇO (Coluna 1)
  doc.text("PESCOÇO:", marginX, currentY);
  let yPescoco = currentY + 3;
  const pescoco = ["Normal", "Turgência jugular", "Desvio Traquéia", "Outro"];
  pescoco.forEach(p => {
    addCheckbox(p, (victimData.ram_rae_pescoco || []).includes(p), marginX, yPescoco, 6);
    yPescoco += 3;
  });

  // UROGENITAL
  doc.text("UROGENITAL:", marginX, yPescoco);
  yPescoco += 3;
  const urogenital = ["Normal", "Hematúria", "Anúria"];
  urogenital.forEach(u => {
    addCheckbox(u, (victimData.ram_rae_urogenital || []).includes(u), marginX, yPescoco, 6);
    yPescoco += 3;
  });
  doc.text("Giordano:", marginX, yPescoco);
  addCheckbox("D", (victimData.ram_rae_urogenital_giordano || []).includes("D"), marginX + 20, yPescoco, 6);
  addCheckbox("E", (victimData.ram_rae_urogenital_giordano || []).includes("E"), marginX + 28, yPescoco, 6);
  yPescoco += 3;
  doc.text("Outro: __________", marginX, yPescoco);
  yPescoco += 4;

  // ABDÔMEN
  doc.text("ABDÔMEN:", marginX, yPescoco);
  yPescoco += 3;
  const abdomen = ["Normal", "Doloroso/defesa", "Irritação peritoneal", "Ascite", "Distensão"];
  abdomen.forEach(a => {
    addCheckbox(a, (victimData.ram_rae_abdomen || []).includes(a), marginX, yPescoco, 6);
    yPescoco += 3;
  });
  doc.text("Outros: __________", marginX, yPescoco);

  // Gineco/Obstétrico (Coluna 2)
  const ginecoX = marginX + 70;
  let yGineco = currentY;
  doc.text("Gineco/Obstétrico", ginecoX, yGineco);
  yGineco += 3;
  addCheckbox("Trabalho de parto", victimData.ram_rae_gineco_trabalho_parto, ginecoX, yGineco, 6);
  doc.text(`semanas: ${victimData.ram_rae_gineco_semanas || ''}`, ginecoX + 40, yGineco);
  yGineco += 3;
  doc.text(`G: ${victimData.ram_rae_gineco_g || ''} P: ${victimData.ram_rae_gineco_p || ''} A: ${victimData.ram_rae_gineco_a || ''}`, ginecoX, yGineco);
  yGineco += 3;
  addCheckbox("Abortamento", victimData.ram_rae_gineco_abortamento, ginecoX, yGineco, 6);
  yGineco += 3;
  addCheckbox("Hemorragia vaginal", victimData.ram_rae_gineco_hemorragia, ginecoX, yGineco, 6);
  yGineco += 3;
  doc.text(`Malinas: ${victimData.ram_rae_gineco_malinas || ''}`, ginecoX, yGineco);
  yGineco += 3;
  const partoTipo = ["Parto único", "Gemelar", "Líquido meconial"];
  partoTipo.forEach(p => {
    addCheckbox(p, (victimData.ram_rae_parto_tipo || []).includes(p), ginecoX, yGineco, 6);
    yGineco += 3;
  });

  // RN (Coluna 3)
  const rnX = marginX + 135;
  let yRn = currentY;
  doc.text("RN", rnX, yRn);
  yRn += 3;
  const rnStatus = ["Vivo", "Morto", "Dequitação de Placenta"];
  rnStatus.forEach(r => {
    addCheckbox(r, (victimData.ram_rae_rn_status || []).includes(r), rnX, yRn, 6);
    yRn += 3;
  });
  doc.text(`Apgar: ${victimData.ram_rae_apgar || ''}`, rnX, yRn);

  currentY = Math.max(yPescoco, yGineco, yRn) + 5;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- DIAGNÓSTICOS / PROCEDIMENTOS ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("DIAGNÓSTICOS / PROCEDIMENTOS / TERAPÊUTICO", marginX, currentY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  currentY += 3;
  currentY = addText(victimData.ram_rae_diagnosticos || '', marginX, currentY, (pageWidth / 2) - 20);
  currentY += 5;

  // --- ANOTAÇÕES DE ENFERMAGEM (Coluna 2) ---
  const anotY = currentY - 30;
  const anotX = marginX + 100;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("ANOTAÇÕES DE ENFERMAGEM", anotX, anotY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const anotEndY = addText(victimData.ram_rae_anotacoes_enfermagem || '', anotX, anotY + 3, (pageWidth / 2) - 20);
  currentY = Math.max(currentY, anotEndY) + 2;

  // Linha divisória
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // --- EVOLUÇÃO / INTERCORRÊNCIAS ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("EVOLUÇÃO / INTERCORRÊNCIAS", marginX, currentY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  currentY += 3;
  const evolucao = ["QTA no local", "QTA no trajeto", "Liberada após atendimento", "Recusa atendimento", "Transporte", "Óbito"];
  let yEvolucao = currentY;
  evolucao.forEach(e => {
    addCheckbox(e, (victimData.ram_rae_evolucao || []).includes(e), marginX, yEvolucao, 6);
    yEvolucao += 3;
  });

  // --- ENCAMINHAMENTO (Coluna 2) ---
  const encamX = marginX + 80;
  let yEncam = currentY;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("ENCAMINHAMENTO", encamX, yEncam);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  yEncam += 3;
  doc.text(`Hospital / Unidade de saúde: ${victimData.ram_rae_encaminhamento_hospital || ''}`, encamX, yEncam);
  yEncam += 8;
  doc.text("Assinatura: __________", encamX, yEncam);

  // --- IDENTIFICAÇÃO DA EQUIPE (Coluna 3) ---
  const equipeX = marginX + 140;
  let yEquipe = currentY;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("IDENTIFICAÇÃO DA EQUIPE", equipeX, yEquipe);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  yEquipe += 3;
  doc.text(`Médico: ${victimData.ram_rae_medico_nome || ''}`, equipeX, yEquipe);
  yEquipe += 3;
  doc.text(`Assinatura/CRM: ${victimData.ram_rae_medico_crm || ''}`, equipeX, yEquipe);
  yEquipe += 4;
  doc.text(`Enfermeiro: ${victimData.ram_rae_enfermeiro_nome || ''}`, equipeX, yEquipe);
  yEquipe += 3;
  doc.text(`Assinatura/COREN: ${victimData.ram_rae_enfermeiro_coren || ''}`, equipeX, yEquipe);
  yEquipe += 4;
  doc.text(`Socorrista: ${victimData.ram_rae_socorrista || ''}`, equipeX, yEquipe);

  currentY = Math.max(yEvolucao, yEncam, yEquipe) + 5;

  // Rodapé
  doc.setFontSize(6);
  doc.text("1ª VIA SAMU - 2ª VIA HOSPITAL", pageWidth - marginX - 30, pageHeight - 5);

  const fileName = `RAM-RAE_${victimData.nome_paciente}_${formatDate(victimData.data)}.pdf`;
  doc.save(fileName);
}