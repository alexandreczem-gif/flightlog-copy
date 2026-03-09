/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
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
import NewFlightLog from './pages/NewFlightLog';
import NewPendingVictim from './pages/NewPendingVictim';
import NewVictimRecord from './pages/NewVictimRecord';
import ServiceRecords from './pages/ServiceRecords';
import Tripulantes from './pages/Tripulantes';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import VictimRecords from './pages/VictimRecords';
import ViewData from './pages/ViewData';
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
    "NewFlightLog": NewFlightLog,
    "NewPendingVictim": NewPendingVictim,
    "NewVictimRecord": NewVictimRecord,
    "ServiceRecords": ServiceRecords,
    "Tripulantes": Tripulantes,
    "UserManagement": UserManagement,
    "UserProfile": UserProfile,
    "VictimRecords": VictimRecords,
    "ViewData": ViewData,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};