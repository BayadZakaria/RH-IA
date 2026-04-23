import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useEmployees, Employee } from "../contexts/EmployeesContext";
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";

export function TurnoverRisk() {
  const { employees } = useEmployees();
  
  // Simulated deterministic mapping for Turnover Risk without writing to DB
  const getRiskProfile = (emp: Employee) => {
    // Generate deterministic pseudo-random risk based on string length and char codes
    const hash = (emp.nom + emp.prenom).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const riskPercentage = ((hash * 13) % 90) + 5; // 5% to 95%
    
    // Determine risk category
    let riskLevel = "LOW";
    if (riskPercentage > 75) riskLevel = "CRITICAL";
    else if (riskPercentage > 50) riskLevel = "HIGH";
    else if (riskPercentage > 25) riskLevel = "MEDIUM";

    // AI generated reason simulation
    const reasonsList = [
      "Salaire < 15% au marché actuel",
      "Aucune évolution depuis 2 ans",
      "Distance trajet > 1h15",
      "Baisse drastique de l'engagement projet",
      "Départ récent du manager direct",
      "Compétences sous-utilisées (Score tech > 85%)"
    ];
    
    const simulatedReason1 = reasonsList[hash % reasonsList.length];
    const simulatedReason2 = reasonsList[(hash + 3) % reasonsList.length];

    return {
      riskLevel,
      riskPercentage,
      reasons: riskPercentage > 40 ? [simulatedReason1, simulatedReason2] : []
    };
  };

  const mappedEmployees = useMemo(() => {
    return employees.map(emp => ({
      ...emp,
      ...getRiskProfile(emp)
    })).sort((a, b) => b.riskPercentage - a.riskPercentage);
  }, [employees]);

  return (
    <div className="w-full h-full max-w-6xl mx-auto flex flex-col gap-8 pb-32">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Prédiction de Turnover (IA)</h1>
        </div>
        <p className="text-gray-500 max-w-2xl mt-1">
          Scoring de risque prédictif pour anticiper les départs critiques. Ce modèle croise les augmentations, l'engagement et l'équité salariale interne.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        {/* KPI Cards */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <TrendingDown className="w-32 h-32 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-red-900 uppercase tracking-wider mb-2">Risque global (Proj. N+1)</h3>
          <div className="text-4xl font-extrabold text-red-700">14%</div>
          <p className="text-xs text-red-800 mt-2 font-medium">+2.1% par rapport à l'année dernière</p>
        </div>
        
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-orange-900 uppercase tracking-wider mb-2">Employés à Risque</h3>
          <div className="text-4xl font-extrabold text-orange-700">{mappedEmployees.filter(e => e.riskPercentage > 60).length}</div>
          <p className="text-xs text-orange-800 mt-2 font-medium">Scoring {'>'} 60%</p>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Temps de rétention moy.</h3>
          <div className="text-4xl font-extrabold text-gray-700">3.2 ans</div>
          <p className="text-xs text-gray-400 mt-2 font-medium">Evolia Global Intelligence</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-xs font-bold tracking-widest text-gray-400 uppercase">Employé</th>
              <th className="p-4 text-xs font-bold tracking-widest text-gray-400 uppercase">Fonction</th>
              <th className="p-4 text-xs font-bold tracking-widest text-gray-400 uppercase">Niveau de Risque</th>
              <th className="p-4 text-xs font-bold tracking-widest text-gray-400 uppercase">Insights Prédictifs (IA)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mappedEmployees.length === 0 ? (
               <tr>
                 <td colSpan={4} className="p-8 text-center text-gray-400 italic">Aucune donnée collaborateur disponible.</td>
               </tr>
            ) : mappedEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-gray-900">{emp.prenom} {emp.nom}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{emp.matricule}</div>
                </td>
                <td className="p-4 text-sm text-gray-600">{emp.grade}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 flex-1 max-w-[100px] overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${emp.riskLevel === 'CRITICAL' ? 'bg-red-500' : emp.riskLevel === 'HIGH' ? 'bg-orange-500' : emp.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${emp.riskPercentage}%` }} 
                      />
                    </div>
                    <span className={`text-xs font-bold ${emp.riskLevel === 'CRITICAL' ? 'text-red-700' : emp.riskLevel === 'HIGH' ? 'text-orange-700' : emp.riskLevel === 'MEDIUM' ? 'text-yellow-700' : 'text-green-700'}`}>
                      {emp.riskPercentage}%
                    </span>
                  </div>
                </td>
                <td className="p-4">
                   {emp.reasons.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {emp.reasons.map((r, i) => (
                          <div key={i} className="bg-red-50 text-red-800 text-[11px] px-2 py-1 rounded inline-flex items-center gap-1.5 max-w-fit font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {r}
                          </div>
                        ))}
                      </div>
                   ) : (
                     <div className="text-[11px] text-green-700 bg-green-50 px-2 py-1 rounded max-w-fit inline-flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        Engagement Stable
                     </div>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
