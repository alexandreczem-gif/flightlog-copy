import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const BASE_OPTIONS = ["Operação Verão", "Curitiba-BPMOA", "Curitiba-PRF", "Londrina", "Maringá", "Ponta Grossa"];
const TRANSPORTE_OPTIONS = ["Resgate", "Remoção", "Órgão", "Treinamento Operacional"];
const STATUS_TRANSPORTE_OPTIONS = ["Completo", "Cancelado", "Sem atendimento"];
const MOTIVO_QTA_OPTIONS = ["Óbito", "Instabilidade clínica", "Meteorologia", "Nova ocorrência/prioridade", "Operacional", "NA"];
const FAIXA_ETARIA_OPTIONS = ["RN (0-89 dias)", "Lactante (90 dias a 2 anos)", "Pediátrico/Adolecente (3 a 18 anos)", "Adulto (19 a 59 anos)", "Idoso (60 anos +)", "sem registo de idade"];
const GRUPO_PATOLOGIAS_OPTIONS = ["Causas Neonatais", "Doenças Infecciosas", "Gineco-obstétricos", "Malformações", "Outros", "Sistema Circulatório", "Sistema Endócrino", "Sistema Gastro-intestinal", "Sistema Genitourinário", "Sistema Músculo-Esquelético", "Sistema Nervoso", "Sistema Respiratório"];
const SUPORTE_VENT_OPTIONS = ["AA", "CnO2", "MF100%", "VM", "NA"];
const SIM_NAO_NA_OPTIONS = ["Sim", "Não", "NA"];
const SEXO_OPTIONS = ["M", "F", "NA"];
const CITY_OPTIONS = ["FORA DO PR","NÃO HOUVE POUSO","Abatiá-PR","Adrianópolis-PR","Agudos do Sul-PR","Almirante Tamandaré-PR","Alto Paraíso-PR","Alto Paraná-PR","Alto Piquiri-PR","Altônia-PR","Alvorada do Sul-PR","Amaporã-PR","Ampére-PR","Anahy-PR","Andirá-PR","Ângulo-PR","Antonina-PR","Antônio Olinto-PR","Apucarana-PR","Arapongas-PR","Arapoti-PR","Arapuã-PR","Araruna-PR","Araucária-PR","Ariranha do Ivaí-PR","Assaí-PR","Assis Chateaubriand-PR","Astorga-PR","Atalaia-PR","Balsa Nova-PR","Bandeirantes-PR","Barbosa Ferraz-PR","Barra do Jacaré-PR","Barracão-PR","Bela Vista da Caroba-PR","Bela Vista do Paraíso-PR","Bituruna-PR","Boa Esperança-PR","Boa Esperança do Iguaçu-PR","Boa Ventura de São Roque-PR","Boa Vista da Aparecida-PR","Bocaiúva do Sul-PR","Bom Jesus do Sul-PR","Bom Sucesso-PR","Bom Sucesso do Sul-PR","Borrazópolis-PR","Braganey-PR","Brasilândia do Sul-PR","Cafeara-PR","Cafelândia-PR","Cafezal do Sul-PR","Califórnia-PR","Cambará-PR","Cambé-PR","Cambira-PR","Campina da Lagoa-PR","Campina do Simão-PR","Campina Grande do Sul-PR","Campo Bonito-PR","Campo do Tenente-PR","Campo Largo-PR","Campo Magro-PR","Campo Mourão-PR","Cândido de Abreu-PR","Candói-PR","Cantagalo-PR","Capanema-PR","Capitão Leônidas Marques-PR","Carambeí-PR","Carlópolis-PR","Cascavel-PR","Castro-PR","Catanduvas-PR","Centenário do Sul-PR","Cerro Azul-PR","Céu Azul-PR","Chopinzinho-PR","Cianorte-PR","Cidade Gaúcha-PR","Clevelândia-PR","Colombo-PR","Colorado-PR","Congonhinhas-PR","Conselheiro Mairinck-PR","Contenda-PR","Corbélia-PR","Cornélio Procópio-PR","Coronel Domingos Soares-PR","Coronel Vivida-PR","Corumbataí do Sul-PR","Cruz Machado-PR","Cruzeiro do Iguaçu-PR","Cruzeiro do Oeste-PR","Cruzeiro do Sul-PR","Cruzmaltina-PR","Curitiba-PR","Curiúva-PR","Diamante do Norte-PR","Diamante do Sul-PR","Diamante D'Oeste-PR","Dois Vizinhos-PR","Douradina-PR","Doutor Camargo-PR","Doutor Ulysses-PR","Enéas Marques-PR","Engenheiro Beltrão-PR","Entre Rios do Oeste-PR","Esperança Nova-PR","Espigão Alto do Iguaçu-PR","Farol-PR","Faxinal-PR","Fazenda Rio Grande-PR","Fênix-PR","Fernandes Pinheiro-PR","Figueira-PR","Flor da Serra do Sul-PR","Floraí-PR","Floresta-PR","Florestópolis-PR","Flórida-PR","Formosa do Oeste-PR","Foz do Iguaçu-PR","Foz do Jordão-PR","Francisco Alves-PR","Francisco Beltrão-PR","General Carneiro-PR","Godoy Moreira-PR","Goioerê-PR","Goioxim-PR","Grandes Rios-PR","Guaíra-PR","Guairaçá-PR","Guamiranga-PR","Guapirama-PR","Guapirama-PR","Guaporé-PR","Guaraci-PR","Guaraniaçu-PR","Guarapuava-PR","Guaraqueçaba-PR","Guaratuba-PR","Honório Serpa-PR","Ibaiti-PR","Ibema-PR","Ibiporã-PR","Icaraíma-PR","Iguaraçu-PR","Iguatu-PR","Imbaú-PR","Imbituva-PR","Inácio Martins-PR","Inajá-PR","Indianópolis-PR","Ipiranga-PR","Iporã-PR","Iracema do Oeste-PR","Irati-PR","Iretama-PR","Itaguajé-PR","Itaipulândia-PR","Itambaracá-PR","Itambé-PR","Itapejara d'Oeste-PR","Itaperuçu-PR","Itaúna do Sul-PR","Ivaí-PR","Ivaiporã-PR","Ivaté-PR","Ivatuba-PR","Jaboti-PR","Jacarezinho-PR","Jaguapitã-PR","Jaguariaíva-PR","Jandaia do Sul-PR","Janiópolis-PR","Japira-PR","Japurá-PR","Jardim Alegre-PR","Jardim Olinda-PR","Jataizinho-PR","Jesuítas-PR","Joaquim Távora-PR","Jundiaí do Sul-PR","Juranda-PR","Jussara-PR","Kaloré-PR","Lapa-PR","Laranjal-PR","Laranjeiras do Sul-PR","Leópolis-PR","Lidianópolis-PR","Lindoeste-PR","Loanda-PR","Lobato-PR","Londrina-PR","Luiziana-PR","Lunardelli-PR","Lupionópolis-PR","Mallet-PR","Mamborê-PR","Mandaguaçu-PR","Mandaguari-PR","Mandirituba-PR","Manfrinópolis-PR","Mangueirinha-PR","Manoel Ribas-PR","Marechal Cândido Rondon-PR","Maria Helena-PR","Marialva-PR","Marilândia do Sul-PR","Marilena-PR","Mariluz-PR","Maringá-PR","Mariópolis-PR","Maripá-PR","Marmeleiro-PR","Marquinho-PR","Marumbi-PR","Matelândia-PR","Matinhos-PR","Mato Rico-PR","Mauá da Serra-PR","Medianeira-PR","Mercedes-PR","Mirador-PR","Miraselva-PR","Missal-PR","Moreira Sales-PR","Morretes-PR","Munhoz de Melo-PR","Nossa Senhora das Graças-PR","Nova Aliança do Ivaí-PR","Nova América da Colina-PR","Nova Aurora-PR","Nova Cantu-PR","Nova Esperança-PR","Nova Esperança do Sudoeste-PR","Nova Fátima-PR","Nova Laranjeiras-PR","Nova Londrina-PR","Nova Olímpia-PR","Nova Prata do Iguaçu-PR","Nova Santa Bárbara-PR","Nova Santa Rosa-PR","Nova Tebas-PR","Novo Itacolomi-PR","Ortigueira-PR","Ourizona-PR","Ouro Verde do Oeste-PR","Paiçandu-PR","Palmas-PR","Palmeira-PR","Palmital-PR","Palotina-PR","Paraíso do Norte-PR","Paranacity-PR","Paranaguá-PR","Paranapoema-PR","Paranavaí-PR","Pato Bragado-PR","Pato Branco-PR","Paula Freitas-PR","Paulo Frontin-PR","Peabiru-PR","Perobal-PR","Pérola-PR","Pérola d'Oeste-PR","Piên-PR","Pinhais-PR","Pinhal de São Bento-PR","Pinhalão-PR","Pinhão-PR","Piraí do Sul-PR","Piraquara-PR","Pitanga-PR","Pitangueiras-PR","Planaltina do Paraná-PR","Planalto-PR","Ponta Grossa-PR","Pontal do Paraná-PR","Porecatu-PR","Porto Amazonas-PR","Porto Barreiro-PR","Porto Rico-PR","Porto Vitória-PR","Prado Ferreira-PR","Pranchita-PR","Presidente Castelo Branco-PR","Primeiro de Maio-PR","Prudentópolis-PR","Quarto Centenário-PR","Quatiguá-PR","Quatro Barras-PR","Quatro Pontes-PR","Quedas do Iguaçu-PR","Querência do Norte-PR","Quinta do Sol-PR","Quitandinha-PR","Ramilândia-PR","Rancho Alegre-PR","Rancho Alegre D'Oeste-PR","Realeza-PR","Rebouças-PR","Renascença-PR","Reserva-PR","Reserva do Iguaçu-PR","Ribeirão Claro-PR","Ribeirão do Pinhal-PR","Rio Azul-PR","Rio Bom-PR","Rio Bonito do Iguaçu-PR","Rio Branco do Ivaí-PR","Rio Branco do Sul-PR","Rio Negro-PR","Rolândia-PR","Roncador-PR","Rondon-PR","Rosário do Ivaí-PR","Sabáudia-PR","Salgado Filho-PR","Salto do Itararé-PR","Salto do Lontra-PR","Santa Amélia-PR","Santa Cecília do Pavão-PR","Santa Cruz de Monte Castelo-PR","Santa Fé-PR","Santa Helena-PR","Santa Inês-PR","Santa Isabel do Ivaí-PR","Santa Izabel do Oeste-PR","Santa Lúcia-PR","Santa Maria do Oeste-PR","Santa Mariana-PR","Santa Mônica-PR","Santa Tereza do Oeste-PR","Santa Terezinha de Itaipu-PR","Santana do Itararé-PR","Santo Antônio da Platina-PR","Santo Antônio do Caiuá-PR","Santo Antônio do Paraíso-PR","Santo Antônio do Sudoeste-PR","Santo Inácio-PR","São Carlos do Ivaí-PR","São Jerônimo da Serra-PR","São João-PR","São João do Caiuá-PR","São João do Ivaí-PR","São João do Triunfo-PR","São Jorge do Ivaí-PR","São Jorge do Patrocínio-PR","São Jorge d'Oeste-PR","São José da Boa Vista-PR","São José das Palmeiras-PR","São José dos Pinhais-PR","São Manoel do Paraná-PR","São Mateus do Sul-PR","São Miguel do Iguaçu-PR","São Pedro do Iguaçu-PR","São Pedro do Ivaí-PR","São Pedro do Paraná-PR","São Sebastião da Amoreira-PR","São Tomé-PR","Sapopema-PR","Sarandi-PR","Saudade do Iguaçu-PR","Sengés-PR","Serranópolis do Iguaçu-PR","Sertaneja-PR","Sertanópolis-PR","Siqueira Campos-PR","Sulina-PR","Tamarana-PR","Tamboara-PR","Tapejara-PR","Tapira-PR","Teixeira Soares-PR","Telêmaco Borba-PR","Terra Boa-PR","Terra Rica-PR","Terra Roxa-PR","Tibagi-PR","Tijucas do Sul-PR","Toledo-PR","Tomazina-PR","Três Barras do Paraná-PR","Tunas do Paraná-PR","Tuneiras do Oeste-PR","Tupãssi-PR","Turvo-PR","Ubiratã-PR","Umuarama-PR","União da Vitória-PR","Uniflor-PR","Uraí-PR","Ventania-PR","Vera Cruz do Oeste-PR","Verê-PR","Virmond-PR","Vitorino-PR","Wenceslau Braz-PR","Xambrê-PR"];

const FormSection = ({ title, children }) => (
    <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
        {children}
    </div>
);

function getAgeRange(age) {
    if (age === null || age === undefined || age === '') return "sem registo de idade";
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) {
        if (typeof age === 'string' && (age.toLowerCase().includes('dias') || age.toLowerCase().includes('dia'))) {
            return "RN (0-89 dias)";
        }
        return "sem registo de idade";
    }
    if (ageNum < 3) return "Lactante (90 dias a 2 anos)";
    if (ageNum >= 3 && ageNum <= 18) return "Pediátrico/Adolecente (3 a 18 anos)";
    if (ageNum >= 19 && ageNum <= 59) return "Adulto (19 a 59 anos)";
    if (ageNum >= 60) return "Idoso (60 anos +)";
    return "sem registo de idade";
}

export default function PendingVictimForm({ onSave, isSaving, currentUser }) {
    const [data, setData] = useState({
        data: new Date().toISOString().split('T')[0],
        ocorrencia_samu: '',
        tipo_transporte: '',
        status_transporte: '',
        motivo_qta: '',
        nome_paciente: '',
        sexo_paciente: '',
        idade: '',
        faixa_etaria: '',
        diagnostico_lesao_principal: '',
        grupo_patologias: '',
        grau_afogamento: 'NA',
        observacoes: '',
        suporte_ventilatorio: '',
        uso_sedacao: '',
        uso_droga_vasoativa: '',
        glasgow: '',
        transfusao: '',
        transfusao_bolsas: '',
        pressao_arterial_sistolica: '',
        frequencia_cardiaca: '',
        indice_choque: null,
        compressor_toracico: '',
        ultrassom_portatil: '',
        babypod: ''
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [isUploadingFrente, setIsUploadingFrente] = useState(false);
    const [isUploadingVerso, setIsUploadingVerso] = useState(false);

    const isOSM = currentUser && currentUser.flight_log_role === 'OSM' && currentUser.role !== 'admin';

    const handleChange = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    useEffect(() => {
        setData(prev => ({ ...prev, faixa_etaria: getAgeRange(prev.idade) }));
    }, [data.idade]);

    useEffect(() => {
        const fc = parseFloat(data.frequencia_cardiaca);
        const pas = parseFloat(data.pressao_arterial_sistolica);

        if (!isNaN(fc) && !isNaN(pas) && pas > 0) {
            const indice = (fc / pas).toFixed(2);
            setData(prev => ({ ...prev, indice_choque: parseFloat(indice) }));
        } else if (data.indice_choque !== null && data.indice_choque !== undefined && data.indice_choque !== '') {
            setData(prev => ({ ...prev, indice_choque: null }));
        }
    }, [data.frequencia_cardiaca, data.pressao_arterial_sistolica]);

    const validateForm = () => {
        const errors = {};

        // Validações obrigatórias
        if (!data.data) errors.data = "Data é obrigatória";
        if (!data.nome_paciente) errors.nome_paciente = "Nome do paciente é obrigatório";
        if (!data.compressor_toracico) errors.compressor_toracico = "Compressor Torácico é obrigatório";
        if (!data.ultrassom_portatil) errors.ultrassom_portatil = "Ultrassom Portátil é obrigatório";
        if (!data.babypod) errors.babypod = "Babypod é obrigatório";
        if (!data.sexo_paciente) errors.sexo_paciente = "Sexo do paciente é obrigatório";
        if (!data.idade) errors.idade = "Idade é obrigatória";
        
        // Validações do transporte
        if (!data.tipo_transporte) errors.tipo_transporte = "Tipo de Transporte é obrigatório";
        if (!data.status_transporte) errors.status_transporte = "Status do Transporte é obrigatório";
        if (data.status_transporte === 'Cancelado' && (!data.motivo_qta || data.motivo_qta.trim() === '')) {
            errors.motivo_qta = "Motivo do QTA é obrigatório quando o status é Cancelado";
        }

        // Validações clínicas
        if (!data.diagnostico_lesao_principal || data.diagnostico_lesao_principal.trim() === '') {
            errors.diagnostico_lesao_principal = "Diagnóstico/Lesão Principal é obrigatório";
        }
        if (!data.grupo_patologias) errors.grupo_patologias = "Grupo de Patologias é obrigatório";
        if (!data.suporte_ventilatorio) errors.suporte_ventilatorio = "Suporte Ventilatório é obrigatório";
        if (!data.uso_sedacao) errors.uso_sedacao = "Uso de Sedação é obrigatório";
        if (!data.uso_droga_vasoativa) errors.uso_droga_vasoativa = "Uso de Droga Vasoativa é obrigatório";
        if (!data.glasgow || data.glasgow === '') errors.glasgow = "Glasgow é obrigatório";
        if (!data.transfusao) errors.transfusao = "Transfusão é obrigatório";
        if (data.transfusao === 'Sim' && (!data.transfusao_bolsas || data.transfusao_bolsas === '')) {
            errors.transfusao_bolsas = "Nº de Bolsas é obrigatório quando Transfusão é Sim";
        }
        if (!data.pressao_arterial_sistolica || data.pressao_arterial_sistolica === '') {
            errors.pressao_arterial_sistolica = "Pressão Arterial Sistólica é obrigatória";
        }
        if (!data.frequencia_cardiaca || data.frequencia_cardiaca === '') {
            errors.frequencia_cardiaca = "Frequência Cardíaca é obrigatória";
        }

        return errors;
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const setUploading = type === 'frente' ? setIsUploadingFrente : setIsUploadingVerso;
        const field = type === 'frente' ? 'ras_ram_rae_file_url' : 'ras_ram_rae_file_url_verso';

        try {
            setUploading(true);
            const result = await base44.integrations.Core.UploadFile({ file });
            setData(prev => ({ ...prev, [field]: result.file_url }));
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            alert('Erro ao fazer upload do arquivo. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = (type) => {
        const field = type === 'frente' ? 'ras_ram_rae_file_url' : 'ras_ram_rae_file_url_verso';
        setData(prev => ({ ...prev, [field]: null }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const errors = validateForm();
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            
            const firstErrorField = Object.keys(errors)[0];
            const element = document.getElementById(firstErrorField);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            const errorCount = Object.keys(errors).length;
            alert(`Por favor, preencha todos os campos obrigatórios. ${errorCount} campo(s) precisam ser preenchidos.`);
            return;
        }
        
        // Limpar campos numéricos vazios
        const cleanedData = { ...data };
        const numericFields = ['glasgow', 'transfusao_bolsas', 'pressao_arterial_sistolica', 'frequencia_cardiaca', 'indice_choque'];
        numericFields.forEach(field => {
            if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
                delete cleanedData[field];
            } else {
                cleanedData[field] = Number(cleanedData[field]);
            }
        });
        
        onSave(cleanedData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {Object.keys(validationErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-900">Campos obrigatórios não preenchidos</p>
                        <p className="text-sm text-red-700 mt-1">
                            Por favor, preencha todos os campos marcados com asterisco (*) vermelho.
                        </p>
                    </div>
                </div>
            )}

            <FormSection title="Dados Administrativos">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="data">Data do Atendimento <span className="text-red-500">*</span></Label>
                        <Input 
                            id="data"
                            type="date"
                            value={data.data} 
                            onChange={e => handleChange('data', e.target.value)}
                            className={validationErrors.data ? 'border-red-500' : ''}
                        />
                        {validationErrors.data && <p className="text-xs text-red-500 mt-1">{validationErrors.data}</p>}
                    </div>
                    <div>
                        <Label htmlFor="ocorrencia_samu">Nº Ocorrência SAMU</Label>
                        <Input id="ocorrencia_samu" value={data.ocorrencia_samu} onChange={e => handleChange('ocorrencia_samu', e.target.value)} />
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Base será preenchida pelo Piloto/OAT ao registrar a missão.
                </p>
            </FormSection>

            <FormSection title="Dados do Transporte">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <Label htmlFor="tipo_transporte">Tipo de Transporte <span className="text-red-500">*</span></Label>
                        <Select value={data.tipo_transporte} onValueChange={v => handleChange('tipo_transporte', v)}>
                            <SelectTrigger id="tipo_transporte" className={validationErrors.tipo_transporte ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>{TRANSPORTE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                        {validationErrors.tipo_transporte && <p className="text-xs text-red-500 mt-1">{validationErrors.tipo_transporte}</p>}
                    </div>
                    <div>
                        <Label htmlFor="status_transporte">Status do Transporte <span className="text-red-500">*</span></Label>
                        <Select value={data.status_transporte} onValueChange={v => handleChange('status_transporte', v)}>
                            <SelectTrigger id="status_transporte" className={validationErrors.status_transporte ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>{STATUS_TRANSPORTE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                        {validationErrors.status_transporte && <p className="text-xs text-red-500 mt-1">{validationErrors.status_transporte}</p>}
                    </div>
                    {data.status_transporte === 'Cancelado' && (
                        <div>
                            <Label htmlFor="motivo_qta">Motivo do QTA <span className="text-red-500">*</span></Label>
                            <Select value={data.motivo_qta} onValueChange={v => handleChange('motivo_qta', v)}>
                                <SelectTrigger id="motivo_qta" className={validationErrors.motivo_qta ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>{MOTIVO_QTA_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                            {validationErrors.motivo_qta && <p className="text-xs text-red-500 mt-1">{validationErrors.motivo_qta}</p>}
                        </div>
                    )}
                </div>
            </FormSection>

            <FormSection title="Dados do Paciente">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2">
                        <Label htmlFor="nome_paciente">Nome <span className="text-red-500">*</span></Label>
                        <Input 
                            id="nome_paciente"
                            value={data.nome_paciente} 
                            onChange={e => handleChange('nome_paciente', e.target.value)}
                            className={validationErrors.nome_paciente ? 'border-red-500' : ''}
                        />
                        {validationErrors.nome_paciente && <p className="text-xs text-red-500 mt-1">{validationErrors.nome_paciente}</p>}
                    </div>
                    <div>
                        <Label htmlFor="sexo_paciente">Sexo <span className="text-red-500">*</span></Label>
                        <Select value={data.sexo_paciente} onValueChange={v => handleChange('sexo_paciente', v)}>
                            <SelectTrigger id="sexo_paciente" className={validationErrors.sexo_paciente ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>{SEXO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                        {validationErrors.sexo_paciente && <p className="text-xs text-red-500 mt-1">{validationErrors.sexo_paciente}</p>}
                    </div>
                    <div>
                        <Label htmlFor="idade">Idade <span className="text-red-500">*</span></Label>
                        <Input 
                            id="idade"
                            value={data.idade} 
                            onChange={e => handleChange('idade', e.target.value)}
                            className={validationErrors.idade ? 'border-red-500' : ''}
                        />
                        {validationErrors.idade && <p className="text-xs text-red-500 mt-1">{validationErrors.idade}</p>}
                    </div>
                    <div className="lg:col-span-2">
                        <Label>Faixa Etária</Label>
                        <Select value={data.faixa_etaria} disabled>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{FAIXA_ETARIA_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
            </FormSection>

            <FormSection title="Dados Clínicos">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Label htmlFor="diagnostico_lesao_principal">Diagnóstico/Lesão Principal <span className="text-red-500">*</span></Label>
                        <Input 
                            id="diagnostico_lesao_principal"
                            value={data.diagnostico_lesao_principal || ''} 
                            onChange={e => handleChange('diagnostico_lesao_principal', e.target.value)}
                            className={validationErrors.diagnostico_lesao_principal ? 'border-red-500' : ''}
                        />
                        {validationErrors.diagnostico_lesao_principal && <p className="text-xs text-red-500 mt-1">{validationErrors.diagnostico_lesao_principal}</p>}
                    </div>
                    <div>
                        <Label htmlFor="grupo_patologias">Grupo de Patologias <span className="text-red-500">*</span></Label>
                        <Select value={data.grupo_patologias} onValueChange={v => handleChange('grupo_patologias', v)}>
                            <SelectTrigger id="grupo_patologias" className={validationErrors.grupo_patologias ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>{GRUPO_PATOLOGIAS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                        {validationErrors.grupo_patologias && <p className="text-xs text-red-500 mt-1">{validationErrors.grupo_patologias}</p>}
                    </div>
                    <div>
                        <Label htmlFor="grau_afogamento">Grau de Afogamento</Label>
                        <Select value={data.grau_afogamento} onValueChange={v => handleChange('grau_afogamento', v)}>
                            <SelectTrigger id="grau_afogamento"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {['1', '2', '3', '4', '5', '6', 'NA'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="suporte_ventilatorio">Suporte Ventilatório <span className="text-red-500">*</span></Label>
                        <Select value={data.suporte_ventilatorio} onValueChange={v => handleChange('suporte_ventilatorio', v)}>
                            <SelectTrigger id="suporte_ventilatorio" className={validationErrors.suporte_ventilatorio ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>{SUPORTE_VENT_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                        {validationErrors.suporte_ventilatorio && <p className="text-xs text-red-500 mt-1">{validationErrors.suporte_ventilatorio}</p>}
                    </div>
                    <div>
                        <Label htmlFor="uso_sedacao">Uso de Sedação <span className="text-red-500">*</span></Label>
                        <Select value={data.uso_sedacao} onValueChange={v => handleChange('uso_sedacao', v)}>
                            <SelectTrigger id="uso_sedacao" className={validationErrors.uso_sedacao ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>{SIM_NAO_NA_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                        {validationErrors.uso_sedacao && <p className="text-xs text-red-500 mt-1">{validationErrors.uso_sedacao}</p>}
                    </div>
                    <div>
                        <Label htmlFor="uso_droga_vasoativa">Uso de Droga Vasoativa <span className="text-red-500">*</span></Label>
                        <Select value={data.uso_droga_vasoativa} onValueChange={v => handleChange('uso_droga_vasoativa', v)}>
                            <SelectTrigger id="uso_droga_vasoativa" className={validationErrors.uso_droga_vasoativa ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>{SIM_NAO_NA_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                        {validationErrors.uso_droga_vasoativa && <p className="text-xs text-red-500 mt-1">{validationErrors.uso_droga_vasoativa}</p>}
                    </div>
                    <div>
                        <Label htmlFor="glasgow">Glasgow <span className="text-red-500">*</span></Label>
                        <Input 
                            id="glasgow"
                            type="number" 
                            min="3" 
                            max="15" 
                            value={data.glasgow || ''} 
                            onChange={e => handleChange('glasgow', e.target.value)}
                            className={validationErrors.glasgow ? 'border-red-500' : ''}
                        />
                        {validationErrors.glasgow && <p className="text-xs text-red-500 mt-1">{validationErrors.glasgow}</p>}
                    </div>
                    <div>
                        <Label htmlFor="transfusao">Transfusão <span className="text-red-500">*</span></Label>
                        <Select value={data.transfusao} onValueChange={v => handleChange('transfusao', v)}>
                            <SelectTrigger id="transfusao" className={validationErrors.transfusao ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>{SIM_NAO_NA_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                        {validationErrors.transfusao && <p className="text-xs text-red-500 mt-1">{validationErrors.transfusao}</p>}
                    </div>
                    {data.transfusao === 'Sim' && (
                        <div>
                            <Label htmlFor="transfusao_bolsas">Nº de Bolsas <span className="text-red-500">*</span></Label>
                            <Input 
                                id="transfusao_bolsas"
                                type="number" 
                                value={data.transfusao_bolsas || ''} 
                                onChange={e => handleChange('transfusao_bolsas', e.target.value)}
                                className={validationErrors.transfusao_bolsas ? 'border-red-500' : ''}
                            />
                            {validationErrors.transfusao_bolsas && <p className="text-xs text-red-500 mt-1">{validationErrors.transfusao_bolsas}</p>}
                        </div>
                    )}
                    <div>
                        <Label htmlFor="pressao_arterial_sistolica">PA Sistólica (mmHg) <span className="text-red-500">*</span></Label>
                        <Input 
                            id="pressao_arterial_sistolica"
                            type="number" 
                            value={data.pressao_arterial_sistolica || ''} 
                            onChange={e => handleChange('pressao_arterial_sistolica', e.target.value)}
                            className={validationErrors.pressao_arterial_sistolica ? 'border-red-500' : ''}
                        />
                        {validationErrors.pressao_arterial_sistolica && <p className="text-xs text-red-500 mt-1">{validationErrors.pressao_arterial_sistolica}</p>}
                    </div>
                    <div>
                        <Label htmlFor="frequencia_cardiaca">Frequência Cardíaca (bpm) <span className="text-red-500">*</span></Label>
                        <Input 
                            id="frequencia_cardiaca"
                            type="number" 
                            value={data.frequencia_cardiaca || ''} 
                            onChange={e => handleChange('frequencia_cardiaca', e.target.value)}
                            className={validationErrors.frequencia_cardiaca ? 'border-red-500' : ''}
                        />
                        {validationErrors.frequencia_cardiaca && <p className="text-xs text-red-500 mt-1">{validationErrors.frequencia_cardiaca}</p>}
                    </div>
                    <div>
                        <Label htmlFor="indice_choque">Índice de Choque</Label>
                        <Input 
                            id="indice_choque"
                            type="number"
                            step="0.01"
                            value={data.indice_choque || ''} 
                            readOnly
                            className="bg-slate-100"
                        />
                    </div>
                </div>
            </FormSection>

            <FormSection title="Equipamentos Utilizados">
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <Label htmlFor="compressor_toracico">Compressor Torácico Automático <span className="text-red-500">*</span></Label>
                        <Select value={data.compressor_toracico} onValueChange={v => handleChange('compressor_toracico', v)}>
                            <SelectTrigger id="compressor_toracico" className={validationErrors.compressor_toracico ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Não Disponível">Não Disponível</SelectItem>
                                <SelectItem value="Disponível no Almoxarifado">Disponível no Almoxarifado</SelectItem>
                                <SelectItem value="Disponível na Aeronave">Disponível na Aeronave</SelectItem>
                                <SelectItem value="Posicionado no Paciente">Posicionado no Paciente</SelectItem>
                                <SelectItem value="Utilizado em RCP">Utilizado em RCP</SelectItem>
                            </SelectContent>
                        </Select>
                        {validationErrors.compressor_toracico && <p className="text-xs text-red-500 mt-1">{validationErrors.compressor_toracico}</p>}
                    </div>
                    <div>
                        <Label htmlFor="ultrassom_portatil">Ultrassom Portátil <span className="text-red-500">*</span></Label>
                        <Select value={data.ultrassom_portatil} onValueChange={v => handleChange('ultrassom_portatil', v)}>
                            <SelectTrigger id="ultrassom_portatil" className={validationErrors.ultrassom_portatil ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Não Disponível">Não Disponível</SelectItem>
                                <SelectItem value="Disponível no Almoxarifado">Disponível no Almoxarifado</SelectItem>
                                <SelectItem value="Disponível na Aeronave">Disponível na Aeronave</SelectItem>
                                <SelectItem value="Utilizado">Utilizado</SelectItem>
                            </SelectContent>
                        </Select>
                        {validationErrors.ultrassom_portatil && <p className="text-xs text-red-500 mt-1">{validationErrors.ultrassom_portatil}</p>}
                    </div>
                    <div>
                        <Label htmlFor="babypod">Babypod <span className="text-red-500">*</span></Label>
                        <Select value={data.babypod} onValueChange={v => handleChange('babypod', v)}>
                            <SelectTrigger id="babypod" className={validationErrors.babypod ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Não Disponível">Não Disponível</SelectItem>
                                <SelectItem value="Disponível no Almoxarifado">Disponível no Almoxarifado</SelectItem>
                                <SelectItem value="Disponível na Aeronave">Disponível na Aeronave</SelectItem>
                                <SelectItem value="Utilizado">Utilizado</SelectItem>
                            </SelectContent>
                        </Select>
                        {validationErrors.babypod && <p className="text-xs text-red-500 mt-1">{validationErrors.babypod}</p>}
                    </div>
                </div>
            </FormSection>

            <FormSection title="Observações">
                <p className="text-xs text-slate-500 mb-2">
                    Os dados de localização (origem/destino) serão preenchidos pelo Piloto/OAT ao registrar a missão.
                </p>
                <Textarea value={data.observacoes} onChange={e => handleChange('observacoes', e.target.value)} className="h-32" />
            </FormSection>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSaving} className="w-full md:w-auto bg-red-700 hover:bg-red-800 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Salvando..." : "Salvar Pré-Detalhamento"}
                </Button>
            </div>
        </form>
    );
}