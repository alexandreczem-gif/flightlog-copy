import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, parseISO } from 'date-fns';
import { Search, Plane, Truck, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ServiceReportButton } from '@/components/reports/ServiceReport';
import { MultiServiceReport } from '@/components/reports/MultiServiceReport';
import { logAction } from '@/components/utils/logger';
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

export default function ServiceRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        if (user.flight_log_role === 'Indefinido' && user.role !== 'admin') {
            navigate(createPageUrl("Dashboard"));
            return;
        }
        // Load all completed services
        const data = await base44.entities.DailyService.filter({ status: 'completed' }, '-date');
        setRecords(data);
        setFilteredRecords(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadData();
  }, [navigate]);

  const canModify = (record) => {
    if (!currentUser || !record) return false;
    if (currentUser.role === 'admin') return true;
    
    if (currentUser.email === record.created_by) {
      const today = new Date();
      const createdDate = parseISO(record.created_date);
      if (isNaN(createdDate.getTime())) return false;
      return differenceInDays(today, createdDate) <= 2;
    }
    return false;
  };

  const handleReactivate = async (record) => {
    const confirmed = confirm(`Deseja reativar o serviço de ${record.name} para o Mapa da Força?`);
    if (!confirmed) return;
    
    try {
      await base44.entities.DailyService.update(record.id, { status: 'active' });
      await logAction('update', 'DailyService', record.id, { action: 'reactivate_service' });
      setRecords(records.filter(r => r.id !== record.id));
      alert(`Serviço de ${record.name} reativado com sucesso!`);
    } catch (error) {
      console.error("Erro ao reativar serviço:", error);
      alert("Erro ao reativar serviço.");
    }
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await base44.entities.DailyService.delete(recordToDelete.id);
      await logAction('delete', 'DailyService', recordToDelete.id, `Exclusão de registro de serviço ${recordToDelete.name}`);
      setRecords(records.filter(r => r.id !== recordToDelete.id));
      setShowDeleteDialog(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      alert("Erro ao excluir o registro.");
    }
  };

  useEffect(() => {
    let results = records;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      results = results.filter(r => 
        r.name.toLowerCase().includes(lower) || 
        (r.commander && r.commander.toLowerCase().includes(lower)) ||
        r.base.toLowerCase().includes(lower)
      );
    }
    if (dateFilter) {
      results = results.filter(r => r.date === dateFilter);
    }
    setFilteredRecords(results);
  }, [searchTerm, dateFilter, records]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Histórico de Serviço</h1>
            <p className="text-slate-600">Registros de serviços encerrados de aeronaves e UAAs.</p>
          </div>
          <MultiServiceReport services={records} />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome, comandante, base..." 
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
             <Input 
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                   <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">Nenhum registro encontrado.</TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map(record => {
                    const isModifiable = canModify(record);
                    return (
                      <TableRow key={record.id}>
                        <TableCell>{format(new Date(record.date + 'T12:00:00'), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.type === 'aircraft' ? <Plane className="w-4 h-4 text-blue-600"/> : <Truck className="w-4 h-4 text-green-600"/>}
                            <span className="font-medium">{record.name}</span>
                            <Badge variant="outline" className="text-[10px]">Eq. {record.team}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{record.base}</TableCell>
                        <TableCell className="text-xs">{record.start_time} - {record.end_time}</TableCell>
                        <TableCell>
                          {record.type === 'aircraft' ? (
                            <div className="text-xs space-y-1">
                              <p><strong>Cmd:</strong> {record.commander}</p>
                              {record.copilot && <p><strong>Cop:</strong> {record.copilot}</p>}
                            </div>
                          ) : (
                            <div className="text-xs">
                              <p>Comb. Inicial: {record.initial_fuel}</p>
                              <p>Comb. Final: {record.final_fuel}</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate" title={record.type === 'aircraft' ? record.notes_general : record.notes}>
                          {record.type === 'aircraft' ? record.notes_general : record.notes}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <ServiceReportButton service={record} />
                            {isModifiable && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleReactivate(record)}
                                  title="Reativar para Mapa da Força"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleDeleteClick(record)}
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o registro de serviço <strong>{recordToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}