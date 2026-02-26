import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Calendar, 
  Clock, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckCircle2,
  Droplets,
  Wind,
  Thermometer
} from 'lucide-react';

// Types
interface LogEntry {
  id?: number;
  timestamp: string;
  bristol_score: number;
  color: string;
  quantity: string;
  urgency: string;
  pain_level: number;
  notes: string;
  has_blood: boolean;
  has_mucus: boolean;
  is_floating: boolean;
  smell: string;
}

// Constants for Selectors
const BRISTOL_SCALE = [
  { score: 1, label: "Type 1", desc: "Separate hard lumps, like nuts (hard to pass)", color: "bg-stone-600" },
  { score: 2, label: "Type 2", desc: "Sausage-shaped, but lumpy", color: "bg-stone-500" },
  { score: 3, label: "Type 3", desc: "Like a sausage but with cracks on surface", color: "bg-stone-500" },
  { score: 4, label: "Type 4", desc: "Like a sausage or snake, smooth and soft", color: "bg-amber-600" },
  { score: 5, label: "Type 5", desc: "Soft blobs with clear cut edges (passed easily)", color: "bg-amber-500" },
  { score: 6, label: "Type 6", desc: "Fluffy pieces with ragged edges, a mushy stool", color: "bg-amber-400" },
  { score: 7, label: "Type 7", desc: "Watery, no solid pieces, entirely liquid", color: "bg-amber-300" },
];

const COLORS = [
  { id: 'brown', label: 'Brown', class: 'bg-[#5D4037]' },
  { id: 'green', label: 'Green', class: 'bg-[#388E3C]' },
  { id: 'yellow', label: 'Yellow', class: 'bg-[#FBC02D]' },
  { id: 'black', label: 'Black', class: 'bg-[#212121]' },
  { id: 'red', label: 'Red', class: 'bg-[#D32F2F]' },
  { id: 'pale', label: 'Pale/Clay', class: 'bg-[#D7CCC8]' },
];

const QUANTITIES = ['Small', 'Medium', 'Large'];
const URGENCIES = ['Normal', 'Urgent', 'Emergency'];
const SMELLS = ['Normal', 'Strong', 'Foul'];

export default function App() {
  const [view, setView] = useState<'dashboard' | 'new-log'>('dashboard');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (entry: LogEntry) => {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      await fetchLogs();
      setView('dashboard');
    } catch (err) {
      console.error("Failed to save log", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      await fetchLogs();
    } catch (err) {
      console.error("Failed to delete log", err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-200">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">
              <Activity size={18} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">DigestForSoph</h1>
          </div>
          {view === 'dashboard' && (
            <button 
              onClick={() => setView('new-log')}
              className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              New Entry
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <DashboardView key="dashboard" logs={logs} loading={loading} onDelete={handleDelete} />
          ) : (
            <NewLogView key="new-log" onSave={handleSave} onCancel={() => setView('dashboard')} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function DashboardView({ logs, loading, onDelete }: { logs: LogEntry[], loading: boolean, onDelete: (id: number) => void, key?: React.Key }) {
  // Calculate some quick stats
  const today = new Date().toDateString();
  const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);
  
  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
          <p className="text-stone-500 text-xs font-medium uppercase tracking-wider">Today's Count</p>
          <p className="text-3xl font-bold mt-1 text-stone-800">{todayLogs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
          <p className="text-stone-500 text-xs font-medium uppercase tracking-wider">Last Entry</p>
          <p className="text-lg font-semibold mt-1 text-stone-800">
            {logs.length > 0 ? new Date(logs[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm col-span-2 md:col-span-1">
          <p className="text-stone-500 text-xs font-medium uppercase tracking-wider">Avg Bristol Score</p>
          <p className="text-3xl font-bold mt-1 text-stone-800">
            {logs.length > 0 ? (logs.reduce((acc, curr) => acc + curr.bristol_score, 0) / logs.length).toFixed(1) : '-'}
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
          <Calendar size={20} className="text-stone-400" />
          History
        </h2>
        
        {loading ? (
          <div className="text-center py-12 text-stone-400">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-stone-200">
            <p className="text-stone-500">No logs yet. Tap "New Entry" to start tracking.</p>
          </div>
        ) : (
          Object.entries(groupedLogs).map(([date, dayLogs]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-sm font-medium text-stone-500 sticky top-16 bg-stone-50 py-2 z-0">{date}</h3>
              {dayLogs.map(log => (
                <LogCard key={log.id} log={log} onDelete={onDelete} />
              ))}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function LogCard({ log, onDelete }: { log: LogEntry, onDelete: (id: number) => void, key?: React.Key }) {
  const bristol = BRISTOL_SCALE.find(b => b.score === log.bristol_score);
  
  return (
    <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm hover:shadow-md transition-shadow relative group">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${bristol?.color || 'bg-gray-400'}`}>
            {log.bristol_score}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-800">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-stone-400 text-xs">•</span>
              <span className="text-stone-600 font-medium">{bristol?.label}</span>
            </div>
            <p className="text-stone-500 text-sm mt-0.5">{bristol?.desc}</p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge label={log.quantity} color="bg-stone-100 text-stone-600" />
              <Badge label={log.color} color="bg-stone-100 text-stone-600" />
              {log.urgency !== 'Normal' && <Badge label={log.urgency} color="bg-red-50 text-red-600" />}
              {log.pain_level > 0 && <Badge label={`Pain: ${log.pain_level}/10`} color="bg-orange-50 text-orange-600" />}
              {log.is_floating && <Badge label="Floating/Greasy" color="bg-yellow-50 text-yellow-700" />}
              {log.has_blood && <Badge label="Blood" color="bg-red-100 text-red-700" />}
              {log.has_mucus && <Badge label="Mucus" color="bg-blue-50 text-blue-700" />}
              {log.smell !== 'Normal' && <Badge label={`Smell: ${log.smell}`} color="bg-stone-100 text-stone-600" />}
            </div>
            
            {log.notes && (
              <p className="mt-3 text-sm text-stone-600 bg-stone-50 p-2 rounded-lg italic">
                "{log.notes}"
              </p>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => log.id && onDelete(log.id)}
          className="text-stone-300 hover:text-red-500 transition-colors p-2"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string, color: string }) {
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function NewLogView({ onSave, onCancel }: { onSave: (entry: LogEntry) => void, onCancel: () => void, key?: React.Key }) {
  const [formData, setFormData] = useState<LogEntry>({
    timestamp: new Date().toISOString(),
    bristol_score: 4,
    color: 'brown',
    quantity: 'Medium',
    urgency: 'Normal',
    pain_level: 0,
    notes: '',
    has_blood: false,
    has_mucus: false,
    is_floating: false,
    smell: 'Normal'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden"
    >
      <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
        <h2 className="font-bold text-lg">New Entry</h2>
        <button onClick={onCancel} className="text-stone-500 hover:text-stone-800 text-sm font-medium">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Bristol Scale */}
        <section>
          <label className="block text-sm font-bold text-stone-700 mb-3">Consistency (Bristol Scale)</label>
          <div className="space-y-2">
            {BRISTOL_SCALE.map((type) => (
              <div 
                key={type.score}
                onClick={() => setFormData({...formData, bristol_score: type.score})}
                className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.bristol_score === type.score 
                    ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' 
                    : 'border-stone-200 hover:border-amber-200 hover:bg-stone-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${type.color}`}>
                  {type.score}
                </div>
                <div>
                  <div className="font-semibold text-stone-800">{type.label}</div>
                  <div className="text-xs text-stone-500">{type.desc}</div>
                </div>
                {formData.bristol_score === type.score && (
                  <CheckCircle2 className="ml-auto text-amber-600" size={20} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Color */}
        <section>
          <label className="block text-sm font-bold text-stone-700 mb-3">Color</label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setFormData({...formData, color: color.label})}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                  formData.color === color.label ? 'bg-stone-100 ring-2 ring-stone-400' : 'hover:bg-stone-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-full shadow-inner border border-black/10 ${color.class}`}></div>
                <span className="text-xs font-medium text-stone-600">{color.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <label className="block text-sm font-bold text-stone-700 mb-3">Quantity</label>
            <div className="flex rounded-lg bg-stone-100 p-1">
              {QUANTITIES.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setFormData({...formData, quantity: q})}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    formData.quantity === q ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="block text-sm font-bold text-stone-700 mb-3">Urgency</label>
            <div className="flex rounded-lg bg-stone-100 p-1">
              {URGENCIES.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setFormData({...formData, urgency: u})}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    formData.urgency === u 
                      ? u === 'Emergency' ? 'bg-red-500 text-white shadow-sm' : 'bg-white shadow-sm text-stone-900' 
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </section>
          
          <section>
            <label className="block text-sm font-bold text-stone-700 mb-3">Smell</label>
            <div className="flex rounded-lg bg-stone-100 p-1">
              {SMELLS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...formData, smell: s})}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    formData.smell === s ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="block text-sm font-bold text-stone-700 mb-3">Pain Level (0-10)</label>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={formData.pain_level} 
              onChange={(e) => setFormData({...formData, pain_level: parseInt(e.target.value)})}
              className="w-full accent-amber-500 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-stone-400 mt-1">
              <span>No Pain</span>
              <span className="font-bold text-stone-800 text-lg">{formData.pain_level}</span>
              <span>Severe</span>
            </div>
          </section>
        </div>

        {/* Flags */}
        <section className="bg-stone-50 p-4 rounded-xl border border-stone-100">
          <label className="block text-sm font-bold text-stone-700 mb-3">Observations</label>
          <div className="space-y-3">
            <Toggle 
              label="Floating / Greasy / Oily" 
              desc="Often indicates malabsorption (common in Celiac)"
              checked={formData.is_floating} 
              onChange={(v) => setFormData({...formData, is_floating: v})} 
            />
            <Toggle 
              label="Visible Blood" 
              desc="Red or maroon color"
              checked={formData.has_blood} 
              onChange={(v) => setFormData({...formData, has_blood: v})} 
            />
            <Toggle 
              label="Mucus" 
              desc="White or yellow slime"
              checked={formData.has_mucus} 
              onChange={(v) => setFormData({...formData, has_mucus: v})} 
            />
          </div>
        </section>

        {/* Notes */}
        <section>
          <label className="block text-sm font-bold text-stone-700 mb-3">Notes</label>
          <textarea 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Any food triggers? Stress? Medications?"
            className="w-full p-3 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all min-h-[100px]"
          />
        </section>

        <div className="pt-4">
          <button 
            type="submit"
            className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-lg hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10"
          >
            Save Entry
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string, desc?: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between cursor-pointer group"
    >
      <div>
        <div className="font-medium text-stone-800">{label}</div>
        {desc && <div className="text-xs text-stone-500">{desc}</div>}
      </div>
      <div className={`w-12 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-amber-500' : 'bg-stone-200'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}
