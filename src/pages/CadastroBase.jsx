import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload, Download, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import AerodromoTable from "../components/aerodromo/AerodromoTable";
import AerodromoForm from "../components/aerodromo/AerodromoForm";
import HospitalTable from "../components/hospital/HospitalTable";
import HospitalForm from "../components/hospital/HospitalForm";
import CityTable from "../components/city/CityTable";
import CityForm from "../components/city/CityForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import AeronaveForm from "../components/aeronave/AeronaveForm";
import AeronaveTable from "../components/aeronave/AeronaveTable";
import UAAForm from "../components/uaa/UAAForm";
import UAATable from "../components/uaa/UAATable";

export default function CadastroBase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("aerodromos");
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Aeródromos
  const [aerodromos, setAerodromos] = useState([]);
  const [showAerodromoForm, setShowAerodromoForm] = useState(false);
  const [editingAerodromo, setEditingAerodromo] = useState(null);

  // Hospitais
  const [hospitais, setHospitais] = useState([]);
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);

  // Cidades
  const [cities, setCities] = useState([]);
  const [showCityForm, setShowCityForm] = useState(false);
  const [editingCity, setEditingCity] = useState(null);

  // Tripulantes
  const [tripulantes, setTripulantes] = useState([]);
  const [showTripulanteForm, setShowTripulanteForm] = useState(false);
  const [editingTripulante, setEditingTripulante] = useState(null);

  // Aeronaves
  const [aeronaves, setAeronaves] = useState([]);
  const [showAeronaveForm, setShowAeronaveForm] = useState(false);
  const [editingAeronave, setEditingAeronave] = useState(null);

  // UAAs
  const [uaas, setUAAs] = useState([]);
  const [showUAAForm, setShowUAAForm] = useState(false);
  const [editingUAA, setEditingUAA] = useState(null);

  // Bases Operacionais
  const [bases, setBases] = useState([]);
  const [showBaseForm, setShowBaseForm] = useState(false);
  const [editingBase, setEditingBase] = useState(null);
  const [baseFormData, setBaseFormData] = useState({ name: '', ativa: true });

  useEffect(() => {
    checkAccessAndLoad();
  }, [navigate]);

  const checkAccessAndLoad = async () => {
    try {
      const user = await base44.auth.me();
      if (user.role !== "admin") {
        navigate("/Dashboard");
        return;
      }
      setHasAccess(true);
      loadData();
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      navigate("/Dashboard");
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [aerodromosData, hospitaisData, citiesData, tripulantesData, aeronavesData, uaasData, basesData] = await Promise.all([
        base44.entities.Aerodromo.list(),
        base44.entities.Hospital.list(),
        base44.entities.City.list(),
        base44.entities.Tripulante.list(),
        base44.entities.Aeronave.list(),
        base44.entities.UAA.list(),
        base44.entities.BaseOperacional.list()
      ]);
      setAerodromos(aerodromosData);
      setHospitais(hospitaisData);
      setCities(citiesData);
      setTripulantes(tripulantesData);
      setAeronaves(aeronavesData);
      setUAAs(uaasData);
      setBases(basesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    }
    setIsLoading(false);
  };

  // Bases Operacionais handlers
  const handleBaseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBase) {
        await base44.entities.BaseOperacional.update(editingBase.id, baseFormData);
        toast({ title: "Base atualizada com sucesso" });
      } else {
        await base44.entities.BaseOperacional.create(baseFormData);
        toast({ title: "Base criada com sucesso" });
      }
      setShowBaseForm(false);
      setEditingBase(null);
      setBaseFormData({ name: '', ativa: true });
      loadData();
    } catch (error) {
      console.error("Erro ao salvar base:", error);
      toast({ title: "Erro ao salvar base", variant: "destructive" });
    }
  };

  const handleBaseDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta base?")) {
      try {
        await base44.entities.BaseOperacional.delete(id);
        toast({ title: "Base excluída com sucesso" });
        loadData();
      } catch (error) {
        console.error("Erro ao excluir base:", error);
        toast({ title: "Erro ao excluir base", variant: "destructive" });
      }
    }
  };

  // Aeródromos handlers
  const handleAerodromoSubmit = async (data) => {
    try {
      if (editingAerodromo) {
        await base44.entities.Aerodromo.update(editingAerodromo.id, data);
        toast({ title: "Aeródromo atualizado com sucesso" });
      } else {
        await base44.entities.Aerodromo.create(data);
        toast({ title: "Aeródromo criado com sucesso" });
      }
      setShowAerodromoForm(false);
      setEditingAerodromo(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar aeródromo:", error);
      toast({ title: "Erro ao salvar aeródromo", variant: "destructive" });
    }
  };

  const handleAerodromoDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este aeródromo?")) {
      try {
        await base44.entities.Aerodromo.delete(id);
        toast({ title: "Aeródromo excluído com sucesso" });
        loadData();
      } catch (error) {
        console.error("Erro ao excluir aeródromo:", error);
        toast({ title: "Erro ao excluir aeródromo", variant: "destructive" });
      }
    }
  };

  // Hospitais handlers
  const handleHospitalSubmit = async (data) => {
    try {
      if (editingHospital) {
        await base44.entities.Hospital.update(editingHospital.id, data);
        toast({ title: "Hospital atualizado com sucesso" });
      } else {
        await base44.entities.Hospital.create(data);
        toast({ title: "Hospital criado com sucesso" });
      }
      setShowHospitalForm(false);
      setEditingHospital(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar hospital:", error);
      toast({ title: "Erro ao salvar hospital", variant: "destructive" });
    }
  };

  const handleHospitalDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este hospital?")) {
      try {
        await base44.entities.Hospital.delete(id);
        toast({ title: "Hospital excluído com sucesso" });
        loadData();
      } catch (error) {
        console.error("Erro ao excluir hospital:", error);
        toast({ title: "Erro ao excluir hospital", variant: "destructive" });
      }
    }
  };

  // Cidades handlers
  const handleCitySubmit = async (data) => {
    try {
      if (editingCity) {
        await base44.entities.City.update(editingCity.id, data);
        toast({ title: "Cidade atualizada com sucesso" });
      } else {
        await base44.entities.City.create(data);
        toast({ title: "Cidade criada com sucesso" });
      }
      setShowCityForm(false);
      setEditingCity(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar cidade:", error);
      toast({ title: "Erro ao salvar cidade", variant: "destructive" });
    }
  };

  const handleCityDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta cidade?")) {
      try {
        await base44.entities.City.delete(id);
        toast({ title: "Cidade excluída com sucesso" });
        loadData();
      } catch (error) {
        console.error("Erro ao excluir cidade:", error);
        toast({ title: "Erro ao excluir cidade", variant: "destructive" });
      }
    }
  };

  // Tripulantes handlers
  const handleTripulanteSubmit = async (data) => {
    try {
      if (editingTripulante) {
        await base44.entities.Tripulante.update(editingTripulante.id, data);
        toast({ title: "Tripulante atualizado com sucesso" });
      } else {
        await base44.entities.Tripulante.create(data);
        toast({ title: "Tripulante criado com sucesso" });
      }
      setShowTripulanteForm(false);
      setEditingTripulante(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar tripulante:", error);
      toast({ title: "Erro ao salvar tripulante", variant: "destructive" });
    }
  };

  const handleTripulanteDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este tripulante?")) {
      try {
        await base44.entities.Tripulante.delete(id);
        toast({ title: "Tripulante excluído com sucesso" });
        loadData();
      } catch (error) {
        console.error("Erro ao excluir tripulante:", error);
        toast({ title: "Erro ao excluir tripulante", variant: "destructive" });
      }
    }
  };

  // Aeronaves handlers
  const handleAeronaveSubmit = async (data) => {
    try {
      if (editingAeronave) {
        await base44.entities.Aeronave.update(editingAeronave.id, data);
        toast({ title: "Aeronave atualizada com sucesso" });
      } else {
        await base44.entities.Aeronave.create(data);
        toast({ title: "Aeronave criada com sucesso" });
      }
      setShowAeronaveForm(false);
      setEditingAeronave(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar aeronave:", error);
      toast({ title: "Erro ao salvar aeronave", variant: "destructive" });
    }
  };

  const handleAeronaveDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta aeronave?")) {
      try {
        await base44.entities.Aeronave.delete(id);
        toast({ title: "Aeronave excluída com sucesso" });
        loadData();
      } catch (error) {
        console.error("Erro ao excluir aeronave:", error);
        toast({ title: "Erro ao excluir aeronave", variant: "destructive" });
      }
    }
  };

  // UAAs handlers
  const handleUAASubmit = async (data) => {
    try {
      if (editingUAA) {
        await base44.entities.UAA.update(editingUAA.id, data);
        toast({ title: "UAA atualizada com sucesso" });
      } else {
        await base44.entities.UAA.create(data);
        toast({ title: "UAA criada com sucesso" });
      }
      setShowUAAForm(false);
      setEditingUAA(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar UAA:", error);
      toast({ title: "Erro ao salvar UAA", variant: "destructive" });
    }
  };

  const handleUAADelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta UAA?")) {
      try {
        await base44.entities.UAA.delete(id);
        toast({ title: "UAA excluída com sucesso" });
        loadData();
      } catch (error) {
        console.error("Erro ao excluir UAA:", error);
        toast({ title: "Erro ao excluir UAA", variant: "destructive" });
      }
    }
  };

  // Export functions
  const exportToCSV = (data, filename, headers) => {
    if (!data || data.length === 0) {
      toast({ title: "Não há dados para exportar", variant: "destructive" });
      return;
    }
    const keys = headers || Object.keys(data[0]).filter(k => !['id','created_date','updated_date','created_by'].includes(k));
    const csvContent = [
      keys.join(','),
      ...data.map(item => keys.map(key => {
        const value = item[key];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        return stringValue.includes(',') || stringValue.includes('"') ? `"${stringValue.replace(/"/g,'""')}"` : stringValue;
      }).join(','))
    ].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "CSV exportado com sucesso" });
  };

  // Import from CSV — robust parser
  const handleImportCSV = async (entityName, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
        if (lines.length < 2) { toast({ title: 'Arquivo vazio ou sem dados', variant: 'destructive' }); return; }

        // Parse CSV header
        const parseCSVLine = (line) => {
          const result = [];
          let cur = '', inQ = false;
          for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') { inQ = !inQ; }
            else if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
            else { cur += c; }
          }
          result.push(cur.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
        const records = lines.slice(1).map(line => {
          const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, '').trim());
          const record = {};
          headers.forEach((h, i) => { if (h) record[h] = values[i] ?? ''; });
          return record;
        }).filter(r => Object.values(r).some(v => v !== ''));

        if (records.length === 0) { toast({ title: 'Nenhum registro encontrado no arquivo', variant: 'destructive' }); return; }

        // Convert boolean fields
        const boolFields = ['ativa'];
        records.forEach(r => {
          boolFields.forEach(f => {
            if (r[f] !== undefined) r[f] = r[f] === 'true' || r[f] === '1' || r[f] === 'TRUE';
          });
          // Remove system fields if present
          ['id', 'created_date', 'updated_date', 'created_by'].forEach(f => delete r[f]);
        });

        const confirmed = window.confirm(`Importar ${records.length} registros para ${entityName}?`);
        if (!confirmed) return;

        await base44.entities[entityName].bulkCreate(records);
        toast({ title: `${records.length} registros importados com sucesso` });
        loadData();
      } catch (error) {
        console.error("Erro ao importar CSV:", error);
        toast({ title: `Erro ao importar CSV: ${error.message}`, variant: 'destructive' });
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Delete all
  const handleDeleteAll = async (entityName, entityLabel) => {
    if (window.confirm(`Tem certeza que deseja excluir TODOS os registros de ${entityLabel}? Esta ação não pode ser desfeita!`)) {
      try {
        const allRecords = await base44.entities[entityName].list();
        await Promise.all(allRecords.map(r => base44.entities[entityName].delete(r.id)));
        toast({ title: `Todos os registros de ${entityLabel} foram excluídos` });
        loadData();
      } catch (error) {
        console.error(`Erro ao excluir registros de ${entityLabel}:`, error);
        toast({ title: `Erro ao excluir registros de ${entityLabel}`, variant: 'destructive' });
      }
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-slate-600">Verificando acesso...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Cadastro Base</h1>
          <p className="text-slate-600">Gerencie os cadastros base do sistema</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="bases">Bases Operacionais</TabsTrigger>
            <TabsTrigger value="aerodromos">Aeródromos</TabsTrigger>
            <TabsTrigger value="hospitais">Hospitais</TabsTrigger>
            <TabsTrigger value="cidades">Cidades</TabsTrigger>
            <TabsTrigger value="tripulantes">Tripulantes</TabsTrigger>
            <TabsTrigger value="aeronaves">Aeronaves</TabsTrigger>
            <TabsTrigger value="uaas">UAAs</TabsTrigger>
          </TabsList>

          {/* Bases Operacionais */}
          <TabsContent value="bases" className="space-y-4">
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportToCSV(bases, 'bases_operacionais', ['name', 'ativa'])}>
                  <Download className="w-4 h-4 mr-2" />Exportar CSV
                </Button>
                <label>
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => handleImportCSV('BaseOperacional', e)} />
                  <Button variant="outline" asChild><span><Upload className="w-4 h-4 mr-2" />Importar CSV</span></Button>
                </label>
                <Button variant="outline" onClick={() => handleDeleteAll('BaseOperacional', 'Bases Operacionais')} className="text-red-600 hover:text-red-700">
                  <Trash className="w-4 h-4 mr-2" />Excluir Tudo
                </Button>
              </div>
              <Button onClick={() => { setEditingBase(null); setBaseFormData({ name: '', ativa: true }); setShowBaseForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />Nova Base
              </Button>
            </div>
            {showBaseForm && (
              <Card>
                <CardHeader><CardTitle>{editingBase ? 'Editar Base' : 'Nova Base Operacional'}</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleBaseSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nome da Base *</label>
                      <input type="text" value={baseFormData.name} onChange={(e) => setBaseFormData({...baseFormData, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" required placeholder="Ex: Curitiba Resgate" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="base-ativa" checked={baseFormData.ativa} onChange={(e) => setBaseFormData({...baseFormData, ativa: e.target.checked})} />
                      <label htmlFor="base-ativa" className="text-sm font-medium">Base Ativa</label>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => { setShowBaseForm(false); setEditingBase(null); }}>Cancelar</Button>
                      <Button type="submit">{editingBase ? 'Atualizar' : 'Adicionar'}</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8">Carregando...</TableCell></TableRow>
                  ) : bases.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-500">Nenhuma base cadastrada</TableCell></TableRow>
                  ) : bases.map(base => (
                    <TableRow key={base.id}>
                      <TableCell className="font-medium">{base.name}</TableCell>
                      <TableCell><Badge variant={base.ativa ? 'default' : 'secondary'}>{base.ativa ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingBase(base); setBaseFormData({ name: base.name, ativa: base.ativa }); setShowBaseForm(true); }}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => handleBaseDelete(base.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Hospitais */}
          <TabsContent value="hospitais" className="space-y-4">
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportToCSV(hospitais, 'hospitais')}><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
                <label><input type="file" accept=".csv" className="hidden" onChange={(e) => handleImportCSV('Hospital', e)} /><Button variant="outline" asChild><span><Upload className="w-4 h-4 mr-2" />Importar CSV</span></Button></label>
                <Button variant="outline" onClick={() => handleDeleteAll('Hospital', 'Hospitais')} className="text-red-600 hover:text-red-700"><Trash className="w-4 h-4 mr-2" />Excluir Tudo</Button>
              </div>
              <Button onClick={() => { setEditingHospital(null); setShowHospitalForm(true); }}><Plus className="w-4 h-4 mr-2" />Novo Hospital</Button>
            </div>
            {showHospitalForm ? (
              <HospitalForm hospital={editingHospital} onSubmit={handleHospitalSubmit} onCancel={() => { setShowHospitalForm(false); setEditingHospital(null); }} />
            ) : (
              <HospitalTable hospitais={hospitais} onEdit={(h) => { setEditingHospital(h); setShowHospitalForm(true); }} onDelete={handleHospitalDelete} isLoading={isLoading} />
            )}
          </TabsContent>

          {/* Cidades */}
          <TabsContent value="cidades" className="space-y-4">
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportToCSV(cities, 'cidades', ['name', 'latitude_raw', 'longitude_raw'])}><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
                <label><input type="file" accept=".csv" className="hidden" onChange={(e) => handleImportCSV('City', e)} /><Button variant="outline" asChild><span><Upload className="w-4 h-4 mr-2" />Importar CSV</span></Button></label>
                <Button variant="outline" onClick={() => handleDeleteAll('City', 'Cidades')} className="text-red-600 hover:text-red-700"><Trash className="w-4 h-4 mr-2" />Excluir Tudo</Button>
              </div>
              <Button onClick={() => { setEditingCity(null); setShowCityForm(true); }}><Plus className="w-4 h-4 mr-2" />Nova Cidade</Button>
            </div>
            {showCityForm ? (
              <CityForm city={editingCity} onSubmit={handleCitySubmit} onCancel={() => { setShowCityForm(false); setEditingCity(null); }} />
            ) : (
              <CityTable cities={cities} onEdit={(c) => { setEditingCity(c); setShowCityForm(true); }} onDelete={handleCityDelete} isLoading={isLoading} />
            )}
          </TabsContent>

          {/* Tripulantes */
          <TabsContent value="tripulantes" className="space-y-4">
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportToCSV(tripulantes, 'tripulantes', ['nome_de_guerra', 'trigrama', 'posto_graduacao', 'funcao', 'user_email'])}><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
                <label><input type="file" accept=".csv" className="hidden" onChange={(e) => handleImportCSV('Tripulante', e)} /><Button variant="outline" asChild><span><Upload className="w-4 h-4 mr-2" />Importar CSV</span></Button></label>
                <Button variant="outline" onClick={() => handleDeleteAll('Tripulante', 'Tripulantes')} className="text-red-600 hover:text-red-700"><Trash className="w-4 h-4 mr-2" />Excluir Tudo</Button>
              </div>
              <Button onClick={() => { setEditingTripulante(null); setShowTripulanteForm(true); }}><Plus className="w-4 h-4 mr-2" />Novo Tripulante</Button>
            </div>
            {showTripulanteForm ? (
              <TripulanteForm tripulante={editingTripulante} onSubmit={handleTripulanteSubmit} onCancel={() => { setShowTripulanteForm(false); setEditingTripulante(null); }} />
            ) : (
              <TripulanteTable tripulantes={tripulantes} onEdit={(t) => { setEditingTripulante(t); setShowTripulanteForm(true); }} onDelete={handleTripulanteDelete} isLoading={isLoading} />
            )}
          </TabsContent>

          {/* Aeronaves */}
          <TabsContent value="aeronaves" className="space-y-4">
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportToCSV(aeronaves, 'aeronaves', ['designativo', 'prefixo', 'modelo', 'ativa'])}><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
                <label><input type="file" accept=".csv" className="hidden" onChange={(e) => handleImportCSV('Aeronave', e)} /><Button variant="outline" asChild><span><Upload className="w-4 h-4 mr-2" />Importar CSV</span></Button></label>
                <Button variant="outline" onClick={() => handleDeleteAll('Aeronave', 'Aeronaves')} className="text-red-600 hover:text-red-700"><Trash className="w-4 h-4 mr-2" />Excluir Tudo</Button>
              </div>
              <Button onClick={() => { setEditingAeronave(null); setShowAeronaveForm(true); }}><Plus className="w-4 h-4 mr-2" />Nova Aeronave</Button>
            </div>
            {showAeronaveForm ? (
              <AeronaveForm aeronave={editingAeronave} onSubmit={handleAeronaveSubmit} onCancel={() => { setShowAeronaveForm(false); setEditingAeronave(null); }} />
            ) : (
              <AeronaveTable aeronaves={aeronaves} onEdit={(a) => { setEditingAeronave(a); setShowAeronaveForm(true); }} onDelete={handleAeronaveDelete} isLoading={isLoading} />
            )}
          </TabsContent>

          {/* UAAs */}
          <TabsContent value="uaas" className="space-y-4">
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportToCSV(uaas, 'uaas', ['plate', 'model', 'ativa'])}><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
                <label><input type="file" accept=".csv" className="hidden" onChange={(e) => handleImportCSV('UAA', e)} /><Button variant="outline" asChild><span><Upload className="w-4 h-4 mr-2" />Importar CSV</span></Button></label>
                <Button variant="outline" onClick={() => handleDeleteAll('UAA', 'UAAs')} className="text-red-600 hover:text-red-700"><Trash className="w-4 h-4 mr-2" />Excluir Tudo</Button>
              </div>
              <Button onClick={() => { setEditingUAA(null); setShowUAAForm(true); }}><Plus className="w-4 h-4 mr-2" />Nova UAA</Button>
            </div>
            {showUAAForm ? (
              <UAAForm uaa={editingUAA} onSubmit={handleUAASubmit} onCancel={() => { setShowUAAForm(false); setEditingUAA(null); }} />
            ) : (
              <UAATable uaas={uaas} onEdit={(u) => { setEditingUAA(u); setShowUAAForm(true); }} onDelete={handleUAADelete} isLoading={isLoading} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TripulanteTable({ tripulantes, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (tripulantes.length === 0) {
    return <div className="text-center py-8 text-slate-500">Nenhum tripulante cadastrado</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome de Guerra</TableHead>
            <TableHead>Trigrama</TableHead>
            <TableHead>Posto/Graduação</TableHead>
            <TableHead>Função</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tripulantes.map((tripulante) => (
            <TableRow key={tripulante.id}>
              <TableCell className="font-medium">{tripulante.nome_de_guerra}</TableCell>
              <TableCell>{tripulante.trigrama}</TableCell>
              <TableCell>{tripulante.posto_graduacao || "-"}</TableCell>
              <TableCell>
                <Badge>{tripulante.funcao}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(tripulante)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(tripulante.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TripulanteForm({ tripulante, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(tripulante || {
    nome_de_guerra: "",
    trigrama: "",
    posto_graduacao: "",
    funcao: "Piloto",
    user_email: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tripulante ? "Editar Tripulante" : "Novo Tripulante"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome de Guerra *</label>
            <input
              type="text"
              value={formData.nome_de_guerra}
              onChange={(e) => setFormData({ ...formData, nome_de_guerra: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Trigrama *</label>
            <input
              type="text"
              value={formData.trigrama}
              onChange={(e) => setFormData({ ...formData, trigrama: e.target.value.toUpperCase() })}
              maxLength={3}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Posto/Graduação</label>
            <select
              value={formData.posto_graduacao}
              onChange={(e) => setFormData({ ...formData, posto_graduacao: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Selecione</option>
              <option value="Coronel">Coronel</option>
              <option value="Tenente-Coronel">Tenente-Coronel</option>
              <option value="Major">Major</option>
              <option value="Capitão">Capitão</option>
              <option value="1º Tenente">1º Tenente</option>
              <option value="2º Tenente">2º Tenente</option>
              <option value="Sub-tenente">Sub-tenente</option>
              <option value="1º Sargento">1º Sargento</option>
              <option value="2º Sargento">2º Sargento</option>
              <option value="3º Sargento">3º Sargento</option>
              <option value="Cabo">Cabo</option>
              <option value="Soldado">Soldado</option>
              <option value="Médico">Médico</option>
              <option value="Enfermeiro">Enfermeiro</option>
              <option value="Funcionário Civil">Funcionário Civil</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Função *</label>
            <select
              value={formData.funcao}
              onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="Piloto">Piloto</option>
              <option value="OAT">OAT</option>
              <option value="OSM">OSM</option>
              <option value="TASA">TASA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email do Usuário</label>
            <input
              type="email"
              value={formData.user_email}
              onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {tripulante ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}