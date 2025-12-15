import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function Tripulantes() {
  const navigate = useNavigate();
  const [tripulantes, setTripulantes] = useState([]);
  const [filteredTripulantes, setFilteredTripulantes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTripulante, setEditingTripulante] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tripulanteToDelete, setTripulanteToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    posto_graduacao: '',
    nome_de_guerra: '',
    trigrama: '',
    funcao: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== 'admin' && user.flight_log_role !== 'Administrador') {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        loadTripulantes();
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        navigate(createPageUrl("Dashboard"));
      }
    };
    checkAccess();
  }, [navigate]);

  useEffect(() => {
    const results = tripulantes.filter(t =>
      t.nome_de_guerra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.trigrama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.funcao?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTripulantes(results);
  }, [searchTerm, tripulantes]);

  const loadTripulantes = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Tripulante.list();
      setTripulantes(data);
      setFilteredTripulantes(data);
    } catch (error) {
      console.error("Erro ao carregar tripulantes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateTrigram = (value) => {
    const trigramRegex = /^[A-Z]{3}$/;
    return trigramRegex.test(value);
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
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.posto_graduacao || !formData.nome_de_guerra || !formData.trigrama || !formData.funcao) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!validateTrigram(formData.trigrama)) {
      alert('Trigrama deve ter exatamente 3 letras maiúsculas.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingTripulante) {
        await base44.entities.Tripulante.update(editingTripulante.id, formData);
      } else {
        await base44.entities.Tripulante.create(formData);
      }
      
      setShowForm(false);
      setEditingTripulante(null);
      setFormData({ posto_graduacao: '', nome_de_guerra: '', trigrama: '', funcao: '' });
      setErrors({});
      await loadTripulantes();
    } catch (error) {
      console.error('Erro ao salvar tripulante:', error);
      alert('Erro ao salvar tripulante. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (tripulante) => {
    setEditingTripulante(tripulante);
    setFormData({
      posto_graduacao: tripulante.posto_graduacao || '',
      nome_de_guerra: tripulante.nome_de_guerra || '',
      trigrama: tripulante.trigrama || '',
      funcao: tripulante.funcao || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = (tripulante) => {
    setTripulanteToDelete(tripulante);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!tripulanteToDelete) return;
    
    try {
      await base44.entities.Tripulante.delete(tripulanteToDelete.id);
      setShowDeleteConfirm(false);
      setTripulanteToDelete(null);
      await loadTripulantes();
    } catch (error) {
      console.error("Erro ao excluir tripulante:", error);
      alert("Erro ao excluir tripulante. Tente novamente.");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTripulante(null);
    setFormData({ posto_graduacao: '', nome_de_guerra: '', trigrama: '', funcao: '' });
    setErrors({});
  };

  const handleExportCSV = () => {
    const headers = ['nome_de_guerra', 'trigrama', 'funcao'];
    const csvContent = [
      headers.join(','),
      ...filteredTripulantes.map(t => 
        headers.map(h => `"${t[h] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tripulantes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const validHeaders = ['nome_de_guerra', 'trigrama', 'funcao'];
        if (!validHeaders.every(h => headers.includes(h))) {
          alert('Formato de CSV inválido. Cabeçalhos esperados: nome_de_guerra, trigrama, funcao');
          return;
        }

        const dataToImport = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          // Split respecting quotes
          const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '').trim());
          
          if (values && values.length >= 3) {
            const row = {};
            headers.forEach((h, idx) => row[h] = values[idx]);
            
            // Basic validation
            if (row.nome_de_guerra && row.trigrama && row.funcao) {
              dataToImport.push(row);
            }
          }
        }

        if (dataToImport.length > 0) {
          // Import one by one to handle potential errors individually or use bulk if available (API says create_entity_records for sample data, but we should use create for real usage usually, but bulk create might be efficient)
          // Using Promise.all for efficiency
          await Promise.all(dataToImport.map(data => base44.entities.Tripulante.create(data)));
          alert(`${dataToImport.length} tripulantes importados com sucesso!`);
          loadTripulantes();
        } else {
          alert('Nenhum dado válido encontrado para importação.');
        }
      } catch (error) {
        console.error('Erro na importação:', error);
        alert('Erro ao processar o arquivo.');
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
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Tripulantes</h1>
            <p className="text-slate-600">Gerencie o cadastro de tripulantes</p>
          </div>
          {!showForm && (
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
              <Button 
                onClick={handleImportClick}
                disabled={isImporting}
                variant="outline"
                className="border-slate-300 text-slate-700"
              >
                {isImporting ? 'Importando...' : 'Importar CSV'}
              </Button>
              <Button 
                onClick={handleExportCSV}
                variant="outline"
                className="border-slate-300 text-slate-700"
              >
                Exportar CSV
              </Button>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-red-700 hover:bg-red-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Tripulante
              </Button>
            </div>
          )}
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="shadow-xl bg-white border-slate-200">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle>
                  {editingTripulante ? 'Editar Tripulante' : 'Novo Tripulante'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="posto_graduacao">Título/Posto/Graduação *</Label>
                    <Select 
                      value={formData.posto_graduacao} 
                      onValueChange={(v) => handleFormChange('posto_graduacao', v)}
                      required
                    >
                      <SelectTrigger id="posto_graduacao">
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

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="nome_de_guerra">Nome de Guerra *</Label>
                      <Input
                          id="nome_de_guerra"
                          value={formData.nome_de_guerra}
                          onChange={(e) => handleFormChange('nome_de_guerra', e.target.value)}
                          placeholder="Ex: Bastos"
                          required
                      />
                    </div>

                    <div>
                      <Label htmlFor="trigrama">Trigrama (3 letras) *</Label>
                      <Input
                        id="trigrama"
                        value={formData.trigrama}
                        onChange={(e) => handleFormChange('trigrama', e.target.value)}
                        placeholder="Ex: BTS"
                        maxLength={3}
                        required
                        className={errors.trigrama ? 'border-red-500' : ''}
                      />
                      {errors.trigrama && (
                        <p className="text-xs text-red-500 mt-1">{errors.trigrama}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="funcao">Função *</Label>
                    <Select 
                      value={formData.funcao} 
                      onValueChange={(v) => handleFormChange('funcao', v)}
                      required
                    >
                      <SelectTrigger id="funcao">
                        <SelectValue placeholder="Selecione a função..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Piloto">Piloto</SelectItem>
                        <SelectItem value="OAT">OAT</SelectItem>
                        <SelectItem value="OSM">OSM</SelectItem>
                        <SelectItem value="TASA">TASA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving || Object.keys(errors).length > 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl bg-white border-slate-200">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Tripulantes</CardTitle>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar tripulante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full my-2" />
                  ))}
                </div>
              ) : filteredTripulantes.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  Nenhum tripulante encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Posto/Graduação</TableHead>
                        <TableHead>Nome de Guerra</TableHead>
                        <TableHead>Trigrama</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTripulantes.map(tripulante => (
                        <TableRow key={tripulante.id}>
                          <TableCell className="font-medium text-xs">{tripulante.posto_graduacao || '-'}</TableCell>
                          <TableCell className="font-medium">{tripulante.nome_de_guerra}</TableCell>
                          <TableCell>{tripulante.trigrama}</TableCell>
                          <TableCell>{tripulante.funcao}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(tripulante)}
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(tripulante)}
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
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

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o tripulante <strong>{tripulanteToDelete?.nome_de_guerra}</strong>?
                <br /><br />
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}