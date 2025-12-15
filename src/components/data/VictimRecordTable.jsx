import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
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

// Função auxiliar para formatar datas localmente
const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    // Assuming dateString is in 'YYYY-MM-DD' format
    const [year, month, day] = dateString.split('-').map(Number);
    // Month is 0-indexed in Date constructor
    return new Date(year, month - 1, day);
};

const formatLocalDate = (dateString) => {
    const date = parseLocalDate(dateString);
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(2); // Get last two digits of the year
    return `${day}/${month}/${year}`;
};

// Função para formatar duração em minutos para hh:mm
const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export default function VictimRecordTable({ records, isLoading, onDelete }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Usuário não autenticado:", e);
      }
    };
    fetchUser();
  }, []);

  const canModify = (record) => {
    if (!currentUser || !record || !record.id) return false;
    if (currentUser.role === 'admin') return true;

    if (currentUser.email === record.created_by) {
      const creationDate = new Date(record.created_date);
      return differenceInDays(new Date(), creationDate) <= 2;
    }
    return false;
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      onDelete(recordToDelete.id);
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
    }
  };

  const handleViewFile = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full my-2" />)}
      </div>
    );
  }

  if (records.length === 0) {
    return <div className="text-center py-16 text-slate-500">Nenhum registro de atendimento completo.</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Missão</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Diagnóstico Principal</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Origem / Destino</TableHead>
              <TableHead>OSM</TableHead>
              <TableHead>Grau Afogamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map(rec => {
              const isModifiable = canModify(rec);
              return (
                <TableRow key={rec.id}>
                  <TableCell>{formatLocalDate(rec.data)}</TableCell>
                  <TableCell><Badge variant="outline">{rec.mission_id}</Badge></TableCell>
                  <TableCell className="font-medium">{rec.nome_paciente}</TableCell>
                  <TableCell>{rec.diagnostico_lesao_principal}</TableCell>
                  <TableCell className="font-mono">{formatDuration(rec.duracao_total_min)}</TableCell>
                  <TableCell>{rec.cidade_origem} → {rec.cidade_destino}</TableCell>
                  <TableCell>{rec.osm_1 || 'N/A'}</TableCell>
                  <TableCell>{rec.grau_afogamento || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {rec.ras_ram_rae_file_url && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Ver Frente"
                          onClick={() => handleViewFile(rec.ras_ram_rae_file_url)}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Frente
                        </Button>
                      )}
                      {rec.ras_ram_rae_file_url_verso && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Ver Verso"
                          onClick={() => handleViewFile(rec.ras_ram_rae_file_url_verso)}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Verso
                        </Button>
                      )}
                      {isModifiable && rec.id && (
                        <>
                          <Button asChild variant="ghost" size="icon" title="Editar">
                            <Link to={`${createPageUrl("EditVictimRecord")}?id=${rec.id}`}>
                              <Pencil className="w-4 h-4 text-slate-600" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDeleteClick(rec)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de atendimento do paciente{' '}
              <strong>{recordToDelete?.nome_paciente}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Confirmar Exclusão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}