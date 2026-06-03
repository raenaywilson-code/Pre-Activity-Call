import React, { useMemo } from 'react';
import { 
  BarChart3, 
  ChevronLeft, 
  TrendingUp, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  ArrowUpRight
} from 'lucide-react';

interface Session {
  id: string;
  empId: string;
  location: string;
  scenarioName: string;
  rating: number;
  createdAt: string;
  summary: string;
}

interface DashboardProps {
  sessions: Session[];
  onBack: () => void;
  logoUrl: string;
}

export function Dashboard({ sessions, onBack, logoUrl }: DashboardProps) {
  const stats = useMemo(() => {
    const total = sessions.length;
    const avg = total > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.rating, 0) / total) : 0;
    const locations = new Set(sessions.map(s => s.location)).size;
    const uniqueUsers = new Set(sessions.map(s => s.empId)).size;
    
    return { total, avg, locations, uniqueUsers };
  }, [sessions]);

  return (
    <div className="min-h-screen bg-[#050A15] p-6 text-white font-sans">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800 text-gray-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black uppercase tracking-tight">Manager Dashboard</h1>
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Training Analytics & Performance</p>
          </div>
        </div>
        <img src={logoUrl} alt="Logo" className="h-10 opacity-50 grayscale hover:grayscale-0 transition-all" />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard 
          icon={<TrendUp className="w-5 h-5" />} 
          label="Average Rating" 
          value={`${stats.avg}%`} 
          color="blue"
        />
        <StatCard 
          icon={<BarChart3 className="w-5 h-5" />} 
          label="Total Sessions" 
          value={stats.total.toString()} 
          color="purple"
        />
        <StatCard 
          icon={<Users className="w-5 h-5" />} 
          label="Unique Advocates" 
          value={stats.uniqueUsers.toString()} 
          color="green"
        />
        <StatCard 
          icon={<Calendar className="w-5 h-5" />} 
          label="Locations Active" 
          value={stats.locations.toString()} 
          color="orange"
        />
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-[32px] overflow-hidden">
        <div className="p-8 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-widest">Recent Activity</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Advocate</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Scenario</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Location</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Score</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6 font-bold text-sm">{s.empId}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-300">{s.scenarioName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-gray-400">{s.location}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`text-sm font-black px-3 py-1 rounded-full ${
                      s.rating >= 90 ? 'bg-green-500/10 text-green-500' :
                      s.rating >= 70 ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {s.rating}%
                    </span>
                  </td>
                  <td className="px-8 py-6 text-xs text-gray-500 font-mono">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                    No session data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const bgColors: any = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-all group-hover:scale-150 ${bgColors[color].split(' ')[0]}`} />
      <div className="space-y-4 relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${bgColors[color]}`}>
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TrendUp(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
