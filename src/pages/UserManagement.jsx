import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';
import UserTable from "../components/users/UserTable";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        if (user.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
        } else {
          loadUsers();
        }
      } catch (e) {
        navigate(createPageUrl("Dashboard"));
      }
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const results = users.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.flight_log_role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.User.list('-created_date');
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
    setIsLoading(false);
  };
  
  const handleRoleChange = async (userId, newRole) => {
    try {
      await base44.entities.User.update(userId, { flight_log_role: newRole });
      loadUsers();
    } catch (error) {
      console.error("Erro ao atualizar nível de acesso:", error);
      alert("Ocorreu um erro ao atualizar o nível de acesso.");
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await base44.entities.User.update(userId, userData);
      loadUsers();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      alert("Ocorreu um erro ao atualizar o usuário.");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await base44.entities.User.delete(userId);
      loadUsers();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Ocorreu um erro ao excluir o usuário.");
    }
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Gerenciamento de Usuários
            </h1>
            <p className="text-slate-600">
              Gerencie usuários e seus níveis de acesso.
            </p>
          </div>
          <a href="/dashboard/users" target="_blank" rel="noopener noreferrer">
             <Button className="bg-red-700 hover:bg-red-800 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Novo Usuário
             </Button>
          </a>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl bg-white border-slate-200">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Usuários</CardTitle>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, email, nível..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <UserTable
                users={filteredUsers}
                isLoading={isLoading}
                onRoleChange={handleRoleChange}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                currentUserEmail={currentUser?.email}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}