import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ShieldOff, Trash2, UserPlus, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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

const ROLE_COLORS = {
  Administrador: "bg-purple-100 text-purple-800",
  Piloto: "bg-blue-100 text-blue-800",
  OAT: "bg-green-100 text-green-800",
  OSM: "bg-yellow-100 text-yellow-800",
  TASA: "bg-orange-100 text-orange-800",
  Visitante: "bg-gray-100 text-gray-800"
};

export default function UserTable({ users, isLoading, onDeleteUser, currentUserEmail }) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAdminPromote, setShowAdminPromote] = useState(false);
  const [userToPromote, setUserToPromote] = useState(null);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await onDeleteUser(userToDelete.id);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário. Tente novamente.");
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      // Se a classe for "Administrador", definir role como "admin", caso contrário "user"
      const systemRole = newRole === 'Administrador' ? 'admin' : 'user';
      
      await base44.entities.User.update(user.id, { 
        flight_log_role: newRole,
        role: systemRole
      });
      
      alert(`✅ Classe de usuário atualizada para ${newRole}!`);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao alterar classe de usuário:", error);
      alert("Erro ao alterar classe de usuário.");
    }
  };

  const handlePromoteAdmin = (user) => {
    setUserToPromote(user);
    setShowAdminPromote(true);
  };

  const handleConfirmPromote = async () => {
    if (!userToPromote) return;
    
    try {
      const newRole = userToPromote.role === 'admin' ? 'user' : 'admin';
      await base44.entities.User.update(userToPromote.id, { role: newRole });
      
      alert(newRole === 'admin' 
        ? "Usuário promovido a Administrador do Sistema com sucesso!" 
        : "Usuário removido do papel de Administrador do Sistema."
      );
      
      setShowAdminPromote(false);
      setUserToPromote(null);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao alterar papel de administrador:", error);
      alert("Erro ao alterar papel de administrador.");
    }
  };

  const handleCreateTripulante = async (user) => {
    // Determinar função baseada no flight_log_role
    const roleToFuncao = {
      'Piloto': 'Piloto',
      'OAT': 'OAT',
      'OSM': 'OSM',
      'TASA': 'TASA'
    };
    
    const funcao = roleToFuncao[user.flight_log_role];
    
    if (!funcao) {
      alert('O usuário precisa ter uma classe de usuário definida (Piloto, OAT, OSM ou TASA) para criar um tripulante.');
      return;
    }
    
    if (!user.posto_graduacao || !user.nome_de_guerra || !user.trigrama) {
      alert('O usuário precisa ter Título/Posto/Graduação, Nome de Guerra e Trigrama definidos para criar um tripulante.');
      return;
    }
    
    try {
      // Verificar se já existe tripulante com mesmo trigrama e função
      const existingTripulantes = await base44.entities.Tripulante.filter({
        trigrama: user.trigrama,
        funcao: funcao
      });
      
      if (existingTripulantes.length > 0) {
        alert(`Já existe um tripulante cadastrado com o trigrama ${user.trigrama} e função ${funcao}.`);
        return;
      }
      
      // Criar o tripulante com os campos solicitados
      await base44.entities.Tripulante.create({
        posto_graduacao: user.posto_graduacao,
        nome_de_guerra: user.nome_de_guerra,
        trigrama: user.trigrama,
        funcao: funcao
      });
      
      alert(`✅ Tripulante ${user.nome_de_guerra} criado com sucesso!`);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao criar tripulante:', error);
      alert('Erro ao criar tripulante. Tente novamente.');
    }
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

  if (users.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        Nenhum usuário encontrado.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Classe de Usuário</TableHead>
              <TableHead>Papel no Sistema</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => {
              const isCurrentUser = user.email === currentUserEmail;
              const userRole = user.flight_log_role || 'Visitante';
              
              return (
                <TableRow key={user.id} className={userRole === 'Visitante' ? 'bg-orange-50' : ''}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select 
                      value={userRole}
                      onValueChange={(newRole) => handleRoleChange(user, newRole)}
                      disabled={isCurrentUser}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                        <SelectItem value="Piloto">Piloto</SelectItem>
                        <SelectItem value="OAT">OAT</SelectItem>
                        <SelectItem value="TASA">TASA</SelectItem>
                        <SelectItem value="OSM">OSM</SelectItem>
                        <SelectItem value="Visitante">Visitante</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                      {user.role === 'admin' ? 'Admin do Sistema' : 'Usuário'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`${createPageUrl("EditUserProfile")}?userId=${user.id}`)}
                        title="Editar Perfil"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreateTripulante(user)}
                        title="Criar Tripulante"
                        className="text-green-600 hover:text-green-700"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Criar Tripulante
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePromoteAdmin(user)}
                        disabled={isCurrentUser}
                        title={user.role === 'admin' ? 'Remover Admin' : 'Promover a Admin'}
                      >
                        {user.role === 'admin' ? (
                          <ShieldOff className="w-4 h-4 text-orange-500" />
                        ) : (
                          <Shield className="w-4 h-4 text-blue-500" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(user)}
                        disabled={isCurrentUser}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.full_name}</strong>?
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

      <AlertDialog open={showAdminPromote} onOpenChange={setShowAdminPromote}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToPromote?.role === 'admin' ? 'Remover Administrador' : 'Promover a Administrador'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToPromote?.role === 'admin' ? (
                <>
                  Tem certeza que deseja remover <strong>{userToPromote?.full_name}</strong> do papel de Administrador do Sistema?
                  <br /><br />
                  O usuário perderá acesso a funcionalidades administrativas.
                </>
              ) : (
                <>
                  Tem certeza que deseja promover <strong>{userToPromote?.full_name}</strong> a Administrador do Sistema?
                  <br /><br />
                  O usuário terá acesso completo a todas as funcionalidades administrativas.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPromote}
              className={userToPromote?.role === 'admin' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}