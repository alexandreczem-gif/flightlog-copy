import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User as UserIcon, Users, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showRoleChoice, setShowRoleChoice] = useState(false);
    const [showCrewForm, setShowCrewForm] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        nome_completo: '',
        posto_graduacao: '',
        nome_de_guerra: '',
        trigrama: '',
        cpf: '',
        data_nascimento: '',
        crm_coren: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
                setFormData({
                    nome_completo: currentUser.nome_completo || '',
                    posto_graduacao: currentUser.posto_graduacao || '',
                    nome_de_guerra: currentUser.nome_de_guerra || '',
                    trigrama: currentUser.trigrama || '',
                    cpf: currentUser.cpf || '',
                    data_nascimento: currentUser.data_nascimento || '',
                    crm_coren: currentUser.crm_coren || ''
                });
                

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const validateTrigram = (value) => {
        const trigramRegex = /^[A-Z]{3}$/;
        return trigramRegex.test(value);
    };

    const validateCPF = (cpf) => {
        cpf = cpf.replace(/[^\d]/g, '');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        
        let sum = 0;
        for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
        let digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (digit !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
        digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (digit !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    };

    const handleFormChange = (field, value) => {
        if (field === 'trigrama') {
            const upperValue = value.toUpperCase().slice(0, 3);
            setFormData({ ...formData, [field]: upperValue });
            
            if (upperValue.length === 3 && !validateTrigram(upperValue)) {
                setErrors({ ...errors, trigrama: 'Trigrama deve ter 3 letras maiúsculas' });
            } else {
                const newErrors = { ...errors };
                delete newErrors.trigrama;
                setErrors(newErrors);
            }
        } else if (field === 'cpf') {
            const numericValue = value.replace(/\D/g, '').slice(0, 11);
            setFormData({ ...formData, [field]: numericValue });
            
            if (numericValue.length === 11) {
                if (!validateCPF(numericValue)) {
                    setErrors({ ...errors, cpf: 'CPF inválido' });
                } else {
                    const newErrors = { ...errors };
                    delete newErrors.cpf;
                    setErrors(newErrors);
                }
            }
        } else {
            setFormData({ ...formData, [field]: value });
        }
    };

    const handleChooseVisitor = async () => {
        setIsSaving(true);
        try {
            await base44.auth.updateMe({ flight_log_role: 'Visitante' });
            window.location.reload();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChooseCrew = () => {
        setShowRoleChoice(false);
        setShowCrewForm(true);
    };

    const handleSaveCrewData = async () => {
        if (!formData.nome_completo || !formData.posto_graduacao || !formData.nome_de_guerra || !formData.trigrama || !formData.cpf || !formData.data_nascimento) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (!validateTrigram(formData.trigrama)) {
            alert('Trigrama deve ter exatamente 3 letras maiúsculas.');
            return;
        }

        if (!validateCPF(formData.cpf)) {
            alert('CPF inválido. Verifique os dígitos.');
            return;
        }

        if ((formData.posto_graduacao === 'Médico' || formData.posto_graduacao === 'Enfermeiro') && !formData.crm_coren) {
            alert('CRM/COREN é obrigatório para Médico ou Enfermeiro.');
            return;
        }

        setIsSaving(true);
        try {
            await base44.auth.updateMe({
                ...formData,
                flight_log_role: 'Visitante' // Temporariamente como visitante até admin configurar
            });
            setShowCrewForm(false);
            setShowSuccessMessage(true);
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            alert('Erro ao salvar dados. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!formData.nome_completo || !formData.posto_graduacao || !formData.nome_de_guerra || !formData.trigrama || !formData.cpf || !formData.data_nascimento) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (!validateTrigram(formData.trigrama)) {
            alert('Trigrama deve ter exatamente 3 letras maiúsculas.');
            return;
        }

        if (!validateCPF(formData.cpf)) {
            alert('CPF inválido. Verifique os dígitos.');
            return;
        }

        if ((formData.posto_graduacao === 'Médico' || formData.posto_graduacao === 'Enfermeiro') && !formData.crm_coren) {
            alert('CRM/COREN é obrigatório para Médico ou Enfermeiro.');
            return;
        }

        setIsSaving(true);
        try {
            await base44.auth.updateMe(formData);
            setUser(prev => ({ ...prev, ...formData }));
            alert('Informações atualizadas com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            alert('Erro ao atualizar perfil. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await base44.auth.logout();
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="text-slate-600">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-slate-50">
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Meu Perfil</h1>
                    <p className="text-slate-600">Visualize suas informações de usuário</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    {(
                        <Card className="shadow-xl bg-white border-slate-200 mb-6">
                            <CardHeader className="bg-slate-50 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <UserIcon className="w-5 h-5" />
                                    Informações do Usuário
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <Label>Email</Label>
                                        <Input value={user?.email || ''} disabled className="bg-slate-100" />
                                    </div>
                                    <div>
                                        <Label>Classe de Usuário</Label>
                                        <Input value={user?.flight_log_role || 'Visitante'} disabled className="bg-slate-100" />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <Label>Nome Completo *</Label>
                                        <Input 
                                            value={formData.nome_completo} 
                                            onChange={(e) => handleFormChange('nome_completo', e.target.value)}
                                            placeholder="Nome completo"
                                        />
                                    </div>
                                    <div>
                                        <Label>Título/Posto/Graduação *</Label>
                                        <Select 
                                            value={formData.posto_graduacao} 
                                            onValueChange={(v) => handleFormChange('posto_graduacao', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Coronel">Coronel</SelectItem>
                                                <SelectItem value="Tenente-Coronel">Tenente-Coronel</SelectItem>
                                                <SelectItem value="Major">Major</SelectItem>
                                                <SelectItem value="Capitão">Capitão</SelectItem>
                                                <SelectItem value="1º Tenente">1º Tenente</SelectItem>
                                                <SelectItem value="2º Tenente">2º Tenente</SelectItem>
                                                <SelectItem value="Sub-tenente">Sub-tenente</SelectItem>
                                                <SelectItem value="1º Sargento">1º Sargento</SelectItem>
                                                <SelectItem value="2º Sargento">2º Sargento</SelectItem>
                                                <SelectItem value="3º Sargento">3º Sargento</SelectItem>
                                                <SelectItem value="Cabo">Cabo</SelectItem>
                                                <SelectItem value="Soldado">Soldado</SelectItem>
                                                <SelectItem value="Médico">Médico</SelectItem>
                                                <SelectItem value="Enfermeiro">Enfermeiro</SelectItem>
                                                <SelectItem value="Funcionário Civil">Funcionário Civil</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <Label>Nome de Guerra *</Label>
                                        <Input 
                                            value={formData.nome_de_guerra} 
                                            onChange={(e) => handleFormChange('nome_de_guerra', e.target.value)}
                                            placeholder="Ex: Bastos"
                                        />
                                    </div>
                                    <div>
                                        <Label>Trigrama *</Label>
                                        <Input 
                                            value={formData.trigrama} 
                                            onChange={(e) => handleFormChange('trigrama', e.target.value)}
                                            placeholder="Ex: BTS"
                                            maxLength={3}
                                            className={errors.trigrama ? 'border-red-500' : ''}
                                        />
                                        {errors.trigrama && (
                                            <p className="text-xs text-red-500 mt-1">{errors.trigrama}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <Label>CPF *</Label>
                                        <Input 
                                            value={formData.cpf} 
                                            onChange={(e) => handleFormChange('cpf', e.target.value)}
                                            placeholder="00000000000"
                                            maxLength={11}
                                            className={errors.cpf ? 'border-red-500' : ''}
                                        />
                                        {errors.cpf && (
                                            <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>Data de Nascimento *</Label>
                                        <Input 
                                            type="date"
                                            value={formData.data_nascimento} 
                                            onChange={(e) => handleFormChange('data_nascimento', e.target.value)}
                                        />
                                    </div>
                                </div>
                                {(formData.posto_graduacao === 'Médico' || formData.posto_graduacao === 'Enfermeiro') && (
                                    <div>
                                        <Label>CRM/COREN *</Label>
                                        <Input 
                                            value={formData.crm_coren} 
                                            onChange={(e) => handleFormChange('crm_coren', e.target.value)}
                                            placeholder="Número do registro"
                                        />
                                    </div>
                                )}
                                <div className="flex justify-end pt-4">
                                    <Button 
                                        onClick={handleSaveChanges}
                                        disabled={isSaving || Object.keys(errors).length > 0}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-end mt-6">
                        <Button 
                            onClick={handleLogout}
                            variant="outline"
                            className="border-slate-300"
                        >
                            Sair do Sistema
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}