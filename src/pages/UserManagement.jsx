import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Search, Download, Upload } from "lucide-react";
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
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef(null);
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

  const exportToCSV = () => {
    if (filteredUsers.length === 0) {
      alert('Nenhum usuário para exportar.');
      return;
    }

    const headers = [
      'Nome Completo',
      'Email',
      'Nível de Acesso',
      'Posto/Graduação',
      'Nome de Guerra',
      'Trigrama',
      'CPF',
      'Telefone',
      'Data de Criação'
    ];

    const rows = filteredUsers.map(user => [
      user.full_name || '',
      user.email || '',
      user.flight_log_role || 'Indefinido',
      user.posto_graduacao || '',
      user.nome_de_guerra || '',
      user.trigrama || '',
      user.cpf || '',
      user.telefone || '',
      user.created_date || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
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

    const confirm = window.confirm(
      'AVISO: A importação de usuários não cria contas automaticamente.\n\n' +
      'Esta funcionalidade importa apenas dados adicionais de usuários existentes (posto, nome de guerra, etc.).\n\n' +
      'Para criar novos usuários, use o botão "Convidar Novo Usuário".\n\n' +
      'Formato esperado do CSV:\n' +
      'Email,Nível de Acesso,Posto/Graduação,Nome de Guerra,Trigrama\n\n' +
      'Deseja continuar?'
    );

    if (!confirm) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('Arquivo CSV vazio ou inválido.');
          return;
        }

        const dataToImport = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '').trim());
          
          if (values && values.length >= 2) {
            const email = values[0]?.toLowerCase();
            const userData = {
              flight_log_role: values[1] || 'Indefinido',
              posto_graduacao: values[2] || '',
              nome_de_guerra: values[3] || '',
              trigrama: values[4]?.toUpperCase() || ''
            };
            
            if (!email) {
              errors.push(`Linha ${i + 1}: Email obrigatório`);
              continue;
            }

            const existingUser = users.find(u => u.email === email);
            if (!existingUser) {
              errors.push(`Linha ${i + 1}: Usuário ${email} não encontrado no sistema`);
              continue;
            }
            
            dataToImport.push({ userId: existingUser.id, ...userData });
          }
        }

        if (errors.length > 0) {
          alert('Avisos:\n\n' + errors.join('\n'));
        }

        if (dataToImport.length > 0) {
          await Promise.all(dataToImport.map(({ userId, ...data }) => 
            base44.entities.User.update(userId, data)
          ));
          alert(`${dataToImport.length} usuário(s) atualizado(s) com sucesso!`);
          loadUsers();
        } else {
          alert('Nenhum dado válido encontrado para importação.');
        }
      } catch (error) {
        console.error('Erro na importação:', error);
        alert('Erro ao processar o arquivo: ' + error.message);
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Gerenciamento de Usuários
            </h1>
            <p className="text-slate-600">
              Gerencie usuários e seus níveis de acesso.
            </p>
          </div>
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
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importando...' : 'Importar CSV'}
            </Button>
            <Button 
              onClick={exportToCSV}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <a href="/dashboard/users" target="_blank" rel="noopener noreferrer">
              <Button className="bg-red-700 hover:bg-red-800 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Novo Usuário
              </Button>
            </a>
          </div>
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