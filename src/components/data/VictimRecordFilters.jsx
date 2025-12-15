import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const BASE_OPTIONS = ["Operação Verão", "Curitiba-BPMOA", "Curitiba-PRF", "Londrina", "Maringá", "Ponta Grossa"];
const TRANSPORT_TYPE_OPTIONS = ["Resgate", "Remoção", "Órgão", "Treinamento Operacional"];
const TRANSPORT_STATUS_OPTIONS = ["Completo", "Cancelado", "Sem atendimento"];
const SEXO_OPTIONS = ["M", "F", "NA"];
const FAIXA_ETARIA_OPTIONS = ["RN (0-89 dias)", "Lactante (90 dias a 2 anos)", "Pediátrico/Adolecente (3 a 18 anos)", "Adulto (19 a 59 anos)", "Idoso (60 anos +)", "sem registo de idade"];
const GRUPO_PATOLOGIAS_OPTIONS = ["Causas Neonatais", "Doenças Infecciosas", "Gineco-obstétricos", "Malformações", "Outros", "Sistema Circulatório", "Sistema Endócrino", "Sistema Gastro-intestinal", "Sistema Genitourinário", "Sistema Músculo-Esquelético", "Sistema Nervoso", "Sistema Respiratório"];
const SUPORTE_VENT_OPTIONS = ["AA", "CnO2", "MF100%", "VM", "NA"];
const SIM_NAO_NA_OPTIONS = ["Sim", "Não", "NA"];
const AIRCRAFT_OPTIONS = ["Arcanjo 01", "Falcão 08", "Falcão 03", "Falcão 04"];

export default function VictimRecordFilters({ onFilterChange }) {
    const [expanded, setExpanded] = useState(false);
    const [tripulantes, setTripulantes] = useState([]);
    const [filters, setFilters] = useState({
        ano: '',
        mes: '',
        dateFrom: '',
        dateTo: '',
        base: '',
        samu_occurrence: '',
        mission_id: '',
        transport_type: '',
        transport_status: '',
        nome_paciente: '',
        sexo_paciente: '',
        idade: '',
        faixa_etaria: '',
        diagnostico: '',
        grupo_patologias: '',
        suporte_ventilatorio: '',
        uso_sedacao: '',
        uso_droga_vasoativa: '',
        glasgow_min: '',
        glasgow_max: '',
        transfusao: '',
        cidade_origem: '',
        hospital_origem: '',
        local_pouso_origem: '',
        cidade_destino: '',
        hospital_destino: '',
        local_pouso_destino: '',
        aeronave: '',
        comandante: '',
        copiloto: '',
        oat: '',
        osm: ''
    });

    useEffect(() => {
        const loadTripulantes = async () => {
            try {
                const data = await base44.entities.Tripulante.list();
                data.sort((a, b) => (a.trigrama || '').localeCompare(b.trigrama || ''));
                setTripulantes(data);
            } catch (error) {
                console.error("Erro ao carregar tripulantes:", error);
            }
        };
        loadTripulantes();
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

    const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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
                    {/* Filtros Temporais e Administrativos */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Período e Localização</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="ano">Ano</Label>
                                <Input
                                    id="ano"
                                    type="number"
                                    value={filters.ano}
                                    onChange={(e) => handleFilterChange('ano', e.target.value)}
                                    placeholder="Ex: 2025"
                                />
                            </div>
                            <div>
                                <Label htmlFor="mes">Mês</Label>
                                <Select value={filters.mes} onValueChange={(v) => handleFilterChange('mes', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {MESES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
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
                            <div>
                                <Label htmlFor="samu_occurrence">Nº Ocorrência SAMU</Label>
                                <Input
                                    id="samu_occurrence"
                                    value={filters.samu_occurrence}
                                    onChange={(e) => handleFilterChange('samu_occurrence', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="mission_id">ID da Missão</Label>
                                <Input
                                    id="mission_id"
                                    type="number"
                                    value={filters.mission_id}
                                    onChange={(e) => handleFilterChange('mission_id', e.target.value)}
                                    placeholder="Ex: 123"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filtros de Transporte */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Transporte</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        </div>
                    </div>

                    {/* Filtros do Paciente */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Dados do Paciente</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-2">
                                <Label htmlFor="nome_paciente">Nome</Label>
                                <Input
                                    id="nome_paciente"
                                    value={filters.nome_paciente}
                                    onChange={(e) => handleFilterChange('nome_paciente', e.target.value)}
                                    placeholder="Nome do paciente"
                                />
                            </div>
                            <div>
                                <Label htmlFor="sexo_paciente">Sexo</Label>
                                <Select value={filters.sexo_paciente} onValueChange={(v) => handleFilterChange('sexo_paciente', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {SEXO_OPTIONS.map(s => <SelectItem key={s} value={s}>{s === 'M' ? 'Masculino' : s === 'F' ? 'Feminino' : 'NA'}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="idade">Idade</Label>
                                <Input
                                    id="idade"
                                    value={filters.idade}
                                    onChange={(e) => handleFilterChange('idade', e.target.value)}
                                    placeholder="Ex: 45"
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <Label htmlFor="faixa_etaria">Faixa Etária</Label>
                                <Select value={filters.faixa_etaria} onValueChange={(v) => handleFilterChange('faixa_etaria', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todas</SelectItem>
                                        {FAIXA_ETARIA_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Filtros Clínicos */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Dados Clínicos</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                                <Label htmlFor="diagnostico">Diagnóstico/Lesão Principal</Label>
                                <Input
                                    id="diagnostico"
                                    value={filters.diagnostico}
                                    onChange={(e) => handleFilterChange('diagnostico', e.target.value)}
                                    placeholder="Diagnóstico"
                                />
                            </div>
                            <div>
                                <Label htmlFor="grupo_patologias">Grupo de Patologias</Label>
                                <Select value={filters.grupo_patologias} onValueChange={(v) => handleFilterChange('grupo_patologias', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {GRUPO_PATOLOGIAS_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="suporte_ventilatorio">Suporte Ventilatório</Label>
                                <Select value={filters.suporte_ventilatorio} onValueChange={(v) => handleFilterChange('suporte_ventilatorio', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {SUPORTE_VENT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="uso_sedacao">Uso de Sedação</Label>
                                <Select value={filters.uso_sedacao} onValueChange={(v) => handleFilterChange('uso_sedacao', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {SIM_NAO_NA_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="uso_droga_vasoativa">Uso de Droga Vasoativa</Label>
                                <Select value={filters.uso_droga_vasoativa} onValueChange={(v) => handleFilterChange('uso_droga_vasoativa', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {SIM_NAO_NA_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="glasgow_min">Glasgow Mínimo</Label>
                                <Input
                                    id="glasgow_min"
                                    type="number"
                                    min="3"
                                    max="15"
                                    value={filters.glasgow_min}
                                    onChange={(e) => handleFilterChange('glasgow_min', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="glasgow_max">Glasgow Máximo</Label>
                                <Input
                                    id="glasgow_max"
                                    type="number"
                                    min="3"
                                    max="15"
                                    value={filters.glasgow_max}
                                    onChange={(e) => handleFilterChange('glasgow_max', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="transfusao">Transfusão</Label>
                                <Select value={filters.transfusao} onValueChange={(v) => handleFilterChange('transfusao', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {SIM_NAO_NA_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Filtros de Localização */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Localizações</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="cidade_origem">Cidade Origem</Label>
                                <Input
                                    id="cidade_origem"
                                    value={filters.cidade_origem}
                                    onChange={(e) => handleFilterChange('cidade_origem', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="hospital_origem">Hospital Origem</Label>
                                <Input
                                    id="hospital_origem"
                                    value={filters.hospital_origem}
                                    onChange={(e) => handleFilterChange('hospital_origem', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="local_pouso_origem">Local Pouso Origem</Label>
                                <Input
                                    id="local_pouso_origem"
                                    value={filters.local_pouso_origem}
                                    onChange={(e) => handleFilterChange('local_pouso_origem', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="cidade_destino">Cidade Destino</Label>
                                <Input
                                    id="cidade_destino"
                                    value={filters.cidade_destino}
                                    onChange={(e) => handleFilterChange('cidade_destino', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="hospital_destino">Hospital Destino</Label>
                                <Input
                                    id="hospital_destino"
                                    value={filters.hospital_destino}
                                    onChange={(e) => handleFilterChange('hospital_destino', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="local_pouso_destino">Local Pouso Destino</Label>
                                <Input
                                    id="local_pouso_destino"
                                    value={filters.local_pouso_destino}
                                    onChange={(e) => handleFilterChange('local_pouso_destino', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filtros da Tripulação */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Tripulação e Aeronave</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="aeronave">Aeronave</Label>
                                <Select value={filters.aeronave} onValueChange={(v) => handleFilterChange('aeronave', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todas</SelectItem>
                                        {AIRCRAFT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="comandante">Comandante</Label>
                                <Select value={filters.comandante} onValueChange={(v) => handleFilterChange('comandante', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {tripulantes.filter(t => t.funcao === 'Piloto').map(t => (
                                            <SelectItem key={t.id} value={t.nome_de_guerra}>
                                                {t.trigrama} - {t.nome_de_guerra}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="copiloto">Copiloto</Label>
                                <Select value={filters.copiloto} onValueChange={(v) => handleFilterChange('copiloto', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {tripulantes.filter(t => t.funcao === 'Piloto').map(t => (
                                            <SelectItem key={t.id} value={t.nome_de_guerra}>
                                                {t.trigrama} - {t.nome_de_guerra}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="oat">OAT</Label>
                                <Select value={filters.oat} onValueChange={(v) => handleFilterChange('oat', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {tripulantes.filter(t => t.funcao === 'OAT').map(t => (
                                            <SelectItem key={t.id} value={t.nome_de_guerra}>
                                                {t.trigrama} - {t.nome_de_guerra}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="osm">OSM</Label>
                                <Select value={filters.osm} onValueChange={(v) => handleFilterChange('osm', v)}>
                                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Todos</SelectItem>
                                        {tripulantes.filter(t => t.funcao === 'OSM').map(t => (
                                            <SelectItem key={t.id} value={t.nome_de_guerra}>
                                                {t.trigrama} - {t.nome_de_guerra}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}