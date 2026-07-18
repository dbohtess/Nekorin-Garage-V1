import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Calendar, DollarSign, Zap, Gauge, Wrench, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Vehicle, ModLog } from '../types';

interface CarDetailProps {
  vehicle: Vehicle;
  logs: ModLog[];
  onBack: () => void;
  onAddLog: (data: Omit<ModLog, 'id' | 'vehicleId' | 'createdAt'>) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: Vehicle['status']) => Promise<void>;
  onDeleteVehicle: (id: string) => Promise<void>;
  setIslandMessage: (msg: string) => void;
}

export default function CarDetail({
  vehicle,
  logs,
  onBack,
  onAddLog,
  onDeleteLog,
  onUpdateStatus,
  onDeleteVehicle,
  setIslandMessage,
}: CarDetailProps) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Engine Rev simulation state
  const [rpm, setRpm] = useState(1000);
  const [isReving, setIsReving] = useState(false);

  // Form states for log addition
  const [logTitle, setLogTitle] = useState('');
  const [category, setCategory] = useState<ModLog['category']>('Engine');
  const [cost, setCost] = useState(150);
  const [hpGain, setHpGain] = useState(10);
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Combined metrics
  const totalModInvestment = logs.reduce((sum, l) => sum + l.cost, 0);
  const totalModHp = logs.reduce((sum, l) => sum + l.hpGain, 0);
  const finalHp = vehicle.powerHp + totalModHp;

  // Sound and Rev Sim
  const triggerRev = () => {
    if (isReving) return;
    setIsReving(true);
    setIslandMessage('REV ENGINE: ACTIVE');
    
    // Animate RPM climb and bounce
    let currentRpm = 1000;
    const peak = 7800 + Math.floor(Math.random() * 500);
    
    // Climb
    const climbInterval = setInterval(() => {
      currentRpm += 450;
      if (currentRpm >= peak) {
        clearInterval(climbInterval);
        
        // Bounce a bit at peak
        let bounces = 0;
        const bounceInterval = setInterval(() => {
          setRpm(peak - (bounces % 2 === 0 ? 300 : 0));
          bounces++;
          if (bounces > 4) {
            clearInterval(bounceInterval);
            // Drop back to idle
            const fallInterval = setInterval(() => {
              currentRpm -= 550;
              if (currentRpm <= 1000) {
                setRpm(1000);
                setIsReving(false);
                clearInterval(fallInterval);
              } else {
                setRpm(currentRpm);
              }
            }, 25);
          }
        }, 60);
      } else {
        setRpm(currentRpm);
      }
    }, 15);
  };

  const handleStatusChange = async (s: Vehicle['status']) => {
    setIslandMessage(`UPDATING STATUS: ${s.toUpperCase()}`);
    await onUpdateStatus(vehicle.id, s);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle) return;

    setFormLoading(true);
    setIslandMessage('COMMITTING LOG...');
    try {
      await onAddLog({
        title: logTitle,
        category,
        cost: Number(cost),
        hpGain: Number(hpGain),
        notes,
        date: logDate,
      });

      setIslandMessage('LOG RECORDED');
      setLogTitle('');
      setNotes('');
      setCost(150);
      setHpGain(10);
      setShowLogForm(false);
    } catch (err) {
      setIslandMessage('LOG ERROR');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVehicleConfirm = async () => {
    setIslandMessage('SCRAPPING VEHICLE...');
    try {
      await onDeleteVehicle(vehicle.id);
      setIslandMessage('RECORD DELETED');
      onBack();
    } catch (err) {
      setIslandMessage('DELETE ERROR');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d0d0f] overflow-y-auto scrollbar-none pb-12 select-none relative">
      {/* Header with Background image */}
      <div className="h-56 relative w-full flex-shrink-0">
        <img
          src={vehicle.imageUrl}
          alt={`${vehicle.make} ${vehicle.model}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/40 to-black/60" />

        {/* Buttons on header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setShowDeleteConfirm(true);
              setIslandMessage('WARNING INITIATED');
            }}
            className="p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 backdrop-blur-md border border-red-500/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Core Spec Title */}
        <div className="absolute bottom-4 left-5 right-5 text-left">
          <span className="text-[10px] font-bold text-blue-400 font-mono tracking-widest uppercase">
            {vehicle.make}
          </span>
          <h2 className="text-xl font-black text-white leading-tight">
            {vehicle.model}
          </h2>
          <div className="flex gap-2.5 mt-1 text-[10px] text-white/40 font-mono">
            <span>{vehicle.year}</span>
            <span>•</span>
            <span className="text-white/60">{vehicle.color}</span>
            <span>•</span>
            <span className="text-blue-400 font-bold">{vehicle.engine}</span>
          </div>
        </div>
      </div>

      {/* Rev Counter / Gauge Simulator */}
      <div className="px-5 mt-4">
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-md text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[9px] font-bold text-white/40 font-mono tracking-widest uppercase">
                COCKPIT INSTRUMENT LOGS
              </span>
              <h4 className="text-xs font-black text-white mt-0.5 font-sans">ECU TELEMETRY ENGINE</h4>
            </div>

            <button
              onClick={triggerRev}
              disabled={isReving}
              className={`px-3 py-1 rounded-lg border text-[9px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                isReving
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 animate-pulse'
                  : 'bg-white/5 border-white/10 text-neutral-300 hover:text-white'
              }`}
            >
              {isReving ? 'REVING...' : 'REV ENGINE'}
            </button>
          </div>

          {/* Interactive RPM Bar Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-white/40">ENGINE LOAD (RPM)</span>
              <span className={`${rpm > 7000 ? 'text-blue-400 font-black animate-pulse' : 'text-neutral-300'}`}>
                {rpm.toLocaleString()} / 8,000
              </span>
            </div>

            {/* Custom high-performance gauge bar */}
            <div className="h-6 bg-black/45 rounded-lg p-1 flex border border-white/5 overflow-hidden relative">
              {/* LED Ticks */}
              {Array.from({ length: 30 }).map((_, i) => {
                const step = (8000 / 30) * i;
                const active = rpm >= step;
                let colorClass = 'bg-neutral-900';
                if (active) {
                  if (step < 4500) colorClass = 'bg-teal-500';
                  else if (step < 6500) colorClass = 'bg-blue-500';
                  else colorClass = 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]';
                }
                return (
                  <div
                    key={i}
                    className={`flex-1 h-full mx-[1px] rounded-[1px] transition-all duration-75 ${colorClass}`}
                  />
                );
              })}
              {rpm > 7000 && (
                <div className="absolute inset-0 bg-blue-500/10 border border-blue-500 animate-pulse flex items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-black text-blue-400 tracking-widest uppercase font-mono">REDLINE EXCEEDED</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dyno stats grid */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3.5">
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-mono tracking-widest">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            MAX HORSEPOWER
          </div>
          <div className="mt-2 text-left">
            <div className="text-2xl font-black text-white">
              {finalHp} <span className="text-blue-400 text-xs font-mono">BHP</span>
            </div>
            <div className="text-[9px] text-white/40 font-mono mt-0.5">
              +{totalModHp} BHP from {logs.length} tuning logs
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-mono tracking-widest">
            <Wrench className="w-3.5 h-3.5 text-indigo-400" />
            MOD INVESTMENT
          </div>
          <div className="mt-2 text-left">
            <div className="text-2xl font-black text-white">
              ${totalModInvestment.toLocaleString()}
            </div>
            <div className="text-[9px] text-white/40 font-mono mt-0.5">
              Avg ${logs.length ? Math.round(totalModInvestment / logs.length) : 0} per modification
            </div>
          </div>
        </div>
      </div>

      {/* Status selector directly from specs */}
      <div className="px-5 mt-4">
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-center justify-between text-left">
          <div>
            <span className="text-[9px] font-mono font-bold text-white/40 uppercase">Operational State</span>
            <div className="text-xs font-black text-white/80 uppercase mt-0.5">
              Active Focus Area
            </div>
          </div>

          <div className="flex gap-1">
            {(['active', 'modding', 'maintenance', 'tuning'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-2 py-1 rounded-lg border text-[9px] font-bold font-mono uppercase transition-all cursor-pointer ${
                  vehicle.status === s
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/40'
                    : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modification & tuning Logs Header */}
      <div className="px-5 mt-6.5 flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest font-mono">
            MODIFICATION RECORDBOOST
          </h4>
          <span className="text-[10px] text-white/30 font-mono">
            {logs.length} Verified Upgrades
          </span>
        </div>

        <button
          onClick={() => {
            setShowLogForm(true);
            setIslandMessage('NEW UPGRADE LOG');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-400 font-bold text-xs border border-white/10 transition-colors active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Upgrade
        </button>
      </div>

      {/* Logs timeline / cards */}
      <div className="px-5 mt-3 space-y-2.5">
        {logs.length === 0 ? (
          <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center text-white/40 text-xs font-mono bg-white/[0.01]">
            [NO TUNING RECORDS LOGGED IN FIRESTORE]
          </div>
        ) : (
          logs.map((log) => {
            // Pick aesthetic styling based on category
            let catColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            if (log.category === 'Suspension') catColor = 'bg-teal-500/10 text-teal-400 border-teal-500/20';
            if (log.category === 'Exhaust') catColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            if (log.category === 'Brakes') catColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            if (log.category === 'Exterior' || log.category === 'Interior') catColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            if (log.category === 'Maintenance') catColor = 'bg-green-500/10 text-green-400 border-green-500/20';

            return (
              <div
                key={log.id}
                className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-xl p-3.5 flex flex-col gap-2 relative group hover:border-white/20 transition-all text-left"
              >
                {/* Top layer */}
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border uppercase ${catColor}`}>
                      {log.category}
                    </span>
                    <h5 className="text-xs font-bold text-neutral-100 pt-1 leading-tight group-hover:text-blue-400 transition-colors">
                      {log.title}
                    </h5>
                  </div>

                  <button
                    onClick={() => {
                      setIslandMessage('UPGRADE RETIRED');
                      onDeleteLog(log.id);
                    }}
                    className="p-1 text-white/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Notes if existing */}
                {log.notes && (
                  <p className="text-[10px] text-white/50 font-sans italic bg-white/5 p-2 rounded border border-white/5">
                    "{log.notes}"
                  </p>
                )}

                {/* Specs layout */}
                <div className="flex gap-4 border-t border-white/5 pt-2 text-[10px] text-white/40 font-mono">
                  <div className="flex items-center gap-1 text-white font-bold">
                    <DollarSign className="w-3 h-3 text-white/40" />
                    {log.cost}
                  </div>
                  {log.hpGain > 0 && (
                    <div className="flex items-center gap-1 text-blue-400 font-bold">
                      <Zap className="w-3 h-3 fill-blue-400/10" />
                      +{log.hpGain} HP
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-auto text-[9px] text-white/30">
                    <Calendar className="w-3 h-3" />
                    {log.date}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full sheet dialog to log a new modification */}
      <AnimatePresence>
        {showLogForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex flex-col justify-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#0e0e11]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[28px] p-5 space-y-4 max-h-[90%] overflow-y-auto scrollbar-none text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white">RECORD TUNING/UPGRADE</h3>
                  <span className="text-[8px] text-white/40 font-mono">FIRESTORE RECORD LEDGER</span>
                </div>
                <button
                  onClick={() => {
                    setShowLogForm(false);
                    setIslandMessage('LOG CANCELLED');
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleLogSubmit} className="space-y-4">
                {/* Part Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Part Name / Modification</label>
                  <input
                    type="text"
                    required
                    value={logTitle}
                    onChange={(e) => setLogTitle(e.target.value)}
                    placeholder="e.g. Stage 2 Map, Titanium Intake, Coilovers"
                    className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-white/20 outline-none font-medium transition-colors"
                  />
                </div>

                {/* Category selectors */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Modification Category</label>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[9px] font-bold text-white/40">
                    {(['Engine', 'Suspension', 'Exhaust', 'Brakes', 'Exterior', 'Interior', 'Maintenance'] as const).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`py-1.5 rounded-lg border uppercase transition-all cursor-pointer ${
                          category === cat
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/40'
                            : 'bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Side-by-side inputs for Cost, HP gains */}
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Cost (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                      <input
                        type="number"
                        required
                        value={cost}
                        onChange={(e) => setCost(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-xl py-2.5 pl-8 pr-3 text-xs text-white outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Est HP Gains</label>
                    <div className="relative">
                      <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                      <input
                        type="number"
                        required
                        value={hpGain}
                        onChange={(e) => setHpGain(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-xl py-2.5 pl-8 pr-3 text-xs text-white outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Log Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Tuning / Install Date</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white outline-none font-mono transition-colors"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Mechanic Notes / Dyno Details</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Log instructions, parts brand, compression ratio, boost settings..."
                    rows={2.5}
                    className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-white/20 outline-none font-sans transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {formLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Record to Cloud Ledger'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0e0e11]/95 backdrop-blur-xl border border-white/10 p-6 rounded-2xl max-w-sm text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-white font-sans">SCRAP VEHICLE SPECS?</h3>
                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  This will permanently delete {vehicle.make} {vehicle.model} specifications and all {logs.length} modification logs from Firestore. This action is irreversible.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 font-sans">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setIslandMessage('SCRAP ABORTED');
                  }}
                  className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVehicleConfirm}
                  className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs border border-red-500/30 transition-all shadow-lg shadow-red-950/20 cursor-pointer"
                >
                  Scrap Vehicle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
