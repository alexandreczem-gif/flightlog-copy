import React, { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, PowerOff, Truck, Plane, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { logAction } from "@/components/utils/logger";
import { ServiceReportButton } from '@/components/reports/ServiceReport';
import { MultiServiceReport } from '@/components/reports/MultiServiceReport';

const AIRCRAFT_OPTIONS = ["Arcanjo 01", "Falcão 01", "Falcão 03", "Falcão 04", "Falcão 07", "Falcão 08", "Falcão 12", "Falcão 13", "Falcão 14", "Falcão 15"];
const BASE_OPTIONS = ["Litoral Resgate", "Litoral Policial", "Curitiba Resgate", "Curitiba Policial", "Londrina Policial", "Cascavel Policial", "Umuarama Policial"];

export default function MapaDaForca() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("aircraft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [todayServices, setTodayServices] = useState([]);
  const [tripulantes, setTripulantes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [uaaFuels, setUaaFuels] = useState({});
  const [uaaList, setUaaList] = useState([]);
  
  // Form States
  const [aircraftForm, setAircraftForm] = useState({
    name: "",
    base: "",
    start_time: "07:30",
    end_time: "18:30",
    commander: "",
    copilot: "",
    oat_1: "",
    oat_2: "",
    oat_3: "",
    osm_1: "",
    osm_2: "",
    tasa: ""
  });

  const [uaaForm, setUaaForm] = useState({
    name: "", // Placa
    base: "",
    start_time: "07:30",
    end_time: "18:30",
    initial_fuel: "",
    drained_fuel: "",
    tasa: ""
  });

  const [showInitialFuel, setShowInitialFuel] = useState(false);
  const [suggestedFuel, setSuggestedFuel] = useState(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    };
    init();
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [services, tripulantesList, abastecimentos, uaas] = await Promise.all([
        base44.entities.DailyService.filter({ status: 'active' }),
        base44.entities.Tripulante.list(),
        base44.entities.Abastecimento.filter({ date: todayStr }),
        base44.entities.UAA.filter({ ativa: true })
      ]);
      setTodayServices(services);
      setTripulantes(tripulantesList);
      setUaaList(uaas);
      
      // Calcular combustível remanescente para cada UAA ativa
      const fuels = {};
      services.filter(s => s.type === 'uaa' && s.status === 'active').forEach(uaa => {
        const initial = Number(uaa.initial_fuel) || 0;
        const drained = Number(uaa.drained_fuel) || 0;
        
        const inputs = abastecimentos
          .filter(a => a.uaa_abastecimento && a.uaa_plate === uaa.name)
          .reduce((sum, a) => sum + (Number(a.quantity_liters) || 0), 0);
          
        const outputs = abastecimentos
          .filter(a => !a.uaa_abastecimento && a.uaa_plate === uaa.name)
          .reduce((sum, a) => sum + (Number(a.quantity_liters) || 0), 0);
          
        fuels[uaa.id] = initial + inputs - outputs - drained;
      });
      setUaaFuels(fuels);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableUsers = (role) => {
    return tripulantes.filter(t => t.funcao === role);
  };

  const checkOverlap = (name, start, end) => {
    // Check overlap for same resource name ON THE SAME DATE
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);

    const overlaps = todayServices.filter(s => 
      s.name === name && 
      s.date === todayStr &&
      s.status === 'active' &&
      (
        (timeToMinutes(s.start_time) < endMinutes && timeToMinutes(s.end_time) > startMinutes)
      )
    );

    return overlaps.length > 0;
  };

  const timeToMinutes = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getNextTeamLabel = (name) => {
    const existing = todayServices.filter(s => s.name === name);
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    return labels[existing.length] || 'Z';
  };

  const handleAddAircraft = async () => {
    if (!aircraftForm.name || !aircraftForm.base || !aircraftForm.start_time || !aircraftForm.commander) {
      alert("Preencha os campos obrigatórios (Aeronave, Base, Horário, Comandante)");
      return;
    }

    if (checkOverlap(aircraftForm.name, aircraftForm.start_time, aircraftForm.end_time)) {
      alert("Conflito de horário! Já existe um serviço ativo para esta aeronave neste período.");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        date: todayStr,
        type: 'aircraft',
        name: aircraftForm.name,
        base: aircraftForm.base,
        start_time: aircraftForm.start_time,
        end_time: aircraftForm.end_time,
        team: getNextTeamLabel(aircraftForm.name),
        status: 'active',
        commander: aircraftForm.commander,
        copilot: aircraftForm.copilot,
        oat_1: aircraftForm.oat_1,
        oat_2: aircraftForm.oat_2,
        oat_3: aircraftForm.oat_3,
        osm_1: aircraftForm.osm_1,
        osm_2: aircraftForm.osm_2,
        tasa: aircraftForm.tasa,
        notes_aircraft: "Sem alterações",
        notes_materials: "Sem alterações",
        notes_general: "Sem alterações"
      };

      const created = await base44.entities.DailyService.create(data);
      if (created && created.id) {
        await logAction('create', 'DailyService', created.id, `Lançamento Aeronave ${data.name} Equipe ${data.team}`);
      }
      
      setAircraftForm({ ...aircraftForm, commander: "", copilot: "", oat_1: "", oat_2: "", oat_3: "", osm_1: "", osm_2: "", tasa: "" });
      loadData();
      alert("Aeronave lançada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao lançar aeronave.");
    } finally {
      setIsSaving(false);
    }
  };

  const checkPreviousFuel = async () => {
    if (!uaaForm.name) {
      alert("Preencha a placa da UAA primeiro");
      return;
    }

    try {
      // Buscar último serviço desta UAA
      const allServices = await base44.entities.DailyService.filter({ 
        type: 'uaa', 
        name: uaaForm.name.toUpperCase() 
      });
      
      // Ordenar por data decrescente e pegar o mais recente com final_fuel
      const servicesWithFuel = allServices
        .filter(s => s.final_fuel !== null && s.final_fuel !== undefined)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (servicesWithFuel.length > 0) {
        const lastService = servicesWithFuel[0];
        setSuggestedFuel(lastService.final_fuel);
        setUaaForm({...uaaForm, initial_fuel: lastService.final_fuel.toString()});
        const confirmed = confirm(
          `Último combustível final da UAA ${uaaForm.name}:\n${lastService.final_fuel.toFixed(0)} L (${format(new Date(lastService.date), 'dd/MM/yyyy')})\n\n` +
          `Deseja usar este valor como combustível inicial?\n` +
          `(Você poderá alterar o valor se necessário)`
        );
        
        if (!confirmed) {
          setUaaForm({...uaaForm, initial_fuel: ""});
        }
      } else {
        alert(`Nenhum serviço anterior encontrado para a UAA ${uaaForm.name}.\nPor favor, informe o combustível inicial.`);
      }
      
      setShowInitialFuel(true);
    } catch (error) {
      console.error("Erro ao buscar combustível anterior:", error);
      alert("Erro ao buscar dados anteriores. Por favor, informe o combustível inicial.");
      setShowInitialFuel(true);
    }
  };

  const handleAddUAA = async () => {
    if (!uaaForm.name || !uaaForm.base || !uaaForm.start_time) {
      alert("Preencha os campos obrigatórios (Placa, Base, Horário)");
      return;
    }

    if (!showInitialFuel) {
      await checkPreviousFuel();
      return;
    }

    if (!uaaForm.initial_fuel) {
      alert("Preencha o combustível inicial");
      return;
    }

    if (checkOverlap(uaaForm.name, uaaForm.start_time, uaaForm.end_time)) {
      alert("Conflito de horário! Já existe um serviço ativo para esta UAA neste período.");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        date: todayStr,
        type: 'uaa',
        name: uaaForm.name.toUpperCase(),
        base: uaaForm.base,
        start_time: uaaForm.start_time,
        end_time: uaaForm.end_time,
        team: getNextTeamLabel(uaaForm.name),
        status: 'active',
        initial_fuel: Number(uaaForm.initial_fuel) || 0,
        drained_fuel: Number(uaaForm.drained_fuel) || 0,
        tasa: uaaForm.tasa || "",
        notes: "Sem alterações"
      };

      const created = await base44.entities.DailyService.create(data);
      if (created && created.id) {
        await logAction('create', 'DailyService', created.id, `Lançamento UAA ${data.name}`);
      }
      
      setUaaForm({ name: "", base: "", start_time: "07:30", end_time: "18:30", initial_fuel: "", drained_fuel: "", tasa: "" });
      setShowInitialFuel(false);
      setSuggestedFuel(null);
      loadData();
      alert("UAA lançada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao lançar UAA.");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateRemainingFuel = async (serviceId) => {
    try {
      const service = todayServices.find(s => s.id === serviceId);
      if (!service) return 0;
      
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const abastecimentos = await base44.entities.Abastecimento.filter({ date: todayStr });
      
      const initial = Number(service.initial_fuel) || 0;
      const drained = Number(service.drained_fuel) || 0;
      
      const inputs = abastecimentos
        .filter(a => a.uaa_abastecimento && a.uaa_plate === service.name)
        .reduce((sum, a) => sum + (Number(a.quantity_liters) || 0), 0);
        
      const outputs = abastecimentos
        .filter(a => !a.uaa_abastecimento && a.uaa_plate === service.name)
        .reduce((sum, a) => sum + (Number(a.quantity_liters) || 0), 0);
        
      return initial + inputs - outputs - drained;
    } catch (error) {
      console.error("Erro ao calcular combustível:", error);
      return 0;
    }
  };

  const handleEndService = async (service) => {
    if (service.type === 'uaa') {
      const remaining = await calculateRemainingFuel(service.id);
      const confirmed = confirm(
        `Combustível remanescente calculado: ${remaining.toFixed(0)} L\n\n` +
        `Deseja encerrar o serviço da UAA ${service.name}?`
      );
      
      if (!confirmed) return;

      try {
        const updateData = {
          status: 'completed',
          final_fuel: remaining
        };
        await base44.entities.DailyService.update(service.id, updateData);
        await logAction('update', 'DailyService', service.id, { action: 'end_service', ...updateData });
        loadData();
      } catch (error) {
        console.error(error);
        alert("Erro ao encerrar serviço.");
      }
    } else {
      if (!confirm(`Deseja encerrar o serviço de ${service.name}?`)) return;
      
      try {
        await base44.entities.DailyService.update(service.id, { status: 'completed' });
        await logAction('update', 'DailyService', service.id, { action: 'end_service' });
        loadData();
      } catch (error) {
        console.error(error);
        alert("Erro ao encerrar serviço.");
      }
    }
  };

  const canModify = (service) => {
    if (!currentUser || !service) return false;
    if (currentUser.role === 'admin') return true;
    
    if (currentUser.email === service.created_by) {
      const today = new Date();
      const createdDate = new Date(service.created_date);
      if (isNaN(createdDate.getTime())) return false;
      const daysDiff = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 2;
    }
    return false;
  };

  const handleEditService = (id) => {
    navigate(`${createPageUrl("EditDailyService")}?id=${id}`);
  };

  const handleDeleteService = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      await base44.entities.DailyService.delete(id);
      await logAction('delete', 'DailyService', id, "Exclusão de lançamento no mapa da força");
      loadData();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir.");
    }
  };

  const handleUpdateNotes = async (id, field, value) => {
    try {
      await base44.entities.DailyService.update(id, { [field]: value });
      // Optional: Toast or silent update
    } catch (error) {
      console.error("Erro ao salvar notas", error);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Dashboard"))}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Mapa da Força</h1>
              <p className="text-slate-600">Lançamento de recursos e equipes ({format(new Date(), "dd/MM/yyyy")})</p>
            </div>
          </div>
          <MultiServiceReport services={todayServices} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Lançar Recurso</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="aircraft"><Plane className="w-4 h-4 mr-2"/> Aeronave</TabsTrigger>
                    <TabsTrigger value="uaa"><Truck className="w-4 h-4 mr-2"/> UAA</TabsTrigger>
                  </TabsList>

                  <TabsContent value="aircraft" className="space-y-4">
                    <div>
                      <Label>Aeronave</Label>
                      <Select value={aircraftForm.name} onValueChange={v => setAircraftForm({...aircraftForm, name: v})}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{AIRCRAFT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Base</Label>
                      <Select value={aircraftForm.base} onValueChange={v => setAircraftForm({...aircraftForm, base: v})}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{BASE_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Início</Label><Input type="time" value={aircraftForm.start_time} onChange={e => setAircraftForm({...aircraftForm, start_time: e.target.value})} /></div>
                      <div><Label>Término</Label><Input type="time" value={aircraftForm.end_time} onChange={e => setAircraftForm({...aircraftForm, end_time: e.target.value})} /></div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4 space-y-3">
                      <Label className="font-semibold text-slate-700">Tripulação</Label>
                      <Select value={aircraftForm.commander} onValueChange={v => setAircraftForm({...aircraftForm, commander: v})}>
                        <SelectTrigger><SelectValue placeholder="Comandante *" /></SelectTrigger>
                        <SelectContent>{getAvailableUsers('Piloto').map(u => <SelectItem key={u.id} value={u.nome_de_guerra}>{u.trigrama} - {u.nome_de_guerra}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={aircraftForm.copilot} onValueChange={v => setAircraftForm({...aircraftForm, copilot: v})}>
                        <SelectTrigger><SelectValue placeholder="Copiloto" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {getAvailableUsers('Piloto').map(u => <SelectItem key={u.id} value={u.nome_de_guerra}>{u.trigrama} - {u.nome_de_guerra}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={aircraftForm.oat_1} onValueChange={v => setAircraftForm({...aircraftForm, oat_1: v})}>
                        <SelectTrigger><SelectValue placeholder="OAT 1" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {getAvailableUsers('OAT').map(u => <SelectItem key={u.id} value={u.nome_de_guerra}>{u.trigrama} - {u.nome_de_guerra}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={aircraftForm.oat_2} onValueChange={v => setAircraftForm({...aircraftForm, oat_2: v})}>
                        <SelectTrigger><SelectValue placeholder="OAT 2" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {getAvailableUsers('OAT').map(u => <SelectItem key={u.id} value={u.nome_de_guerra}>{u.trigrama} - {u.nome_de_guerra}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={aircraftForm.oat_3} onValueChange={v => setAircraftForm({...aircraftForm, oat_3: v})}>
                        <SelectTrigger><SelectValue placeholder="OAT 3" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {getAvailableUsers('OAT').map(u => <SelectItem key={u.id} value={u.nome_de_guerra}>{u.trigrama} - {u.nome_de_guerra}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={aircraftForm.osm_1} onValueChange={v => setAircraftForm({...aircraftForm, osm_1: v})}>
                        <SelectTrigger><SelectValue placeholder="OSM 1" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {getAvailableUsers('OSM').map(u => <SelectItem key={u.id} value={u.nome_de_guerra}>{u.trigrama} - {u.nome_de_guerra}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={aircraftForm.osm_2} onValueChange={v => setAircraftForm({...aircraftForm, osm_2: v})}>
                        <SelectTrigger><SelectValue placeholder="OSM 2" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {getAvailableUsers('OSM').map(u => <SelectItem key={u.id} value={u.nome_de_guerra}>{u.trigrama} - {u.nome_de_guerra}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={aircraftForm.tasa} onValueChange={v => setAircraftForm({...aircraftForm, tasa: v})}>
                        <SelectTrigger><SelectValue placeholder="TASA" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {getAvailableUsers('TASA').map(u => <SelectItem key={u.id} value={u.nome_de_guerra}>{u.trigrama} - {u.nome_de_guerra}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleAddAircraft} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" /> Lançar Aeronave
                    </Button>
                  </TabsContent>

                  <TabsContent value="uaa" className="space-y-4">
                     <div>
                      <Label>Placa da UAA</Label>
                      <Select 
                        value={uaaForm.name} 
                        onValueChange={v => {
                          setUaaForm({...uaaForm, name: v});
                          setShowInitialFuel(false);
                          setSuggestedFuel(null);
                        }}
                        disabled={showInitialFuel}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione a UAA..." /></SelectTrigger>
                        <SelectContent>
                          {uaaList.map(uaa => (
                            <SelectItem key={uaa.id} value={uaa.plate}>
                              {uaa.plate} {uaa.model ? `- ${uaa.model}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Base</Label>
                      <Select value={uaaForm.base} onValueChange={v => setUaaForm({...uaaForm, base: v})} disabled={showInitialFuel}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{BASE_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Início</Label><Input type="time" value={uaaForm.start_time} onChange={e => setUaaForm({...uaaForm, start_time: e.target.value})} disabled={showInitialFuel} /></div>
                      <div><Label>Término</Label><Input type="time" value={uaaForm.end_time} onChange={e => setUaaForm({...uaaForm, end_time: e.target.value})} disabled={showInitialFuel} /></div>
                    </div>
                    
                    {showInitialFuel && (
                      <>
                        <div>
                          <Label>Combustível no Início do Serviço (L) *</Label>
                          <Input 
                            type="number" 
                            value={uaaForm.initial_fuel} 
                            onChange={e => setUaaForm({...uaaForm, initial_fuel: e.target.value})} 
                            placeholder="Ex: 2000"
                            className={suggestedFuel ? "border-green-500" : ""}
                          />
                          {suggestedFuel && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Valor sugerido baseado no último serviço
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Combustível Drenado (L)</Label>
                          <Input type="number" value={uaaForm.drained_fuel} onChange={e => setUaaForm({...uaaForm, drained_fuel: e.target.value})} placeholder="Ex: 50" />
                          <p className="text-xs text-slate-500 mt-1">Será debitado do remanescente</p>
                        </div>
                      </>
                    )}
                    
                    <div className="border-t pt-4 mt-4">
                      <Label className="font-semibold text-slate-700">TASA</Label>
                      <Select value={uaaForm.tasa || ''} onValueChange={v => setUaaForm({...uaaForm, tasa: v})}>
                        <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione TASA" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {getAvailableUsers('TASA').map(u => <SelectItem key={u.id} value={u.nome_de_guerra}>{u.trigrama} - {u.nome_de_guerra}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleAddUAA} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" /> {showInitialFuel ? 'Lançar UAA' : 'Continuar'}
                    </Button>
                    
                    {showInitialFuel && (
                      <Button 
                        onClick={() => {
                          setShowInitialFuel(false);
                          setSuggestedFuel(null);
                          setUaaForm({...uaaForm, initial_fuel: "", drained_fuel: ""});
                        }} 
                        variant="outline" 
                        className="w-full"
                      >
                        Voltar
                      </Button>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Recursos Lançados</h2>
            
            {todayServices.length === 0 && (
              <div className="text-center p-8 bg-white rounded-lg border border-dashed">
                <p className="text-slate-500">Nenhum recurso lançado hoje.</p>
              </div>
            )}

            {/* Group by Base */}
            {BASE_OPTIONS.map(base => {
              const baseServices = todayServices.filter(s => s.base === base);
              if (baseServices.length === 0) return null;

              return (
                <div key={base} className="space-y-3">
                  <h3 className="font-semibold text-slate-700 border-b pb-2">{base}</h3>
                  {baseServices.map(service => (
                    <Card key={service.id} className={`border-l-4 ${service.status === 'completed' ? 'border-l-green-500 opacity-75' : service.date < todayStr ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              {service.type === 'aircraft' ? <Plane className="w-4 h-4 text-slate-500"/> : <Truck className="w-4 h-4 text-slate-500"/>}
                              <span className="font-bold text-lg">{service.name}</span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono font-bold">Eq. {service.team}</span>
                              {service.status === 'completed' && <span className="text-xs text-green-600 font-bold border border-green-200 px-1 rounded">ENCERRADO</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {service.start_time} - {service.end_time}
                            </p>
                            <p className={`text-xs font-semibold mt-1 ${service.date < todayStr ? 'text-red-600' : 'text-slate-600'}`}>
                              Data: {format(new Date(service.date + 'T12:00:00'), 'dd/MM/yyyy')}
                              {service.date < todayStr && ' ⚠️'}
                            </p>
                            {service.type === 'aircraft' && (
                              <p className="text-xs text-slate-600 mt-1">
                                <strong>Cmd:</strong> {service.commander} {service.copilot && `| Cop: ${service.copilot}`}
                              </p>
                            )}
                            {service.type === 'uaa' && (
                              <>
                                {service.tasa && (
                                  <p className="text-xs text-slate-600 mt-1">
                                    <strong>TASA:</strong> {service.tasa}
                                  </p>
                                )}
                                {service.status === 'active' && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">Combustível Remanescente:</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                      {uaaFuels[service.id] !== undefined ? `${uaaFuels[service.id].toFixed(0)} L` : '- L'}
                                    </p>
                                  </div>
                                )}
                                {service.status === 'completed' && service.final_fuel !== null && service.final_fuel !== undefined && (
                                  <p className="text-xs text-green-600 mt-1">
                                    <strong>Combustível Final:</strong> {service.final_fuel.toFixed(0)} L
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {service.status === 'completed' && (
                              <ServiceReportButton service={service} />
                            )}
                            {service.status === 'active' && (
                              <>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleEndService(service)} title="Encerrar Serviço">
                                  <PowerOff className="w-4 h-4" />
                                </Button>
                                {canModify(service) && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditService(service.id)} title="Editar">
                                      <Pencil className="w-4 h-4 text-slate-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDeleteService(service.id)} title="Excluir">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Notes Fields */}
                        <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
                          {service.type === 'aircraft' ? (
                            <>
                              <div>
                                <Label className="text-xs">Alterações Aeronave</Label>
                                <Textarea 
                                  className="h-20 text-xs mt-1" 
                                  defaultValue={service.notes_aircraft} 
                                  onBlur={(e) => handleUpdateNotes(service.id, 'notes_aircraft', e.target.value)}
                                  disabled={service.status === 'completed'}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Alterações Materiais</Label>
                                <Textarea 
                                  className="h-20 text-xs mt-1" 
                                  defaultValue={service.notes_materials} 
                                  onBlur={(e) => handleUpdateNotes(service.id, 'notes_materials', e.target.value)}
                                  disabled={service.status === 'completed'}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Caráter Geral</Label>
                                <Textarea 
                                  className="h-20 text-xs mt-1" 
                                  defaultValue={service.notes_general} 
                                  onBlur={(e) => handleUpdateNotes(service.id, 'notes_general', e.target.value)}
                                  disabled={service.status === 'completed'}
                                />
                              </div>
                            </>
                          ) : (
                            <div className="col-span-3">
                              <Label className="text-xs">Alterações UAA</Label>
                              <Textarea 
                                className="h-20 text-xs mt-1" 
                                defaultValue={service.notes} 
                                onBlur={(e) => handleUpdateNotes(service.id, 'notes', e.target.value)}
                                disabled={service.status === 'completed'}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </div>
  );
}