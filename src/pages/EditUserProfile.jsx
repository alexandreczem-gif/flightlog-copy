import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EditUserProfile() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
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
        const checkAdminAndLoadUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                if (currentUser.role !== 'admin') {
                    navigate(createPageUrl("Dashboard"));
                    return;
                }

                const urlParams = new URLSearchParams(location.search);
                const userId = urlParams.get('userId');
                
                if (!userId) {
                    alert('ID do usuário não fornecido.');
                    navigate(createPageUrl("UserManagement"));
                    return;
                }

                const users = await base44.entities.User.filter({ id: userId });
                
                if (users.length === 0) {
                    alert('Usuário não encontrado.');
                    navigate(createPageUrl("UserManagement"));
                    return;
                }

                const targetUser = users[0];
                setUser(targetUser);
                setFormData({
                    nome_completo: targetUser.nome_completo || '',
                    posto_graduacao: targetUser.posto_graduacao || '',
                    nome_de_guerra: targetUser.nome_de_guerra || '',
                    trigrama: targetUser.trigrama || '',
                    cpf: targetUser.cpf || '',
                    data_nascimento: targetUser.data_nascimento || '',
                    crm_coren: targetUser.crm_coren || ''
                });
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                alert('Erro ao carregar dados do usuário.');
                navigate(createPageUrl("UserManagement"));
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAndLoadUser();
    }, [navigate, location]);

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
            await base44.entities.User.update(user.id, formData);
            alert('Perfil do usuário atualizado com sucesso!');
            navigate(createPageUrl("UserManagement"));
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            alert('Erro ao atualizar perfil. Tente novamente.');
        } finally {
            setIsSaving(false);
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
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("UserManagement"))}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Editar Perfil do Usuário</h1>
                        <p className="text-slate-600">Atualize as informações de {user?.full_name}</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="shadow-xl bg-white border-slate-200 mb-6">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>Informações do Usuário</CardTitle>
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
                            <div className="flex justify-end gap-3 pt-4">
                                <Button 
                                    variant="outline"
                                    onClick={() => navigate(createPageUrl("UserManagement"))}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleSaveChanges}
                                    disabled={isSaving || Object.keys(errors).length > 0}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}