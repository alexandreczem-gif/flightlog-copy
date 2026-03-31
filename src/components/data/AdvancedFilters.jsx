import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const AIRCRAFT_OPTIONS = ["Arcanjo 01", "Falcão 08", "Falcão 03", "Falcão 04"];
const MISSION_TYPES_BM = ["Remoção aeromédica", "Resgate aeromédico", "Busca Terrestre", "Busca Aquática", "Salvamento Aquático", "Salvamento Terrestre", "Transporte de Órgãos", "Combate a Incêndio", "Plataforma de observação BM", "Transporte de tropa BM", "Operação de Defesa Civil", "Ronda Preventiva na Faixa Litorânea", "Ocorrência Cancelada", "Transporte de Vacinas/Medicamentos", "Transporte de materiais", "Transporte de autoridades", "Apoio a PM", "Apoio a Outros Órgãos", "Voo de Manutenção", "Voo de Treinamento", "Voo de Translado", "Voo de demonstração", "Cumprimento de Ordem de Serviço"];
const MISSION_TYPES_PM = ["Operações Programadas/Eventos", "Busca de Fugitivo(s)/Suspeito(s)", "Roubo", "Roubo a Banco", "Confronto Armado", "Veículo Recuperado", "Sequestro de Pessoas", "Plataforma de Observação Policial", "Radio Patrulhamento Urbano", "Radio Patrulhamento Aéreo em Fronteira", "Radio Patrulhamento Aéreo Rodoviário", "Fuga/Rebelião em Estabelecimento Prisional", "Escolta", "Cumprimento de Mandando", "Reintegração de Posse", "Fiscalização Ambiental", "Transporte de Autoridade(s)/Dignitário(s)", "Transporte de Material (Armas, Munições)", "Transporte de Material (Outros)", "Transporte de Tropa Policial", "Ocorrência Aérea Policial Cancelada", "Ocorrências Diversas"];
const BASE_OPTIONS = ["Operação Verão", "Curitiba-BPMOA", "Curitiba-PRF", "Londrina", "Maringá", "Ponta Grossa"];
const TRANSPORT_TYPE_OPTIONS = ["Resgate", "Remoção", "Órgão", "Treinamento Operacional"];
const TRANSPORT_STATUS_OPTIONS = ["Completo", "Cancelado", "Sem atendimento"];

export default function AdvancedFilters({ onFilterChange }) {
    const [expanded, setExpanded] = useState(false);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        timeFrom: '',
        timeTo: '',
        base: '',
        samu_occurrence: '',
        sade_occurrence: '',
        mission_id: '',
        aircraft: '',
        municipality: '',
        mission_types: [],
        pilot: '',
        oat: '',
        osm: '',
        pax: '',
        heli_operations: '',
        victim_name: '',
        victim_origin_city: '',
        victim_origin_hospital: '',
        victim_destination_city: '',
        victim_destination_hospital: '',
        transport_type: '',
        transport_status: '',
        diagnosis: ''
    });

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const tripulantes = await base44.entities.Tripulante.list();
                tripulantes.sort((a, b) => (a.trigrama || '').localeCompare(b.trigrama || ''));
                setUsers(tripulantes);
            } catch (error) {
                console.error("Erro ao carregar tripulantes:", error);
            }
        };
        loadUsers();
    }, []);

    useEffect(() => {
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const toggleMissionType = (type) => {
        setFilters(prev => {
            const current = prev.mission_types || [];
            const exists = current.includes(type);
            return { ...prev, mission_types: exists ? current.filter(t => t !== type) : [...current, type] };
        });
    };

    const clearFilters = () => {
        setFilters({
            dateFrom: '', dateTo: '', timeFrom: '', timeTo: '', base: '',
            samu_occurrence: '', sade_occurrence: '', mission_id: '', aircraft: '',
            municipality: '', mission_types: [], pilot: '', oat: '', osm: '', pax: '',
            heli_operations: '', victim_name: '', victim_origin_city: '', victim_origin_hospital: '',
            victim_destination_city: '', victim_destination_hospital: '', transport_type: '',
            transport_status: '', diagnosis: ''
        });
    };

    const activeFiltersCount = Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v !== '').length;

    return (
        <Card className="mb-6">
            <CardHeader 
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        Filtros Avançados
                        {activeFiltersCount > 0 && (
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearFilters();
                                }}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Limpar
                            </Button>
                        )}
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </CardHeader>
            
            {expanded && (
                <CardContent className="space-y-6">
                    {/* Período */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Período</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <Label>Data Inicial</Label>
                                <Input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} />
                            </div>
                            <div>
                                <Label>Data Final</Label>
                                <Input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} />
                            </div>
                            <div>
                                <Label>Horário Inicial</Label>
                                <Input type="time" value={filters.timeFrom} onChange={(e) => handleFilterChange('timeFrom', e.target.value)} />
                            </div>
                            <div>
                                <Label>Horário Final</Label>
                                <Input type="time" value={filters.timeTo} onChange={(e) => handleFilterChange('timeTo', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Dados da Missão */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Dados da Missão</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label>Nº Missão</Label>
                                <Input value={filters.mission_id} onChange={(e) => handleFilterChange('mission_id', e.target.value)} placeholder="Ex: 123" />
                            </div>
                            <div>
                                <Label>Nº Ocorrência SADE</Label>
                                <Input value={filters.sade_occurrence} onChange={(e) => handleFilterChange('sade_occurrence', e.target.value)} />
                            </div>
                            <div>
                                <Label>Nº Ocorrência SAMU</Label>
                                <Input value={filters.samu_occurrence} onChange={(e) => handleFilterChange('samu_occurrence', e.target.value)} />
                            </div>
                            <div>
                                <Label>Aeronave</Label>
                                <Select value={filters.aircraft} onValueChange={(v) => handleFilterChange('aircraft', v === '__all__' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todas</SelectItem>
                                        {AIRCRAFT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Município</Label>
                                <Input value={filters.municipality} onChange={(e) => handleFilterChange('municipality', e.target.value)} placeholder="Filtrar por município" />
                            </div>
                            <div>
                                <Label>Base</Label>
                                <Select value={filters.base} onValueChange={(v) => handleFilterChange('base', v === '__all__' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todas</SelectItem>
                                        {BASE_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tipos de Missão - Multi-select */}
                        <div className="mt-4">
                            <Label className="mb-2 block">Tipos de Missão {filters.mission_types.length > 0 && <span className="text-red-600 font-bold">({filters.mission_types.length} selecionados)</span>}</Label>
                            <div className="border rounded-md p-3 space-y-3">
                                <p className="text-xs font-semibold text-slate-500 uppercase">BM</p>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {MISSION_TYPES_BM.map(type => (
                                        <div key={type} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`bm-${type}`}
                                                checked={filters.mission_types.includes(type)}
                                                onCheckedChange={() => toggleMissionType(type)}
                                            />
                                            <label htmlFor={`bm-${type}`} className="text-sm cursor-pointer">{type}</label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs font-semibold text-slate-500 uppercase pt-2 border-t">PM</p>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {MISSION_TYPES_PM.map(type => (
                                        <div key={type} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`pm-${type}`}
                                                checked={filters.mission_types.includes(type)}
                                                onCheckedChange={() => toggleMissionType(type)}
                                            />
                                            <label htmlFor={`pm-${type}`} className="text-sm cursor-pointer">{type}</label>
                                        </div>
                                    ))}
                                </div>
                                {filters.mission_types.length > 0 && (
                                    <Button size="sm" variant="ghost" onClick={() => handleFilterChange('mission_types', [])} className="text-xs text-slate-500">
                                        <X className="w-3 h-3 mr-1" /> Limpar tipos selecionados
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tripulação */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Tripulação</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <Label>Piloto</Label>
                                <Input value={filters.pilot} onChange={(e) => handleFilterChange('pilot', e.target.value)} placeholder="Nome do piloto" />
                            </div>
                            <div>
                                <Label>OAT</Label>
                                <Input value={filters.oat} onChange={(e) => handleFilterChange('oat', e.target.value)} placeholder="Nome do OAT" />
                            </div>
                            <div>
                                <Label>OSM</Label>
                                <Input value={filters.osm} onChange={(e) => handleFilterChange('osm', e.target.value)} placeholder="Nome do OSM" />
                            </div>
                            <div>
                                <Label>PAX</Label>
                                <Input value={filters.pax} onChange={(e) => handleFilterChange('pax', e.target.value)} placeholder="Passageiros" />
                            </div>
                        </div>
                    </div>

                    {/* Operações */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Operações</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Operação Helitransportada</Label>
                                <Input value={filters.heli_operations} onChange={(e) => handleFilterChange('heli_operations', e.target.value)} placeholder="Ex: Rapel, Guincho" />
                            </div>
                        </div>
                    </div>

                    {/* Dados da Vítima */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Dados da Vítima</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label>Nome</Label>
                                <Input value={filters.victim_name} onChange={(e) => handleFilterChange('victim_name', e.target.value)} placeholder="Nome da vítima" />
                            </div>
                            <div>
                                <Label>Cidade de Origem</Label>
                                <Input value={filters.victim_origin_city} onChange={(e) => handleFilterChange('victim_origin_city', e.target.value)} placeholder="Cidade" />
                            </div>
                            <div>
                                <Label>Hospital de Origem</Label>
                                <Input value={filters.victim_origin_hospital} onChange={(e) => handleFilterChange('victim_origin_hospital', e.target.value)} placeholder="Hospital" />
                            </div>
                            <div>
                                <Label>Cidade de Destino</Label>
                                <Input value={filters.victim_destination_city} onChange={(e) => handleFilterChange('victim_destination_city', e.target.value)} placeholder="Cidade" />
                            </div>
                            <div>
                                <Label>Hospital de Destino</Label>
                                <Input value={filters.victim_destination_hospital} onChange={(e) => handleFilterChange('victim_destination_hospital', e.target.value)} placeholder="Hospital" />
                            </div>
                            <div>
                                <Label>Tipo de Transporte</Label>
                                <Select value={filters.transport_type} onValueChange={(v) => handleFilterChange('transport_type', v === '__all__' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todos</SelectItem>
                                        {["Resgate", "Remoção", "Órgão", "Treinamento Operacional"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Status do Transporte</Label>
                                <Select value={filters.transport_status} onValueChange={(v) => handleFilterChange('transport_status', v === '__all__' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todos</SelectItem>
                                        {["Completo", "Cancelado", "Sem atendimento"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label>Diagnóstico/Lesão Principal</Label>
                                <Input value={filters.diagnosis} onChange={(e) => handleFilterChange('diagnosis', e.target.value)} placeholder="Diagnóstico" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}