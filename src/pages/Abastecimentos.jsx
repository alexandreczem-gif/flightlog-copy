import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Download, Fuel, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { logAction } from "@/components/utils/logger";

import AbastecimentosTable from '../components/data/AbastecimentosTable';

const emptyAbastecimento = {
  date: format(new Date(), 'yyyy-MM-dd'),
  time: format(new Date(), 'HH:mm'),
  aircraft_prefix: '',
  aircraft_designator: '',
  quantity_liters: '',
  uaa_abastecimento: false,
  nota_numero: ''
};

// Mapeamento de prefixos para designativos
const PREFIX_TO_DESIGNATOR = {
  'PRHBZ': 'Arcanjo 01',
  'PRCBH': 'Falcão 08',
  'PRECB': 'Falcão 03',
  'PRBOP': 'Falcão 04',
  'PRRBM': 'Falcão 12',
  'PRRBL': 'Falcão 13',
  'PRRBK': 'Falcão 14',
  'PRRBO': 'Falcão 15'
};

export default function AbastecimentosPage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [formData, setFormData] = useState({ ...emptyAbastecimento, uaa_plate: '' });
  const [today, setToday] = useState('');
  const [uaaList, setUaaList] = useState([]);
  const [uaaFuels, setUaaFuels] = useState({});

  useEffect(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    setToday(`${year}-${month}-${day}`);
  }, []);

  const calculateUAAFuels = async (activeUAAs) => {
    const fuels = {};
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Buscar abastecimentos dos últimos 30 dias para calculo? 
    // Na verdade, o calculo deve ser baseado no lançamento do dia no mapa da força.
    // Se a UAA foi lançada hoje, pega o combustivel inicial dela.
    // E soma/subtrai os abastecimentos de hoje que referenciam essa UAA?
    // O prompt diz: "todos os mostradores de combustível atual da UAA devem fazer menção de cada UAA lançada no mapa da força"
    
    try {
      const todayAbastecimentos = await base44.entities.Abastecimento.filter({ date: todayStr });
      
      for (const uaa of activeUAAs) {
        const initial = Number(uaa.initial_fuel) || 0;
        
        // Abastecimentos ONDE essa UAA abasteceu aeronaves (Saída) -> Como saber qual UAA abasteceu a aeronave?
        // O sistema antigo assumia uma única UAA. Agora tem várias.
        // Se não tem campo "UAA de origem" no abastecimento de aeronave, assumimos que debita da UAA que está operando?
        // Se houver mais de uma UAA operando, precisamos saber de qual saiu.
        // O prompt não pediu campo "UAA de Origem" no abastecimento de aeronave, mas pediu "placa da UAA como dado para ser lançado nos abastecimentos".
        // Isso sugere que TODO abastecimento deve dizer qual UAA está envolvida (seja recebendo ou fornecendo).
        
        // Entradas: Abastecimentos onde uaa_abastecimento = true AND uaa_plate = uaa.name
        const inputs = todayAbastecimentos
          .filter(a => a.uaa_abastecimento && a.uaa_plate === uaa.name)
          .reduce((sum, a) => sum + (Number(a.quantity_liters) || 0), 0);
          
        // Saídas: Abastecimentos onde uaa_abastecimento = false AND uaa_plate = uaa.name
        const outputs = todayAbastecimentos
          .filter(a => !a.uaa_abastecimento && a.uaa_plate === uaa.name)
          .reduce((sum, a) => sum + (Number(a.quantity_liters) || 0), 0);
          
        fuels[uaa.name] = initial + inputs - outputs;
      }
      setUaaFuels(fuels);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar UAAs cadastradas e ativas
      const activeUAAsFromBase = await base44.entities.UAA.filter({ ativa: true });
      
      // Carregar UAAs ativas no mapa da força hoje (para cálculo de combustível)
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const activeUAAsServices = await base44.entities.DailyService.filter({ date: todayStr, type: 'uaa' });
      
      setUaaList(activeUAAsFromBase);

      // Carregar abastecimentos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = format(thirtyDaysAgo, 'yyyy-MM-dd');
      
      const data = await base44.entities.Abastecimento.filter({ date: { "$gte": dateStr } }, '-date');
      setAbastecimentos(data);
      
      await calculateUAAFuels(activeUAAsServices);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAccessAndLoad = async () => {
      try {
        const currentUser = await base44.auth.me();
        const allowedRoles = ["Administrador", "Piloto", "OAT", "TASA"];
        if (currentUser.role !== 'admin' && !allowedRoles.includes(currentUser.flight_log_role)) {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        loadData();
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        navigate(createPageUrl("Dashboard"));
      }
    };
    checkAccessAndLoad();
  }, [navigate]);

  const handleChange = (field, value) => {
    if (field === 'aircraft_prefix') {
      const upperPrefix = value.toUpperCase();
      const designator = PREFIX_TO_DESIGNATOR[upperPrefix];
      
      setFormData({ 
        ...formData, 
        aircraft_prefix: upperPrefix,
        aircraft_designator: designator || formData.aircraft_designator
      });
    } else if (field === 'uaa_abastecimento') {
      // Quando marcar UAA, limpar prefixo e designativo
      setFormData({ 
        ...formData, 
        uaa_abastecimento: value,
        aircraft_prefix: value ? '' : formData.aircraft_prefix,
        aircraft_designator: value ? '' : formData.aircraft_designator
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };
  
  const handleSave = async () => {
    // Validação de campos obrigatórios
    if (!formData.quantity_liters) {
      alert("Por favor, preencha a quantidade de combustível.");
      return;
    }

    if (!formData.uaa_plate) {
      alert("Por favor, selecione a placa da UAA.");
      return;
    }

    if (formData.uaa_abastecimento) {
      // Para abastecimento UAA: quantidade e nota são obrigatórios
      if (!formData.nota_numero) {
        alert("Para abastecimento da UAA, o número da nota é obrigatório.");
        return;
      }
    } else {
      // Para abastecimento de aeronave: quantidade e prefixo são obrigatórios
      if (!formData.aircraft_prefix) {
        alert("Para abastecimento de aeronave, o prefixo é obrigatório.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        quantity_liters: Number(formData.quantity_liters),
      };
      const created = await base44.entities.Abastecimento.create(dataToSave);
      if (created && created.id) {
        await logAction('create', 'Abastecimento', created.id, dataToSave);
      }
      setFormData(emptyAbastecimento);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar abastecimento:", error);
      alert("Erro ao salvar registro. Verifique os dados e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await base44.entities.Abastecimento.update(id, data);
      await logAction('update', 'Abastecimento', id, data);
      loadData();
    } catch (error) {
      console.error("Erro ao atualizar abastecimento:", error);
      alert("Ocorreu um erro ao atualizar o registro.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Abastecimento.delete(id);
      await logAction('delete', 'Abastecimento', id, 'Registro de abastecimento excluído');
      loadData();
    } catch (error) {
      console.error("Erro ao excluir abastecimento:", error);
      alert("Ocorreu um erro ao excluir o registro.");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Buscar TODOS os registros sem filtro de data
      const allData = await base44.entities.Abastecimento.list('-date', 50000);
      
      if (allData.length === 0) {
        alert('Nenhum abastecimento para exportar.');
        return;
      }

      const headers = [
        'Data',
        'Hora',
        'Prefixo Aeronave',
        'Designativo Aeronave',
        'Quantidade (L)',
        'Abastecimento UAA',
        'Placa UAA',
        'Número Nota',
        'Criado Por',
        'Data de Criação'
      ];

      const rows = allData.map(record => [
        record.date || '',
        record.time || '',
        record.aircraft_prefix || '',
        record.aircraft_designator || '',
        record.quantity_liters || '',
        record.uaa_abastecimento ? 'Sim' : 'Não',
        record.uaa_plate || '',
        record.nota_numero || '',
        record.created_by || '',
        record.created_date || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `abastecimentos-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      alert("Ocorreu um erro ao gerar o arquivo CSV: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && abastecimentos.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-1/2 mb-8" />
          <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent className="space-y-4 mt-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><div className="flex justify-end"><Skeleton className="h-10 w-24" /></div></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Registro de Abastecimento</h1>
            <p className="text-slate-600">Adicione um novo registro e visualize os abastecimentos do mês.</p>
          </div>
          <Button onClick={handleExport} disabled={isExporting}><Download className="w-4 h-4 mr-2" />{isExporting ? "Exportando..." : "Exportar Tudo"}</Button>
        </motion.div>

        {/* Cards de Combustível UAA */}
        {Object.keys(uaaFuels).length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(uaaFuels).map(([plateName, fuel]) => (
              <motion.div key={plateName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-600">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-blue-900">{plateName}</p>
                          <p className="text-xs text-slate-500">UAA Operando Hoje</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-900">
                          {fuel.toFixed(0)}
                        </p>
                        <p className="text-xs text-slate-600">Litros</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-xl bg-white border-slate-200 mb-8">
            <CardHeader className="bg-slate-50 border-b"><CardTitle className="flex items-center gap-2"><Fuel className="w-5 h-5 text-red-700" /> Novo Abastecimento</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox 
                  id="uaa_abastecimento" 
                  checked={formData.uaa_abastecimento}
                  onCheckedChange={(checked) => handleChange('uaa_abastecimento', checked)}
                />
                <label
                  htmlFor="uaa_abastecimento"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Abastecimento da UAA (Unidade de Abastecimento Autônoma)
                </label>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div><Label htmlFor="date">Data</Label><Input id="date" type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} required max={today} /></div>
                <div><Label htmlFor="time">Hora</Label><Input id="time" type="time" value={formData.time} onChange={(e) => handleChange('time', e.target.value)} required /></div>
                <div><Label htmlFor="quantity_liters">Quantidade (L)</Label><Input id="quantity_liters" type="number" placeholder="Ex: 500" value={formData.quantity_liters} onChange={(e) => handleChange('quantity_liters', e.target.value)} required /></div>
                
                {!formData.uaa_abastecimento && (
                  <>
                    <div>
                      <Label htmlFor="aircraft_prefix">Prefixo Aeronave</Label>
                      <Input 
                        id="aircraft_prefix" 
                        placeholder="Ex: PRHBZ" 
                        value={formData.aircraft_prefix} 
                        onChange={(e) => handleChange('aircraft_prefix', e.target.value)} 
                        maxLength={5} 
                        required 
                      />
                      <p className="text-xs text-slate-500 mt-1">Digite sem hífen (ex: PRHBZ)</p>
                    </div>
                    <div><Label htmlFor="aircraft_designator">Designativo Aeronave</Label><Input id="aircraft_designator" placeholder="Ex: Falcão 08" value={formData.aircraft_designator} onChange={(e) => handleChange('aircraft_designator', e.target.value)} required /></div>
                  </>
                )}
                
                <div>
                   <Label htmlFor="uaa_plate">Placa da UAA (Origem/Destino) *</Label>
                   {uaaList.length > 0 ? (
                     <Select value={formData.uaa_plate} onValueChange={(v) => handleChange('uaa_plate', v)} required>
                       <SelectTrigger><SelectValue placeholder="Selecione a UAA..." /></SelectTrigger>
                       <SelectContent>
                         {uaaList.map(u => (
                           <SelectItem key={u.id} value={u.plate}>
                             {u.plate} {u.model ? `- ${u.model}` : ''}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   ) : (
                     <Input id="uaa_plate" placeholder="Placa da UAA" value={formData.uaa_plate} onChange={(e) => handleChange('uaa_plate', e.target.value)} className="uppercase"/>
                   )}
                   <p className="text-xs text-slate-500 mt-1">{formData.uaa_abastecimento ? "UAA que recebeu combustível" : "UAA que forneceu combustível"}</p>
                </div>

                {formData.uaa_abastecimento && (
                  <div>
                    <Label htmlFor="nota_numero">Número da Nota</Label>
                    <Input 
                      id="nota_numero" 
                      placeholder="Ex: 12345" 
                      value={formData.nota_numero} 
                      onChange={(e) => handleChange('nota_numero', e.target.value)} 
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4"><Button type="button" onClick={handleSave} disabled={isSaving} className="w-full md:w-auto bg-red-700 hover:bg-red-800 text-white"><Save className="w-4 h-4 mr-2" />{isSaving ? "Salvando..." : "Salvar Registro"}</Button></div>
            </CardContent>
          </Card>

          <Card className="shadow-xl bg-white border-slate-200">
            <CardHeader className="border-b"><CardTitle>Abastecimentos (Últimos 30 dias)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <AbastecimentosTable records={abastecimentos} isLoading={isLoading} onUpdate={handleUpdate} onDelete={handleDelete} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}