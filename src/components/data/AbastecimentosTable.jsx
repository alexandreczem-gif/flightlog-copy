import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "@/entities/User";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Mapeamento de prefixos para designativos
const PREFIX_TO_DESIGNATOR = {
  'PRHBZ': 'Arcanjo 01',
  'PRCBH': 'Falcão 08',
  'PRECB': 'Falcão 03',
  'PRBOP': 'Falcão 04',
  'PRRBM': 'Falcão 12',
  'PRRBL': 'Falcão 13',
  'PRRBK': 'Falcão 14',
  'PRRBO': 'Falcão 15'
};

export default function AbastecimentosTable({ records, isLoading, onUpdate, onDelete }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [today, setToday] = useState('');

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

    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    setToday(`${year}-${month}-${day}`);
  }, []);

  const canModify = (record) => {
    if (!currentUser || !record) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.email === record.created_by) {
      const recordCreationDate = parseISO(record.created_date);
      return differenceInDays(new Date(), recordCreationDate) <= 2;
    }
    return false;
  };
  
  const handleEditClick = (record) => {
    setEditingRecord({ ...record });
    setShowEditDialog(true);
  };

  const handlePrefixChange = (value) => {
    const upperPrefix = value.toUpperCase();
    const designator = PREFIX_TO_DESIGNATOR[upperPrefix];
    
    setEditingRecord({
      ...editingRecord, 
      aircraft_prefix: upperPrefix,
      aircraft_designator: designator || editingRecord.aircraft_designator
    });
  };

  const handleUpdate = () => {
    if (editingRecord) {
      const { id, created_date, updated_date, created_by, ...dataToUpdate } = editingRecord;
      onUpdate(id, dataToUpdate);
      setShowEditDialog(false);
      setEditingRecord(null);
    }
  };
  
  const ConfirmDeleteDialog = ({ recordId, recordInfo }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            A ação excluirá o registro de abastecimento: <strong>{recordInfo}</strong>. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDelete(recordId)} className="bg-red-600 hover:bg-red-700">Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isLoading) {
    return <div className="p-4">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full my-2" />)}</div>;
  }

  if (records.length === 0) {
    return <div className="text-center py-16 text-slate-500">Nenhum abastecimento registrado este mês.</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow><TableHead>Data</TableHead><TableHead>Hora</TableHead><TableHead>Tipo</TableHead><TableHead>Prefixo</TableHead><TableHead>Designativo</TableHead><TableHead>Qtd (L)</TableHead><TableHead>Nota</TableHead><TableHead>Registrado por</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {records.map(record => {
              const isModifiable = canModify(record);
              const localDate = new Date(record.date + 'T00:00:00');
              const recordInfo = record.uaa_abastecimento ? 'UAA' : (record.aircraft_prefix || 'N/A');
              
              return (
                <TableRow key={record.id}>
                  <TableCell>{format(localDate, "dd/MM/yy", { locale: ptBR })}</TableCell>
                  <TableCell>{record.time}</TableCell>
                  <TableCell>
                    {record.uaa_abastecimento ? (
                      <Badge className="bg-green-100 text-green-800">UAA</Badge>
                    ) : (
                      <Badge variant="outline">Aeronave</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{record.aircraft_prefix || '-'}</TableCell>
                  <TableCell>{record.aircraft_designator || '-'}</TableCell>
                  <TableCell>{record.quantity_liters}</TableCell>
                  <TableCell className="text-xs">{record.nota_numero || '-'}</TableCell>
                  <TableCell className="text-xs text-slate-600 truncate">{record.created_by}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      {isModifiable && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(record)}><Pencil className="w-4 h-4 text-slate-600" /></Button>
                          <ConfirmDeleteDialog recordId={record.id} recordInfo={recordInfo} />
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
      
      {editingRecord && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Registro de Abastecimento</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <Checkbox 
                  id="edit-uaa" 
                  checked={editingRecord.uaa_abastecimento || false}
                  onCheckedChange={(checked) => setEditingRecord({
                    ...editingRecord, 
                    uaa_abastecimento: checked,
                    aircraft_prefix: checked ? '' : editingRecord.aircraft_prefix,
                    aircraft_designator: checked ? '' : editingRecord.aircraft_designator
                  })}
                />
                <label htmlFor="edit-uaa" className="text-sm font-medium cursor-pointer">
                  Abastecimento da UAA
                </label>
              </div>
              
              <div><Label htmlFor="edit-date">Data</Label><Input id="edit-date" type="date" value={editingRecord.date} onChange={(e) => setEditingRecord({...editingRecord, date: e.target.value})} max={today} /></div>
              <div><Label htmlFor="edit-time">Hora</Label><Input id="edit-time" type="time" value={editingRecord.time} onChange={(e) => setEditingRecord({...editingRecord, time: e.target.value})} /></div>
              <div><Label htmlFor="edit-quantity">Quantidade (L)</Label><Input id="edit-quantity" type="number" value={editingRecord.quantity_liters} onChange={(e) => setEditingRecord({...editingRecord, quantity_liters: Number(e.target.value)})} /></div>
              
              {!editingRecord.uaa_abastecimento && (
                <>
                  <div>
                    <Label htmlFor="edit-prefix">Prefixo Aeronave</Label>
                    <Input 
                      id="edit-prefix" 
                      value={editingRecord.aircraft_prefix} 
                      onChange={(e) => handlePrefixChange(e.target.value)} 
                      maxLength={5} 
                    />
                  </div>
                  <div><Label htmlFor="edit-designator">Designativo Aeronave</Label><Input id="edit-designator" value={editingRecord.aircraft_designator} onChange={(e) => setEditingRecord({...editingRecord, aircraft_designator: e.target.value})} /></div>
                </>
              )}
              
              <div><Label htmlFor="edit-nota">Número da Nota</Label><Input id="edit-nota" value={editingRecord.nota_numero || ''} onChange={(e) => setEditingRecord({...editingRecord, nota_numero: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}><X className="w-4 h-4 mr-2"/>Cancelar</Button>
              <Button onClick={handleUpdate}><Save className="w-4 h-4 mr-2"/>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}