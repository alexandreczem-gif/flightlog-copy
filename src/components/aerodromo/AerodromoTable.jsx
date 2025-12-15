import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from 'lucide-react';
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

export default function AerodromoTable({ aerodromos, isLoading, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [aerodromoToDelete, setAerodromoToDelete] = useState(null);

  const handleDeleteClick = (aerodromo) => {
    setAerodromoToDelete(aerodromo);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (aerodromoToDelete) {
      onDelete(aerodromoToDelete.id);
    }
    setShowDeleteConfirm(false);
    setAerodromoToDelete(null);
  };

  const formatCoordinate = (raw) => {
    if (!raw || raw.length < 6) return raw;
    const degrees = raw.substring(0, 2);
    const minutes = raw.substring(2, 4);
    const seconds = raw.substring(4, 6);
    return `${degrees}°${minutes}'${seconds}"`;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full my-2" />
        ))}
      </div>
    );
  }

  if (aerodromos.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        Nenhum aeródromo encontrado.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Código ICAO</TableHead>
              <TableHead>Latitude</TableHead>
              <TableHead>Longitude</TableHead>
              <TableHead>Latitude (Decimal)</TableHead>
              <TableHead>Longitude (Decimal)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aerodromos.map(aero => (
              <TableRow key={aero.id}>
                <TableCell className="font-mono font-semibold">{aero.icao_code}</TableCell>
                <TableCell className="font-mono">{formatCoordinate(aero.latitude_raw)}</TableCell>
                <TableCell className="font-mono">{formatCoordinate(aero.longitude_raw)}</TableCell>
                <TableCell className="text-slate-600">{aero.latitude_decimal?.toFixed(6)}</TableCell>
                <TableCell className="text-slate-600">{aero.longitude_decimal?.toFixed(6)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEdit(aero)}
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClick(aero)}
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
              Tem certeza que deseja excluir o aeródromo <strong>{aerodromoToDelete?.icao_code}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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