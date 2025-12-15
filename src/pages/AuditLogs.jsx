import React, { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [filterUser, setFilterUser] = useState("");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const checkAccessAndLoad = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          alert("Acesso restrito a administradores.");
          navigate(createPageUrl("Dashboard"));
          return;
        }
        loadLogs();
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        navigate(createPageUrl("Dashboard"));
      }
    };
    checkAccessAndLoad();
  }, [navigate]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // Carregar últimos 500 logs
      const data = await base44.entities.AuditLog.list('-timestamp', 500);
      setLogs(data);
      setFilteredLogs(data);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = logs;

    if (filterUser) {
      const term = filterUser.toLowerCase();
      result = result.filter(log => 
        (log.user_name && log.user_name.toLowerCase().includes(term)) || 
        (log.user_email && log.user_email.toLowerCase().includes(term))
      );
    }

    if (filterEntity !== "all") {
      result = result.filter(log => log.entity_name === filterEntity);
    }

    if (filterAction !== "all") {
      result = result.filter(log => log.action === filterAction);
    }

    if (filterDate) {
      result = result.filter(log => log.timestamp.startsWith(filterDate));
    }

    setFilteredLogs(result);
  }, [logs, filterUser, filterEntity, filterAction, filterDate]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'create': return <Badge className="bg-green-100 text-green-800">Criação</Badge>;
      case 'update': return <Badge className="bg-blue-100 text-blue-800">Edição</Badge>;
      case 'delete': return <Badge className="bg-red-100 text-red-800">Exclusão</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatDetails = (details) => {
    try {
      const parsed = JSON.parse(details);
      return (
        <div className="text-xs font-mono whitespace-pre-wrap max-h-20 overflow-y-auto">
          {JSON.stringify(parsed, null, 2)}
        </div>
      );
    } catch {
      return <span className="text-xs text-slate-500">{details}</span>;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Logs de Auditoria</h1>
            <p className="text-slate-600">Histórico de ações realizadas no sistema.</p>
          </div>
          <Button onClick={loadLogs} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Usuário</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Nome ou Email..." 
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Entidade</label>
                <Select value={filterEntity} onValueChange={setFilterEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="FlightLog">Missões</SelectItem>
                    <SelectItem value="VictimRecord">Vítimas</SelectItem>
                    <SelectItem value="DailyService">Serviços Diários</SelectItem>
                    <SelectItem value="Abastecimento">Abastecimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Ação</label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="create">Criação</SelectItem>
                    <SelectItem value="update">Edição</SelectItem>
                    <SelectItem value="delete">Exclusão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data</label>
                <Input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-40">Data/Hora</TableHead>
                  <TableHead className="w-48">Usuário</TableHead>
                  <TableHead className="w-32">Ação</TableHead>
                  <TableHead className="w-32">Entidade</TableHead>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Alterações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Carregando logs...</TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Nenhum log encontrado.</TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{log.user_name}</span>
                          <span className="text-xs text-slate-500">{log.user_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{log.entity_name}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {log.entity_id ? log.entity_id.substring(0, 8) + '...' : '-'}
                      </TableCell>
                      <TableCell>
                        {formatDetails(log.details)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}