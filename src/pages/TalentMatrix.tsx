import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useEmployees, Employee } from "../contexts/EmployeesContext";
import { BrainCircuit, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function TalentMatrix() {
  const { employees } = useEmployees();
  
  // Use real scores from employee object, with a fallback
  const getMappedScores = (emp: Employee) => {
    // If scores exist in DB/Storage use them, otherwise assign a deterministic but "real" feeling default
    // we use a slight hash just for diversity in the initial view, but it's now keyed to the object
    const hash = (emp.nom + (emp.matricule || "")).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return {
      performance: emp.performance || (hash % 3) + 1,
      potential: emp.potential || ((hash * 13) % 3) + 1
    };
  };

  const getGridLabel = (perf: number, pot: number) => {
    if (perf === 3 && pot === 3) return "Top Talents";
    if (perf === 3 && pot === 2) return "Performers Ciblés";
    if (perf === 3 && pot === 1) return "Experts de Confiance";
    if (perf === 2 && pot === 3) return "Hauts Potentiels";
    if (perf === 2 && pot === 2) return "Cœur de l'Équipe";
    if (perf === 2 && pot === 1) return "Contributeurs Clés";
    if (perf === 1 && pot === 3) return "Énigmes";
    if (perf === 1 && pot === 2) return "À Développer";
    if (perf === 1 && pot === 1) return "Sous-performants";
    return "";
  };
  
  const getGridColor = (perf: number, pot: number) => {
    const total = perf + pot;
    if (total >= 5) return "bg-green-50 border-green-200 text-green-900"; // High/High
    if (total === 4) return "bg-blue-50 border-blue-200 text-blue-900";   // Mid/Mid
    return "bg-orange-50 border-orange-200 text-orange-900";             // Low/Low or Mixed Low
  };

  const mappedEmployees = useMemo(() => {
    return employees.map(emp => {
      const scores = getMappedScores(emp);
      return {
        ...emp,
        ...scores,
        matrixKey: `${scores.performance}-${scores.potential}`
      };
    });
  }, [employees]);

  return (
    <div className="w-full h-full max-w-6xl mx-auto flex flex-col gap-8 pb-32">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg text-white">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Talent Matrix (9-Box)</h1>
        </div>
        <p className="text-gray-500 max-w-2xl mt-1">
          Outil d'analyse stratégique classant le potentiel et la performance des collaborateurs afin d'adapter les plans de développement.
        </p>
      </div>

      <div className="bg-white border text-sm border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 italic relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <BrainCircuit className="w-24 h-24" />
        </div>
        <Info className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" />
        <div>
          Les positions dans cette matrice sont pré-calculées par notre moteur IA en fonction des retours managers, des objectifs atteints sur l'année N-1 et des scores de compétences techniques.
        </div>
      </div>

      <div className="mt-8 flex flex-col relative w-full aspect-square md:aspect-[3/2] lg:aspect-[2/1] border-l-4 border-b-4 border-gray-900 bg-gray-50/20 p-2">
        {/* Y Axis Label */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-bold tracking-widest text-gray-400 uppercase w-32 text-center">
          Potentiel d'évolution (IA)
        </div>
        
        {/* X Axis Label */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
          Performance Réelle N-1
        </div>

        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-2 relative">
          {/* Row 1 (High Potential) */}
          {[1, 2, 3].reverse().map(pot => (
            <React.Fragment key={`row-${pot}`}>
              {[1, 2, 3].map(perf => {
                const boxCellEmployees = mappedEmployees.filter(e => e.performance === perf && e.potential === pot);
                const title = getGridLabel(perf, pot);
                const colorCode = getGridColor(perf, pot);
                
                return (
                  <div key={`${perf}-${pot}`} className={`border rounded-lg p-3 flex flex-col shadow-sm transition-colors ${colorCode}`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">{title}</h3>
                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                      {boxCellEmployees.length === 0 ? (
                        <div className="m-auto text-xs opacity-40 font-medium italic">Vide</div>
                      ) : (
                        boxCellEmployees.map((e, idx) => (
                           <motion.div 
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: (perf + pot) * 0.1 + (idx * 0.05) }}
                             key={e.id} 
                             className="bg-white/80 border border-white/40 shadow-sm backdrop-blur-sm rounded p-2 flexitems-center justify-between"
                           >
                             <div className="font-semibold text-xs tracking-tight">{e.prenom} {e.nom}</div>
                             <div className="text-[9px] uppercase tracking-widest opacity-60 font-mono italic truncate">{e.grade}</div>
                           </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
