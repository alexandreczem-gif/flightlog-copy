import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
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

const ESFERA_COLORS = {
  'Federal': 'bg-blue-100 text-blue-800',
  'Estadual': 'bg-green-100 text-green-800',
  'Municipal': 'bg-yellow-100 text-yellow-800',
  'Privada': 'bg-purple-100 text-purple-800'
};

export default function HospitalTable({ hospitals, isLoading, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hospitalToDelete, setHospitalToDelete] = useState(null);

  const handleDeleteClick = (hospital) => {
    setHospitalToDelete(hospital);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (hospitalToDelete) {
      onDelete(hospitalToDelete.id);
      setShowDeleteConfirm(false);
      setHospitalToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        {Array(10).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full my-2" />
        ))}
      </div>
    );
  }

  if (!hospitals || hospitals.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        Nenhum hospital cadastrado.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>Município</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Esfera</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hospitals.map(hospital => (
              <TableRow key={hospital.id}>
                <TableCell className="font-medium">{hospital.name}</TableCell>
                <TableCell>{hospital.razao_social || '-'}</TableCell>
                <TableCell>{hospital.municipality}</TableCell>
                <TableCell>{hospital.bairro || '-'}</TableCell>
                <TableCell className="font-mono text-sm">{hospital.phone || '-'}</TableCell>
                <TableCell>
                  {hospital.esfera_administrativa ? (
                    <Badge className={ESFERA_COLORS[hospital.esfera_administrativa]}>
                      {hospital.esfera_administrativa}
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEdit(hospital)}
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClick(hospital)}
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o hospital <strong>{hospitalToDelete?.name}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita.
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