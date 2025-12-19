import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutGrid, Plane, ClipboardList, Users, ClipboardCheck, BookOpenCheck, Fuel, Stethoscope } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutGrid,
    adminOnly: false,
  },
  {
    title: "Meu Perfil",
    url: createPageUrl("UserProfile"),
    icon: Users,
    adminOnly: false,
  },

  {
    title: "Tripulantes",
    url: createPageUrl("Tripulantes"),
    icon: Users,
    adminOnly: false,
  },
  {
    title: "Mapa da Força",
    url: createPageUrl("MapaDaForca"),
    icon: ClipboardCheck,
    adminOnly: false,
  },
   {
    title: "Histórico de Serviço",
    url: createPageUrl("ServiceRecords"),
    icon: BookOpenCheck,
    adminOnly: false,
  },
  {
    title: "Nova Missão",
    url: createPageUrl("NewFlightLog"),
    icon: Plane,
    adminOnly: false,
  },
  {
    title: "Visualizar Registros",
    url: createPageUrl("FlightLogs"),
    icon: ClipboardList,
    adminOnly: false,
  },
  {
    title: "Abastecimentos",
    url: createPageUrl("Abastecimentos"),
    icon: Fuel,
    adminOnly: false,
  },
  {
    title: "Vítimas/Pacientes Atendidos",
    url: createPageUrl("VictimRecords"),
    icon: Stethoscope,
    adminOnly: false,
  },
  {
    title: "Aeródromos",
    url: createPageUrl("Aerodromos"),
    icon: Plane,
    adminOnly: true,
  },
  {
    title: "Hospitais",
    url: createPageUrl("Hospitais"),
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Cidades",
    url: createPageUrl("Cidades"),
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Diagnósticos (CID)",
    url: createPageUrl("Diagnosticos"),
    icon: ClipboardList,
    adminOnly: true,
  },
  {
    title: "Gerenciar Usuários",
    url: createPageUrl("UserManagement"),
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Logs de Auditoria",
    url: createPageUrl("AuditLogs"),
    icon: ClipboardList,
    adminOnly: true,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Capturar evento de instalação do PWA
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        setCurrentUser(null);
        console.error("Failed to fetch user:", e);
        setError(e.message || "Erro de conexão");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [location.pathname, navigate]);

  const visibleNavItems = navigationItems.filter(item => {
    if (!currentUser) {
      return false;
    }
    
    const userRole = currentUser.flight_log_role || 'Visitante';
    
    // Administradores veem tudo
    if (currentUser.role === 'admin' || userRole === 'Administrador') {
      return true;
    }

    // Sempre mostrar Dashboard e Meu Perfil
    if (item.title === "Dashboard" || item.title === "Meu Perfil") {
      return true;
    }

    // Páginas exclusivas de admin
    if (item.adminOnly) {
      return false;
    }

    // Tripulantes: apenas admin
    if (item.title === "Tripulantes") {
      return false;
    }

    // Piloto e OAT: acesso a quase tudo exceto vítimas, aeródromos, hospitais e gestão de usuários
    if (userRole === 'Piloto' || userRole === 'OAT') {
      const blocked = ["Vítimas/Pacientes Atendidos", "Aeródromos", "Hospitais", "Gerenciar Usuários"];
      return !blocked.includes(item.title);
    }

    // TASA: apenas dashboard, perfil, abastecimentos, serviço diário e histórico
    if (userRole === 'TASA') {
      const allowed = ["Dashboard", "Meu Perfil", "Abastecimentos", "Mapa da Força", "Histórico de Serviço"];
      return allowed.includes(item.title);
    }

    // OSM: apenas dashboard, perfil e vítimas atendidas
    if (userRole === 'OSM') {
      const allowed = ["Dashboard", "Meu Perfil", "Vítimas/Pacientes Atendidos"];
      return allowed.includes(item.title);
    }

    // Visitante: apenas dashboard e perfil
    if (userRole === 'Visitante') {
      return false;
    }

    return false;
  });

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Para instalar o FlightLog, use a opção "Adicionar à tela inicial" do seu navegador.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
        <div className="text-red-600 font-semibold">Erro de conexão: {error}</div>
        <Button onClick={() => window.location.reload()} variant="outline">Recarregar Página</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-100">
        <style>
          {`
            :root {
              --sidebar-background: 23 23 23;
              --sidebar-foreground: 229 231 235;
              --sidebar-primary: 220 38 38;
              --sidebar-primary-foreground: 255 255 255;
              --sidebar-accent: 31 41 55;
              --sidebar-accent-foreground: 255 255 255;
            }
          `}
        </style>

        <Sidebar className="border-r border-slate-700 backdrop-blur-xl bg-neutral-900/95 text-slate-200">
          <SidebarHeader className="border-b border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={showInstallButton ? handleInstallClick : undefined}
                className={`w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/50 ${showInstallButton ? 'cursor-pointer hover:from-red-700 hover:to-red-900 transition-all' : ''}`}
                title={showInstallButton ? "Clique para instalar FlightLog" : "FlightLog"}
              >
                <Plane className="w-5 h-5 text-white" />
              </button>
              <div>
                <h2 className="font-bold text-white text-lg">FlightLog</h2>
                <p className="text-xs text-slate-400">Sistema de Gestão de Voos</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Navegação
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {visibleNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-neutral-800 transition-all duration-200 rounded-lg ${
                          location.pathname === item.url
                            ? 'bg-red-700/80 text-white font-semibold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-700/50 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {currentUser?.trigrama || currentUser?.full_name?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {currentUser?.nome_de_guerra || currentUser?.full_name || 'Operador'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {currentUser?.flight_log_role || 'Visitante'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-600"
              >
                Sair
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-neutral-900/80 backdrop-blur-xl border-b border-slate-700 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200 text-white" />
              {showInstallButton ? (
                <button
                  onClick={handleInstallClick}
                  className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/50 cursor-pointer hover:from-red-700 hover:to-red-900 transition-all"
                  title="Clique para instalar FlightLog"
                >
                  <Plane className="w-4 h-4 text-white" />
                </button>
              ) : null}
              <h1 className="text-xl font-bold text-white">FlightLog</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}