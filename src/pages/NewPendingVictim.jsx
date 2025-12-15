import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import PendingVictimForm from '../components/forms/PendingVictimForm';

export default function NewPendingVictim() {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
                
                const allowedRoles = ["Administrador", "OSM", "Piloto", "OAT"];
                if (!allowedRoles.includes(user.flight_log_role) && user.role !== 'admin') {
                    navigate(createPageUrl("Dashboard"));
                }
            } catch (error) {
                console.error("Erro ao verificar acesso:", error);
                navigate(createPageUrl("Dashboard"));
            }
        };
        checkAccess();
    }, [navigate]);

    const handleSave = async (victimData) => {
        setIsSaving(true);
        try {
            const dataToSave = {
                ...victimData,
                pending_registration: true,
                flight_log_id: 'pending',
                victim_index: 0
            };

            await base44.entities.VictimRecord.create(dataToSave);
            alert('Vítima pré-detalhada com sucesso! Ela estará disponível para seleção ao registrar uma nova missão.');
            navigate(createPageUrl("VictimRecords"));
        } catch (error) {
            console.error("Erro ao salvar vítima:", error);
            alert("Erro ao salvar vítima. Verifique os dados e tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-slate-50">
            <div className="max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("VictimRecords"))}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Adicionar Vítima Não Registrada</h1>
                        <p className="text-slate-600">Pré-detalhe uma vítima para posterior registro de missão.</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="shadow-xl bg-white border-slate-200">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>Formulário de Pré-Detalhamento</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <PendingVictimForm 
                                onSave={handleSave} 
                                isSaving={isSaving}
                                currentUser={currentUser}
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}