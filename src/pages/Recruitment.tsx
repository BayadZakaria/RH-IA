import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Search, Filter, Briefcase, Brain, Clock, MoreHorizontal, AlertCircle } from "lucide-react";
import { useEvaluations } from "../contexts/EvaluationsContext";

type StageId = "NEW" | "IA_SCREENING" | "INTERVIEW" | "APPROVAL";

const STAGES: { id: StageId; title: string; color: string; bg: string; text: string }[] = [
  { id: "NEW", title: "Nouveaux", color: "border-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  { id: "IA_SCREENING", title: "Analyse IA", color: "border-purple-500", bg: "bg-purple-50", text: "text-purple-700" },
  { id: "INTERVIEW", title: "Entretiens", color: "border-orange-500", bg: "bg-orange-50", text: "text-orange-700" },
  { id: "APPROVAL", title: "Décision Finale", color: "border-green-500", bg: "bg-green-50", text: "text-green-700" }
];

export function Recruitment() {
  const { evaluations } = useEvaluations();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Map Evaluations to Recruitment Board
  const mappedCandidates = evaluations.map(ev => {
    let stage: StageId = "NEW";
    if (ev.status === "ANALYZING") stage = "IA_SCREENING";
    if (ev.status === "COMPLETED") stage = "INTERVIEW";
    if (ev.status === "APPROVED" || ev.status === "REJECTED") stage = "APPROVAL";

    return {
      id: ev.id,
      name: ev.name,
      role: ev.role,
      stage,
      aiScore: ev.globalScore > 0 ? ev.globalScore : null,
      time: ev.date,
      alert: ev.status === "REJECTED",
      status: ev.status
    };
  });

  const filteredCandidates = mappedCandidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pipeline de Recrutement</h1>
          <p className="text-gray-500 mt-2">Suivez vos candidats et laissez l'IA qualifier les profils.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Filtres
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau Candidat
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 shrink-0 max-w-md">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Rechercher un candidat, un poste..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-gray-900 font-medium shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x">
        {STAGES.map((stage) => {
          const colCandidates = filteredCandidates.filter(c => c.stage === stage.id);
          
          return (
            <div key={stage.id} className="min-w-[320px] w-[320px] flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 snap-center shrink-0">
              {/* Column Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full border-2 ${stage.color} ${stage.bg}`} />
                  <h3 className="font-semibold text-sm text-gray-900">{stage.title}</h3>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${stage.bg} ${stage.text}`}>
                  {colCandidates.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {colCandidates.map((candidate, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={candidate.id}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">{candidate.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          <Briefcase className="w-3 h-3" />
                          <span>{candidate.role}</span>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      
                      {/* AI Score / Status Indicator */}
                      <div className="flex items-center gap-2">
                        {candidate.aiScore ? (
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${candidate.aiScore > 90 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                            <Brain className="w-3 h-3" />
                            <span>Match {candidate.aiScore}%</span>
                          </div>
                        ) : candidate.alert ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-700">
                            <AlertCircle className="w-3 h-3" />
                            <span>Action requise</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
                            <span>En attente...</span>
                          </div>
                        )}
                      </div>

                      {/* Time Marker */}
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{candidate.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {colCandidates.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                    <span className="text-xs font-medium text-gray-400">Aucun candidat</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Simple overlay mock for add modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
          >
            <h2 className="text-xl font-semibold mb-6">Ajouter un candidat</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Prénom et Nom" className="form-input" />
              <input type="email" placeholder="Email du candidat" className="form-input" />
              <input type="text" placeholder="Intitulé du poste" className="form-input" />
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors">
                Gilssez-déposez le CV (PDF) pour le parsing IA
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-colors">
                  Annuler
                </button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 bg-black text-white font-semibold rounded-xl text-sm hover:bg-gray-800 transition-colors">
                  Créer candidat
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
