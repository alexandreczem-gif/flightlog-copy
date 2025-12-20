import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDown, Save, PenTool } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { generateRAMRAEPDF } from './generateRAMRAEPDF';
import SignaturePad from './SignaturePad';

const FormSection = ({ title, children }) => (
  <div className="space-y-3 p-4 border rounded-lg bg-slate-50">
    <h4 className="font-semibold text-slate-800">{title}</h4>
    {children}
  </div>
);

export default function RAMRAEFormDialog({ open, onOpenChange, victimData, onSave }) {
  const [formData, setFormData] = useState({
    ...victimData,
    ram_rae_cartao_sus: victimData.ram_rae_cartao_sus || '',
    ram_rae_nome_mae: victimData.ram_rae_nome_mae || '',
    ram_rae_data_nascimento: victimData.ram_rae_data_nascimento || '',
    ram_rae_endereco_ocorrencia: victimData.ram_rae_endereco_ocorrencia || '',
    ram_rae_bairro: victimData.ram_rae_bairro || '',
    ram_rae_local_ocorrencia: victimData.ram_rae_local_ocorrencia || '',
    ram_rae_natureza_chamado: victimData.ram_rae_natureza_chamado || [],
    ram_rae_natureza_detalhes: victimData.ram_rae_natureza_detalhes || '',
    ram_rae_transporte_origem: victimData.ram_rae_transporte_origem || '',
    ram_rae_transporte_servico_medico: victimData.ram_rae_transporte_servico_medico || '',
    ram_rae_transporte_responsavel: victimData.ram_rae_transporte_responsavel || '',
    ram_rae_transporte_motivo: victimData.ram_rae_transporte_motivo || [],
    ram_rae_transporte_motivo_outros: victimData.ram_rae_transporte_motivo_outros || '',
    ram_rae_destino_local: victimData.ram_rae_destino_local || '',
    ram_rae_destino_responsavel: victimData.ram_rae_destino_responsavel || '',
    ram_rae_destino_funcao: victimData.ram_rae_destino_funcao || '',
    ram_rae_destino_assinatura: victimData.ram_rae_destino_assinatura || '',
    ram_rae_antecedentes: victimData.ram_rae_antecedentes || '',
    ram_rae_internamentos: victimData.ram_rae_internamentos || '',
    ram_rae_medicamentos: victimData.ram_rae_medicamentos || '',
    ram_rae_principais_sintomas: victimData.ram_rae_principais_sintomas || '',
    ram_rae_vias_aereas: victimData.ram_rae_vias_aereas || [],
    ram_rae_vias_aereas_obs: victimData.ram_rae_vias_aereas_obs || '',
    ram_rae_respiracao: victimData.ram_rae_respiracao || [],
    ram_rae_ausculta_pulmonar: victimData.ram_rae_ausculta_pulmonar || [],
    ram_rae_expansibilidade: victimData.ram_rae_expansibilidade || [],
    ram_rae_pele: victimData.ram_rae_pele || [],
    ram_rae_pele_outro: victimData.ram_rae_pele_outro || '',
    ram_rae_edema: victimData.ram_rae_edema || [],
    ram_rae_perfusao: victimData.ram_rae_perfusao || [],
    ram_rae_pulso: victimData.ram_rae_pulso || [],
    ram_rae_ausculta_cardiaca: victimData.ram_rae_ausculta_cardiaca || [],
    ram_rae_ausculta_sopro: victimData.ram_rae_ausculta_sopro || '',
    ram_rae_ecg: victimData.ram_rae_ecg || '',
    ram_rae_ecg_alterado: victimData.ram_rae_ecg_alterado || '',
    ram_rae_estado_mental: victimData.ram_rae_estado_mental || [],
    ram_rae_pupilas: victimData.ram_rae_pupilas || [],
    ram_rae_pescoco: victimData.ram_rae_pescoco || [],
    ram_rae_pescoco_outro: victimData.ram_rae_pescoco_outro || '',
    ram_rae_urogenital: victimData.ram_rae_urogenital || [],
    ram_rae_urogenital_giordano: victimData.ram_rae_urogenital_giordano || [],
    ram_rae_urogenital_outro: victimData.ram_rae_urogenital_outro || '',
    ram_rae_abdomen: victimData.ram_rae_abdomen || [],
    ram_rae_abdomen_outros: victimData.ram_rae_abdomen_outros || '',
    ram_rae_gineco_trabalho_parto: victimData.ram_rae_gineco_trabalho_parto || false,
    ram_rae_gineco_semanas: victimData.ram_rae_gineco_semanas || '',
    ram_rae_gineco_g: victimData.ram_rae_gineco_g || '',
    ram_rae_gineco_p: victimData.ram_rae_gineco_p || '',
    ram_rae_gineco_a: victimData.ram_rae_gineco_a || '',
    ram_rae_gineco_abortamento: victimData.ram_rae_gineco_abortamento || false,
    ram_rae_gineco_hemorragia: victimData.ram_rae_gineco_hemorragia || false,
    ram_rae_gineco_malinas: victimData.ram_rae_gineco_malinas || '',
    ram_rae_gineco_outro: victimData.ram_rae_gineco_outro || '',
    ram_rae_parto_tipo: victimData.ram_rae_parto_tipo || [],
    ram_rae_rn_status: victimData.ram_rae_rn_status || [],
    ram_rae_apgar: victimData.ram_rae_apgar || '',
    ram_rae_diagnosticos: victimData.ram_rae_diagnosticos || '',
    ram_rae_anotacoes_enfermagem: victimData.ram_rae_anotacoes_enfermagem || '',
    ram_rae_evolucao: victimData.ram_rae_evolucao || [],
    ram_rae_qta_local_hora: victimData.ram_rae_qta_local_hora || '',
    ram_rae_encaminhamento_hospital: victimData.ram_rae_encaminhamento_hospital || victimData.hospital_destino || '',
    ram_rae_encaminhamento_assinatura: victimData.ram_rae_encaminhamento_assinatura || '',
    ram_rae_medico_nome: victimData.ram_rae_medico_nome || '',
    ram_rae_medico_assinatura: victimData.ram_rae_medico_assinatura || '',
    ram_rae_medico_crm: victimData.ram_rae_medico_crm || '',
    ram_rae_enfermeiro_nome: victimData.ram_rae_enfermeiro_nome || '',
    ram_rae_enfermeiro_assinatura: victimData.ram_rae_enfermeiro_assinatura || '',
    ram_rae_enfermeiro_coren: victimData.ram_rae_enfermeiro_coren || '',
    ram_rae_socorrista: victimData.ram_rae_socorrista || ''
  });

  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [signatureDialog, setSignatureDialog] = useState({ open: false, field: '' });

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await base44.entities.Hospital.list();
        setHospitals(data);
      } catch (error) {
        console.error('Erro ao carregar hospitais:', error);
      }
    };
    if (open) loadHospitals();
  }, [open]);

  useEffect(() => {
    if (formData.cidade_destino) {
      const filtered = hospitals.filter(h => h.municipality === formData.cidade_destino);
      setFilteredHospitals(filtered);
    } else {
      setFilteredHospitals(hospitals);
    }
  }, [formData.cidade_destino, hospitals]);

  const handleArrayToggle = (field, value) => {
    const current = formData[field] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  const handleSignatureSave = (dataURL) => {
    setFormData(prev => ({ ...prev, [signatureDialog.field]: dataURL }));
  };

  const handleSaveAndDownload = async () => {
    await onSave(formData);
    generateRAMRAEPDF(formData);
  };

  const handleDownloadOnly = () => {
    generateRAMRAEPDF(formData);
  };

  const showNaturezaDetalhes = formData.ram_rae_natureza_chamado?.includes('Acidente Trânsito') || 
                                formData.ram_rae_natureza_chamado?.includes('Outros');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Preencher RAM/RAE - {formData.nome_paciente}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            <FormSection title="Identificação do Paciente">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Cartão SUS/Convênio</Label>
                  <Input value={formData.ram_rae_cartao_sus} onChange={e => setFormData({...formData, ram_rae_cartao_sus: e.target.value})} />
                </div>
                <div>
                  <Label>Nome da Mãe</Label>
                  <Input value={formData.ram_rae_nome_mae} onChange={e => setFormData({...formData, ram_rae_nome_mae: e.target.value})} />
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={formData.ram_rae_data_nascimento} onChange={e => setFormData({...formData, ram_rae_data_nascimento: e.target.value})} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Local da Ocorrência">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Endereço</Label>
                  <Input value={formData.ram_rae_endereco_ocorrencia} onChange={e => setFormData({...formData, ram_rae_endereco_ocorrencia: e.target.value})} />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input value={formData.ram_rae_bairro} onChange={e => setFormData({...formData, ram_rae_bairro: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <Label>Tipo de Local</Label>
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mt-1">
                    {['Via Pública', 'Domicílio', 'Local de trabalho', 'Hospital', 'UPA', 'Unid. De Saúde', 'Outros'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_local_ocorrencia === opt}
                          onCheckedChange={() => setFormData({...formData, ram_rae_local_ocorrencia: opt})}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Natureza do Chamado">
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['Acidente Trânsito', 'FAF', 'FAB', 'Trauma', 'Agressão', 'Queda', 'Afogamento', 'Desab/soterramento', 'Eletrocussão', 'Queimadura', 'Clínico', 'Psiquiátrico', 'Pediátrico', 'Gineco/Obstétrico', 'Outros'].map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <Checkbox 
                        checked={formData.ram_rae_natureza_chamado?.includes(opt)}
                        onCheckedChange={() => handleArrayToggle('ram_rae_natureza_chamado', opt)}
                      />
                      <Label className="text-sm">{opt}</Label>
                    </div>
                  ))}
                </div>
                {showNaturezaDetalhes && (
                  <div>
                    <Label>Detalhes</Label>
                    <Input value={formData.ram_rae_natureza_detalhes} onChange={e => setFormData({...formData, ram_rae_natureza_detalhes: e.target.value})} placeholder="Ex: FAF calibre 9mm, Auto x Moto..." />
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <h5 className="font-semibold text-sm mb-3">Transporte Secundário</h5>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Origem</Label>
                      <Input value={formData.ram_rae_transporte_origem} onChange={e => setFormData({...formData, ram_rae_transporte_origem: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Serviço Médico</Label>
                      <Input value={formData.ram_rae_transporte_servico_medico} onChange={e => setFormData({...formData, ram_rae_transporte_servico_medico: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Responsável</Label>
                      <Input value={formData.ram_rae_transporte_responsavel} onChange={e => setFormData({...formData, ram_rae_transporte_responsavel: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Motivo do Transporte</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {['Serviço de maior complexidade', 'Apoio', 'Transferência Simples', 'Outros'].map(opt => (
                          <div key={opt} className="flex items-center gap-2">
                            <Checkbox 
                              checked={formData.ram_rae_transporte_motivo?.includes(opt)}
                              onCheckedChange={() => handleArrayToggle('ram_rae_transporte_motivo', opt)}
                            />
                            <Label className="text-xs">{opt}</Label>
                          </div>
                        ))}
                      </div>
                      {formData.ram_rae_transporte_motivo?.includes('Outros') && (
                        <Input 
                          className="mt-2" 
                          placeholder="Especificar..." 
                          value={formData.ram_rae_transporte_motivo_outros} 
                          onChange={e => setFormData({...formData, ram_rae_transporte_motivo_outros: e.target.value})} 
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-semibold text-sm mb-3">Destino</h5>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Local</Label>
                      <Input value={formData.ram_rae_destino_local} onChange={e => setFormData({...formData, ram_rae_destino_local: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Responsável</Label>
                      <Input value={formData.ram_rae_destino_responsavel} onChange={e => setFormData({...formData, ram_rae_destino_responsavel: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Função</Label>
                      <Input value={formData.ram_rae_destino_funcao} onChange={e => setFormData({...formData, ram_rae_destino_funcao: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs">Assinatura</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSignatureDialog({ open: true, field: 'ram_rae_destino_assinatura' })}
                        className="w-full mt-1"
                      >
                        <PenTool className="w-3 h-3 mr-2" />
                        {formData.ram_rae_destino_assinatura ? 'Editar Assinatura' : 'Assinar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Histórico">
              <div className="space-y-3">
                <div>
                  <Label>Antecedentes</Label>
                  <Input value={formData.ram_rae_antecedentes} onChange={e => setFormData({...formData, ram_rae_antecedentes: e.target.value})} />
                </div>
                <div>
                  <Label>Internamentos Anteriores</Label>
                  <Input value={formData.ram_rae_internamentos} onChange={e => setFormData({...formData, ram_rae_internamentos: e.target.value})} />
                </div>
                <div>
                  <Label>Medicamentos em Uso</Label>
                  <Input value={formData.ram_rae_medicamentos} onChange={e => setFormData({...formData, ram_rae_medicamentos: e.target.value})} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Avaliação Clínica">
              <div>
                <Label>Principais Sintomas / Queixas</Label>
                <Textarea value={formData.ram_rae_principais_sintomas} onChange={e => setFormData({...formData, ram_rae_principais_sintomas: e.target.value})} className="h-24" />
              </div>
            </FormSection>

            <FormSection title="Vias Aéreas">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-3">
                  {['Livre', 'Obstrução parcial', 'Obstrução total', 'Corpo estranho', 'Bronco aspiração'].map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <Checkbox 
                        checked={formData.ram_rae_vias_aereas?.includes(opt)}
                        onCheckedChange={() => handleArrayToggle('ram_rae_vias_aereas', opt)}
                      />
                      <Label className="text-sm">{opt}</Label>
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input value={formData.ram_rae_vias_aereas_obs} onChange={e => setFormData({...formData, ram_rae_vias_aereas_obs: e.target.value})} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Respiração / Ventilação">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Espontânea', 'Dificuldade respiratória', 'Parada respiratória', 'Ritmo irregular', 'Assistida'].map(opt => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox 
                      checked={formData.ram_rae_respiracao?.includes(opt)}
                      onCheckedChange={() => handleArrayToggle('ram_rae_respiracao', opt)}
                    />
                    <Label className="text-sm">{opt}</Label>
                  </div>
                ))}
              </div>
            </FormSection>

            <FormSection title="Ausculta Pulmonar">
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Normal', 'Roncos/sibilos', 'Estertores', 'Diminuição MV', 'Ausência MV'].map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <Checkbox 
                        checked={formData.ram_rae_ausculta_pulmonar?.includes(opt)}
                        onCheckedChange={() => handleArrayToggle('ram_rae_ausculta_pulmonar', opt)}
                      />
                      <Label className="text-sm">{opt}</Label>
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Expansibilidade</Label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {['Normal', 'Superficial', 'Regular', 'Irregular'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_expansibilidade?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_expansibilidade', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Circulação">
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">PELE</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                    {['Normal', 'Palidez', 'Cianose', 'Quente', 'Fria', 'Úmida', 'Seca', 'Outros'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_pele?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_pele', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                  {formData.ram_rae_pele?.includes('Outros') && (
                    <Input 
                      className="mt-2" 
                      placeholder="Especificar..." 
                      value={formData.ram_rae_pele_outro} 
                      onChange={e => setFormData({...formData, ram_rae_pele_outro: e.target.value})} 
                    />
                  )}
                </div>

                <div>
                  <Label className="font-semibold">EDEMA</Label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {['Ausente', 'Palpebral', 'M. Inferiores', 'Anasarca'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_edema?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_edema', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">PERFUSÃO</Label>
                  <div className="flex gap-3 mt-1">
                    {['Normal', 'Retardada'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_perfusao?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_perfusao', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">PULSO</Label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {['Regular', 'Irregular', 'Fino', 'Cheio', 'Ausente'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_pulso?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_pulso', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">AUSCULTA</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {['Normal', 'Hipofonese', 'Atrito pericárdico', 'Arritmia', 'Sopro'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_ausculta_cardiaca?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_ausculta_cardiaca', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                  {formData.ram_rae_ausculta_cardiaca?.includes('Sopro') && (
                    <Input 
                      className="mt-2" 
                      placeholder="Detalhar sopro..." 
                      value={formData.ram_rae_ausculta_sopro} 
                      onChange={e => setFormData({...formData, ram_rae_ausculta_sopro: e.target.value})} 
                    />
                  )}
                </div>

                <div>
                  <Label className="font-semibold">ECG</Label>
                  <div className="flex gap-3 mt-1">
                    {['Não realizado', 'Normal', 'Alterado'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_ecg === opt}
                          onCheckedChange={() => setFormData({...formData, ram_rae_ecg: opt})}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                  {formData.ram_rae_ecg === 'Alterado' && (
                    <Input 
                      className="mt-2" 
                      placeholder="Detalhar alteração..." 
                      value={formData.ram_rae_ecg_alterado} 
                      onChange={e => setFormData({...formData, ram_rae_ecg_alterado: e.target.value})} 
                    />
                  )}
                </div>
              </div>
            </FormSection>

            <FormSection title="Exame Neurológico">
              <div className="space-y-3">
                <div>
                  <Label>Estado Mental</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                    {['Lúcido / Orientado', 'Agitação', 'Sonolência', 'Confusão', 'Coma', 'Convulsão', 'Rigidez de nuca', 'Disartria', 'Afasia'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_estado_mental?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_estado_mental', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Pupilas</Label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {['Isocóricas', 'Anisocóricas', 'Midriáticas', 'Mióticas', 'Fotorreagentes', 'Não reagente'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_pupilas?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_pupilas', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Segmentos">
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">PESCOÇO</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['Normal', 'Turgência jugular', 'Desvio Traquéia', 'Outro'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_pescoco?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_pescoco', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                  {formData.ram_rae_pescoco?.includes('Outro') && (
                    <Input 
                      className="mt-2" 
                      placeholder="Especificar..." 
                      value={formData.ram_rae_pescoco_outro} 
                      onChange={e => setFormData({...formData, ram_rae_pescoco_outro: e.target.value})} 
                    />
                  )}
                </div>

                <div>
                  <Label className="font-semibold">UROGENITAL</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {['Normal', 'Hematúria', 'Anúria', 'Outro'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_urogenital?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_urogenital', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Label className="text-sm">Giordano:</Label>
                    {['D', 'E'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_urogenital_giordano?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_urogenital_giordano', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                  {formData.ram_rae_urogenital?.includes('Outro') && (
                    <Input 
                      className="mt-2" 
                      placeholder="Especificar..." 
                      value={formData.ram_rae_urogenital_outro} 
                      onChange={e => setFormData({...formData, ram_rae_urogenital_outro: e.target.value})} 
                    />
                  )}
                </div>

                <div>
                  <Label className="font-semibold">ABDÔMEN</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                    {['Normal', 'Doloroso/defesa', 'Irritação peritoneal', 'Hepatomegalia', 'Esplenomegalia', 'Ascite', 'Distensão', 'Outros'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_abdomen?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_abdomen', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                  {formData.ram_rae_abdomen?.includes('Outros') && (
                    <Input 
                      className="mt-2" 
                      placeholder="Especificar..." 
                      value={formData.ram_rae_abdomen_outros} 
                      onChange={e => setFormData({...formData, ram_rae_abdomen_outros: e.target.value})} 
                    />
                  )}
                </div>

                <div>
                  <Label className="font-semibold">Gineco/Obstétrico</Label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_gineco_trabalho_parto}
                          onCheckedChange={(checked) => setFormData({...formData, ram_rae_gineco_trabalho_parto: checked})}
                        />
                        <Label className="text-sm">Trabalho de parto</Label>
                      </div>
                      {formData.ram_rae_gineco_trabalho_parto && (
                        <Input 
                          type="number" 
                          placeholder="Semanas" 
                          value={formData.ram_rae_gineco_semanas} 
                          onChange={e => setFormData({...formData, ram_rae_gineco_semanas: e.target.value})} 
                        />
                      )}
                    </div>
                    <div className="flex gap-3 items-center">
                      <Label className="text-sm">G</Label>
                      <Input type="number" className="w-16" value={formData.ram_rae_gineco_g} onChange={e => setFormData({...formData, ram_rae_gineco_g: e.target.value})} />
                      <Label className="text-sm">P</Label>
                      <Input type="number" className="w-16" value={formData.ram_rae_gineco_p} onChange={e => setFormData({...formData, ram_rae_gineco_p: e.target.value})} />
                      <Label className="text-sm">A</Label>
                      <Input type="number" className="w-16" value={formData.ram_rae_gineco_a} onChange={e => setFormData({...formData, ram_rae_gineco_a: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_gineco_abortamento}
                          onCheckedChange={(checked) => setFormData({...formData, ram_rae_gineco_abortamento: checked})}
                        />
                        <Label className="text-sm">Abortamento</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_gineco_hemorragia}
                          onCheckedChange={(checked) => setFormData({...formData, ram_rae_gineco_hemorragia: checked})}
                        />
                        <Label className="text-sm">Hemorragia Vaginal</Label>
                      </div>
                    </div>
                    <Input placeholder="Malinas" value={formData.ram_rae_gineco_malinas} onChange={e => setFormData({...formData, ram_rae_gineco_malinas: e.target.value})} />
                    <Input placeholder="Outro" value={formData.ram_rae_gineco_outro} onChange={e => setFormData({...formData, ram_rae_gineco_outro: e.target.value})} />
                    <div className="grid grid-cols-3 gap-2">
                      {['Parto único', 'Gemelar', 'Líquido meconial'].map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                          <Checkbox 
                            checked={formData.ram_rae_parto_tipo?.includes(opt)}
                            onCheckedChange={() => handleArrayToggle('ram_rae_parto_tipo', opt)}
                          />
                          <Label className="text-sm">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">RN</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['Vivo', 'Morto', 'Dequitação de Placenta'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox 
                          checked={formData.ram_rae_rn_status?.includes(opt)}
                          onCheckedChange={() => handleArrayToggle('ram_rae_rn_status', opt)}
                        />
                        <Label className="text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                  <Input className="mt-2" placeholder="Apgar" value={formData.ram_rae_apgar} onChange={e => setFormData({...formData, ram_rae_apgar: e.target.value})} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Diagnósticos / Procedimentos / Terapêutico">
              <Textarea value={formData.ram_rae_diagnosticos} onChange={e => setFormData({...formData, ram_rae_diagnosticos: e.target.value})} className="h-32" />
            </FormSection>

            <FormSection title="Anotações de Enfermagem">
              <Textarea value={formData.ram_rae_anotacoes_enfermagem} onChange={e => setFormData({...formData, ram_rae_anotacoes_enfermagem: e.target.value})} className="h-32" />
            </FormSection>

            <FormSection title="Evolução / Intercorrências">
              <div className="space-y-2">
                {['QTA no local', 'QTA no trajeto', 'Liberada após atendimento', 'Recusa atendimento', 'Transporte', 'Óbito'].map(opt => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox 
                      checked={formData.ram_rae_evolucao?.includes(opt)}
                      onCheckedChange={() => handleArrayToggle('ram_rae_evolucao', opt)}
                    />
                    <Label className="text-sm">{opt}</Label>
                  </div>
                ))}
                {formData.ram_rae_evolucao?.includes('QTA no local') && (
                  <div>
                    <Label className="text-xs">Horário</Label>
                    <Input 
                      type="time" 
                      value={formData.ram_rae_qta_local_hora} 
                      onChange={e => setFormData({...formData, ram_rae_qta_local_hora: e.target.value})} 
                    />
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection title="Encaminhamento">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Hospital / Unidade de Saúde</Label>
                  <Select 
                    value={formData.ram_rae_encaminhamento_hospital} 
                    onValueChange={v => setFormData({...formData, ram_rae_encaminhamento_hospital: v})}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {filteredHospitals.map(h => (
                        <SelectItem key={h.id} value={h.name}>{h.name} - {h.municipality}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assinatura</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSignatureDialog({ open: true, field: 'ram_rae_encaminhamento_assinatura' })}
                    className="w-full mt-1"
                  >
                    <PenTool className="w-3 h-3 mr-2" />
                    {formData.ram_rae_encaminhamento_assinatura ? 'Editar Assinatura' : 'Assinar'}
                  </Button>
                </div>
              </div>
            </FormSection>

            <FormSection title="Identificação da Equipe">
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Médico</Label>
                  <div className="grid md:grid-cols-3 gap-3 mt-2">
                    <Input placeholder="Nome" value={formData.ram_rae_medico_nome} onChange={e => setFormData({...formData, ram_rae_medico_nome: e.target.value})} />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSignatureDialog({ open: true, field: 'ram_rae_medico_assinatura' })}
                    >
                      <PenTool className="w-3 h-3 mr-2" />
                      {formData.ram_rae_medico_assinatura ? 'Editar Assinatura' : 'Assinar'}
                    </Button>
                    <Input placeholder="CRM" value={formData.ram_rae_medico_crm} onChange={e => setFormData({...formData, ram_rae_medico_crm: e.target.value})} />
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Enfermeiro</Label>
                  <div className="grid md:grid-cols-3 gap-3 mt-2">
                    <Input placeholder="Nome" value={formData.ram_rae_enfermeiro_nome} onChange={e => setFormData({...formData, ram_rae_enfermeiro_nome: e.target.value})} />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSignatureDialog({ open: true, field: 'ram_rae_enfermeiro_assinatura' })}
                    >
                      <PenTool className="w-3 h-3 mr-2" />
                      {formData.ram_rae_enfermeiro_assinatura ? 'Editar Assinatura' : 'Assinar'}
                    </Button>
                    <Input placeholder="COREN" value={formData.ram_rae_enfermeiro_coren} onChange={e => setFormData({...formData, ram_rae_enfermeiro_coren: e.target.value})} />
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Socorrista</Label>
                  <Input className="mt-2" value={formData.ram_rae_socorrista} onChange={e => setFormData({...formData, ram_rae_socorrista: e.target.value})} />
                </div>
              </div>
            </FormSection>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleDownloadOnly}>
            <FileDown className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
          <Button onClick={handleSaveAndDownload} className="bg-red-700 hover:bg-red-800">
            <Save className="w-4 h-4 mr-2" />
            Salvar e Baixar PDF
          </Button>
        </div>
      </DialogContent>

      <SignaturePad 
        open={signatureDialog.open}
        onOpenChange={(open) => setSignatureDialog({ ...signatureDialog, open })}
        onSave={handleSignatureSave}
        title="Assinatura"
      />
    </Dialog>
  );
}