import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronDown, ChevronRight, CheckCircle } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { logAction } from "@/components/utils/logger";
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

// Função auxiliar para parsear datas localmente
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function ServiceRecordTable({ records, isLoading, onDelete, onEndService }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  const canModify = (record) => {
    if (!currentUser || !record || !record.id) return false;
    
    if (currentUser.role === 'admin') return true;
    
    if (currentUser.email === record.created_by) {
      const today = new Date();
      const recordCreationDate = parseISO(record.created_date);
      if (isNaN(recordCreationDate.getTime())) return false;
      return differenceInDays(today, recordCreationDate) <= 2;
    }
    
    return false;
  };
  
  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      onDelete(recordToDelete.id);
      await logAction('delete', 'DailyService', recordToDelete.id, `Serviço de ${recordToDelete.date} excluído`);
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
    }
  };

  const handleEditClick = (record) => {
    if (record && record.id) {
      navigate(`${createPageUrl("EditDailyService")}?id=${record.id}`);
    } else {
      alert('ID do registro não fornecido na URL.');
    }
  };

  const toggleRow = (recordId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        {Array(10).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full my-2" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        Nenhum registro de serviço encontrado.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Aeronaves/Bases</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registrado por</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map(record => {
              const isModifiable = canModify(record);
              const localDate = parseLocalDate(record.date);
              const isExpanded = expandedRows.has(record.id);
              const aircraftServices = record.aircraft_services || [];
              
              return (
                <React.Fragment key={record.id}>
                  <TableRow className="cursor-pointer hover:bg-slate-50" onClick={() => toggleRow(record.id)}>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {localDate ? format(localDate, "dd/MM/yy", { locale: ptBR }) : record.date}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {aircraftServices.map((svc, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {svc.aircraft}
                            </Badge>
                            {svc.base && (
                              <Badge variant="secondary" className="text-xs">
                                {svc.base}
                              </Badge>
                            )}
                          </div>
                        ))}
                        {aircraftServices.length === 0 && <span className="text-slate-400 text-sm">Nenhuma</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.status === 'completed' ? (
                        <Badge className="bg-green-100 text-green-800">Encerrado</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 truncate">{record.created_by}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {record.status === 'in_progress' && isModifiable && onEndService && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onEndService(record)}
                            title="Encerrar Serviço"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {isModifiable && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditClick(record)}
                            >
                              <Pencil className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteClick(record)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-slate-50">
                        <div className="py-4 space-y-4">
                          {aircraftServices.map((svc, idx) => (
                            <div key={idx} className="p-4 bg-white rounded-lg border">
                              <h4 className="font-semibold text-sm mb-3 text-slate-800 flex items-center gap-2">
                                Aeronave {idx + 1}: {svc.aircraft}
                                {svc.base && <Badge variant="secondary" className="text-xs">{svc.base}</Badge>}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <span className="text-slate-500">Horário:</span>
                                  <p className="font-medium">{svc.service_start_time || 'N/A'} - {svc.service_end_time || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500">Comandante:</span>
                                  <p className="font-medium">{svc.commander || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500">Copiloto:</span>
                                  <p className="font-medium">{svc.copilot || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500">OATs:</span>
                                  <p className="font-medium">
                                    {[svc.oat_1, svc.oat_2, svc.oat_3].filter(Boolean).join(', ') || '-'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-500">OSMs:</span>
                                  <p className="font-medium">
                                    {[svc.osm_1, svc.osm_2].filter(Boolean).join(', ') || '-'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-500">TASA:</span>
                                  <p className="font-medium">{svc.tasa || '-'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {aircraftServices.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">
                              Nenhuma aeronave registrada para este serviço.
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            <div>
                              <span className="text-xs text-slate-500">Combustível Inicial UAA:</span>
                              <p className="font-medium text-sm">{record.initial_fuel_supply_liters ?? 'N/A'} L</p>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500">Combustível Drenado:</span>
                              <p className="font-medium text-sm">{record.drained_fuel_liters ?? 'N/A'} L</p>
                            </div>
                            {record.final_fuel_supply_liters !== null && record.final_fuel_supply_liters !== undefined && (
                              <div>
                                <span className="text-xs text-slate-500">Combustível Final UAA:</span>
                                <p className="font-medium text-sm">{record.final_fuel_supply_liters} L</p>
                              </div>
                            )}
                          </div>
                          
                          {record.service_notes && record.service_notes !== 'Sem alterações' && (
                            <div className="mt-4 pt-4 border-t">
                              <span className="text-xs text-slate-500">Notas do Serviço:</span>
                              <p className="text-sm mt-1">{record.service_notes}</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de serviço do dia{' '}
              {recordToDelete && parseLocalDate(recordToDelete.date) && (
                <strong>{format(parseLocalDate(recordToDelete.date), "dd/MM/yyyy", { locale: ptBR })}</strong>
              )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}