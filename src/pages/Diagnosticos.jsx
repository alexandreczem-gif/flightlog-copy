import React, { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Download, Upload, Trash2, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function Diagnosticos() {
  const navigate = useNavigate();
  const [cids, setCids] = useState([]);
  const [filteredCids, setFilteredCids] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newCid, setNewCid] = useState({ subcategoria: "", descricao: "" });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    const searchCIDs = async () => {
      if (searchTerm.trim() === "") {
        const data = await base44.entities.CID.list("subcategoria", 100);
        setCids(data);
        setFilteredCids(data);
      } else {
        // Buscar no backend usando filter
        const term = searchTerm.toLowerCase();
        try {
          const results = await base44.entities.CID.filter(
            {
              $or: [
                { subcategoria: { $regex: searchTerm, $options: 'i' } },
                { descricao: { $regex: searchTerm, $options: 'i' } }
              ]
            },
            'subcategoria',
            100
          );
          setFilteredCids(results);
        } catch (error) {
          console.error("Erro ao buscar CIDs:", error);
        }
      }
    };
    
    const timeoutId = setTimeout(() => {
      searchCIDs();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const checkAccess = async () => {
    try {
      const user = await base44.auth.me();
      if (user.role !== "admin") {
        navigate(createPageUrl("Dashboard"));
        return;
      }
      loadData();
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      navigate(createPageUrl("Dashboard"));
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar apenas os primeiros 100 registros para exibição inicial
      const data = await base44.entities.CID.list("subcategoria", 100);
      setCids(data);
      setFilteredCids(data);
    } catch (error) {
      console.error("Erro ao carregar CIDs:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!newCid.subcategoria || !newCid.descricao) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    setIsSaving(true);
    try {
      await base44.entities.CID.create(newCid);
      setNewCid({ subcategoria: "", descricao: "" });
      setShowDialog(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar CID:", error);
      alert("Erro ao salvar CID.");
    }
    setIsSaving(false);
  };

  const handleExport = () => {
    const csvContent = [
      "subcategoria,descricao",
      ...cids.map((cid) => `"${cid.subcategoria}","${cid.descricao.replace(/"/g, '""')}"`),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `cids_${new Date().toISOString().split("T")[0]}.csv`);
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

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split("\n");
        if (lines.length < 2) return;

        const dataToImport = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const rowValues = [];
          let currentVal = "";
          let inQuotes = false;

          for (let char of lines[i]) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              rowValues.push(currentVal.trim().replace(/^"|"$/g, ""));
              currentVal = "";
            } else {
              currentVal += char;
            }
          }
          rowValues.push(currentVal.trim().replace(/^"|"$/g, ""));

          if (rowValues.length >= 2) {
            dataToImport.push({
              subcategoria: rowValues[0],
              descricao: rowValues[1],
            });
          }
        }

        if (dataToImport.length === 0) {
          alert("Nenhum dado válido encontrado no arquivo.");
          return;
        }

        const confirmImport = window.confirm(
          `Importar ${dataToImport.length} registro(s)?`
        );

        if (!confirmImport) {
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        // Importar em lotes de 100 para evitar sobrecarga
        const batchSize = 100;
        let imported = 0;
        
        for (let i = 0; i < dataToImport.length; i += batchSize) {
          const batch = dataToImport.slice(i, i + batchSize);
          await Promise.all(batch.map((d) => base44.entities.CID.create(d)));
          imported += batch.length;
          console.log(`Importados ${imported} de ${dataToImport.length} registros...`);
        }
        
        alert(`${dataToImport.length} registros importados com sucesso!`);
        loadData();
      } catch (error) {
        console.error("Erro na importação:", error);
        alert("Erro ao processar arquivo.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  const handleDeleteAll = async () => {
    try {
      // Buscar todos os CIDs para contar
      const allCids = await base44.entities.CID.list('subcategoria', 20000);
      
      const confirm = window.confirm(
        `Tem certeza que deseja excluir TODOS os ${allCids.length} registros de CID? Esta ação não pode ser desfeita.`
      );
      if (!confirm) return;

      const confirmAgain = window.confirm(
        "CONFIRMAÇÃO FINAL: Todos os registros serão excluídos permanentemente. Deseja continuar?"
      );
      if (!confirmAgain) return;

      // Excluir em lotes de 100 para evitar sobrecarga
      const batchSize = 100;
      let deleted = 0;
      
      for (let i = 0; i < allCids.length; i += batchSize) {
        const batch = allCids.slice(i, i + batchSize);
        await Promise.all(batch.map((cid) => base44.entities.CID.delete(cid.id)));
        deleted += batch.length;
        console.log(`Excluídos ${deleted} de ${allCids.length} registros...`);
      }
      
      alert("Todos os registros foram excluídos.");
      loadData();
    } catch (error) {
      console.error("Erro ao excluir registros:", error);
      alert("Erro ao excluir registros.");
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
              Banco de Dados CID
            </h1>
            <p className="text-slate-600">
              Gerenciar diagnósticos para preenchimento automático
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <Button onClick={handleImportClick} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
            <Button onClick={handleExport} variant="outline" disabled={cids.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              onClick={handleDeleteAll}
              variant="outline"
              disabled={cids.length === 0}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Todos
            </Button>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-red-700 hover:bg-red-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo CID
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo CID</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="subcategoria">Subcategoria *</Label>
                    <Input
                      id="subcategoria"
                      value={newCid.subcategoria}
                      onChange={(e) =>
                        setNewCid({ ...newCid, subcategoria: e.target.value })
                      }
                      placeholder="Ex: A00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input
                      id="descricao"
                      value={newCid.descricao}
                      onChange={(e) =>
                        setNewCid({ ...newCid, descricao: e.target.value })
                      }
                      placeholder="Ex: Cólera"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por subcategoria ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-slate-500">
                {filteredCids.length} registros
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-slate-500 py-8">Carregando...</p>
            ) : filteredCids.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                {searchTerm ? "Nenhum resultado encontrado" : "Nenhum CID cadastrado"}
              </p>
            ) : (
              <div className="max-h-[600px] overflow-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700">
                        Subcategoria
                      </th>
                      <th className="text-left p-3 font-semibold text-slate-700">
                        Descrição
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCids.map((cid, idx) => (
                      <tr
                        key={cid.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        <td className="p-3 border-t">{cid.subcategoria}</td>
                        <td className="p-3 border-t">{cid.descricao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}