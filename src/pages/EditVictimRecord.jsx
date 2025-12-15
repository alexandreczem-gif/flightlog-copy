import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays } from "date-fns";
import { logAction } from "@/components/utils/logger";

import VictimRecordForm from '../components/forms/VictimRecordForm';

export default function EditVictimRecord() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSaving, setIsSaving] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recordId, setRecordId] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const urlParams = new URLSearchParams(location.search);
                const id = urlParams.get('id');
                
                if (!id) {
                    console.error("ID do registro não fornecido na URL.");
                    navigate(createPageUrl("VictimRecords"));
                    return;
                }
                
                setRecordId(id);
                
                const [user, records] = await Promise.all([
                    base44.auth.me(), 
                    base44.entities.VictimRecord.filter({ id })
                ]);
                
                if (records.length === 0) {
                    alert("Registro não encontrado.");
                    navigate(createPageUrl("VictimRecords"));
                    return;
                }
                
                const record = records[0];

                const canModify = () => {
                    if (user.role === 'admin') return true;
                    if (user.email === record.created_by) {
                        return differenceInDays(new Date(), new Date(record.created_date)) <= 2;
                    }
                    return false;
                };

                if (!canModify()) {
                    alert("Você não tem permissão para editar este registro ou o prazo de edição expirou.");
                    navigate(createPageUrl("VictimRecords"));
                    return;
                }

                setInitialData(record);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                alert("Erro ao carregar dados. Tente novamente.");
                navigate(createPageUrl("VictimRecords"));
            } finally {
                setIsLoading(false);
            }
        };
        
        loadData();
    }, [navigate, location]);

    const handleSave = async (data) => {
        if (!recordId) {
            alert("Erro: ID do registro não encontrado.");
            return;
        }
        
        setIsSaving(true);
        try {
            const { id, created_by, created_date, updated_date, ...dataToUpdate } = data;
            await base44.entities.VictimRecord.update(recordId, dataToUpdate);
            await logAction('update', 'VictimRecord', recordId, dataToUpdate);
            alert("Registro de atendimento da vítima atualizado com sucesso!");
            navigate(createPageUrl("VictimRecords"));
        } catch (error) {
            console.error("Erro ao atualizar registro da vítima:", error);
            alert("Erro ao atualizar. Verifique os dados e tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen p-8 text-center">Carregando dados para edição...</div>;
    }
    
    if (!initialData) {
        return null;
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-slate-50">
            <div className="max-w-5xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("VictimRecords"))}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Editar Atendimento da Vítima</h1>
                        <p className="text-slate-600">Altere as informações clínicas do atendimento.</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="shadow-xl bg-white border-slate-200">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>Formulário de Atendimento Aeromédico</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <VictimRecordForm initialData={initialData} onSave={handleSave} isSaving={isSaving} />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}