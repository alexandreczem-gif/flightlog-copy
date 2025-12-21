import Abastecimentos from './pages/Abastecimentos';
import Aerodromos from './pages/Aerodromos';
import AuditLogs from './pages/AuditLogs';
import Cidades from './pages/Cidades';
import CreateForm from './pages/CreateForm';
import DailyService from './pages/DailyService';
import Dashboard from './pages/Dashboard';
import EditDailyService from './pages/EditDailyService';
import EditFlightLog from './pages/EditFlightLog';
import EditUserProfile from './pages/EditUserProfile';
import EditVictimRecord from './pages/EditVictimRecord';
import FillForm from './pages/FillForm';
import FillForms from './pages/FillForms';
import FlightLogs from './pages/FlightLogs';
import Hospitais from './pages/Hospitais';
import MapaDaForca from './pages/MapaDaForca';
import NewPendingVictim from './pages/NewPendingVictim';
import NewVictimRecord from './pages/NewVictimRecord';
import ServiceRecords from './pages/ServiceRecords';
import Tripulantes from './pages/Tripulantes';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import VictimRecords from './pages/VictimRecords';
import ViewData from './pages/ViewData';
import NewFlightLog from './pages/NewFlightLog';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Abastecimentos": Abastecimentos,
    "Aerodromos": Aerodromos,
    "AuditLogs": AuditLogs,
    "Cidades": Cidades,
    "CreateForm": CreateForm,
    "DailyService": DailyService,
    "Dashboard": Dashboard,
    "EditDailyService": EditDailyService,
    "EditFlightLog": EditFlightLog,
    "EditUserProfile": EditUserProfile,
    "EditVictimRecord": EditVictimRecord,
    "FillForm": FillForm,
    "FillForms": FillForms,
    "FlightLogs": FlightLogs,
    "Hospitais": Hospitais,
    "MapaDaForca": MapaDaForca,
    "NewPendingVictim": NewPendingVictim,
    "NewVictimRecord": NewVictimRecord,
    "ServiceRecords": ServiceRecords,
    "Tripulantes": Tripulantes,
    "UserManagement": UserManagement,
    "UserProfile": UserProfile,
    "VictimRecords": VictimRecords,
    "ViewData": ViewData,
    "NewFlightLog": NewFlightLog,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};