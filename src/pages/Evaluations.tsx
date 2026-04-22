import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Search, CheckCircle2, ChevronRight, User, AlertCircle, Sparkles, BrainCircuit, Activity, Check, X, Download, Loader2 } from "lucide-react";
import { useEvaluations, EvalState } from "../contexts/EvaluationsContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { processCandidateByAI } from "../lib/gemini";
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Zap } from "lucide-react";

export function Evaluations() {
  const { evaluations, updateEvaluation, approveEvaluation, rejectEvaluation } = useEvaluations();
  const { addNotification } = useNotifications();
  const [selectedId, setSelectedId] = useState<number>(0);
  const [evalNotes, setEvalNotes] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (evaluations.length > 0 && selectedId === 0) {
      setSelectedId(evaluations[0].id);
    }
  }, [evaluations, selectedId]);

  const selectedEval = evaluations.find(e => e.id === selectedId) || evaluations[0];

  const handleSelectEval = (id: number) => {
    setSelectedId(id);
    setEvalNotes("");
  };

  const generateAIEvaluation = async () => {
    if (!selectedEval) return;
    
    // Étape 1 : Mettre en statut "ANALYZING"
    updateEvaluation(selectedEval.id, { status: "ANALYZING" });

    // Call Gemini AI
    const aiResult = await processCandidateByAI(selectedEval.name, selectedEval.role, evalNotes || "Notes d'entretien vides.");

    // Logic: Very good score (>= 80) -> Auto-Approved to move to Directors Workflow. 
    // Otherwise stays in Evaluations as 'COMPLETED' for manual review.
    let finalStatus: EvalState['status'] = "COMPLETED";
    if (aiResult.globalScore >= 80 || aiResult.decision === "APPROVED") {
      finalStatus = "APPROVED";
    } else if (aiResult.decision === "REJECTED") {
      finalStatus = "REJECTED";
    }

    updateEvaluation(selectedEval.id, {
      status: finalStatus,
      techScore: aiResult.techScore,
      cultureScore: aiResult.cultureScore,
      globalScore: aiResult.globalScore,
      strengths: aiResult.strengths,
      weaknesses: aiResult.weaknesses,
      recommendation: aiResult.recommendation,
      comments: evalNotes
    });

    addNotification(`L'IA NewGen Rh a terminé l'analyse de ${selectedEval.name} (Score global: ${aiResult.globalScore}/100)`, "info");

    if (finalStatus === "APPROVED") {
      addNotification(`Félicitations ! Le candidat ${selectedEval.name} est automatiquement validé pour l'étape suivante.`, "success");
    }
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current || !selectedEval) return;
    setIsDownloading(true);
    
    try {
      const element = documentRef.current;
      const dataUrl = await htmlToImage.toPng(element, { 
        quality: 1.0,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let finalWidth = pdfWidth - 20; // Margin
      let finalHeight = (imgProps.height * finalWidth) / imgProps.width;
      
      if (finalHeight > pageHeight - 20) {
        finalHeight = pageHeight - 20;
        finalWidth = (imgProps.width * finalHeight) / imgProps.height;
      }
      
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = 10;
      
      pdf.addImage(dataUrl, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      pdf.save(`Evaluation_Entretien_${selectedEval.name.replace(/\s+/g, '_')}.pdf`);
      addNotification("Document d'entretien téléchargé avec succès", "success");
    } catch (error) {
      console.error('Error generating PDF:', error);
      addNotification("Erreur lors du téléchargement du PDF", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-8 pb-8">
      {/* Colonne gauche : Liste des évaluations */}
      <div className="w-1/3 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden shrink-0">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold tracking-tight">Candidatures à Auditer</h2>
          <p className="text-sm text-gray-500 mt-1">Laissez l'IA analyser les profils</p>
          
          <div className="relative mt-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {evaluations.map((ev) => (
            <div 
              key={ev.id}
              onClick={() => handleSelectEval(ev.id)}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedEval.id === ev.id ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
            >
              <div>
                <h3 className={`font-semibold text-sm ${ev.status === "COMPLETED" ? 'text-gray-500' : 'text-gray-900'}`}>{ev.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{ev.role}</p>
              </div>
              <div>
                {ev.status === "APPROVED" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : ev.status === "REJECTED" ? (
                  <X className="w-5 h-5 text-red-500" />
                ) : ev.status === "COMPLETED" ? (
                  <BrainCircuit className="w-5 h-5 text-indigo-500" />
                ) : ev.status === "ANALYZING" ? (
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronRight className={`w-5 h-5 ${selectedEval.id === ev.id ? 'text-black' : 'text-gray-300'}`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Colonne droite : Profil et Action IA */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-y-auto relative">
        <motion.div 
          key={`${selectedEval.id}-${selectedEval.status}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 h-full flex flex-col"
        >
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{selectedEval.name}</h1>
                <p className="text-gray-500 mt-1">{selectedEval.role} • Parsing CV & Quiz : {selectedEval.date}</p>
              </div>
            </div>
            
            {(selectedEval.status === "COMPLETED" || selectedEval.status === "APPROVED") && (
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? "Génération..." : "Exporter Rapport IA (PDF)"}
              </button>
            )}
          </div>

          {selectedEval.status === "ANALYZING" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-50" />
                <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center relative z-10 shadow-lg">
                  <BrainCircuit className="w-10 h-10 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-2">L'IA évalue le profil...</h2>
              <div className="max-w-sm space-y-2 text-sm text-gray-500">
                <p className="animate-pulse">Analyse sémantique du CV et lettre de motivation...</p>
                <p className="animate-pulse delay-75">Croisement avec les scores du Quiz technique...</p>
                <p className="animate-pulse delay-150">Génération du "Global Fit Score"...</p>
              </div>
            </div>
          )}

          {selectedEval.status === "PENDING" && (
             <div className="flex-1 flex flex-col pt-4">
               <h2 className="text-xl font-semibold text-gray-900 mb-2">Saisie de l'Évaluation (Entretien)</h2>
               <p className="text-sm text-gray-500 mb-6">
                 Saisissez vos notes brutes d'entretien. L'IA va analyser vos commentaires, suggérer un score final et structurer le résumé.
               </p>
               
               <textarea 
                 value={evalNotes}
                 onChange={(e) => setEvalNotes(e.target.value)}
                 placeholder="Ex: Bonne aisance technique sur React, mais semble un peu rigide sur l'architecture. Très bon fit culturel avec l'équipe..."
                 className="flex-1 w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
               />

               <div className="flex justify-end mt-6">
                 <button 
                   onClick={generateAIEvaluation}
                   disabled={!evalNotes.trim()}
                   className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                 >
                   <BrainCircuit className="w-4 h-4" />
                   Générer Scoring & Résumé IA
                 </button>
               </div>
             </div>
          )}

          {(selectedEval.status === "COMPLETED" || selectedEval.status === "APPROVED" || selectedEval.status === "REJECTED") && (
            <div className="flex-1 flex flex-col pt-2 animate-in fade-in duration-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 bg-indigo-50/50 text-indigo-800 px-4 py-3 rounded-xl border border-indigo-100">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-sm">Évaluation générée par AI Scoring Module</span>
                </div>
                {selectedEval.status === "APPROVED" && (
                  <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-100 flex items-center gap-2 text-sm font-bold animate-pulse">
                    <CheckCircle2 className="w-4 h-4" />
                    CANDIDAT APPROUVÉ
                  </div>
                )}
                {selectedEval.status === "REJECTED" && (
                  <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 flex items-center gap-2 text-sm font-bold">
                    <X className="w-4 h-4" />
                    CANDIDATURE REJETÉE
                  </div>
                )}
              </div>

              {/* Ligne des Scores - Perfected match to photo */}
              <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="bg-white border border-gray-100/80 p-8 rounded-[2rem] flex flex-col items-center text-center shadow-sm transition-all hover:shadow-md">
                   <Activity className="w-8 h-8 text-gray-300 mb-4 opacity-70" />
                   <div className="flex items-baseline gap-1 mb-1.5">
                     <span className="text-5xl font-extrabold text-gray-900 tracking-tighter">{selectedEval.techScore}</span>
                     <span className="text-lg text-gray-400 font-semibold">/100</span>
                   </div>
                   <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">Score Technique</span>
                </div>
                <div className="bg-white border border-gray-100/80 p-8 rounded-[2rem] flex flex-col items-center text-center shadow-sm transition-all hover:shadow-md">
                   <User className="w-8 h-8 text-gray-300 mb-4 opacity-70" />
                   <div className="flex items-baseline gap-1 mb-1.5">
                     <span className="text-5xl font-extrabold text-gray-900 tracking-tighter">{selectedEval.cultureScore}</span>
                     <span className="text-lg text-gray-400 font-semibold">/100</span>
                   </div>
                   <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">Fit Culturel</span>
                </div>
                <div className="bg-[#0B1E36] border border-[#16335A] p-8 rounded-[2rem] flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                   <BrainCircuit className="w-8 h-8 text-[#8C5E3C] mb-4 relative z-10 opacity-90 animate-pulse" />
                   <div className="flex items-baseline gap-1 mb-1.5 relative z-10">
                     <span className="text-5xl font-extrabold text-white tracking-tighter">{selectedEval.globalScore}</span>
                     <span className="text-lg text-white/40 font-semibold">/100</span>
                   </div>
                   <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8C5E3C] relative z-10">Global AI Score</span>
                </div>
              </div>

              {/* Ligne Analyse Textuelle - High fidelity match */}
              <div className="grid grid-cols-2 gap-10 mb-10 flex-1">
                 <div>
                   <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-green-600 mb-6 pl-1">Forces Principales</h3>
                   <ul className="space-y-4">
                     {selectedEval.strengths.map((str, idx) => (
                       <li key={idx} className="bg-green-50/20 border border-green-100/40 text-gray-700 text-sm py-4 px-5 rounded-2xl flex items-center gap-4 font-medium shadow-sm">
                         <div className="w-2 h-2 bg-green-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                         {str}
                       </li>
                     ))}
                   </ul>
                 </div>
                 <div>
                   <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-red-600 mb-6 pl-1">Points de Vigilance</h3>
                   <ul className="space-y-4">
                     {selectedEval.weaknesses.map((wk, idx) => (
                       <li key={idx} className="bg-red-50/20 border border-red-100/40 text-gray-700 text-sm py-4 px-5 rounded-2xl flex items-center gap-4 font-medium shadow-sm">
                         <div className="w-2 h-2 bg-red-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                         {wk}
                       </li>
                     ))}
                   </ul>
                 </div>
              </div>

              {/* Recommandation & Actions - Bottom Bar fidelity */}
              <div className="mt-auto bg-[#FBF9F6] border border-[#EBE6DE] rounded-[2.5rem] p-8 flex items-center justify-between shadow-sm">
                <div className="max-w-md">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Recommandation du Système</h3>
                  <p className="text-[#0B1E36] font-bold text-2xl font-serif tracking-tight leading-none">
                    {selectedEval.recommendation}
                  </p>
                </div>
                
                {selectedEval.status === "COMPLETED" && (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => rejectEvaluation(selectedEval.id)}
                      className="bg-white border border-gray-200 px-8 py-4 rounded-2xl text-sm font-bold text-red-500 shadow-sm hover:bg-red-50 hover:border-red-100 transition-all flex items-center gap-2 active:scale-95"
                    >
                      <X className="w-4 h-4" />
                      Refuser
                    </button>
                    <button 
                      onClick={() => approveEvaluation(selectedEval.id)}
                      className="bg-[#0B1E36] px-10 py-4 rounded-2xl text-sm font-bold text-white shadow-xl hover:shadow-[#0B1E36]/40 hover:bg-[#16335A] transition-all flex items-center gap-2 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      Approuver le candidat
                    </button>
                  </div>
                )}

                {selectedEval.status === "APPROVED" && (
                   <div className="bg-white/60 text-gray-500 px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold opacity-60">
                     Action désactivée : Déjà Dossier
                   </div>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </div>

      {/* --- HIDDEN PRINT VIEW FOR INTERVIEW REPORT --- */}
      <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none opacity-0">
        <div ref={documentRef} className="bg-white p-12" style={{ width: "850px", color: "#0B1E36" }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-16 border-b-2 border-[#0B1E36] pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-7 h-7 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-[#0B1E36]">NewGen <span className="text-indigo-600">Rh</span></h1>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">AI Intelligence Core</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-[#0B1E36] text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest mb-2">Rapport d'Entretien IA</div>
              <p className="text-xs text-gray-500 font-mono">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Candidate Info Card */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-4">Informations Candidat</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-xs text-gray-500">Nom Complet:</span> <span className="text-sm font-bold underline underline-offset-4 decoration-indigo-200">{selectedEval.name}</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-500">Poste Visé:</span> <span className="text-sm font-bold">{selectedEval.role}</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-500">Date Evaluation:</span> <span className="text-sm font-bold">{selectedEval.date}</span></div>
              </div>
            </div>
            <div className="bg-[#0B1E36] p-6 rounded-2xl relative overflow-hidden">
               <div className="absolute right-0 bottom-0 opacity-10">
                 <BrainCircuit className="w-24 h-24 text-white" />
               </div>
               <h3 className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest mb-2 relative z-10">Score Global Nexa Match</h3>
               <div className="text-6xl font-black text-white tracking-tighter relative z-10">{selectedEval.globalScore}<span className="text-2xl text-white/40">/100</span></div>
               <p className="text-[10px] text-white/60 mt-2 font-medium">Analyse basée sur 14 points de données sémantiques</p>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-2 gap-8 mb-12">
             <div className="border-l-4 border-indigo-500 pl-4 py-1">
                <div className="text-sm font-bold text-indigo-600 mb-1">Score Technique</div>
                <div className="flex items-center gap-3">
                   <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${selectedEval.techScore}%` }}></div>
                   </div>
                   <span className="text-lg font-black text-[#0B1E36]">{selectedEval.techScore}%</span>
                </div>
             </div>
             <div className="border-l-4 border-emerald-500 pl-4 py-1">
                <div className="text-sm font-bold text-emerald-600 mb-1">Fit Culturel</div>
                <div className="flex items-center gap-3">
                   <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${selectedEval.cultureScore}%` }}></div>
                   </div>
                   <span className="text-lg font-black text-[#0B1E36]">{selectedEval.cultureScore}%</span>
                </div>
             </div>
          </div>

          {/* Summary */}
          <div className="mb-12">
            <h3 className="text-lg font-black text-[#0B1E36] mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Recommandation Stratégique
            </h3>
            <div className="bg-[#FBF9F6] p-6 rounded-2xl border border-[#EBE6DE] italic text-lg leading-relaxed font-serif text-[#0B1E36]">
              "{selectedEval.recommendation}"
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-12">
             <div>
                <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-green-600" /></div>
                  Points Forts
                </h4>
                <div className="space-y-4">
                   {selectedEval.strengths.map((s, i) => (
                      <div key={i} className="flex gap-3">
                         <span className="text-green-500 text-sm mt-0.5">•</span>
                         <p className="text-sm text-gray-700 leading-snug">{s}</p>
                      </div>
                   ))}
                </div>
             </div>
             <div>
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center"><X className="w-2.5 h-2.5 text-red-600" /></div>
                  Risques / Vigilance
                </h4>
                <div className="space-y-4">
                   {selectedEval.weaknesses.map((w, i) => (
                      <div key={i} className="flex gap-3">
                         <span className="text-red-500 text-sm mt-0.5">•</span>
                         <p className="text-sm text-gray-700 leading-snug">{w}</p>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Footer Branding */}
          <div className="mt-24 pt-8 border-t border-gray-100 flex justify-between items-center opacity-40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Document Confidentiel - Réservé aux RH</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Powered by NewGen Rh AI</span>
          </div>

        </div>
      </div>
    </div>
  );
}
