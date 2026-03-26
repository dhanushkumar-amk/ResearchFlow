'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getAdminLogs, getHealth } from '@/lib/api';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import Badge from '@/components/Badge';
import { Activity, ShieldAlert, Cpu, Timer, Heart } from 'lucide-react';

export default function AdminPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [logsData, healthData] = await Promise.all([
          getAdminLogs(token),
          getHealth().catch(() => null)
        ]);
        setLogs(logsData);
        setHealth(healthData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [token]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#050510] text-gray-100">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header & Stats */}
          <div className="mb-10">
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
              System Control Center
            </h1>
            <p className="text-gray-400 font-medium tracking-tight">
              Real-time intelligence monitoring & telemetry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Health Card */}
            <div className="bg-[#111122]/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Heart className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">System Health</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{health?.status === 'ok' ? 'Nominal' : 'Checking...'}</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 border-t border-white/5 pt-4">
                <span>Uptime: {health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '...'}</span>
                <span>v{health?.version || '1.0.0'}</span>
              </div>
            </div>

            {/* Performance Card */}
            <div className="bg-[#111122]/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Cpu className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Active Nodes</h3>
                  <span className="text-2xl font-bold">5 Specialized Agents</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 border-t border-white/5 pt-4">
                Latency Optimized • Sub-second Planning
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-[#111122]/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Total Tokens</h3>
                  <span className="text-2xl font-bold">
                    {logs.reduce((acc, log) => acc + (log.token_count || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 border-t border-white/5 pt-4">
                Tracked via Agent Telemetry
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-[#0a0a1a] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-white/[0.02] to-transparent">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-400" /> 
                  Agent Activity Logs
                </h2>
                <p className="text-sm text-gray-500 mt-1">Live stream of cross-agent communication & telemetry</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
              >
                Force Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 text-center animate-pulse text-gray-500">Retrieving system telemetry...</div>
              ) : error ? (
                <div className="p-20 text-center text-red-400">Error: {error}</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] text-gray-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-8 py-5">Agent</th>
                      <th className="px-8 py-5">Session</th>
                      <th className="px-8 py-5">Duration</th>
                      <th className="px-8 py-5">Tokens</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {logs.map((log) => (
                      <tr key={log.log_id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${getAgentColor(log.agent_name)} group-hover:scale-150 transition-transform`} />
                            <span className="font-bold text-gray-200 capitalize">{log.agent_name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <code className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md">
                            {log.session_id.substring(0, 8)}...
                          </code>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Timer className="w-3.5 h-3.5 text-gray-500" />
                            <span>{log.duration_ms}ms</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 font-mono text-sm text-blue-400">
                          {log.token_count || 0}
                        </td>
                        <td className="px-8 py-6">
                           <Badge 
                            variant={log.status === 'success' ? 'success' : 'error'}
                            className="bg-transparent border transition-all"
                          >
                            {log.status === 'success' ? 'Nominal' : 'Failure'}
                          </Badge>
                        </td>
                        <td className="px-8 py-6 text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function getAgentColor(name: string) {
  switch (name.toLowerCase()) {
    case 'planner': return 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]';
    case 'search': return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
    case 'rag': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    case 'synthesizer': return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]';
    case 'critic': return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
    default: return 'bg-gray-500';
  }
}
