import { motion } from "motion/react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, CartesianGrid, YAxis } from "recharts";
import { BrainCircuit, Cpu, ShieldAlert, Activity, Bot, FileText, CheckCircle2, Clock, Users, BarChart as BarChartIcon } from "lucide-react";

const PERFORMANCE_DATA = [
  { name: "Lun", success: 95, failed: 5, latency: 1.2 },
  { name: "Mar", success: 98, failed: 2, latency: 1.4 },
  { name: "Mer", success: 92, failed: 8, latency: 2.1 },
  { name: "Jeu", success: 99, failed: 1, latency: 1.1 },
  { name: "Ven", success: 100, failed: 0, latency: 0.9 },
  { name: "Sam", success: 100, failed: 0, latency: 0.8 },
  { name: "Dim", success: 95, failed: 5, latency: 1.5 },
];

const TALENT_RISK_DATA = [
  { stage: "Moins d'un an", riskLow: 40, riskMid: 24, riskHigh: 8 },
  { stage: "1-3 ans", riskLow: 60, riskMid: 12, riskHigh: 15 },
  { stage: "3-5 ans", riskLow: 30, riskMid: 40, riskHigh: 5 },
  { stage: "+5 ans", riskLow: 80, riskMid: 5, riskHigh: 2 },
];

const NINE_BOX = [
  { id: '9', title: 'Future Leader', desc: 'Haut Potentiel / Haute Performance', color: 'bg-green-100/50 text-green-800 border-green-200' },
  { id: '8', title: 'Top Talent', desc: 'Haut Potentiel / Performance Moy.', color: 'bg-green-50 text-green-700 border-green-100' },
  { id: '7', title: 'Enigma', desc: 'Haut Potentiel / Faible Performance', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: '6', title: 'High Professional', desc: 'Potentiel Moy. / Haute Performance', color: 'bg-green-50 text-green-700 border-green-100' },
  { id: '5', title: 'Core Player', desc: 'Potentiel Moy. / Performance Moy.', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { id: '4', title: 'Dilemma', desc: 'Potentiel Moy. / Faible Performance', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  { id: '3', title: 'Solid Professional', desc: 'Faible Potentiel / Haute Performance', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: '2', title: 'Effective', desc: 'Faible Potentiel / Performance Moy.', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  { id: '1', title: 'Risk', desc: 'Faible Potentiel / Faible Performance', color: 'bg-red-50 text-red-700 border-red-100' },
];

export function Insights() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Intelligence Artificielle & Insights</h1>
        <p className="text-gray-500 mt-2">Supervision des modèles LLM et analytique RH prédictive (Turnover & Performance).</p>
      </div>

      {/* KPIs Chatbot & Evaluation Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Module Chatbot KPIs */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                 <Bot className="w-5 h-5" />
               </div>
               <div>
                  <h2 className="text-lg font-semibold tracking-tight">Chatbot Module</h2>
                  <p className="text-xs text-gray-500">Pré-qualification IA</p>
               </div>
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-50 px-2 py-1 rounded-md">Opérationnel</span>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl flex flex-col justify-end">
               <div className="flex justify-between items-start mb-2">
                 <Activity className="w-4 h-4 text-gray-400" />
               </div>
               <h3 className="font-bold text-2xl text-gray-900">86<span className="text-sm font-medium text-gray-500">%</span></h3>
               <p className="text-xs text-gray-500 font-medium">Taux complétion chatbot</p>
            </div>
            <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl flex flex-col justify-end">
               <div className="flex justify-between items-start mb-2">
                 <Clock className="w-4 h-4 text-gray-400" />
               </div>
               <h3 className="font-bold text-2xl text-gray-900">3<span className="text-sm font-medium text-gray-500">m</span> 12<span className="text-sm font-medium text-gray-500">s</span></h3>
               <p className="text-xs text-gray-500 font-medium">Temps moyen interaction</p>
            </div>
            <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl flex flex-col justify-end">
               <div className="flex justify-between items-start mb-2">
                 <CheckCircle2 className="w-4 h-4 text-green-500" />
               </div>
               <h3 className="font-bold text-2xl text-gray-900">42<span className="text-sm font-medium text-gray-500">%</span></h3>
               <p className="text-xs text-gray-500 font-medium">Taux de qualification</p>
            </div>
            <div className="bg-[#fcfaf5] border border-[#f0e6d2] p-4 rounded-2xl flex flex-col justify-end">
               <div className="flex justify-between items-start mb-2">
                 <BrainCircuit className="w-4 h-4 text-[#8C5E3C]" />
               </div>
               <h3 className="font-bold text-2xl text-[#0B1E36]">81<span className="text-sm font-medium text-[#0B1E36]/50">/100</span></h3>
               <p className="text-xs text-[#8C5E3C] font-semibold">Score moyen IA</p>
            </div>
          </div>
        </section>

        {/* Module Evaluation KPIs */}
        <section className="bg-[#0B1E36] p-6 rounded-3xl border border-[#16335A] shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
             <BrainCircuit className="w-32 h-32 text-[#8C5E3C]" />
          </div>
          
          <div className="mb-6 flex items-center justify-between relative z-10">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-[#16335A] text-white rounded-xl flex items-center justify-center border border-[#1e4475]">
                 <FileText className="w-5 h-5" />
               </div>
               <div>
                  <h2 className="text-lg font-semibold tracking-tight text-white">Evaluation Module</h2>
                  <p className="text-xs text-white/50">Post-entretien & Décision</p>
               </div>
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C5E3C] bg-[#8C5E3C]/10 border border-[#8C5E3C]/20 px-2 py-1 rounded-md">Analytique active</span>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 relative z-10">
            <div className="bg-[#16335A]/50 border border-[#1e4475] p-4 rounded-2xl flex flex-col justify-end">
               <div className="flex justify-between items-start mb-2">
                 <BrainCircuit className="w-4 h-4 text-[#8C5E3C]" />
               </div>
               <h3 className="font-bold text-2xl text-white">84<span className="text-sm font-medium text-white/50">/100</span></h3>
               <p className="text-xs text-white/60 font-medium">Score Moyen</p>
            </div>
            <div className="bg-[#16335A]/50 border border-[#1e4475] p-4 rounded-2xl flex flex-col justify-end">
               <div className="flex justify-between items-start mb-2">
                 <CheckCircle2 className="w-4 h-4 text-green-400" />
               </div>
               <h3 className="font-bold text-2xl text-white">68<span className="text-sm font-medium text-white/50">%</span></h3>
               <p className="text-xs text-white/60 font-medium">Taux Validation</p>
            </div>
            <div className="bg-[#16335A]/50 border border-[#1e4475] p-4 rounded-2xl flex flex-col justify-end">
               <div className="flex justify-between items-start mb-2">
                 <BarChartIcon className="w-4 h-4 text-purple-400" />
               </div>
               <h3 className="font-bold text-2xl text-white">12<span className="text-sm font-medium text-white/50">%</span></h3>
               <p className="text-xs text-white/60 font-medium">Dispersion des Scores</p>
            </div>
            <div className="bg-[#16335A]/50 border border-[#1e4475] p-4 rounded-2xl flex flex-col justify-end">
               <div className="flex justify-between items-start mb-2">
                 <Users className="w-4 h-4 text-blue-400" />
               </div>
               <h3 className="font-bold text-2xl text-white">92<span className="text-sm font-medium text-white/50">%</span></h3>
               <p className="text-xs text-white/60 font-medium">Cohérence Évaluateurs</p>
            </div>
          </div>
        </section>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* IA Model Performance */}
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="mb-8">
            <h2 className="text-lg font-semibold tracking-tight">Stabilité des Modèles IA (Gemini)</h2>
            <p className="text-sm text-gray-400">Taux de succès des appels API et structuration JSON</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="success" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSuccess)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Prediction Turnover (9-Box context) */}
        <section className="bg-[#111827] text-white p-8 rounded-3xl border border-gray-800 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BrainCircuit className="w-48 h-48" />
          </div>
          <div className="mb-8 relative z-10">
            <h2 className="text-lg font-semibold tracking-tight text-white">Prédiction de Turnover par Ancienneté</h2>
            <p className="text-sm text-gray-400">Analyse croisée via le module d'IA prédictive</p>
          </div>
          <div className="h-64 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TALENT_RISK_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip cursor={{ fill: '#1f2937' }} contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #374151', color: 'white' }} />
                <Bar dataKey="riskHigh" name="Risque Élevé" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="riskMid" name="Risque Moyen" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="riskLow" name="Risque Faible" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 9-Box Matrix Talent Module */}
      <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mt-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold tracking-tight">Talent Module : Matrice 9-Box</h2>
          <p className="text-sm text-gray-500">Cartographie générée automatiquement par l'IA sur la base du scoring et des évaluations continues.</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100">
          {NINE_BOX.map((box, i) => (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.05 }}
               key={box.id} 
               className={`p-4 rounded-xl border flex flex-col justify-between h-28 ${box.color}`}
             >
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">Box {box.id}</span>
                <div>
                   <h4 className="font-bold text-sm leading-tight">{box.title}</h4>
                   <p className="text-[10px] mt-1 opacity-80">{box.desc}</p>
                </div>
             </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest px-4">
           <span>Faible Perf.</span>
           <span>Performance de l'employé</span>
           <span>Haute Perf.</span>
        </div>
      </section>
      
      {/* Simulation Module Details */}
      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 flex items-center justify-between">
        <div>
           <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Architecture en arrière-plan</h3>
           <p className="text-gray-700 font-medium max-w-xl">
             Le module Insights reçoit ses événements asynchrones ("Event-driven"). 
             Dès qu'une <i>Evaluation</i> ou un <i>Chatbot complet</i> est intercepté dans la queue,
             le pipeline NLP extrait les entités (CVs) et alimente ce tableau de bord.
           </p>
        </div>
        <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-semibold shadow-sm hover:bg-gray-100 transition-colors text-sm">
           Exporter le Dataset PDF
        </button>
      </div>

    </div>
  );
}
