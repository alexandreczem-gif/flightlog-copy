import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Download, Upload, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Diagnosticos() {
  const navigate = useNavigate();
  const [cids, setCids] = useState([]);
  const [filteredCids, setFilteredCids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [newCid, setNewCid] = useState({ categoria: '', descricao: '' });
  const fileInputRef = React.useRef(null);

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
      const data = await base44.entities.CID.list('categoria', 20000);
      setCids(data);
      setFilteredCids(data);
    } catch (error) {
      console.error("Erro ao carregar CIDs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = cids.filter(cid =>
        cid.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cid.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCids(filtered);
    } else {
      setFilteredCids(cids);
    }
  }, [searchTerm, cids]);

  const handleCreateCid = async () => {
    if (!newCid.categoria || !newCid.descricao) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    try {
      await base44.entities.CID.create(newCid);
      setShowNewDialog(false);
      setNewCid({ categoria: '', descricao: '' });
      loadCids();
    } catch (error) {
      console.error("Erro ao criar CID:", error);
      alert("Erro ao criar CID.");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = [
        'categoria,descricao',
        ...cids.map(cid => `"${cid.categoria}","${cid.descricao.replace(/"/g, '""')}"`)
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
      alert("Erro ao exportar CIDs.");
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
        if (lines.length < 2) {
          alert('Arquivo CSV vazio.');
          setIsImporting(false);
          return;
        }

        const dataToImport = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const match = lines[i].match(/^"([^"]*)","([^"]*)"$/);
          if (match) {
            dataToImport.push({
              categoria: match[1],
              descricao: match[2]
            });
          }
        }

        if (dataToImport.length === 0) {
          alert('Nenhum dado válido encontrado no CSV.');
          setIsImporting(false);
          return;
        }

        const confirmImport = window.confirm(
          `Deseja importar ${dataToImport.length} CIDs?`
        );

        if (!confirmImport) {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // Importar em lotes de 50
        const batchSize = 50;
        for (let i = 0; i < dataToImport.length; i += batchSize) {
          const batch = dataToImport.slice(i, i + batchSize);
          await Promise.all(batch.map(d => base44.entities.CID.create(d)));
        }
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

  const handleDeleteAll = async () => {
    try {
      // Excluir em lotes de 50
      const batchSize = 50;
      for (let i = 0; i < cids.length; i += batchSize) {
        const batch = cids.slice(i, i + batchSize);
        await Promise.all(batch.map(cid => base44.entities.CID.delete(cid.id)));
      }
      setShowDeleteAllDialog(false);
      alert(`${cids.length} CIDs excluídos com sucesso!`);
      loadCids();
    } catch (error) {
      console.error("Erro ao excluir CIDs:", error);
      alert("Erro ao excluir CIDs.");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Diagnósticos (CID)</h1>
            <p className="text-slate-600">Gerencie o banco de dados de CID</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowNewDialog(true)} className="bg-green-700 hover:bg-green-800">
              <Plus className="w-4 h-4 mr-2" />
              Novo CID
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
            <Button onClick={handleImportClick} disabled={isImporting} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importando...' : 'Importar CSV'}
            </Button>
            <Button onClick={handleExport} disabled={isExporting || cids.length === 0} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exportando..." : "Exportar CSV"}
            </Button>
            <Button onClick={() => setShowDeleteAllDialog(true)} disabled={cids.length === 0} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Todos
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-xl bg-white border-slate-200">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Banco de Dados CID ({filteredCids.length} registros)</CardTitle>
                <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por categoria ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Categoria</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {isLoading ? (
                      <tr><td colSpan="2" className="px-4 py-8 text-center text-slate-500">Carregando...</td></tr>
                    ) : filteredCids.length === 0 ? (
                      <tr><td colSpan="2" className="px-4 py-8 text-center text-slate-500">Nenhum CID encontrado.</td></tr>
                    ) : (
                      filteredCids.map((cid) => (
                        <tr key={cid.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{cid.categoria}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{cid.descricao}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo CID</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Input
                id="categoria"
                value={newCid.categoria}
                onChange={(e) => setNewCid({ ...newCid, categoria: e.target.value })}
                placeholder="Ex: A00.0"
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={newCid.descricao}
                onChange={(e) => setNewCid({ ...newCid, descricao: e.target.value })}
                placeholder="Ex: Cólera devida a Vibrio cholerae"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateCid} className="bg-green-700 hover:bg-green-800">Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir TODOS os {cids.length} registros de CID? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
              Excluir Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}