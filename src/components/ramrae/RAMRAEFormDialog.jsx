import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDown, Save } from 'lucide-react';
import { generateRAMRAEPDF } from './generateRAMRAEPDF';

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
    ram_rae_estado_mental: victimData.ram_rae_estado_mental || [],
    ram_rae_pupilas: victimData.ram_rae_pupilas || [],
    ram_rae_diagnosticos: victimData.ram_rae_diagnosticos || '',
    ram_rae_anotacoes_enfermagem: victimData.ram_rae_anotacoes_enfermagem || '',
    ram_rae_evolucao: victimData.ram_rae_evolucao || []
  });

  const handleArrayToggle = (field, value) => {
    const current = formData[field] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  const handleSaveAndDownload = async () => {
    await onSave(formData);
    generateRAMRAEPDF(formData);
  };

  const handleDownloadOnly = () => {
    generateRAMRAEPDF(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
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
                <div>
                  <Label>Tipo de Local</Label>
                  <Select value={formData.ram_rae_local_ocorrencia} onValueChange={v => setFormData({...formData, ram_rae_local_ocorrencia: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {['Via Pública', 'Domicílio', 'Local de trabalho', 'Hospital', 'UPA', 'Unid. De Saúde', 'Outros'].map(o => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>

            <FormSection title="Natureza do Chamado">
              <div className="space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                <div>
                  <Label>Detalhes</Label>
                  <Input value={formData.ram_rae_natureza_detalhes} onChange={e => setFormData({...formData, ram_rae_natureza_detalhes: e.target.value})} placeholder="Ex: FAF calibre 9mm, Acidente auto x moto..." />
                </div>
              </div>
            </FormSection>

            <FormSection title="Histórico">
              <div className="space-y-3">
                <div>
                  <Label>Antecedentes</Label>
                  <Textarea value={formData.ram_rae_antecedentes} onChange={e => setFormData({...formData, ram_rae_antecedentes: e.target.value})} className="h-20" />
                </div>
                <div>
                  <Label>Internamentos Anteriores</Label>
                  <Textarea value={formData.ram_rae_internamentos} onChange={e => setFormData({...formData, ram_rae_internamentos: e.target.value})} className="h-20" />
                </div>
                <div>
                  <Label>Medicamentos em Uso</Label>
                  <Textarea value={formData.ram_rae_medicamentos} onChange={e => setFormData({...formData, ram_rae_medicamentos: e.target.value})} className="h-20" />
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
                <div className="flex gap-4">
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
              <div className="mt-2">
                <Label>Expansibilidade</Label>
                <div className="flex gap-4 mt-1">
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
            </FormSection>

            <FormSection title="Exame Neurológico">
              <div className="space-y-2">
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
                  <div className="flex gap-4 mt-1">
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

            <FormSection title="Diagnósticos / Procedimentos / Terapêutico">
              <Textarea value={formData.ram_rae_diagnosticos} onChange={e => setFormData({...formData, ram_rae_diagnosticos: e.target.value})} className="h-32" placeholder="Liste os diagnósticos, procedimentos realizados e medicações administradas..." />
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
    </Dialog>
  );
}