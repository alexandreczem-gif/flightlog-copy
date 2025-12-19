import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Upload, Download, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function Diagnosticos() {
    const navigate = useNavigate();
    const [cids, setCids] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newCategoria, setNewCategoria] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const user = await base44.auth.me();
                if (user.role !== 'admin') {
                    navigate(createPageUrl("Dashboard"));
                    return;
                }
                loadCids();
            } catch (error) {
                console.error("Erro ao verificar acesso:", error);
                navigate(createPageUrl("Dashboard"));
            }
        };
        checkAccess();
    }, [navigate]);

    const loadCids = async () => {
        setIsLoading(true);
        try {
            const data = await base44.entities.CID.list('categoria', 2000);
            setCids(data);
        } catch (error) {
            console.error("Erro ao carregar CIDs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newCategoria.trim()) {
            alert('Por favor, preencha a categoria.');
            return;
        }
        setIsSaving(true);
        try {
            await base44.entities.CID.create({ categoria: newCategoria });
            setNewCategoria('');
            setShowAddDialog(false);
            loadCids();
        } catch (error) {
            console.error("Erro ao adicionar CID:", error);
            alert("Erro ao adicionar CID.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este CID?')) return;
        try {
            await base44.entities.CID.delete(id);
            loadCids();
        } catch (error) {
            console.error("Erro ao excluir CID:", error);
            alert("Erro ao excluir CID.");
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Tem certeza que deseja excluir TODOS os CIDs? Esta ação não pode ser desfeita.')) return;
        try {
            await Promise.all(cids.map(cid => base44.entities.CID.delete(cid.id)));
            loadCids();
        } catch (error) {
            console.error("Erro ao excluir todos os CIDs:", error);
            alert("Erro ao excluir todos os CIDs.");
        }
    };

    const handleExport = () => {
        setIsExporting(true);
        try {
            const csvContent = [
                'categoria',
                ...cids.map(cid => `"${(cid.categoria || '').replace(/"/g, '""')}"`)
            ].join('\n');

            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `cids_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Erro ao exportar:", error);
            alert("Erro ao exportar.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n');
                if (lines.length < 2) return;

                const dataToImport = [];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const categoria = lines[i].trim().replace(/^"|"$/g, '');
                    if (categoria) dataToImport.push({ categoria });
                }

                if (!confirm(`Importar ${dataToImport.length} registros?`)) {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                await Promise.all(dataToImport.map(d => base44.entities.CID.create(d)));
                alert(`${dataToImport.length} CIDs importados com sucesso!`);
                loadCids();
            } catch (error) {
                console.error('Erro na importação:', error);
                alert('Erro ao processar arquivo.');
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Diagnósticos (CID)</h1>
                        <p className="text-slate-600">Gerenciar banco de dados de CIDs</p>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".csv" 
                            className="hidden" 
                        />
                        <Button onClick={handleImportClick} disabled={isImporting} variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            {isImporting ? 'Importando...' : 'Importar CSV'}
                        </Button>
                        <Button onClick={handleExport} disabled={isExporting || cids.length === 0} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
                        <Button onClick={handleDeleteAll} disabled={cids.length === 0} variant="outline" className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Todos
                        </Button>
                        <Button onClick={() => setShowAddDialog(true)} className="bg-red-700 hover:bg-red-800">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo CID
                        </Button>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle>Lista de CIDs ({cids.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-8 text-slate-500">Carregando...</div>
                            ) : cids.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">Nenhum CID cadastrado.</div>
                            ) : (
                                <div className="max-h-[600px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Categoria</TableHead>
                                                <TableHead className="w-20">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cids.map((cid) => (
                                                <TableRow key={cid.id}>
                                                    <TableCell>{cid.categoria}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(cid.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo CID</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="categoria">Categoria</Label>
                            <Input
                                id="categoria"
                                value={newCategoria}
                                onChange={(e) => setNewCategoria(e.target.value)}
                                placeholder="Ex: A00 - Cólera"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAdd} disabled={isSaving}>
                                {isSaving ? 'Salvando...' : 'Adicionar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}