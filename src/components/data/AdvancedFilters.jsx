import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const AIRCRAFT_OPTIONS = ["Arcanjo 01", "Falcão 08", "Falcão 03", "Falcão 04"];
const MISSION_TYPES = ["Remoção aeromédica", "Resgate aeromédico", "Busca Terrestre", "Busca Aquática", "Salvamento Aquático", "Salvamento Terrestre", "Transporte de Órgãos", "Combate a Incêndio", "Plataforma de observação BM", "Transporte de tropa BM", "Operação de Defesa Civil", "Ronda Preventiva na Faixa Litorânea", "Ocorrência Cancelada", "Transporte de Vacinas/Medicamentos", "Transporte de materiais", "Transporte de autoridades", "Apoio a PM", "Apoio a Outros Órgãos", "Voo de Manutenção", "Voo de Treinamento", "Voo de Translado", "Voo de demonstração", "Cumprimento de Ordem de Serviço"];
const BASE_OPTIONS = ["Operação Verão", "Curitiba-BPMOA", "Curitiba-PRF", "Londrina", "Maringá", "Ponta Grossa"];
const TRANSPORT_TYPE_OPTIONS = ["Resgate", "Remoção", "Órgão", "Treinamento Operacional"];
const TRANSPORT_STATUS_OPTIONS = ["Completo", "Cancelado", "Sem atendimento"];

export default function AdvancedFilters({ onFilterChange }) {
    const [expanded, setExpanded] = useState(false);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        base: '',
        samu_occurrence: '',
        sade_occurrence: '',
        mission_id: '',
        aircraft: '',
        municipality: '',
        mission_type: '',
        commander: '',
        heli_operations: '',
        crew_member: '',
        pax: '',
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
                // Sort by trigram for easier finding
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

    const clearFilters = () => {
        const emptyFilters = Object.keys(filters).reduce((acc, key) => {
            acc[key] = '';
            return acc;
        }, {});
        setFilters(emptyFilters);
    };

    const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

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
                    {/* Filtros Temporais */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Período</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="dateFrom">Data Inicial</Label>
                                <Input
                                    id="dateFrom"
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="dateTo">Data Final</Label>
                                <Input
                                    id="dateTo"
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filtros da Missão */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Dados da Missão</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="mission_id">Nº Missão</Label>
                                <Input
                                    id="mission_id"
                                    value={filters.mission_id}
                                    onChange={(e) => handleFilterChange('mission_id', e.target.value)}
                                    placeholder="Ex: 123"
                                />
                            </div>
                            <div>
                                <Label htmlFor="sade_occurrence">Nº Ocorrência SADE</Label>
                                <Input
                                    id="sade_occurrence"
                                    value={filters.sade_occurrence}
                                    onChange={(e) => handleFilterChange('sade_occurrence', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="samu_occurrence">Nº Ocorrência SAMU</Label>
                                <Input
                                    id="samu_occurrence"
                                    value={filters.samu_occurrence}
                                    onChange={(e) => handleFilterChange('samu_occurrence', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="aircraft">Aeronave</Label>
                                <Select value={filters.aircraft} onValueChange={(v) => handleFilterChange('aircraft', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todas</SelectItem>
                                        {AIRCRAFT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="municipality">Município</Label>
                                <Input
                                    id="municipality"
                                    value={filters.municipality}
                                    onChange={(e) => handleFilterChange('municipality', e.target.value)}
                                    placeholder="Filtrar por município"
                                />
                            </div>
                            <div>
                                <Label htmlFor="mission_type">Tipo de Missão</Label>
                                <Select value={filters.mission_type} onValueChange={(v) => handleFilterChange('mission_type', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {MISSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="base">Base</Label>
                                <Select value={filters.base} onValueChange={(v) => handleFilterChange('base', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todas</SelectItem>
                                        {BASE_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Filtros da Tripulação */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Tripulação</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="commander">Comandante</Label>
                                <Input
                                    id="commander"
                                    value={filters.commander}
                                    onChange={(e) => handleFilterChange('commander', e.target.value)}
                                    placeholder="Nome do comandante"
                                />
                            </div>
                            <div>
                                <Label htmlFor="crew_member">Membro da Tripulação</Label>
                                <Select value={filters.crew_member} onValueChange={(v) => handleFilterChange('crew_member', v)}>
                                    <SelectTrigger><SelectValue placeholder="Qualquer membro" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {users.map(u => (
                                            <SelectItem key={u.id} value={u.trigrama}>
                                                {u.trigrama} - {u.nome_de_guerra}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="pax">PAX</Label>
                                <Input
                                    id="pax"
                                    value={filters.pax}
                                    onChange={(e) => handleFilterChange('pax', e.target.value)}
                                    placeholder="Passageiros"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filtros de Operações */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Operações</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="heli_operations">Operação Helitransportada</Label>
                                <Input
                                    id="heli_operations"
                                    value={filters.heli_operations}
                                    onChange={(e) => handleFilterChange('heli_operations', e.target.value)}
                                    placeholder="Ex: Rapel, Guincho"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filtros da Vítima */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Dados da Vítima</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="victim_name">Nome</Label>
                                <Input
                                    id="victim_name"
                                    value={filters.victim_name}
                                    onChange={(e) => handleFilterChange('victim_name', e.target.value)}
                                    placeholder="Nome da vítima"
                                />
                            </div>
                            <div>
                                <Label htmlFor="victim_origin_city">Cidade de Origem</Label>
                                <Input
                                    id="victim_origin_city"
                                    value={filters.victim_origin_city}
                                    onChange={(e) => handleFilterChange('victim_origin_city', e.target.value)}
                                    placeholder="Cidade"
                                />
                            </div>
                            <div>
                                <Label htmlFor="victim_origin_hospital">Hospital de Origem</Label>
                                <Input
                                    id="victim_origin_hospital"
                                    value={filters.victim_origin_hospital}
                                    onChange={(e) => handleFilterChange('victim_origin_hospital', e.target.value)}
                                    placeholder="Hospital"
                                />
                            </div>
                            <div>
                                <Label htmlFor="victim_destination_city">Cidade de Destino</Label>
                                <Input
                                    id="victim_destination_city"
                                    value={filters.victim_destination_city}
                                    onChange={(e) => handleFilterChange('victim_destination_city', e.target.value)}
                                    placeholder="Cidade"
                                />
                            </div>
                            <div>
                                <Label htmlFor="victim_destination_hospital">Hospital de Destino</Label>
                                <Input
                                    id="victim_destination_hospital"
                                    value={filters.victim_destination_hospital}
                                    onChange={(e) => handleFilterChange('victim_destination_hospital', e.target.value)}
                                    placeholder="Hospital"
                                />
                            </div>
                            <div>
                                <Label htmlFor="transport_type">Tipo de Transporte</Label>
                                <Select value={filters.transport_type} onValueChange={(v) => handleFilterChange('transport_type', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {TRANSPORT_TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="transport_status">Status do Transporte</Label>
                                <Select value={filters.transport_status} onValueChange={(v) => handleFilterChange('transport_status', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {TRANSPORT_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="diagnosis">Diagnóstico/Lesão Principal</Label>
                                <Input
                                    id="diagnosis"
                                    value={filters.diagnosis}
                                    onChange={(e) => handleFilterChange('diagnosis', e.target.value)}
                                    placeholder="Diagnóstico"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}