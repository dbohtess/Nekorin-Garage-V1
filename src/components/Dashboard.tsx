import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Fuel, 
  Wrench, 
  FileText, 
  BarChart3, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Camera, 
  Upload, 
  CheckCircle2, 
  MapPin, 
  User, 
  RefreshCw, 
  LogOut, 
  ChevronLeft, 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import firebaseService from '../lib/firebase';
import { Vehicle, FuelLog, MaintenanceLog, VehicleDocument, UserProfile, FuelPrices } from '../types';

// Custom UAE Dirham symbol component
const DirhamSymbol = ({ className = "h-3.5 w-auto inline" }: { className?: string }) => {
  return (
    <img
      src="/input_file_0.png"
      className={`${className} filter invert align-middle inline-block mx-0.5`}
      alt="د.إ"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

interface DashboardProps {
  user: UserProfile;
  onSignOut: () => void;
  setIslandMessage: (msg: string) => void;
}

export default function Dashboard({
  user,
  onSignOut,
  setIslandMessage,
}: DashboardProps) {
  // Navigation & View States
  // Tab index order (RTL order matching bottom layout, but handled numerically):
  // 0: Account / Settings, 1: Reports, 2: Home (Center), 3: Vehicle/Logs, 4: Documents
  const [activeTab, setActiveTab] = useState<number>(2);
  const [activeSubTab, setActiveSubTab] = useState<'fuel' | 'maint'>('fuel');

  // Database States
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form States
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [showDocDetails, setShowDocDetails] = useState<VehicleDocument | null>(null);
  const [showCameraSim, setShowCameraSim] = useState(false);

  // Fuel Prices State
  const [fuelPrices, setFuelPrices] = useState<FuelPrices>({
    super98: 3.55,
    special95: 3.21,
    eplus91: 2.95,
    diesel: 3.02,
    month: 'يوليو',
    year: '2026',
    updatedAt: Date.now()
  });

  // Edit states for fuel prices (synchronized on mount and save)
  const [editSuper98, setEditSuper98] = useState<string>('3.55');
  const [editSpecial95, setEditSpecial95] = useState<string>('3.21');
  const [editEPlus91, setEditEPlus91] = useState<string>('2.95');
  const [editDiesel, setEditDiesel] = useState<string>('3.02');
  const [editMonth, setEditMonth] = useState<string>('يوليو');
  const [editYear, setEditYear] = useState<string>('2026');
  const [savingPrices, setSavingPrices] = useState(false);

  // Fuel Form Fields
  const [fuelOdometer, setFuelOdometer] = useState<string>('126560');
  const [fuelGrade, setFuelGrade] = useState<'91' | '95' | '98' | 'Diesel'>('95');
  const [fuelLiters, setFuelLiters] = useState<number>(45);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(3.21);
  const [fuelAmountPaid, setFuelAmountPaid] = useState<string>('150');
  const [submittingFuel, setSubmittingFuel] = useState(false);

  // Maintenance Form Fields
  const [maintTitle, setMaintTitle] = useState('');
  const [maintOdometer, setMaintOdometer] = useState('126560');
  const [maintCost, setMaintCost] = useState('350');
  const [maintNotes, setMaintNotes] = useState('');
  const [maintCompleted, setMaintCompleted] = useState(true);
  const [submittingMaint, setSubmittingMaint] = useState(false);

  // Camera Simulator States
  const [cameraOdometer, setCameraOdometer] = useState<number>(126560);
  const [scanning, setScanning] = useState(false);

  // Document Upload States
  const [dragActive, setDragActive] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Document Editing States
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocNumber, setEditDocNumber] = useState('');
  const [editDocExpiry, setEditDocExpiry] = useState('');
  const [editDocOwner, setEditDocOwner] = useState('');
  const [editDocNotes, setEditDocNotes] = useState('');

  // Profile Editing States
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState(user.displayName);
  const [profileGarageName, setProfileGarageName] = useState(user.garageName);
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Settings States
  const [syncDatabase, setSyncDatabase] = useState(true);
  const [syncStorage, setSyncStorage] = useState(true);
  const [useMiles, setUseMiles] = useState(false);

  // Fetch all records on mount
  const fetchData = async () => {
    try {
      setLoading(true);
      const vResult = await firebaseService.getVehicles(user.uid);
      if (vResult.length > 0) {
        setVehicle(vResult[0]);
      }
      
      const fResult = await firebaseService.getFuelLogs();
      setFuelLogs(fResult);

      const mResult = await firebaseService.getMaintenanceLogs();
      setMaintenanceLogs(mResult);

      const dResult = await firebaseService.getDocuments();
      setDocuments(dResult);

      // Fetch official fuel prices from Firestore
      const pResult = await firebaseService.getFuelPrices();
      if (pResult) {
        setFuelPrices(pResult);
        setEditSuper98(pResult.super98.toString());
        setEditSpecial95(pResult.special95.toString());
        setEditEPlus91(pResult.eplus91.toString());
        setEditDiesel(pResult.diesel.toString());
        setEditMonth(pResult.month);
        setEditYear(pResult.year);
      }
    } catch (err) {
      setIslandMessage('DATABASE READ ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Load interactive settings
  useEffect(() => {
    const saved = localStorage.getItem('nekorin_v1_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.syncDatabase !== undefined) setSyncDatabase(parsed.syncDatabase);
        if (parsed.syncStorage !== undefined) setSyncStorage(parsed.syncStorage);
        if (parsed.useMiles !== undefined) setUseMiles(parsed.useMiles);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, []);

  const saveSettings = (updated: { syncDatabase?: boolean; syncStorage?: boolean; useMiles?: boolean }) => {
    const current = { syncDatabase, syncStorage, useMiles, ...updated };
    localStorage.setItem('nekorin_v1_settings', JSON.stringify(current));
    setIslandMessage('⚙️ SETTINGS UPDATED');
  };

  // Sync fuelPricePerLiter with selected fuelGrade and our dynamic fuelPrices
  useEffect(() => {
    const getPriceForGrade = (grade: '91' | '95' | '98' | 'Diesel') => {
      switch (grade) {
        case '98': return fuelPrices.super98;
        case '95': return fuelPrices.special95;
        case '91': return fuelPrices.eplus91;
        case 'Diesel': return fuelPrices.diesel;
        default: return fuelPrices.special95;
      }
    };
    setFuelPricePerLiter(getPriceForGrade(fuelGrade));
  }, [fuelGrade, fuelPrices]);

  // Sync fuelLiters based on amount paid and fuelPricePerLiter
  useEffect(() => {
    const paid = Number(fuelAmountPaid);
    if (paid > 0 && fuelPricePerLiter > 0) {
      const computedLiters = Number((paid / fuelPricePerLiter).toFixed(2));
      setFuelLiters(computedLiters);
    } else {
      setFuelLiters(0);
    }
  }, [fuelAmountPaid, fuelPricePerLiter]);

  // Derived Values for Dashboard Stats
  const currentOdometer = fuelLogs.length > 0 ? Math.max(...fuelLogs.map(l => l.odometer)) : 126560;
  
  // Calculate average fuel consumption automatically in km/L (baseline fallback 11.8)
  const calculateAverageEfficiency = (logs: FuelLog[]) => {
    if (logs.length < 2) return 11.8;
    const sorted = [...logs].sort((a, b) => b.odometer - a.odometer);
    const latestOdometer = sorted[0].odometer;
    const earliestOdometer = sorted[sorted.length - 1].odometer;
    const distance = latestOdometer - earliestOdometer;
    if (distance <= 0) return 11.8;
    
    let totalLiters = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      totalLiters += sorted[i].liters;
    }
    if (totalLiters <= 0) return 11.8;
    return Number((distance / totalLiters).toFixed(1));
  };
  
  const averageEfficiency = calculateAverageEfficiency(fuelLogs);

  // Calculate total fuel cost for the current calendar month automatically (or default to 0 if none)
  const totalFuelCostThisMonth = fuelLogs
    .filter(log => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed
      const parts = log.date.split('/');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        return year === currentYear && month === currentMonth;
      }
      return false;
    })
    .reduce((sum, log) => sum + log.totalCost, 0);

  // Remaining range and fuel percentage calculated from the latest fuel entry
  const latestFuelLog = fuelLogs.length > 0 ? [...fuelLogs].sort((a, b) => b.odometer - a.odometer)[0] : null;
  const tankCapacity = 65; // Nissan Altima 2014 fuel tank capacity in liters
  
  let fuelPercentage = 68; // Default fallback matching UI
  let remainingRange = 248; // Default fallback matching UI

  if (latestFuelLog) {
    const distanceSinceLastRefuel = Math.max(0, currentOdometer - latestFuelLog.odometer);
    const fuelConsumed = distanceSinceLastRefuel / averageEfficiency;
    const startingLiters = Math.min(tankCapacity, latestFuelLog.liters || 50);
    const remainingLiters = Math.max(0, startingLiters - fuelConsumed);
    
    fuelPercentage = Math.round((remainingLiters / tankCapacity) * 100);
    remainingRange = Math.round(remainingLiters * averageEfficiency);
    
    if (fuelPercentage === 0 && distanceSinceLastRefuel === 0) {
      fuelPercentage = Math.round((startingLiters / tankCapacity) * 100);
      remainingRange = Math.round(startingLiters * averageEfficiency);
    }
  }

  const lastFillDate = fuelLogs.length > 0 ? fuelLogs[0].date : '2024/07/08';
  const lastFillLiters = fuelLogs.length > 0 ? fuelLogs[0].liters : 45.0;

  const averagePricePerLiter = fuelLogs.length > 0
    ? fuelLogs.reduce((sum, l) => sum + l.pricePerLiter, 0) / fuelLogs.length
    : 3.21;

  // Add Fuel Log handler
  const handleAddFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelOdometer || fuelLiters <= 0) return;

    setSubmittingFuel(true);
    setIslandMessage('LOGGING REFUEL...');
    try {
      const today = new Date();
      const dateString = `${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
      
      const cost = Number(Number(fuelAmountPaid).toFixed(2));
      const log = await firebaseService.addFuelLog({
        date: dateString,
        odometer: Number(fuelOdometer),
        liters: fuelLiters,
        pricePerLiter: fuelPricePerLiter,
        totalCost: cost,
        fuelGrade,
      });

      setFuelLogs([log, ...fuelLogs]);
      setIslandMessage('⛽ REFUEL REGISTERED');
      setShowFuelForm(false);
    } catch (err) {
      setIslandMessage('REFUEL LOG ERROR');
    } finally {
      setSubmittingFuel(false);
    }
  };

  // Add Maintenance Log handler
  const handleAddMaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintTitle || !maintOdometer) return;

    setSubmittingMaint(true);
    setIslandMessage('LOGGING MAINTENANCE...');
    try {
      const today = new Date();
      const dateString = `${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
      
      const log = await firebaseService.addMaintenanceLog({
        title: maintTitle,
        date: dateString,
        cost: Number(maintCost),
        odometer: Number(maintOdometer),
        notes: maintNotes,
        completed: maintCompleted,
      });

      setMaintenanceLogs([log, ...maintenanceLogs]);
      setIslandMessage('🔧 MAINTENANCE LOGGED');
      setShowMaintForm(false);
      // Reset fields
      setMaintTitle('');
      setMaintNotes('');
    } catch (err) {
      setIslandMessage('MAINT LOG ERROR');
    } finally {
      setSubmittingMaint(false);
    }
  };

  // Toggle Maintenance completed state
  const handleToggleMaint = async (id: string) => {
    try {
      const updated = await firebaseService.toggleMaintenanceLog(id);
      setMaintenanceLogs(maintenanceLogs.map(l => l.id === id ? updated : l));
      setIslandMessage(updated.completed ? 'COMPLETED' : 'PENDING');
    } catch (err) {
      setIslandMessage('TOGGLE ERROR');
    }
  };

  // Odometer OCR Scan Simulation
  const handleOdometerCapture = () => {
    setScanning(true);
    setIslandMessage('SCANNING ODOMETER DISPLAY...');
    
    setTimeout(() => {
      setFuelOdometer(cameraOdometer.toString());
      setMaintOdometer(cameraOdometer.toString());
      setScanning(false);
      setShowCameraSim(false);
      setIslandMessage(`OCR DETECTED: ${cameraOdometer.toLocaleString()} KM`);
    }, 2000);
  };

  // Drag and Drop simulated document upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      simulateDocumentUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateDocumentUpload(e.target.files[0]);
    }
  };

  const simulateDocumentUpload = (file: File) => {
    setUploadingDoc(true);
    setIslandMessage('STORING PDF BINARY...');
    
    setTimeout(async () => {
      try {
        const today = new Date();
        const dateString = `${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
        const expiryYear = today.getFullYear() + 1;
        const expiryString = `${expiryYear}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
        
        const newDoc = await firebaseService.addDocument({
          title: file.name.split('.')[0] || 'مستند مضاف',
          docNumber: 'DOC-MOC-' + Math.floor(10000 + Math.random() * 90000),
          issueDate: dateString,
          expiryDate: expiryString,
          owner: user.displayName,
          category: file.name.toLowerCase().includes('insurance') ? 'insurance' : 'registration',
          notes: 'مستند تم تحميله رقمياً عبر بوابة التخزين الافتراضية بنجاح.',
        });

        setDocuments([newDoc, ...documents]);
        setIslandMessage('🛡️ UPLOAD SECURED');
      } catch (err) {
        setIslandMessage('UPLOAD FAILED');
      } finally {
        setUploadingDoc(false);
      }
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0b0d] overflow-hidden select-none relative" dir="rtl">
      
      {/* Scrollable Container for Active Tab */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-24">
        
        {/* TAB 2: HOME VIEW (DEFAULT) */}
        {activeTab === 2 && (
          <div className="space-y-4.5 animate-fadeIn">
            
            {/* Top Bar Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0b0b0d] border-b border-white/5">
              {/* Menu Button */}
              <button 
                onClick={() => setIslandMessage('SIDEBAR PROTOCOL')}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Centered Logo */}
              <div className="text-center">
                <span className="text-[13px] font-black tracking-widest text-white block font-sans">
                  NEKORIN GARAGE
                </span>
                <span className="text-[7.5px] font-bold text-red-500 tracking-[0.25em] block uppercase -mt-0.5 font-mono">
                  CARE • TRACK • PERFORMANCE
                </span>
              </div>

              {/* Notification Button */}
              <button 
                onClick={() => setIslandMessage('NOTIFICATIONS EMPTY')}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative"
              >
                <svg className="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Red dot */}
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-red-600" />
              </button>
            </div>

            {/* Nissan Altima 2014 Header */}
            <div className="px-4 pt-1 flex justify-between items-end font-sans">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-bold text-neutral-400 tracking-wider">NISSAN</span>
                  <span className="text-base font-black text-red-500 tracking-wider">ALTIMA 2014</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white/70">موقف السيارة | متصل</span>
                </div>
              </div>
              <div className="text-left font-mono">
                <span className="text-[8px] text-white/40 block">آخر تحديث</span>
                <span className="text-[9px] font-bold text-neutral-300">اليوم : 9:30 ص</span>
              </div>
            </div>

            {/* Main Hero Image */}
            <div className="px-4">
              <div className="relative h-44 w-full bg-[#0d0d10] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {/* Backglow behind the Altima */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-72 h-32 bg-red-600/20 rounded-full blur-[45px] pointer-events-none z-0" />
                
                {/* Core Image Display */}
                <img
                  src="/assets/nekorin-altima.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain relative z-20 p-5 scale-[1.35] -translate-y-0.5 transform origin-center transition-all duration-300"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src.includes('/assets/nekorin-altima.png')) {
                      img.src = '/input_file_5.png';
                    } else if (img.src.includes('/input_file_5.png')) {
                      img.src = '/input_file_2.png';
                    } else if (img.src.includes('/input_file_2.png')) {
                      img.src = '/input_file_1.png';
                    } else if (img.src.includes('/input_file_1.png')) {
                      img.src = '/input_file_0.png';
                    } else if (img.src.includes('/input_file_0.png')) {
                      img.src = '/input_file_3.png';
                    } else if (img.src.includes('/input_file_3.png')) {
                      img.src = '/input_file_4.png';
                    }
                  }}
                />
                
                {/* Elegant shadow gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/80 via-[#0b0b0d]/10 to-transparent z-10" />
              </div>
            </div>

            {/* Core Stats 2x2 Bento Grid */}
            <div className="px-4 grid grid-cols-2 gap-3.5">
              
              {/* Fuel Percentage Card */}
              <div className="bg-[#121215]/90 border border-white/5 hover:border-red-500/20 transition-all rounded-2xl p-3.5 shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white/40 block">البنزين</span>
                    <span className="text-2xl font-black text-white tracking-tight font-sans">{fuelPercentage}%</span>
                  </div>
                  {/* Circular progress SVG */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="22"
                        cy="22"
                        r="16"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="3"
                        fill="transparent"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r="16"
                        stroke="#ef4444"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={2 * Math.PI * 16 * (1 - fuelPercentage / 100)}
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                      />
                    </svg>
                    <Fuel className="w-4.5 h-4.5 text-red-500 absolute" />
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2 mt-2 flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>متبقي</span>
                  <span className="text-red-400 font-bold">{remainingRange} كم</span>
                </div>
              </div>

              {/* Odometer Card */}
              <div 
                onClick={() => {
                  setIslandMessage('OPENING ODOMETER ADJUSTER');
                  setShowCameraSim(true);
                }}
                className="bg-[#121215]/90 border border-white/5 hover:border-red-500/20 transition-all rounded-2xl p-3.5 shadow-xl flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-bold text-white/40 font-mono tracking-wider block">عداد المسافة</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-white tracking-tight font-mono">{currentOdometer.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-white/40 mr-auto">كم</span>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2 mt-2 flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>تحديث يدوي</span>
                  <Camera className="w-3.5 h-3.5 text-red-400" />
                </div>
              </div>

              {/* Last Fuel Fill Card */}
              <div className="bg-[#121215]/90 border border-white/5 hover:border-red-500/20 transition-all rounded-2xl p-3.5 shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-white/40 font-mono tracking-wider block">آخر تعبئة</span>
                  <div className="text-base font-black text-neutral-200 mt-1 tracking-tight font-mono">
                    {lastFillDate}
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2 mt-2 flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>السعة اللترية</span>
                  <span className="text-red-400 font-bold">{lastFillLiters.toFixed(1)} لتر</span>
                </div>
              </div>

              {/* Monthly Total Fuel Cost Card */}
              <div className="bg-[#121215]/90 border border-white/5 hover:border-red-500/20 transition-all rounded-2xl p-3.5 shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-white/40 font-mono tracking-wider block">إجمالي هذا الشهر</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white tracking-tight font-mono">
                      {totalFuelCostThisMonth.toFixed(1)}
                    </span>
                    <DirhamSymbol className="h-4 w-auto mr-1" />
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2 mt-2 flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>الكفاءة</span>
                  <span className="text-green-400 font-bold font-mono">{averageEfficiency.toFixed(1)} كم/لتر</span>
                </div>
              </div>

            </div>

            {/* Quick Actions Row (6 columns matching master UI layout) */}
            <div className="px-4 py-1">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2.5 font-mono">الوصول السريع للخدمات</span>
              <div className="grid grid-cols-6 gap-2">
                
                {/* Maintenance button */}
                <button 
                  onClick={() => {
                    setActiveTab(3);
                    setActiveSubTab('maint');
                  }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer relative"
                >
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-red-950/20 hover:border-red-500/30 transition-all relative">
                    <Wrench className="w-5 h-5 text-red-500" />
                    {/* Badge */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[8px] font-bold flex items-center justify-center text-white font-mono">
                      2
                    </span>
                  </div>
                  <span className="text-[9px] text-white/60 font-medium">الصيانة</span>
                </button>

                {/* Fuel log button */}
                <button 
                  onClick={() => {
                    setActiveTab(3);
                    setActiveSubTab('fuel');
                  }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-red-950/20 hover:border-red-500/30 transition-all">
                    <Fuel className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-[9px] text-white/60 font-medium">سجل التعبئة</span>
                </button>

                {/* Camera photo button */}
                <button 
                  onClick={() => setShowCameraSim(true)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-red-950/20 hover:border-red-500/30 transition-all">
                    <Camera className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-[9px] text-white/60 font-medium">تصوير العداد</span>
                </button>

                {/* Documents button */}
                <button 
                  onClick={() => {
                    setIslandMessage('DOCUMENT STORE');
                    setActiveTab(5);
                  }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-red-950/20 hover:border-red-500/30 transition-all">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-[9px] text-white/60 font-medium">المستندات</span>
                </button>

                {/* Reports button */}
                <button 
                  onClick={() => setActiveTab(1)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-red-950/20 hover:border-red-500/30 transition-all">
                    <BarChart3 className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-[9px] text-white/60 font-medium">تقرير الشهر</span>
                </button>

                {/* Insurance button (opens insurance doc in tab 5) */}
                <button 
                  onClick={() => {
                    setActiveTab(5);
                    const ins = documents.find(d => d.category === 'insurance');
                    if (ins) {
                      setShowDocDetails(ins);
                      setIsEditingDoc(false);
                      setEditDocTitle(ins.title);
                      setEditDocNumber(ins.docNumber);
                      setEditDocExpiry(ins.expiryDate);
                      setEditDocOwner(ins.owner);
                      setEditDocNotes(ins.notes || '');
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-red-950/20 hover:border-red-500/30 transition-all">
                    <ShieldCheck className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-[9px] text-white/60 font-medium">التأمين</span>
                </button>

              </div>
            </div>

            {/* Maintenance Reminder Card */}
            <div className="px-4">
              <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 shadow-lg relative overflow-hidden flex items-center justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                
                {/* Right/Middle parts in RTL: Icon and Text */}
                <div className="flex items-center gap-3.5">
                  {/* Red Circle with Wrench */}
                  <div className="w-11 h-11 rounded-full bg-red-600/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-red-500" />
                  </div>
                  
                  <div className="space-y-0.5 text-right">
                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono">
                      تذكير صيانة
                    </div>
                    <h4 className="text-xs font-black text-white font-sans">تغيير زيت المحرك</h4>
                    <span className="block text-red-500 font-bold text-[10px] font-mono">
                      بعد 1,250 كم أو 15 يوم
                    </span>
                  </div>
                </div>

                {/* Left part in RTL: Red outlined Button */}
                <button 
                  onClick={() => {
                    setActiveTab(3);
                    setActiveSubTab('maint');
                  }}
                  className="px-3.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl transition-all font-bold text-[10px] cursor-pointer font-sans"
                >
                  عرض التفاصيل
                </button>
              </div>
            </div>

            {/* UAE Fuel Prices Card */}
            <div className="px-4">
              <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 shadow-lg relative overflow-hidden flex justify-between gap-4">
                
                {/* Employee Nekorin Photo Box (takes left part of card) */}
                <div className="w-24 h-32 rounded-xl overflow-hidden relative border border-white/5 flex-shrink-0">
                  <img
                    src="/assets/nekorin-fuel-attendant .png"
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Right side: Fuel Prices Table */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white tracking-tight flex items-center gap-1">
                      أسعار الوقود لشهر {fuelPrices.month} {fuelPrices.year}
                    </h4>
                    <p className="text-[9px] text-white/40 font-sans">آخر تحديث: {fuelPrices.month}/{fuelPrices.year}</p>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="space-y-1.5 mt-2.5 font-sans">
                    <div className="flex justify-between items-center text-xs pb-1 border-b border-white/5">
                      <span className="text-neutral-400 font-medium">ممتاز (Super 98)</span>
                      <span className="font-mono font-bold text-white flex items-center gap-0.5">
                        {fuelPrices.super98.toFixed(2)} <DirhamSymbol className="h-3" /> / لتر
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-1 border-b border-white/5">
                      <span className="text-neutral-400 font-medium">خصوصي (Special 95)</span>
                      <span className="font-mono font-bold text-red-400 flex items-center gap-0.5">
                        {fuelPrices.special95.toFixed(2)} <DirhamSymbol className="h-3" /> / لتر
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-1 border-b border-white/5">
                      <span className="text-neutral-400 font-medium">إي بلس (E-Plus 91)</span>
                      <span className="font-mono font-bold text-white flex items-center gap-0.5">
                        {fuelPrices.eplus91.toFixed(2)} <DirhamSymbol className="h-3" /> / لتر
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-medium">ديزل (Diesel)</span>
                      <span className="font-mono font-bold text-white flex items-center gap-0.5">
                        {fuelPrices.diesel.toFixed(2)} <DirhamSymbol className="h-3" /> / لتر
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Nekorin Advice Card */}
            <div className="px-4">
              <div className="bg-gradient-to-l from-red-950/20 to-transparent border border-white/5 rounded-2xl p-4 shadow-lg relative overflow-hidden flex justify-between gap-4">
                
                {/* Left side: content */}
                <div className="flex-1 flex flex-col justify-between text-right">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-bold font-mono">
                      <Sparkles className="w-3 h-3 animate-spin-slow" />
                      نصيحة نيكورين الذكية
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-sans mt-2">
                      "افحص ضغط الإطارات شهرياً للحفاظ على أداء أفضل وتوفير استهلاك الوقود. اضبط الضغط على 32 psi لسيارة ألتيما."
                    </p>
                  </div>

                  <button 
                    onClick={() => setIslandMessage('NEKORIN: KEEP TYRES AT 32 PSI')}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors mt-3 text-right"
                  >
                    تنبيهات صيانة أخرى <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Right side: float Nekorin half-body */}
                <div className="w-20 h-28 rounded-xl overflow-hidden relative flex-shrink-0 self-end">
                  <img
                    src="/assets/nekorin-advisor.png"
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain scale-110 object-top"
                  />
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 3: VEHICLE / LOGS VIEW (FUEL & MAINTENANCE) */}
        {activeTab === 3 && (
          <div className="px-4 py-4 space-y-4 animate-fadeIn">
            
            {/* Upper Tab Switcher */}
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-1 grid grid-cols-2 text-center font-sans">
              <button
                onClick={() => setActiveSubTab('fuel')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'fuel' 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                سجل التعبئة (Fuel Logs)
              </button>
              <button
                onClick={() => setActiveSubTab('maint')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'maint' 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                سجل الصيانة (Maintenance)
              </button>
            </div>

            {/* SUB-TAB: FUEL LOG */}
            {activeSubTab === 'fuel' && (
              <div className="space-y-4">
                
                {/* Header Stats */}
                <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-white/40 block font-mono">معدل التكلفة باللتر</span>
                    <span className="text-lg font-black text-white font-mono">
                      {averagePricePerLiter.toFixed(2)} <DirhamSymbol className="h-3" />
                    </span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10" />
                  <div>
                    <span className="text-[10px] text-white/40 block font-mono">مجموع اللترات</span>
                    <span className="text-lg font-black text-white font-mono">
                      {fuelLogs.reduce((sum, l) => sum + l.liters, 0).toFixed(0)} لتر
                    </span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10" />
                  <button
                    onClick={() => {
                      setIslandMessage('OPEN REFUEL ENTRY');
                      setShowFuelForm(true);
                    }}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1 shadow-lg shadow-red-950/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة تعبئة
                  </button>
                </div>

                {/* List of Fuel Entries */}
                <div className="space-y-2.5">
                  {fuelLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="bg-[#121215] border border-white/5 rounded-xl p-3.5 flex justify-between items-center hover:border-red-500/20 transition-all font-sans relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-[3px] h-full bg-red-600" />
                      
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{log.date}</span>
                          <span className="text-[9px] font-mono bg-white/5 border border-white/10 text-white/60 rounded px-1">
                            فئة {log.fuelGrade}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono block">
                          العداد: {log.odometer.toLocaleString()} كم
                        </span>
                      </div>

                      <div className="text-left font-mono flex items-center gap-2.5">
                        <div>
                          <div className="text-sm font-black text-white flex items-center justify-end gap-1">
                            {log.totalCost.toFixed(2)} <DirhamSymbol className="h-3" />
                          </div>
                          <span className="text-[9px] text-neutral-400 block text-left">
                            {log.liters.toFixed(1)} لتر • {log.pricePerLiter} د.إ
                          </span>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('هل أنت متأكد من رغبتك في حذف هذا السجل؟')) {
                              try {
                                await firebaseService.deleteFuelLog(log.id);
                                setFuelLogs(fuelLogs.filter(fl => fl.id !== log.id));
                                setIslandMessage('🗑️ FUEL LOG DELETED');
                              } catch (err) {
                                setIslandMessage('DELETE ERROR');
                              }
                            }
                          }}
                          className="p-1 hover:text-red-500 text-neutral-500 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* SUB-TAB: MAINTENANCE LOG */}
            {activeSubTab === 'maint' && (
              <div className="space-y-4">
                
                {/* Add new button */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-white tracking-wider uppercase font-mono">سجل المهام</h3>
                    <p className="text-[10px] text-white/30 font-mono">{maintenanceLogs.length} مهام مؤرشفة</p>
                  </div>
                  <button
                    onClick={() => {
                      setIslandMessage('OPEN MAINTENANCE ENTRY');
                      setShowMaintForm(true);
                    }}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1 shadow-lg shadow-red-950/20 cursor-pointer font-sans"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة صيانة
                  </button>
                </div>

                {/* List of Maintenance Entries */}
                <div className="space-y-2.5">
                  {maintenanceLogs.map((log) => (
                    <div 
                      key={log.id} 
                      onClick={() => handleToggleMaint(log.id)}
                      className="bg-[#121215] border border-white/5 rounded-xl p-3.5 hover:border-red-500/20 transition-all font-sans cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2.5">
                          {/* Checkbox indicator */}
                          <div className={`mt-0.5 w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                            log.completed 
                              ? 'bg-green-500/15 border-green-500 text-green-400' 
                              : 'border-white/20 text-transparent'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                          
                          <div>
                            <h4 className={`text-xs font-black ${log.completed ? 'text-white/50 line-through' : 'text-neutral-100'}`}>
                              {log.title}
                            </h4>
                            <p className="text-[10px] text-white/40 font-mono mt-0.5">{log.date} • {log.odometer.toLocaleString()} كم</p>
                          </div>
                        </div>

                        <div className="text-left font-mono text-xs font-bold text-red-400 flex items-center gap-2">
                          <div>
                            {log.cost} <DirhamSymbol className="h-2.5" />
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('هل أنت متأكد من رغبتك في حذف هذا السجل؟')) {
                                try {
                                  await firebaseService.deleteMaintenanceLog(log.id);
                                  setMaintenanceLogs(maintenanceLogs.filter(ml => ml.id !== log.id));
                                  setIslandMessage('🗑️ MAINTENANCE DELETED');
                                } catch (err) {
                                  setIslandMessage('DELETE ERROR');
                                }
                              }
                            }}
                            className="p-1 hover:text-red-500 text-neutral-500 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {log.notes && (
                        <p className="text-[10px] text-white/50 bg-white/[0.02] border border-white/5 rounded-lg p-2 mt-2.5 leading-relaxed">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 5: DOCUMENTS VIEW */}
        {activeTab === 5 && (
          <div className="px-4 py-4 space-y-5 animate-fadeIn font-sans text-right">
            <div>
              <h3 className="text-base font-black text-white">المستندات والوثائق الافتراضية</h3>
              <p className="text-[10px] text-white/40 font-mono">إدارة وثائق الملكية والتأمين الشامل لسيارة نيسان ألتيما</p>
            </div>

            {/* UAE Documents Slider/Grid */}
            <div className="space-y-4">
              {documents.map((doc) => {
                // Style differences for registration card vs insurance
                const isReg = doc.category === 'registration';
                const isLic = doc.category === 'license';
                let cardColorClass = "from-red-900/30 to-black";
                let badgeLabel = "تأمين شامل";
                if (isReg) {
                  cardColorClass = "from-neutral-800 to-black";
                  badgeLabel = "ملكية دبي";
                } else if (isLic) {
                  cardColorClass = "from-red-950 to-neutral-900";
                  badgeLabel = "رخصة قيادة";
                }

                return (
                  <div 
                    key={doc.id}
                    onClick={() => {
                      setIslandMessage('OPENING DOCUMENT');
                      setShowDocDetails(doc);
                      setIsEditingDoc(false);
                      setEditDocTitle(doc.title);
                      setEditDocNumber(doc.docNumber);
                      setEditDocExpiry(doc.expiryDate);
                      setEditDocOwner(doc.owner);
                      setEditDocNotes(doc.notes || '');
                    }}
                    className={`bg-gradient-to-br ${cardColorClass} border border-white/10 rounded-2xl p-4 shadow-xl hover:border-red-500/30 transition-all cursor-pointer relative overflow-hidden`}
                  >
                    {/* UAE Emblem/Logo Watermark representation */}
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/[0.02] rounded-full flex items-center justify-center text-white/5 font-black text-6xl pointer-events-none select-none">
                      UAE
                    </div>

                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] font-black uppercase bg-red-600/10 border border-red-500/25 text-red-500 rounded px-1.5 py-0.5">
                          {badgeLabel}
                        </span>
                        <h4 className="text-sm font-black text-white mt-2">{doc.title}</h4>
                      </div>
                      <div className="text-[10px] text-white/30 font-mono">صالح لغاية</div>
                    </div>

                    <div className="flex justify-between items-end mt-6">
                      <div>
                        <span className="text-[9px] text-white/40 block font-mono">رقم المستند</span>
                        <span className="text-xs font-black text-neutral-200 font-mono">{doc.docNumber}</span>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-xs font-black text-red-500">{doc.expiryDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drag and Drop Document Upload simulation */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono block">التخزين الرقمي المؤقت (Firebase Storage)</span>
              
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative overflow-hidden ${
                  dragActive 
                    ? 'border-red-500 bg-red-500/10' 
                    : 'border-white/10 hover:border-white/20 bg-[#121215]'
                }`}
              >
                <input 
                  type="file" 
                  accept="application/pdf,image/*" 
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {uploadingDoc ? (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
                    <span className="text-[10px] font-mono text-red-400">جاري نقل البيانات وتخزين الملف...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5">
                    <Upload className="w-6 h-6 text-white/40 group-hover:text-red-500 transition-colors" />
                    <div>
                      <span className="text-xs font-bold text-neutral-200 block">قم بسحب وإلقاء مستند هنا لتحميله</span>
                      <span className="text-[9px] text-white/30 font-mono mt-1 block">يدعم صيغ PDF و PNG و JPG (الحد الأقصى 5 ميجابايت)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: ACCOUNT VIEW */}
        {activeTab === 4 && (
          <div className="px-4 py-4 space-y-5 animate-fadeIn font-sans text-right">
            <div>
              <h3 className="text-base font-black text-white">الملف الشخصي والحساب</h3>
              <p className="text-[10px] text-white/40 font-mono">بيانات قائد مركبة نيسان ألتيما والجراج المعتمد</p>
            </div>

            {/* User Profile Card */}
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-red-600" />
              
              {showProfileEdit ? (
                <div className="space-y-3.5 pt-2 text-right">
                  <div>
                    <label className="text-[10px] text-white/40 block mb-1 font-sans">الاسم الكامل</label>
                    <input
                      type="text"
                      value={profileDisplayName}
                      onChange={(e) => setProfileDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 block mb-1 font-sans">اسم الجراج المعتمد</label>
                    <input
                      type="text"
                      value={profileGarageName}
                      onChange={(e) => setProfileGarageName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-sans"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={async () => {
                        setSubmittingProfile(true);
                        try {
                          await firebaseService.updateUserProfile(
                            profileDisplayName,
                            profileGarageName
                          );
                          setShowProfileEdit(false);
                          setIslandMessage('👤 PROFILE UPDATED');
                        } catch (err) {
                          setIslandMessage('UPDATE ERROR');
                        } finally {
                          setSubmittingProfile(false);
                        }
                      }}
                      disabled={submittingProfile}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      {submittingProfile ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'حفظ'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setProfileDisplayName(user.displayName);
                        setProfileGarageName(user.garageName);
                        setShowProfileEdit(false);
                      }}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/10">
                    <User className="w-8 h-8" />
                  </div>

                  <h4 className="text-base font-black text-white">{user.displayName}</h4>
                  <span className="text-[10px] text-white/40 font-mono block mt-0.5">{user.email}</span>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/70 font-mono mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {user.garageName}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.03]">
                    <button
                      onClick={() => {
                        setProfileDisplayName(user.displayName);
                        setProfileGarageName(user.garageName);
                        setShowProfileEdit(true);
                      }}
                      className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      تعديل بيانات الحساب والجراج
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* UAE Traffic File Summary */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">ملف المرور الموحد (دبي)</span>

              <div className="bg-[#121215] border border-white/5 rounded-xl p-3.5 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5 text-xs">
                  <span className="text-neutral-400">رقم الملف المروري</span>
                  <span className="font-mono font-black text-white">TRF-7489102-DXB</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5 text-xs">
                  <span className="text-neutral-400">جهة الإصدار</span>
                  <span className="font-bold text-white">هيئة الطرق والمواصلات - دبي</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5 text-xs">
                  <span className="text-neutral-400">تاريخ انتهاء الرخصة</span>
                  <span className="font-mono font-bold text-red-500">2029/10/12</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">النقاط السوداء الحالية</span>
                  <span className="font-mono font-bold text-green-400">0 نقاط (سجل نظيف)</span>
                </div>
              </div>
            </div>

            {/* Active Logs & Database Stats */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">إحصائيات الاستخدام والجراج</span>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#121215] border border-white/5 rounded-xl p-3 text-right">
                  <span className="text-[9px] text-white/40 block">مستندات مخزنة</span>
                  <span className="text-base font-black text-white font-mono mt-1 block">
                    {documents.length} وثائق
                  </span>
                </div>
                <div className="bg-[#121215] border border-white/5 rounded-xl p-3 text-right">
                  <span className="text-[9px] text-white/40 block">سجلات الصيانة</span>
                  <span className="text-base font-black text-white font-mono mt-1 block">
                    {maintenanceLogs.length} سجلات
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 1: REPORTS VIEW (CUSTOM SVG GRAPHICAL VIEW) */}
        {activeTab === 1 && (
          <div className="px-4 py-4 space-y-5 animate-fadeIn font-sans text-right">
            <div>
              <h3 className="text-base font-black text-white">التقارير التحليلية للوقود</h3>
              <p className="text-[10px] text-white/40 font-mono">تحليل إحصائي لمصروفات البنزين لسيارة نيسان ألتيما ٢٠١٤</p>
            </div>

            {/* Total Spending Stat Display */}
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-white/40 block">مجموع إنفاق الوقود</span>
                <span className="text-xl font-black text-white font-mono mt-0.5 block">
                  {totalFuelCostThisMonth.toFixed(1)} <DirhamSymbol className="h-4" />
                </span>
              </div>
              <div className="border-r border-white/10 pr-4">
                <span className="text-[10px] text-white/40 block">المعدل الشهري</span>
                <span className="text-xl font-black text-red-500 font-mono mt-0.5 block">
                  612.5 <DirhamSymbol className="h-4" />
                </span>
              </div>
            </div>

            {/* Spending Chart Card (Beautiful Custom SVG Bar Chart) */}
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 shadow-lg space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs font-black text-neutral-200">الإنفاق الشهري (د.إ)</span>
                <span className="text-[9px] font-mono text-white/30">٢٠٢٤</span>
              </div>

              {/* Responsive SVG Bar Graph */}
              <div className="h-44 w-full flex items-end justify-between pt-4 px-2 font-mono">
                {/* Jan */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="text-[8px] text-white/40">320</div>
                  <div className="w-6 bg-white/5 hover:bg-white/10 rounded-t h-16 transition-all duration-300 relative group">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">320د.إ</div>
                  </div>
                  <span className="text-[9px] text-neutral-400 mt-1">يناير</span>
                </div>

                {/* Mar */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="text-[8px] text-white/40">450</div>
                  <div className="w-6 bg-white/5 hover:bg-white/10 rounded-t h-24 transition-all duration-300 relative group">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">450د.إ</div>
                  </div>
                  <span className="text-[9px] text-neutral-400 mt-1">مارس</span>
                </div>

                {/* May */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="text-[8px] text-white/40">520</div>
                  <div className="w-6 bg-white/5 hover:bg-white/10 rounded-t h-28 transition-all duration-300 relative group">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">520د.إ</div>
                  </div>
                  <span className="text-[9px] text-neutral-400 mt-1">مايو</span>
                </div>

                {/* July (Our Active Mock Month) */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="text-[8px] text-red-400 font-bold">{totalFuelCostThisMonth.toFixed(0)}</div>
                  {/* Glowing Red Active Bar */}
                  <div className="w-6 bg-gradient-to-t from-red-700 to-red-500 rounded-t shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 relative group h-36">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">{totalFuelCostThisMonth.toFixed(1)}د.إ</div>
                  </div>
                  <span className="text-[9px] text-red-400 font-bold mt-1">يوليو</span>
                </div>
              </div>
            </div>

            {/* Fuel Efficiency Trend (SVG Custom Sparkline Chart) */}
            <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 shadow-lg space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs font-black text-neutral-200">معدل استهلاك الوقود (كم/لتر)</span>
                <span className="text-[9px] font-mono text-green-400 font-bold">
                  {averageEfficiency > 11.8 ? 'ممتاز' : averageEfficiency < 10 ? 'منخفض' : 'مستقر'}: {averageEfficiency.toFixed(1)} كم/لتر
                </span>
              </div>

              {/* SVG Line Sparkline Graphic */}
              <div className="h-28 w-full relative pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  
                  {/* Filled Area */}
                  <path
                    d="M 10,65 L 80,45 L 150,55 L 220,30 L 290,25 L 290,80 L 10,80 Z"
                    fill="url(#chartGradient)"
                  />
                  
                  {/* Glowing Stroke Line */}
                  <path
                    d="M 10,65 L 80,45 L 150,55 L 220,30 L 290,25"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="drop-shadow-[0_2px_4px_rgba(239,68,68,0.5)]"
                  />
                  
                  {/* Data Points */}
                  <circle cx="10" cy="65" r="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="80" cy="45" r="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="150" cy="55" r="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="220" cy="30" r="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="290" cy="25" r="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                </svg>
              </div>

              <div className="flex justify-between text-[9px] font-mono text-white/30 px-1">
                <span>تعبئة ١</span>
                <span>تعبئة ٢</span>
                <span>تعبئة ٣</span>
                <span>تعبئة ٤</span>
                <span>تعبئة ٥</span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 0: SETTINGS / SYSTEM VIEW */}
        {activeTab === 0 && (
          <div className="px-4 py-4 space-y-5 animate-fadeIn font-sans text-right">
            <div>
              <h3 className="text-base font-black text-white">إعدادات النظام والمنصة</h3>
              <p className="text-[10px] text-white/40 font-mono">تكوين جراج نيكورين والاتصال السحابي</p>
            </div>

            {/* App General Configuration */}
            <div className="bg-[#121215] border border-white/5 rounded-xl p-3.5 space-y-4">
              
              {/* Language (Arabic default) */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs text-neutral-300">لغة التطبيق الافتراضية</span>
                <span className="text-xs font-bold text-red-500 font-sans">العربية (RTL)</span>
              </div>

              {/* Database Synchronization (Simulated Firestore) */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div>
                  <span className="text-xs text-neutral-300 block">تزامن السحابة (Firestore)</span>
                  <span className="text-[9px] text-white/30">حفظ تلقائي لكافة البيانات والعمليات على خوادم سحابية آمنة</span>
                </div>
                <button
                  onClick={() => {
                    const next = !syncDatabase;
                    setSyncDatabase(next);
                    saveSettings({ syncDatabase: next });
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${syncDatabase ? 'bg-green-500 flex justify-end' : 'bg-white/10 flex justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                </button>
              </div>

              {/* Storage Synchronization (Simulated Firebase Storage) */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div>
                  <span className="text-xs text-neutral-300 block">تخزين المستندات (Storage)</span>
                  <span className="text-[9px] text-white/30">تخزين ورفع ملفات التأمين والملكية بشكل رقمي مشفر</span>
                </div>
                <button
                  onClick={() => {
                    const next = !syncStorage;
                    setSyncStorage(next);
                    saveSettings({ syncStorage: next });
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${syncStorage ? 'bg-green-500 flex justify-end' : 'bg-white/10 flex justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                </button>
              </div>

              {/* Use Miles instead of Kilometers */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div>
                  <span className="text-xs text-neutral-300 block">وحدة قياس المسافة (أميال)</span>
                  <span className="text-[9px] text-white/30">تحويل نظام القياس وعرض المسافات بالأميال بدلاً من الكيلومترات</span>
                </div>
                <button
                  onClick={() => {
                    const next = !useMiles;
                    setUseMiles(next);
                    saveSettings({ useMiles: next });
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${useMiles ? 'bg-red-500 flex justify-end' : 'bg-white/10 flex justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                </button>
              </div>

              {/* App Version Info */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-300">إصدار النظام الحالي</span>
                <span className="text-xs font-bold text-neutral-400 font-mono">v1.1.2 (PRODUCTION-READY)</span>
              </div>

            </div>

            {/* Fuel Prices Configuration Section */}
            <div className="bg-[#121215] border border-white/5 rounded-xl p-3.5 space-y-4">
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1">
                  إعداد أسعار الوقود اليدوية
                </h4>
                <p className="text-[9px] text-white/40">أدخل أسعار الوقود لشهر معين ليتم تحديثها بالكامل في التطبيق</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/40 block">ممتاز (Super 98)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editSuper98}
                    onChange={(e) => setEditSuper98(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/40 block">خصوصي (Special 95)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editSpecial95}
                    onChange={(e) => setEditSpecial95(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/40 block">إي بلس (E-Plus 91)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editEPlus91}
                    onChange={(e) => setEditEPlus91(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/40 block">ديزل (Diesel)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editDiesel}
                    onChange={(e) => setEditDiesel(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/40 block">الشهر (مثل: يوليو)</label>
                  <input
                    type="text"
                    value={editMonth}
                    onChange={(e) => setEditMonth(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/40 block">السنة (مثل: 2026)</label>
                  <input
                    type="text"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={savingPrices}
                onClick={async () => {
                  setSavingPrices(true);
                  setIslandMessage('SAVING PRICES...');
                  try {
                    const newPrices = {
                      super98: Number(editSuper98),
                      special95: Number(editSpecial95),
                      eplus91: Number(editEPlus91),
                      diesel: Number(editDiesel),
                      month: editMonth,
                      year: editYear
                    };
                    await firebaseService.saveFuelPrices(newPrices);
                    setFuelPrices({
                      ...newPrices,
                      updatedAt: Date.now()
                    });
                    setIslandMessage('PRICES UPDATED ⛽');
                  } catch (err) {
                    setIslandMessage('UPDATE ERROR');
                  } finally {
                    setSavingPrices(false);
                  }
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all border border-red-500/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingPrices ? 'جاري الحفظ...' : 'حفظ أسعار الوقود الرسمية'}
              </button>
            </div>

            {/* Actions Block */}
            <div className="space-y-2">
              <button
                onClick={onSignOut}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-red-400 border border-white/10 hover:border-white/25 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                تسجيل الخروج من الجراج
              </button>
            </div>

          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION TAB BAR (Exactly matching Image 4 RTL Layout & Icons!) */}
      <div className="absolute bottom-0 left-0 w-full h-18 bg-[#121215]/95 border-t border-white/5 flex items-center justify-between px-3 z-40 select-none backdrop-blur-lg">
        
        {/* Far Right (index 4 / Tab 0 in our settings mapping): Gear Settings */}
        <button 
          onClick={() => {
            setIslandMessage('SETTINGS CHANNEL');
            setActiveTab(0);
          }}
          className={`flex flex-col items-center gap-1 flex-1 cursor-pointer transition-all ${activeTab === 0 ? 'text-red-500 scale-105' : 'text-neutral-400 hover:text-white'}`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[8px] font-black">الإعدادات</span>
        </button>

        {/* Second Right: Car logs/maintenance */}
        <button 
          onClick={() => {
            setIslandMessage('CAR LOG CHANNELS');
            setActiveTab(3);
          }}
          className={`flex flex-col items-center gap-1 flex-1 cursor-pointer transition-all ${activeTab === 3 ? 'text-red-500 scale-105' : 'text-neutral-400 hover:text-white'}`}
        >
          <Fuel className="w-5 h-5" />
          <span className="text-[8px] font-black">السيارة</span>
        </button>

        {/* Center: Home Tab (Highlighted Center Button inside red circular border!) */}
        <div className="flex-1 flex justify-center -mt-5 relative">
          <button 
            onClick={() => {
              setIslandMessage('HOME TELEMETRY');
              setActiveTab(2);
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg relative ${
              activeTab === 2 
                ? 'bg-red-600 text-white border-4 border-[#0b0b0d] shadow-red-950/50 scale-110 z-50' 
                : 'bg-neutral-800 text-neutral-400 hover:text-white border-2 border-white/5 hover:border-white/10'
            }`}
          >
            <Home className="w-6 h-6" />
          </button>
        </div>

        {/* Third Left: Reports */}
        <button 
          onClick={() => {
            setIslandMessage('ANALYTICS ENGINE');
            setActiveTab(1);
          }}
          className={`flex flex-col items-center gap-1 flex-1 cursor-pointer transition-all ${activeTab === 1 ? 'text-red-500 scale-105' : 'text-neutral-400 hover:text-white'}`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[8px] font-black">التقارير</span>
        </button>

        {/* Second Left: Account */}
        <button 
          onClick={() => {
            setIslandMessage('ACCOUNT PORTAL');
            setActiveTab(4);
          }}
          className={`flex flex-col items-center gap-1 flex-1 cursor-pointer transition-all ${activeTab === 4 ? 'text-red-500 scale-105' : 'text-neutral-400 hover:text-white'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[8px] font-black">الحساب</span>
        </button>

        {/* Far Left: Documents */}
        <button 
          onClick={() => {
            setIslandMessage('DOCUMENT STORE');
            setActiveTab(5);
          }}
          className={`flex flex-col items-center gap-1 flex-1 cursor-pointer transition-all ${activeTab === 5 ? 'text-red-500 scale-105' : 'text-neutral-400 hover:text-white'}`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[8px] font-black">المستندات</span>
        </button>

      </div>

      {/* --- FLOATING SHEETS / DIALOGS (Animated via AnimatePresence) --- */}
      
      {/* 1. ADD FUEL ENTRY FORM SHEET */}
      <AnimatePresence>
        {showFuelForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#121215] border-t border-white/10 rounded-t-[24px] max-h-[85%] overflow-y-auto p-5 space-y-4 text-right"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">إضافة تعبئة وقود جديدة</h3>
                  <span className="text-[9px] text-white/40 font-mono block">سجل وتتبع كفاءة استهلاك البنزين</span>
                </div>
                <button
                  onClick={() => setShowFuelForm(false)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 font-mono text-xs hover:text-white transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>

              <form onSubmit={handleAddFuel} className="space-y-4">
                
                {/* Odometer Field */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">قراءة عداد المسافة الحالية</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowFuelForm(false);
                        setShowCameraSim(true);
                      }}
                      className="text-[10px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer font-sans"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      التقاط عبر الكاميرا
                    </button>
                  </div>
                  <input
                    type="number"
                    required
                    value={fuelOdometer}
                    onChange={(e) => setFuelOdometer(e.target.value)}
                    placeholder="مثال: 126560"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-white/20 outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>

                {/* Fuel Grade Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">فئة الوقود (UAE Standard)</label>
                  <div className="grid grid-cols-4 gap-2 font-mono">
                    {(['91', '95', '98', 'Diesel'] as const).map((grade) => (
                      <button
                        type="button"
                        key={grade}
                        onClick={() => setFuelGrade(grade)}
                        className={`py-2 rounded-xl border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          fuelGrade === grade
                            ? 'bg-red-600 text-white border-red-500'
                            : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {grade === 'Diesel' ? 'ديزل' : grade}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Paid Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">إجمالي المبلغ المدفوع (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fuelAmountPaid}
                    onChange={(e) => setFuelAmountPaid(e.target.value)}
                    placeholder="مثال: 150"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-white/20 outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>

                {/* Calculated Liters Display */}
                <div className="space-y-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 text-right">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>كمية الوقود المحسوبة تلقائياً</span>
                    <span className="text-red-400 font-bold font-mono">{fuelLiters} لتر</span>
                  </div>
                  <p className="text-[9px] text-white/30">المبلغ المدفوع ÷ سعر لتر الفئة المحددة</p>
                </div>

                {/* Calculated Bill */}
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-white/40 block">سعر لتر الفئة المحددة</span>
                    <span className="text-xs font-black text-neutral-300 font-mono mt-0.5 block">{fuelPricePerLiter.toFixed(2)} د.إ / لتر</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-[10px] text-white/40 block">إجمالي التكلفة</span>
                    <span className="text-base font-black text-white mt-0.5 block">
                      {Number(fuelAmountPaid || 0).toFixed(2)} <DirhamSymbol className="h-3" />
                    </span>
                  </div>
                </div>

                {/* Commit Button */}
                <button
                  type="submit"
                  disabled={submittingFuel}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-red-500/30 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 cursor-pointer"
                >
                  {submittingFuel ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'حفظ التعبئة في قاعدة البيانات'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ADD MAINTENANCE LOG FORM SHEET */}
      <AnimatePresence>
        {showMaintForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#121215] border-t border-white/10 rounded-t-[24px] max-h-[85%] overflow-y-auto p-5 space-y-4 text-right"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">إضافة سجل صيانة جديد</h3>
                  <span className="text-[9px] text-white/40 font-mono block">تأريخ أعمال الصيانة والإصلاحات للسيارة</span>
                </div>
                <button
                  onClick={() => setShowMaintForm(false)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 font-mono text-xs hover:text-white transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>

              <form onSubmit={handleAddMaint} className="space-y-4">
                
                {/* Service Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 block">عنوان الصيانة / الخدمة</label>
                  <input
                    type="text"
                    required
                    value={maintTitle}
                    onChange={(e) => setMaintTitle(e.target.value)}
                    placeholder="مثال: تغيير الفرامل الخلفية"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-white/20 outline-none text-right"
                  />
                </div>

                {/* Grid inputs for Odometer and Cost */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 block">عداد المسافة عند الصيانة</label>
                    <input
                      type="number"
                      required
                      value={maintOdometer}
                      onChange={(e) => setMaintOdometer(e.target.value)}
                      placeholder="126560"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white outline-none font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 block">التكلفة الإجمالية (د.إ)</label>
                    <input
                      type="number"
                      required
                      value={maintCost}
                      onChange={(e) => setMaintCost(e.target.value)}
                      placeholder="350"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white outline-none font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 block">ملاحظات الصيانة والقطع المستبدلة</label>
                  <textarea
                    rows={3}
                    value={maintNotes}
                    onChange={(e) => setMaintNotes(e.target.value)}
                    placeholder="مثال: تم تبديل الفحمات بقطع أوريجينال يابانية نيسان."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-white/20 outline-none text-right resize-none"
                  />
                </div>

                {/* Status completed checkbox */}
                <div className="flex items-center gap-2.5 py-1">
                  <button
                    type="button"
                    onClick={() => setMaintCompleted(!maintCompleted)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      maintCompleted 
                        ? 'bg-red-600 border-red-500 text-white' 
                        : 'border-white/10 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-neutral-300">تم إنجاز المهمة ودفع المستحقات بالكامل</span>
                </div>

                {/* Commit Button */}
                <button
                  type="submit"
                  disabled={submittingMaint}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-red-500/30 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 cursor-pointer"
                >
                  {submittingMaint ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'إرسال التقرير للأرشيف'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. DOCUMENT DETAIL VIEW DIALOG */}
      <AnimatePresence>
        {showDocDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-right"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full bg-[#121215] border border-white/10 rounded-2xl p-5 space-y-4"
            >
              <div className="flex justify-between items-start pb-2.5 border-b border-white/5">
                <div>
                  <span className="text-[9px] font-black uppercase text-red-500">تفاصيل المستند الرقمي</span>
                  <h3 className="text-sm font-black text-white mt-1">{showDocDetails.title}</h3>
                </div>
                <button
                  onClick={() => setShowDocDetails(null)}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>

              {isEditingDoc ? (
                <div className="space-y-3 text-right">
                  <div>
                    <label className="text-[10px] text-white/40 block mb-1">اسم المستند</label>
                    <input
                      type="text"
                      value={editDocTitle}
                      onChange={(e) => setEditDocTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 block mb-1">رقم الوثيقة</label>
                    <input
                      type="text"
                      value={editDocNumber}
                      onChange={(e) => setEditDocNumber(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-white/40 block mb-1">تاريخ الانتهاء</label>
                      <input
                        type="text"
                        value={editDocExpiry}
                        onChange={(e) => setEditDocExpiry(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                        placeholder="YYYY/MM/DD"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 block mb-1">اسم المالك</label>
                      <input
                        type="text"
                        value={editDocOwner}
                        onChange={(e) => setEditDocOwner(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-sans"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 block mb-1">ملاحظات</label>
                    <textarea
                      value={editDocNotes}
                      onChange={(e) => setEditDocNotes(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 h-16 resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={async () => {
                        try {
                          const updated = await firebaseService.updateDocument(showDocDetails.id, {
                            title: editDocTitle,
                            docNumber: editDocNumber,
                            expiryDate: editDocExpiry,
                            owner: editDocOwner,
                            notes: editDocNotes,
                          });
                          setDocuments(documents.map(d => d.id === showDocDetails.id ? updated : d));
                          setShowDocDetails(updated);
                          setIsEditingDoc(false);
                          setIslandMessage('🛡️ DOCUMENT UPDATED');
                        } catch (err) {
                          setIslandMessage('UPDATE ERROR');
                        }
                      }}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      حفظ التعديلات
                    </button>
                    <button
                      onClick={() => setIsEditingDoc(false)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Virtual Metadata Matrix */}
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/40">رقم الوثيقة</span>
                      <span className="font-mono font-bold text-white">{showDocDetails.docNumber}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/40">تاريخ الإصدار</span>
                      <span className="font-mono text-neutral-300">{showDocDetails.issueDate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/40">تاريخ الانتهاء</span>
                      <span className="font-mono text-red-500 font-bold">{showDocDetails.expiryDate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/40">اسم المالك</span>
                      <span className="text-neutral-200">{showDocDetails.owner}</span>
                    </div>
                    {showDocDetails.notes && (
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-[11px] text-white/50 leading-relaxed">
                        {showDocDetails.notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setIslandMessage('OPENING LIVE PDF PREVIEW');
                        setShowDocDetails(null);
                      }}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-[11px] rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      تحميل المستند الأصلي
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingDoc(true)}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        تعديل البيانات
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('هل أنت متأكد من رغبتك في حذف هذا المستند؟')) {
                            try {
                              await firebaseService.deleteDocument(showDocDetails.id);
                              setDocuments(documents.filter(d => d.id !== showDocDetails.id));
                              setShowDocDetails(null);
                              setIslandMessage('🗑️ DOCUMENT DELETED');
                            } catch (err) {
                              setIslandMessage('DELETE ERROR');
                            }
                          }
                        }}
                        className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/10 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        حذف المستند
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. INTERACTIVE ODOMETER CAMERA SCANNER / OCR SIMULATOR */}
      <AnimatePresence>
        {showCameraSim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black z-50 flex flex-col justify-between font-sans"
          >
            {/* Viewfinder Header */}
            <div className="p-4 flex justify-between items-center bg-black/60 z-10">
              <span className="text-xs font-mono font-bold text-red-500 animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-600 rounded-full" />
                NISSAN_CAMERA_OCR_V1.1
              </span>
              <button
                onClick={() => {
                  setIslandMessage('CAMERA DISENGAGED');
                  setShowCameraSim(false);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white cursor-pointer"
              >
                إلغاء
              </button>
            </div>

            {/* Simulated Live Viewfinder Frame */}
            <div className="flex-1 flex flex-col items-center justify-center relative px-6 text-center">
              {/* Backing Dashboard reference simulation overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#1a0505_10%,transparent_100%)] opacity-30" />
              
              {/* Retro Odometer Display Box */}
              <div className="w-64 p-5 bg-[#0f1115] border border-red-500/30 rounded-2xl relative shadow-2xl flex flex-col items-center justify-center animate-pulse">
                {/* Core digital display screen */}
                <div className="bg-[#1b2319] border border-white/5 rounded-xl px-5 py-3 font-mono text-center tracking-[0.2em] relative overflow-hidden w-full">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1b2319] via-transparent to-[#1b2319]/25 pointer-events-none" />
                  <span className="text-3xl font-bold text-[#4bf33b] drop-shadow-[0_0_8px_rgba(75,243,59,0.6)]">
                    {cameraOdometer.toString().padStart(6, '0')}
                  </span>
                  <span className="text-[8px] text-[#4bf33b]/40 block tracking-normal mt-1">TOTAL ODOMETER KM</span>
                </div>
                
                {/* Calibration Guide Lines */}
                <div className="absolute -inset-2 border-2 border-dashed border-red-500/40 rounded-[22px] pointer-events-none" />
              </div>

              <div className="mt-8 space-y-2 max-w-xs relative z-10">
                <span className="text-xs font-bold text-neutral-200 block">قم بتحريك شريط التعديل لتغيير قيمة الكيلومترات للعداد</span>
                <p className="text-[10px] text-white/40">قم بمحاكاة تصوير عداد السرعة في السيارة حركياً لتحديث قراءة العداد تلقائياً.</p>
              </div>

              {/* Slider Controller */}
              <div className="w-full max-w-xs mt-4 relative z-10 px-4">
                <input
                  type="range"
                  min="120000"
                  max="140000"
                  step="50"
                  value={cameraOdometer}
                  onChange={(e) => setCameraOdometer(Number(e.target.value))}
                  className="w-full accent-red-600"
                />
                <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1">
                  <span>120,000 كم</span>
                  <span>140,000 كم</span>
                </div>
              </div>
            </div>

            {/* Viewfinder Bottom Controls */}
            <div className="p-6 bg-black/60 flex flex-col items-center justify-center gap-3 z-10">
              <button
                onClick={handleOdometerCapture}
                disabled={scanning}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 border-4 border-white/20 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xl shadow-red-950/40"
              >
                {scanning ? (
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" strokeWidth={2.5} />
                )}
              </button>
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                {scanning ? 'OCR ANALYSIS IN PROGRESS...' : 'CAPTURE SCREENSHOT FOR AUTO-OCR'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
