import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AeronaveTable({ aeronaves, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (aeronaves.length === 0) {
    return <div className="text-center py-8 text-slate-500">Nenhuma aeronave cadastrada</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Designativo</TableHead>
            <TableHead>Prefixo</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aeronaves.map((aeronave) => (
            <TableRow key={aeronave.id}>
              <TableCell className="font-medium">{aeronave.designativo}</TableCell>
              <TableCell>{aeronave.prefixo || "-"}</TableCell>
              <TableCell>{aeronave.modelo || "-"}</TableCell>
              <TableCell>
                {aeronave.ativa ? (
                  <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(aeronave)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(aeronave.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}