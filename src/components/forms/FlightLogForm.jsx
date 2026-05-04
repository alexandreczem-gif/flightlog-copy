import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Save, Trash2, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CoordinateMap from './CoordinateMap';
import HospitalCombobox from './HospitalCombobox';
import CitySelect from './CitySelect';
import MunicipalityCombobox from './MunicipalityCombobox';

const MISSION_TYPES = [
  "Remoção aeromédica", "Resgate aeromédico", "Busca Terrestre", "Busca Aquática",
  "Salvamento Aquático", "Salvamento Terrestre", "Transporte de Órgãos",
  "Combate a Incêndio", "Plataforma de observação BM", "Transporte de tropa BM",
  "Operação de Defesa Civil", "Ronda Preventiva na Faixa Litorânea",
  "Ocorrência Cancelada", "Transporte de Vacinas/Medicamentos",
  "Transporte de materiais", "Transporte de autoridades", "Apoio a PM",
  "Apoio a Outros Órgãos", "Voo de Manutenção", "Voo de Treinamento",
  "Voo de Translado", "Voo de demonstração", "Cumprimento de Ordem de Serviço"
];

const MISSION_TYPES_PM = [
  "Operações Programadas/Eventos",
  "Busca de Fugitivo(s)/Suspeito(s)",
  "Roubo",
  "Roubo a Banco",
  "Confronto Armado",
  "Veículo Recuperado",
  "Sequestro de Pessoas",
  "Plataforma de Observação Policial",
  "Radio Patrulhamento Urbano",
  "Radio Patrulhamento Aéreo em Fronteira",
  "Radio Patrulhamento Aéreo Rodoviário",
  "Fuga/Rebelião em Estabelecimento Prisional",
  "Escolta",
  "Cumprimento de Mandando",
  "Reintegração de Posse",
  "Fiscalização Ambiental",
  "Fiscalização Ambiental em Apoio ao IAT",
  "Fiscalização Ambiental em Apoio ao BPMAmb FV",
  "Fiscalização Ambiental em apoio a Outros Órgãos",
  "Transporte de Autoridade(s)/Dignitário(s)",
  "Transporte de Material (Armas, Munições)",
  "Transporte de Material (Outros)",
  "Transporte de Tropa Policial",
  "Ocorrência Aérea Policial Cancelada",
  "Ocorrências Diversas"
];

const HELI_OPERATIONS = [
  "Guincho", "Rapel", "McGuire", "Helibalde", "Carga Externa", "Pouso em área restrita", 
  "Helocasting", "Puçá", "Sling", "Embarque ou desembarque a baixa altura",
  "Acompanhamento de Salvamento sem intervenção da aeronave", "Orientação Preventiva ao Banhista"
];

const UserSelect = ({ field, label, value, onChange, userList, required }) => {
  const normalizedValue = value || '_none_';
  
  const handleChange = (newValue) => {
    onChange(newValue === '_none_' ? '' : newValue);
  };
  
  return (
    <div>
      <Label htmlFor={field}>{label}</Label>
      <Select value={normalizedValue} onValueChange={handleChange} required={required}>
        <SelectTrigger id={field}><SelectValue placeholder="Selecione..." /></SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value="_none_">Nenhum</SelectItem>}
          {userList && userList.length > 0 ? (
            userList.map(user => {
              const displayName = user.trigrama && user.nome_de_guerra 
                ? `${user.trigrama} - ${user.nome_de_guerra}`.trim()
                : user.nome_de_guerra || user.nome_completo || user.full_name;
              const selectValue = user.nome_de_guerra || user.nome_completo || user.full_name;
              
              return (
                <SelectItem key={user.id} value={selectValue}>
                  {displayName}
                </SelectItem>
              );
            })
          ) : (
            <SelectItem value="_empty_" disabled>Nenhum usuário disponível</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default function FlightLogForm({ initialData, onSave, isSaving, availableCrew, missionId, dailyServiceData, onDateChange, isHistoricalFlight, missionInOperation, setMissionInOperation, filteredAircraft }) {
  const [formData, setFormData] = useState({
    date: initialData?.date || '',
    mission_id: missionId || initialData?.mission_id || '',
    base: initialData?.base || '',
    sade_occurrence_number: initialData?.sade_occurrence_number || '',
    diario_bordo_pagina: initialData?.diario_bordo_pagina || '',
    aircraft: initialData?.aircraft || '',
    municipality: initialData?.municipality || '',
    mission_type: initialData?.mission_type || '',
    mission_type_pm: initialData?.mission_type_pm || '',
    pilot_in_command: initialData?.pilot_in_command || '',
    pilot_2: initialData?.pilot_2 || '',
    pilot_3: initialData?.pilot_3 || '',
    copilot: initialData?.copilot || '',
    copilot_2: initialData?.copilot_2 || '',
    copilot_3: initialData?.copilot_3 || '',
    oat_1: initialData?.oat_1 || '',
    oat_2: initialData?.oat_2 || '',
    oat_3: initialData?.oat_3 || '',
    osm_1: initialData?.osm_1 || '',
    osm_2: initialData?.osm_2 || '',
    pax: initialData?.pax || '',
    heli_operations: initialData?.heli_operations || [],
    rescued_victims_count: initialData?.rescued_victims_count || '',
    oriented_people_count: initialData?.oriented_people_count || '',
    helibalde_launches: initialData?.helibalde_launches || '',
    helibalde_load_liters: initialData?.helibalde_load_liters || '',
    external_load_time_min: initialData?.external_load_time_min || '',
    external_load_kg: initialData?.external_load_kg || '',
    victims: initialData?.victims || [],
    remarks: initialData?.remarks || '',
  });

  const [stages, setStages] = useState(() => {
    // Recuperar etapas dos campos do banco de dados
    if (initialData) {
      const recoveredStages = [];
      for (let i = 1; i <= 6; i++) {
        if (initialData[`departure_time_${i}`] && initialData[`arrival_time_${i}`]) {
          recoveredStages.push({
            departure_time: initialData[`departure_time_${i}`] || '',
            arrival_time: initialData[`arrival_time_${i}`] || '',
            origin: initialData[`origin_${i}`] || '',
            destination: initialData[`destination_${i}`] || '',
            origin_lat: initialData[`origin_lat_${i}`] || '',
            origin_lon: initialData[`origin_lon_${i}`] || '',
            destination_lat: initialData[`destination_lat_${i}`] || '',
            destination_lon: initialData[`destination_lon_${i}`] || '',
            crew: initialData[`stage_crew_${i}`] || null // null = todos pre-selecionados
          });
        }
      }
      if (recoveredStages.length > 0) {
        return recoveredStages;
      }
    }
    // Estado inicial padrão
    return [
      { 
        departure_time: '', 
        arrival_time: '', 
        origin: '', 
        destination: '',
        origin_lat: '',
        origin_lon: '',
        destination_lat: '',
        destination_lon: '',
        crew: null // null = todos pre-selecionados
      }
    ];
  });

  const [activeStages, setActiveStages] = useState(() => {
    // Calcular número de etapas ativas baseado nos dados iniciais
    if (initialData) {
      let count = 0;
      for (let i = 1; i <= 6; i++) {
        if (initialData[`departure_time_${i}`] && initialData[`arrival_time_${i}`]) {
          count++;
        }
      }
      return count > 0 ? count : 1;
    }
    return 1;
  });
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [aerodromos, setAerodromos] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [cities, setCities] = useState([]);
  const [availableBases, setAvailableBases] = useState([]);
  const [allBases, setAllBases] = useState([]);
  const [pendingVictims, setPendingVictims] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tripulantesList, aerodromosList, hospitalsList, citiesList, victimRecords, basesList] = await Promise.all([
          base44.entities.Tripulante.list(),
          base44.entities.Aerodromo.list(),
          base44.entities.Hospital.list(),
          base44.entities.City.list(),
          base44.entities.VictimRecord.filter({ pending_registration: true }),
          base44.entities.BaseOperacional.filter({ ativa: true })
        ]);
        setAllBases(basesList.map(b => b.name));
        
        setHospitals(hospitalsList);
        setCities(citiesList);
        setPendingVictims(victimRecords);
        
        const tripulanteList = tripulantesList.map(t => ({
          id: t.id,
          nome_de_guerra: t.nome_de_guerra,
          trigrama: t.trigrama,
          funcao: t.funcao,
          posto_graduacao: t.posto_graduacao
        }));
        
        setUsers(tripulanteList);
        setAerodromos(aerodromosList);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    loadData();
  }, []);



  // A lista de aeronaves agora vem da página NewFlightLog através de props
  // Não precisa mais calcular aqui, apenas extrair as bases disponíveis
  useEffect(() => {
    if (dailyServiceData && Array.isArray(dailyServiceData)) {
      const aircraftServices = dailyServiceData.filter(s => s.type === 'aircraft');
      const bases = [...new Set(aircraftServices.map(s => s.base))];
      setAvailableBases(bases);
    } else {
      setAvailableBases([]);
    }
  }, [dailyServiceData]);

  useEffect(() => {
    if (missionId && missionId !== formData.mission_id) {
      setFormData(prev => ({ ...prev, mission_id: missionId }));
    }
  }, [missionId]);

  useEffect(() => {
    if (availableCrew && Object.keys(availableCrew).length > 0) {
      setFormData(prev => ({
        ...prev,
        pilot_in_command: availableCrew.commander || prev.pilot_in_command,
        copilot: availableCrew.copilot || prev.copilot,
        oat_1: availableCrew.oat_1 || prev.oat_1,
        oat_2: availableCrew.oat_2 || prev.oat_2,
        oat_3: availableCrew.oat_3 || prev.oat_3,
        osm_1: availableCrew.osm_1 || prev.osm_1,
        osm_2: availableCrew.osm_2 || prev.osm_2,
        base: availableCrew.base || prev.base
      }));
    }
  }, [availableCrew]);

  // Retorna lista de tripulantes registrados no formulário (excluindo vazios)
  const getCrewList = () => {
    const crew = [];
    const addIfFilled = (name, role) => { if (name && name.trim()) crew.push({ name: name.trim(), role }); };
    addIfFilled(formData.pilot_in_command, 'Comandante');
    addIfFilled(formData.pilot_2, 'Comandante 2');
    addIfFilled(formData.pilot_3, 'Comandante 3');
    addIfFilled(formData.copilot, 'Copiloto');
    addIfFilled(formData.copilot_2, 'Copiloto 2');
    addIfFilled(formData.copilot_3, 'Copiloto 3');
    addIfFilled(formData.oat_1, 'OAT 1');
    addIfFilled(formData.oat_2, 'OAT 2');
    addIfFilled(formData.oat_3, 'OAT 3');
    addIfFilled(formData.osm_1, 'OSM Médico');
    addIfFilled(formData.osm_2, 'OSM Enfermeiro');
    return crew;
  };

  // Quando a tripulação muda, resetar crew das etapas para null (todos pré-selecionados)
  const crwKey = [
    formData.pilot_in_command, formData.pilot_2, formData.pilot_3,
    formData.copilot, formData.copilot_2, formData.copilot_3,
    formData.oat_1, formData.oat_2, formData.oat_3,
    formData.osm_1, formData.osm_2
  ].join('|');

  useEffect(() => {
    setStages(prev => prev.map(s => ({ ...s, crew: null })));
  }, [crwKey]);

  const handleChange = (field, value) => {
    // Handle aircraft selection with special logic for map/service
    if (field === 'aircraft') {
      if (missionInOperation) {
        // Buscar o serviço correspondente
        const selectedService = filteredAircraft.find(fa => fa.service && fa.service.id === value);
        if (selectedService && selectedService.service) {
          const svc = selectedService.service;
          setSelectedServiceId(value);
          // Preencher automaticamente com dados do mapa da força
          setFormData({ 
            ...formData, 
            aircraft: svc.name,
            base: svc.base,
            pilot_in_command: svc.commander || '',
            pilot_2: '',
            pilot_3: '',
            copilot: svc.copilot === '_none_' ? '' : (svc.copilot || ''),
            copilot_2: '',
            copilot_3: '',
            oat_1: svc.oat_1 === '_none_' ? '' : (svc.oat_1 || ''),
            oat_2: svc.oat_2 === '_none_' ? '' : (svc.oat_2 || ''),
            oat_3: svc.oat_3 === '_none_' ? '' : (svc.oat_3 || ''),
            osm_1: svc.osm_1 === '_none_' ? '' : (svc.osm_1 || ''),
            osm_2: svc.osm_2 === '_none_' ? '' : (svc.osm_2 || '')
          });
          return;
        }
      }
    }
    setFormData({ ...formData, [field]: value });
  };

  const handleStageChange = async (index, field, value) => {
    const newStages = [...stages];
    newStages[index][field] = value;
    
    // Se for um campo de origem ou destino, buscar aeródromo
    if (field === 'origin' || field === 'destination') {
      const icaoCode = value.toUpperCase().trim();
      
      if (icaoCode && icaoCode !== 'ZZZZ' && icaoCode.length === 4) {
        const aerodromo = aerodromos.find(a => a.icao_code === icaoCode);
        
        if (aerodromo) {
          if (field === 'origin') {
            newStages[index].origin_lat = aerodromo.latitude_raw || '';
            newStages[index].origin_lon = aerodromo.longitude_raw || '';
          } else {
            newStages[index].destination_lat = aerodromo.latitude_raw || '';
            newStages[index].destination_lon = aerodromo.longitude_raw || '';
          }
        }
      }
    }
    
    setStages(newStages);
  };

  const addStage = () => {
    if (activeStages < 6) {
      setActiveStages(activeStages + 1);
      const lastStage = stages[stages.length - 1];
      setStages([...stages, { 
        departure_time: '', 
        arrival_time: '', 
        origin: lastStage?.destination || '', 
        destination: '',
        origin_lat: lastStage?.destination_lat || '',
        origin_lon: lastStage?.destination_lon || '',
        destination_lat: '',
        destination_lon: '',
        crew: null
      }]);
    }
  };

  const removeStage = (index) => {
    if (activeStages > 1) {
      setActiveStages(activeStages - 1);
      const newStages = stages.filter((_, i) => i !== index);
      setStages(newStages);
    }
  };

  const addVictim = () => {
    setFormData({
      ...formData,
      victims: [...formData.victims, {
        name: '',
        sex: 'NA',
        age: '',
        life_code: '',
        drowning_grade: 'NA',
        origin_city: formData.municipality || '',
        origin_city_special: '',
        origin_hospital: '',
        origin_landing_site: '',
        destination_city: '',
        destination_city_special: '',
        destination_hospital: '',
        destination_landing_site: '',
        pending_victim_id: null
      }]
    });
  };

  const addPendingVictim = (pendingVictimRecord) => {
    setFormData({
      ...formData,
      victims: [...formData.victims, {
        name: pendingVictimRecord.nome_paciente,
        sex: pendingVictimRecord.sexo_paciente,
        age: pendingVictimRecord.idade,
        life_code: '',
        drowning_grade: pendingVictimRecord.grau_afogamento || 'NA',
        origin_city: pendingVictimRecord.cidade_origem || formData.municipality || '',
        origin_city_special: '',
        origin_hospital: pendingVictimRecord.hospital_origem || '',
        origin_landing_site: pendingVictimRecord.local_pouso_origem || '',
        destination_city: pendingVictimRecord.cidade_destino || '',
        destination_city_special: '',
        destination_hospital: pendingVictimRecord.hospital_destino || '',
        destination_landing_site: pendingVictimRecord.local_pouso_destino || '',
        pending_victim_id: pendingVictimRecord.id
      }]
    });
  };

  const removeVictim = (index) => {
    const newVictims = formData.victims.filter((_, i) => i !== index);
    setFormData({ ...formData, victims: newVictims });
  };

  const replaceVictimWithPending = (index, pendingVictimRecord) => {
    const newVictims = [...formData.victims];
    newVictims[index] = {
      name: pendingVictimRecord.nome_paciente,
      sex: pendingVictimRecord.sexo_paciente,
      age: pendingVictimRecord.idade,
      life_code: '',
      drowning_grade: pendingVictimRecord.grau_afogamento || 'NA',
      origin_city: pendingVictimRecord.cidade_origem || formData.municipality || '',
      origin_city_special: '',
      origin_hospital: pendingVictimRecord.hospital_origem || '',
      origin_landing_site: pendingVictimRecord.local_pouso_origem || '',
      destination_city: pendingVictimRecord.cidade_destino || '',
      destination_city_special: '',
      destination_hospital: pendingVictimRecord.hospital_destino || '',
      destination_landing_site: pendingVictimRecord.local_pouso_destino || '',
      pending_victim_id: pendingVictimRecord.id
    };
    setFormData({ ...formData, victims: newVictims });
  };

  const handleVictimChange = (index, field, value) => {
    const newVictims = [...formData.victims];
    newVictims[index][field] = value;
    
    // Se mudar cidade, limpar hospital
    if (field === 'origin_city' || field === 'destination_city') {
      if (field === 'origin_city') {
        newVictims[index].origin_hospital = '';
        newVictims[index].origin_city_special = '';
      } else {
        newVictims[index].destination_hospital = '';
        newVictims[index].destination_city_special = '';
      }
    }
    
    // Se marcar checkbox especial, atualizar cidade e hospital
    if (field === 'origin_city_special') {
      if (value === 'FORA DO PR') {
        newVictims[index].origin_city = 'FORA DO PR';
        newVictims[index].origin_hospital = '';
      } else if (value === 'NÃO HOUVE POUSO') {
        newVictims[index].origin_city = 'NÃO HOUVE POUSO';
        newVictims[index].origin_hospital = 'Não se aplica';
      } else {
        newVictims[index].origin_city = '';
        newVictims[index].origin_hospital = '';
      }
    }
    
    if (field === 'destination_city_special') {
      if (value === 'FORA DO PR') {
        newVictims[index].destination_city = 'FORA DO PR';
        newVictims[index].destination_hospital = '';
      } else if (value === 'NÃO HOUVE POUSO') {
        newVictims[index].destination_city = 'NÃO HOUVE POUSO';
        newVictims[index].destination_hospital = 'Não se aplica';
      } else {
        newVictims[index].destination_city = '';
        newVictims[index].destination_hospital = '';
      }
    }
    
    // Se mudar hospital, buscar coordenadas
    if ((field === 'origin_hospital' || field === 'destination_hospital') && value && value !== 'Não se aplica') {
      const hospital = hospitals.find(h => h.name === value);
      if (hospital) {
        if (field === 'origin_hospital') {
          newVictims[index].origin_hospital_lat = hospital.latitude;
          newVictims[index].origin_hospital_lon = hospital.longitude;
        } else {
          newVictims[index].destination_hospital_lat = hospital.latitude;
          newVictims[index].destination_hospital_lon = hospital.longitude;
        }
      }
    }
    
    setFormData({ ...formData, victims: newVictims });
  };

  const toggleHeliOperation = (operation) => {
    const current = formData.heli_operations || [];
    const newOps = current.includes(operation)
      ? current.filter(op => op !== operation)
      : [...current, operation];
    setFormData({ ...formData, heli_operations: newOps });
  };

  const calculateTotalDuration = () => {
    let totalMinutes = 0;
    stages.forEach(stage => {
      if (stage.departure_time && stage.arrival_time) {
        const [depHour, depMin] = stage.departure_time.split(':').map(Number);
        const [arrHour, arrMin] = stage.arrival_time.split(':').map(Number);
        
        const depTotalMin = depHour * 60 + depMin;
        const arrTotalMin = arrHour * 60 + arrMin;
        
        let duration = arrTotalMin - depTotalMin;
        if (duration < 0) duration += 24 * 60;
        
        totalMinutes += duration;
      }
    });
    return totalMinutes;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.municipality) {
      alert("Por favor, preencha o campo Município.");
      return;
    }

    if (!formData.mission_type && (!formData.mission_type_pm || formData.mission_type_pm === '_none_')) {
      alert("Por favor, selecione a Natureza da Missão (BM ou PM).");
      return;
    }

    // Validar campos obrigatórios quando missão não está em escala regular
    if (!missionInOperation) {
      // Validar coordenadas de todas as etapas
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        if (!stage.origin_lat || !stage.origin_lon) {
          alert(`Por favor, preencha as coordenadas de origem da etapa ${i + 1}.`);
          return;
        }
        if (!stage.destination_lat || !stage.destination_lon) {
          alert(`Por favor, preencha as coordenadas de destino da etapa ${i + 1}.`);
          return;
        }
      }

      // Validar observações
      if (!formData.remarks || formData.remarks.trim() === '') {
        alert("Por favor, preencha o campo de Observações.");
        return;
      }
    }

    // Validate stage durations
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      if (stage.departure_time && stage.arrival_time) {
        const [depHour, depMin] = stage.departure_time.split(':').map(Number);
        const [arrHour, arrMin] = stage.arrival_time.split(':').map(Number);
        
        const depTotalMin = depHour * 60 + depMin;
        const arrTotalMin = arrHour * 60 + arrMin;
        
        let duration = arrTotalMin - depTotalMin;
        if (duration < 0) duration += 24 * 60;
        
        if (duration > 300) {
          alert(`A etapa ${i + 1} tem duração superior a 300 minutos (5 horas). Por favor, verifique os horários.`);
          return;
        }
      }
    }
    
    const totalDuration = calculateTotalDuration();
    
    // Limpar dados numéricos vazios
    const cleanedFormData = { ...formData };
    
    // Converter strings vazias em null para campos numéricos
    const numericFields = ['rescued_victims_count', 'oriented_people_count', 'helibalde_launches', 'helibalde_load_liters', 'external_load_time_min', 'external_load_kg'];
    numericFields.forEach(field => {
      if (cleanedFormData[field] === '' || cleanedFormData[field] === null || cleanedFormData[field] === undefined) {
        delete cleanedFormData[field];
      } else {
        cleanedFormData[field] = Number(cleanedFormData[field]);
      }
    });
    
    const dataToSave = {
      ...cleanedFormData,
      flight_duration: totalDuration,
      origin: stages[0]?.origin || '',
      destination: stages[stages.length - 1]?.destination || ''
    };

    const allCrew = getCrewList();
    stages.forEach((stage, index) => {
      const stageNum = index + 1;
      dataToSave[`departure_time_${stageNum}`] = stage.departure_time || '';
      dataToSave[`arrival_time_${stageNum}`] = stage.arrival_time || '';
      dataToSave[`origin_${stageNum}`] = stage.origin || '';
      dataToSave[`destination_${stageNum}`] = stage.destination || '';
      dataToSave[`origin_lat_${stageNum}`] = stage.origin_lat || '';
      dataToSave[`origin_lon_${stageNum}`] = stage.origin_lon || '';
      dataToSave[`destination_lat_${stageNum}`] = stage.destination_lat || '';
      dataToSave[`destination_lon_${stageNum}`] = stage.destination_lon || '';
      // crew: null = todos; array = selecionados
      const stageCrew = stage.crew === null ? allCrew.map(c => c.name) : stage.crew;
      dataToSave[`stage_crew_${stageNum}`] = stageCrew;
    });

    console.log('Dados a serem salvos:', dataToSave);
    onSave(dataToSave);
  };

  const userGroups = {
    pilots: users.filter(u => u.funcao === 'Piloto'),
    oats: users.filter(u => u.funcao === 'OAT'),
    osmMedicos: users.filter(u => u.funcao === 'OSM' && u.posto_graduacao === 'Médico'),
    osmEnfermeiros: users.filter(u => u.funcao === 'OSM' && u.posto_graduacao === 'Enfermeiro')
  };

  const isZZZZ = (icaoCode) => {
    return icaoCode && icaoCode.toUpperCase().trim() === 'ZZZZ';
  };

  const shouldShowCoordinates = (stage, type) => {
    const icaoCode = type === 'origin' ? stage.origin : stage.destination;
    return isZZZZ(icaoCode) || (icaoCode && icaoCode.length === 4 && icaoCode !== 'ZZZZ');
  };

  const shouldShowVictimsCount = () => {
    const ops = formData.heli_operations || [];
    const showForOps = ["Sling", "Helocasting", "Guincho", "McGuire", "Rapel", "Embarque ou desembarque a baixa altura", "Puçá", "Pouso em área restrita", "Acompanhamento de Salvamento sem intervenção da aeronave"];
    return ops.some(op => showForOps.includes(op));
  };

  const shouldShowOrientedPeopleCount = () => {
    const ops = formData.heli_operations || [];
    return ops.includes("Orientação Preventiva ao Banhista");
  };

  const shouldShowHelibaldeFields = () => {
    const ops = formData.heli_operations || [];
    return ops.includes("Helibalde");
  };

  const shouldShowExternalLoadFields = () => {
    const ops = formData.heli_operations || [];
    return ops.includes("Carga Externa") || ops.includes("McGuire") || ops.includes("Puçá");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Informações da Missão</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="missionInOperation" 
              checked={missionInOperation} 
              onCheckedChange={(checked) => {
                setMissionInOperation(checked);
                setFormData(prev => ({ ...prev, is_regular_scale: checked }));
              }}
            />
            <Label
              htmlFor="missionInOperation"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Missão em escala regular de alguma base
            </Label>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="date">Data *</Label>
              <Input 
                id="date" 
                type="date" 
                value={formData.date} 
                onChange={(e) => {
                  handleChange('date', e.target.value);
                  if (onDateChange) onDateChange(e.target.value);
                }} 
                max={new Date().toISOString().split('T')[0]}
                required 
              />
            </div>
            <div>
              <Label htmlFor="mission_id">Número da Missão *</Label>
              <Input 
                id="mission_id" 
                type="number" 
                value={formData.mission_id} 
                onChange={(e) => handleChange('mission_id', e.target.value)} 
                disabled 
                className="bg-slate-100 cursor-not-allowed"
                required 
              />
            </div>
            <div>
              <Label htmlFor="base">Base</Label>
              {missionInOperation && availableBases.length > 0 ? (
                <Select value={formData.base} onValueChange={(v) => handleChange('base', v)}>
                  <SelectTrigger id="base">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBases.map(base => (
                      <SelectItem key={base} value={base}>{base}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={formData.base} onValueChange={(v) => handleChange('base', v)}>
                  <SelectTrigger id="base">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allBases.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="sade_occurrence_number">Número Ocorrência SADE</Label>
              <Input id="sade_occurrence_number" value={formData.sade_occurrence_number} onChange={(e) => handleChange('sade_occurrence_number', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="diario_bordo_pagina">Página Diário de Bordo</Label>
              <Input id="diario_bordo_pagina" value={formData.diario_bordo_pagina} onChange={(e) => handleChange('diario_bordo_pagina', e.target.value)} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="aircraft">Aeronave *</Label>
              <Select value={formData.aircraft} onValueChange={(v) => handleChange('aircraft', v)} required>
                <SelectTrigger id="aircraft"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {filteredAircraft && filteredAircraft.length > 0 ? (
                    filteredAircraft.map(item => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_empty_" disabled>Nenhuma aeronave disponível</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="municipality">Município *</Label>
              <MunicipalityCombobox
                value={formData.municipality}
                onChange={(v) => handleChange('municipality', v)}
                placeholder="Digite o município..."
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="mission_type">Natureza da Missão BM</Label>
              <Select 
                value={formData.mission_type || '_none_'} 
                onValueChange={(v) => {
                  if (v === '_none_') {
                    setFormData({ ...formData, mission_type: '' });
                  } else {
                    setFormData({ ...formData, mission_type: v, mission_type_pm: '' });
                  }
                }}
              >
                <SelectTrigger id="mission_type"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Nenhuma</SelectItem>
                  {MISSION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mission_type_pm">Natureza da Missão PM</Label>
              <Select 
                value={formData.mission_type_pm || '_none_'} 
                onValueChange={(v) => {
                  if (v === '_none_') {
                    setFormData({ ...formData, mission_type_pm: '' });
                  } else {
                    setFormData({ ...formData, mission_type_pm: v, mission_type: '' });
                  }
                }}
              >
                <SelectTrigger id="mission_type_pm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Nenhuma</SelectItem>
                  {MISSION_TYPES_PM.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Tripulação</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Comandantes</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <UserSelect field="pilot_in_command" label="Comandante 1 *" value={formData.pilot_in_command} onChange={v => handleChange('pilot_in_command', v)} userList={userGroups.pilots} required />
              <UserSelect field="pilot_2" label="Comandante 2" value={formData.pilot_2} onChange={v => handleChange('pilot_2', v)} userList={userGroups.pilots} />
              <UserSelect field="pilot_3" label="Comandante 3" value={formData.pilot_3} onChange={v => handleChange('pilot_3', v)} userList={userGroups.pilots} />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Copilotos</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <UserSelect field="copilot" label="Copiloto 1" value={formData.copilot} onChange={v => handleChange('copilot', v)} userList={userGroups.pilots} />
              <UserSelect field="copilot_2" label="Copiloto 2" value={formData.copilot_2} onChange={v => handleChange('copilot_2', v)} userList={userGroups.pilots} />
              <UserSelect field="copilot_3" label="Copiloto 3" value={formData.copilot_3} onChange={v => handleChange('copilot_3', v)} userList={userGroups.pilots} />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">OATs</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <UserSelect field="oat_1" label="OAT 1" value={formData.oat_1} onChange={v => handleChange('oat_1', v)} userList={userGroups.oats} />
              <UserSelect field="oat_2" label="OAT 2" value={formData.oat_2} onChange={v => handleChange('oat_2', v)} userList={userGroups.oats} />
              <UserSelect field="oat_3" label="OAT 3" value={formData.oat_3} onChange={v => handleChange('oat_3', v)} userList={userGroups.oats} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <UserSelect field="osm_1" label="OSM-Médico" value={formData.osm_1} onChange={v => handleChange('osm_1', v)} userList={userGroups.osmMedicos} />
            <UserSelect field="osm_2" label="OSM-Enfermeiro" value={formData.osm_2} onChange={v => handleChange('osm_2', v)} userList={userGroups.osmEnfermeiros} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Etapas de Voo ({activeStages}/6)</CardTitle>
            {activeStages < 6 && (
              <Button type="button" onClick={addStage} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Etapa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {stages.map((stage, index) => (
            <div key={index} className="p-4 border rounded-lg bg-slate-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Etapa {index + 1}</h3>
                {activeStages > 1 && (
                  <Button type="button" onClick={() => removeStage(index)} variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <Label>Hora de Acionamento (UTC) *</Label>
                  <Input type="time" value={stage.departure_time} onChange={(e) => handleStageChange(index, 'departure_time', e.target.value)} required />
                </div>
                <div>
                  <Label>Hora do Corte (UTC) *</Label>
                  <Input type="time" value={stage.arrival_time} onChange={(e) => handleStageChange(index, 'arrival_time', e.target.value)} required />
                </div>
              </div>

              {(() => {
                const crewList = getCrewList();
                if (crewList.length === 0) return null;
                // null = todos; array = selecionados
                const selected = stage.crew === null ? crewList.map(c => c.name) : stage.crew;
                const toggle = (name) => {
                  const current = stage.crew === null ? crewList.map(c => c.name) : stage.crew;
                  const next = current.includes(name) ? current.filter(n => n !== name) : [...current, name];
                  const newStages = [...stages];
                  newStages[index] = { ...newStages[index], crew: next };
                  setStages(newStages);
                };
                return (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Tripulantes nesta etapa</p>
                    <div className="flex flex-wrap gap-3">
                      {crewList.map(member => (
                        <label key={member.name} className="flex items-center gap-2 cursor-pointer select-none">
                          <Checkbox
                            checked={selected.includes(member.name)}
                            onCheckedChange={() => toggle(member.name)}
                          />
                          <span className="text-sm text-slate-700">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-slate-400 text-xs ml-1">({member.role})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Origem (Código ICAO) *</Label>
                    <Input 
                      value={stage.origin} 
                      onChange={(e) => handleStageChange(index, 'origin', e.target.value.toUpperCase())} 
                      placeholder="Ex: SBCT ou ZZZZ"
                      maxLength={4}
                      required 
                    />
                  </div>
                  
                  {shouldShowCoordinates(stage, 'origin') && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                       <div>
                         <Label>Latitude Origem {!missionInOperation && '*'}</Label>
                         <Input 
                           value={stage.origin_lat} 
                           onChange={(e) => handleStageChange(index, 'origin_lat', e.target.value)}
                           placeholder="DDMMSS"
                           maxLength={6}
                           disabled={!isZZZZ(stage.origin)}
                           required={!missionInOperation}
                         />
                       </div>
                       <div>
                         <Label>Longitude Origem {!missionInOperation && '*'}</Label>
                         <Input 
                           value={stage.origin_lon} 
                           onChange={(e) => handleStageChange(index, 'origin_lon', e.target.value)}
                           placeholder="DDDMMSS"
                           maxLength={7}
                           disabled={!isZZZZ(stage.origin)}
                           required={!missionInOperation}
                         />
                       </div>
                      </div>
                      
                      {stage.origin_lat && stage.origin_lon && (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-slate-100 px-3 py-2 border-b flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">Origem - {stage.origin}</span>
                          </div>
                          <CoordinateMap 
                            latitude={stage.origin_lat} 
                            longitude={stage.origin_lon}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Destino (Código ICAO) *</Label>
                    <Input 
                      value={stage.destination} 
                      onChange={(e) => handleStageChange(index, 'destination', e.target.value.toUpperCase())} 
                      placeholder="Ex: SBCT ou ZZZZ"
                      maxLength={4}
                      required 
                    />
                  </div>
                  
                  {shouldShowCoordinates(stage, 'destination') && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                       <div>
                         <Label>Latitude Destino {!missionInOperation && '*'}</Label>
                         <Input 
                           value={stage.destination_lat} 
                           onChange={(e) => handleStageChange(index, 'destination_lat', e.target.value)}
                           placeholder="DDMMSS"
                           maxLength={6}
                           disabled={!isZZZZ(stage.destination)}
                           required={!missionInOperation}
                         />
                       </div>
                       <div>
                         <Label>Longitude Destino {!missionInOperation && '*'}</Label>
                         <Input 
                           value={stage.destination_lon} 
                           onChange={(e) => handleStageChange(index, 'destination_lon', e.target.value)}
                           placeholder="DDDMMSS"
                           maxLength={7}
                           disabled={!isZZZZ(stage.destination)}
                           required={!missionInOperation}
                         />
                       </div>
                      </div>
                      
                      {stage.destination_lat && stage.destination_lon && (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-slate-100 px-3 py-2 border-b flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">Destino - {stage.destination}</span>
                          </div>
                          <CoordinateMap 
                            latitude={stage.destination_lat} 
                            longitude={stage.destination_lon}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <p className="text-sm text-slate-600">
              <strong>Duração Total do Voo:</strong> {calculateTotalDuration()} minutos
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Operações Helitransportadas</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            {HELI_OPERATIONS.map(op => (
              <Badge
                key={op}
                variant={formData.heli_operations?.includes(op) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleHeliOperation(op)}
              >
                {op}
              </Badge>
            ))}
          </div>

          {shouldShowVictimsCount() && (
            <div>
              <Label htmlFor="rescued_victims_count">Quantidade de Vítimas Resgatadas</Label>
              <Input id="rescued_victims_count" type="number" value={formData.rescued_victims_count} onChange={(e) => handleChange('rescued_victims_count', e.target.value)} />
            </div>
          )}

          {shouldShowOrientedPeopleCount() && (
            <div>
              <Label htmlFor="oriented_people_count">Quantidade de Pessoas Orientadas</Label>
              <Input id="oriented_people_count" type="number" value={formData.oriented_people_count} onChange={(e) => handleChange('oriented_people_count', e.target.value)} />
            </div>
          )}

          {shouldShowHelibaldeFields() && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="helibalde_launches">Lançamentos com Helibalde</Label>
                <Input id="helibalde_launches" type="number" value={formData.helibalde_launches} onChange={(e) => handleChange('helibalde_launches', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="helibalde_load_liters">Carga Helibalde (Litros)</Label>
                <Input id="helibalde_load_liters" type="number" value={formData.helibalde_load_liters} onChange={(e) => handleChange('helibalde_load_liters', e.target.value)} />
              </div>
            </div>
          )}

          {shouldShowExternalLoadFields() && (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="external_load_time_min">Tempo Carga Externa/McGuire (min)</Label>
                  <Input id="external_load_time_min" type="number" value={formData.external_load_time_min} onChange={(e) => handleChange('external_load_time_min', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="external_load_kg">Quantidade Carga Externa/McGuire (kg)</Label>
                  <Input id="external_load_kg" type="number" value={formData.external_load_kg} onChange={(e) => handleChange('external_load_kg', e.target.value)} />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Passageiros</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div>
            <Label htmlFor="pax">Passageiros a Bordo</Label>
            <Textarea id="pax" value={formData.pax} onChange={(e) => handleChange('pax', e.target.value)} placeholder="Liste os passageiros..." className="h-24" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Vítimas/Pacientes Atendidos</CardTitle>
            <div className="flex gap-2">
              <Button type="button" onClick={addVictim} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Nova Vítima
              </Button>
              {pendingVictims.length > 0 && (
                <Select onValueChange={(victimId) => {
                  const selected = pendingVictims.find(v => v.id === victimId);
                  if (selected) addPendingVictim(selected);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Vítima Pré-detalhada" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingVictims.map(pv => (
                      <SelectItem key={pv.id} value={pv.id}>
                        {pv.nome_paciente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {formData.victims.map((victim, index) => (
            <div key={index} className="p-4 border rounded-lg bg-slate-50">
              <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2">
                 <h3 className="font-semibold">Vítima {index + 1}</h3>
                 {victim.pending_victim_id && (
                   <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Pré-detalhada</span>
                 )}
               </div>
               <div className="flex gap-2">
                 {pendingVictims.length > 0 && (
                   <Select onValueChange={(victimId) => {
                     const selected = pendingVictims.find(v => v.id === victimId);
                     if (selected) replaceVictimWithPending(index, selected);
                   }}>
                     <SelectTrigger className="w-40 h-8 text-xs">
                       <SelectValue placeholder="Substituir por..." />
                     </SelectTrigger>
                     <SelectContent>
                       {pendingVictims.map(pv => (
                         <SelectItem key={pv.id} value={pv.id}>
                           {pv.nome_paciente}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 )}
                 <Button type="button" onClick={() => removeVictim(index)} variant="ghost" size="sm">
                   <Minus className="w-4 h-4" />
                 </Button>
               </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={victim.name} onChange={(e) => handleVictimChange(index, 'name', e.target.value)} />
                </div>
                <div>
                  <Label>Sexo</Label>
                  <Select value={victim.sex} onValueChange={(v) => handleVictimChange(index, 'sex', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="NA">Não se aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Idade</Label>
                  <Input type="number" value={victim.age} onChange={(e) => handleVictimChange(index, 'age', e.target.value)} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Código de Vida (trauma)</Label>
                  <Select value={victim.life_code} onValueChange={(v) => handleVictimChange(index, 'life_code', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="NA">Não se aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grau de Afogamento</Label>
                  <Select value={victim.drowning_grade} onValueChange={(v) => handleVictimChange(index, 'drowning_grade', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Somente Resgate">Somente Resgate</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="NA">Não se aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Origem</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Cidade</Label>
                    <CitySelect 
                      value={victim.origin_city || ''} 
                      onChange={(v) => handleVictimChange(index, 'origin_city', v)}
                    />
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={victim.origin_city_special === 'FORA DO PR'}
                          onChange={(e) => handleVictimChange(index, 'origin_city_special', e.target.checked ? 'FORA DO PR' : '')}
                          className="w-4 h-4"
                        />
                        FORA DO PR
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={victim.origin_city_special === 'NÃO HOUVE POUSO'}
                          onChange={(e) => handleVictimChange(index, 'origin_city_special', e.target.checked ? 'NÃO HOUVE POUSO' : '')}
                          className="w-4 h-4"
                        />
                        NÃO HOUVE POUSO
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>Hospital</Label>
                    <div className="space-y-2">
                      {victim.origin_city_special === 'FORA DO PR' ? (
                        <Input
                          value={victim.origin_hospital}
                          onChange={(e) => handleVictimChange(index, 'origin_hospital', e.target.value)}
                          placeholder="Digite o nome do hospital manualmente..."
                        />
                      ) : (
                        <HospitalCombobox 
                          value={victim.origin_hospital} 
                          onChange={(v) => handleVictimChange(index, 'origin_hospital', v)}
                          placeholder="Digite o nome do hospital..."
                          cityFilter={victim.origin_city && !victim.origin_city_special ? victim.origin_city : null}
                          disabled={victim.origin_hospital === 'Não se aplica'}
                        />
                      )}
                      {victim.origin_city_special !== 'NÃO HOUVE POUSO' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`origin_na_${index}`}
                            checked={victim.origin_hospital === 'Não se aplica'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleVictimChange(index, 'origin_hospital', 'Não se aplica');
                              } else {
                                handleVictimChange(index, 'origin_hospital', '');
                              }
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor={`origin_na_${index}`} className="text-sm text-slate-600 cursor-pointer">
                            Não se aplica
                          </label>
                        </div>
                      )}
                      {victim.origin_hospital && victim.origin_hospital !== 'Não se aplica' && victim.origin_hospital_lat && (
                        <div className="mt-2 rounded overflow-hidden border h-32">
                          <CoordinateMap latitude={victim.origin_hospital_lat} longitude={victim.origin_hospital_lon} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Local de Pouso</Label>
                    <Select value={victim.origin_landing_site || ''} onValueChange={(v) => handleVictimChange(index, 'origin_landing_site', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Heliponto">Heliponto</SelectItem>
                        <SelectItem value="Aeródromo">Aeródromo</SelectItem>
                        <SelectItem value="Campo de Futebol">Campo de Futebol</SelectItem>
                        <SelectItem value="Rodovia">Rodovia</SelectItem>
                        <SelectItem value="Via Pública">Via Pública</SelectItem>
                        <SelectItem value="Terreno Baldio">Terreno Baldio</SelectItem>
                        <SelectItem value="Areia da Orla">Areia da Orla</SelectItem>
                        <SelectItem value="Gramado">Gramado</SelectItem>
                        <SelectItem value="Morro">Morro</SelectItem>
                        <SelectItem value="Estacionamento">Estacionamento</SelectItem>
                        <SelectItem value="Área Rural">Área Rural</SelectItem>
                        <SelectItem value="Pátio Pavimentado">Pátio Pavimentado</SelectItem>
                        <SelectItem value="Pátio não Pavimentado">Pátio não Pavimentado</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                        <SelectItem value="Não se aplica">Não se aplica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Destino</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Cidade</Label>
                    <CitySelect 
                      value={victim.destination_city || ''} 
                      onChange={(v) => handleVictimChange(index, 'destination_city', v)}
                    />
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={victim.destination_city_special === 'FORA DO PR'}
                          onChange={(e) => handleVictimChange(index, 'destination_city_special', e.target.checked ? 'FORA DO PR' : '')}
                          className="w-4 h-4"
                        />
                        FORA DO PR
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={victim.destination_city_special === 'NÃO HOUVE POUSO'}
                          onChange={(e) => handleVictimChange(index, 'destination_city_special', e.target.checked ? 'NÃO HOUVE POUSO' : '')}
                          className="w-4 h-4"
                        />
                        NÃO HOUVE POUSO
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>Hospital</Label>
                    <div className="space-y-2">
                      {victim.destination_city_special === 'FORA DO PR' ? (
                        <Input
                          value={victim.destination_hospital}
                          onChange={(e) => handleVictimChange(index, 'destination_hospital', e.target.value)}
                          placeholder="Digite o nome do hospital manualmente..."
                        />
                      ) : (
                        <HospitalCombobox 
                          value={victim.destination_hospital} 
                          onChange={(v) => handleVictimChange(index, 'destination_hospital', v)}
                          placeholder="Digite o nome do hospital..."
                          cityFilter={victim.destination_city && !victim.destination_city_special ? victim.destination_city : null}
                          disabled={victim.destination_hospital === 'Não se aplica'}
                        />
                      )}
                      {victim.destination_city_special !== 'NÃO HOUVE POUSO' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`destination_na_${index}`}
                            checked={victim.destination_hospital === 'Não se aplica'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleVictimChange(index, 'destination_hospital', 'Não se aplica');
                              } else {
                                handleVictimChange(index, 'destination_hospital', '');
                              }
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor={`destination_na_${index}`} className="text-sm text-slate-600 cursor-pointer">
                            Não se aplica
                          </label>
                        </div>
                      )}
                      {victim.destination_hospital && victim.destination_hospital !== 'Não se aplica' && victim.destination_hospital_lat && (
                        <div className="mt-2 rounded overflow-hidden border h-32">
                          <CoordinateMap latitude={victim.destination_hospital_lat} longitude={victim.destination_hospital_lon} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Local de Pouso</Label>
                    <Select value={victim.destination_landing_site || ''} onValueChange={(v) => handleVictimChange(index, 'destination_landing_site', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Heliponto">Heliponto</SelectItem>
                        <SelectItem value="Aeródromo">Aeródromo</SelectItem>
                        <SelectItem value="Campo de Futebol">Campo de Futebol</SelectItem>
                        <SelectItem value="Rodovia">Rodovia</SelectItem>
                        <SelectItem value="Via Pública">Via Pública</SelectItem>
                        <SelectItem value="Terreno Baldio">Terreno Baldio</SelectItem>
                        <SelectItem value="Areia da Orla">Areia da Orla</SelectItem>
                        <SelectItem value="Gramado">Gramado</SelectItem>
                        <SelectItem value="Morro">Morro</SelectItem>
                        <SelectItem value="Estacionamento">Estacionamento</SelectItem>
                        <SelectItem value="Área Rural">Área Rural</SelectItem>
                        <SelectItem value="Pátio Pavimentado">Pátio Pavimentado</SelectItem>
                        <SelectItem value="Pátio não Pavimentado">Pátio não Pavimentado</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                        <SelectItem value="Não se aplica">Não se aplica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div>
            <Label htmlFor="remarks">Observações e Detalhes da Missão {!missionInOperation && '*'}</Label>
            <Textarea 
              id="remarks" 
              value={formData.remarks} 
              onChange={(e) => handleChange('remarks', e.target.value)} 
              placeholder="Adicione observações relevantes sobre a missão..." 
              className="h-32"
              required={!missionInOperation}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <Button type="submit" disabled={isSaving} className="bg-red-700 hover:bg-red-800 text-white">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Registro de Voo'}
        </Button>
      </div>
    </form>
  );
}