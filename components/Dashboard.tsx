
import React, { useMemo } from 'react';
import { ConflictCase, RiskLevel, CaseStatus, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface DashboardProps {
  cases: ConflictCase[];
  onSelectCase: (c: ConflictCase) => void;
}

const COLORS = {
  [RiskLevel.LOW]: '#10B981',    // Green
  [RiskLevel.MEDIUM]: '#F59E0B', // Amber
  [RiskLevel.HIGH]: '#EF4444',   // Red
  [RiskLevel.CRITICAL]: '#991B1B' // Deep Red
};

const Dashboard: React.FC<DashboardProps> = ({ cases, onSelectCase }) => {
  
  // KPIs
  const stats = useMemo(() => {
    return {
      total: cases.length,
      active: cases.filter(c => c.status !== CaseStatus.CLOSED).length,
      critical: cases.filter(c => c.riskLevel === RiskLevel.CRITICAL).length,
      resolved: cases.filter(c => c.status === CaseStatus.RESOLVED || c.status === CaseStatus.CLOSED).length
    };
  }, [cases]);

  // Data for Charts
  const riskData = useMemo(() => {
    const counts = cases.reduce((acc, curr) => {
      acc[curr.riskLevel] = (acc[curr.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.values(RiskLevel).map(level => ({
      name: level,
      value: counts[level] || 0
    }));
  }, [cases]);

  const getRoleBadge = (role: UserRole) => {
    switch(role) {
        case UserRole.STUDENT:
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">ALUMNO</span>;
        case UserRole.PARENT:
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-700">FAMILIA</span>;
        case UserRole.TEACHER:
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-700">DOCENTE</span>;
        default:
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">OTRO</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-300 dark:border-gray-700 pb-4 gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Panel Institucional</h1>
        
        <div className="flex flex-wrap items-center gap-3">
             {/* Document Repository Button */}
             <a 
              href="https://dinamicaweecuador-my.sharepoint.com/:f:/g/personal/jorge_dinamicaweecuador_onmicrosoft_com/IgCmAmwKKF2-Tb6Bdy4Z3pAmAbzxh5pi9me_LV97spvpalU?e=ewyx9J"
              target="_blank"
              //onClick={(e) => { e.preventDefault(); alert("En una implementación real, esto abriría el repositorio externo de documentos (Google Drive, SharePoint, etc.)"); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition shadow-sm border border-blue-800 dark:border-blue-400 group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Repositorio Documental
            </a>

            <span className="text-sm font-bold text-white bg-gray-800 dark:bg-gray-700 px-3 py-2 rounded shadow-sm">
            Actualizado: {new Date().toLocaleTimeString()}
            </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-8 border-gray-800 dark:border-gray-600 border-t border-r border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Casos</p>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-8 border-indigo-600 border-t border-r border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activos</p>
          <p className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-2">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-8 border-red-600 border-t border-r border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Riesgo Crítico</p>
          <p className="text-4xl font-extrabold text-red-700 dark:text-red-400 mt-2">{stats.critical}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-8 border-emerald-600 border-t border-r border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resueltos</p>
          <p className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{stats.resolved}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-300 dark:border-gray-700 h-96 transition-colors duration-200">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-600 rounded"></span>
            Distribución por Nivel de Riesgo
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={riskData}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={true} stroke="#6B7280" tick={{fill: '#6B7280', fontWeight: 'bold'}} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#6B7280'}} />
              <Tooltip 
                cursor={{ fill: '#374151' }} 
                contentStyle={{ borderRadius: '4px', border: '1px solid #374151', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#1F2937', color: '#fff' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as RiskLevel] || '#6366F1'} strokeWidth={1} stroke="#fff" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-300 dark:border-gray-700 h-96 transition-colors duration-200">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-600 rounded"></span>
            Estado del Flujo de Trabajo
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={riskData} // Using risk data as proxy for simplicity
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                 {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as RiskLevel] || '#6366F1'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '4px', border: 'none', backgroundColor: '#1F2937', color: '#fff' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: '600', color: '#9CA3AF' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Case List - Data Grid View */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        <div className="px-6 py-5 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Casos Recientes</h3>
          <button className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200">Ver todos &rarr;</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-800 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">ID Caso</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Reportante</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tipología</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Riesgo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Protocolo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Asignado a</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-indigo-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700 dark:text-indigo-400">{c.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(c.reporterRole)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{c.typology}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full text-white shadow-sm
                      ${c.riskLevel === RiskLevel.CRITICAL ? 'bg-red-700' : 
                        c.riskLevel === RiskLevel.HIGH ? 'bg-orange-600' : 
                        c.riskLevel === RiskLevel.MEDIUM ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                      {c.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{c.assignedProtocol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{c.assignedTo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-300">{c.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => onSelectCase(c)} className="text-white bg-indigo-600 hover:bg-indigo-800 px-3 py-1.5 rounded text-xs font-bold transition shadow-sm">
                      GESTIONAR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
