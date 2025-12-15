import Dashboard from './pages/Dashboard';
import CreateForm from './pages/CreateForm';
import FillForms from './pages/FillForms';
import FillForm from './pages/FillForm';
import ViewData from './pages/ViewData';
import NewFlightLog from './pages/NewFlightLog';
import FlightLogs from './pages/FlightLogs';
import EditFlightLog from './pages/EditFlightLog';
import UserManagement from './pages/UserManagement';
import DailyService from './pages/DailyService';
import ServiceRecords from './pages/ServiceRecords';
import Abastecimentos from './pages/Abastecimentos';
import VictimRecords from './pages/VictimRecords';
import NewVictimRecord from './pages/NewVictimRecord';
import EditVictimRecord from './pages/EditVictimRecord';
import UserProfile from './pages/UserProfile';
import EditDailyService from './pages/EditDailyService';
import Aerodromos from './pages/Aerodromos';
import Hospitais from './pages/Hospitais';
import Tripulantes from './pages/Tripulantes';
import AuditLogs from './pages/AuditLogs';
import MapaDaForca from './pages/MapaDaForca';
import Cidades from './pages/Cidades';
import EditUserProfile from './pages/EditUserProfile';
import NewPendingVictim from './pages/NewPendingVictim';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "CreateForm": CreateForm,
    "FillForms": FillForms,
    "FillForm": FillForm,
    "ViewData": ViewData,
    "NewFlightLog": NewFlightLog,
    "FlightLogs": FlightLogs,
    "EditFlightLog": EditFlightLog,
    "UserManagement": UserManagement,
    "DailyService": DailyService,
    "ServiceRecords": ServiceRecords,
    "Abastecimentos": Abastecimentos,
    "VictimRecords": VictimRecords,
    "NewVictimRecord": NewVictimRecord,
    "EditVictimRecord": EditVictimRecord,
    "UserProfile": UserProfile,
    "EditDailyService": EditDailyService,
    "Aerodromos": Aerodromos,
    "Hospitais": Hospitais,
    "Tripulantes": Tripulantes,
    "AuditLogs": AuditLogs,
    "MapaDaForca": MapaDaForca,
    "Cidades": Cidades,
    "EditUserProfile": EditUserProfile,
    "NewPendingVictim": NewPendingVictim,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};