import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useJobs } from "../contexts/JobsContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { useNavigate } from "react-router-dom";
import { Building2, Calendar, MapPin, Briefcase, CheckCircle2, ChevronRight, FileCheck2, AlertCircle, FileText, Sparkles, ArrowRight } from "lucide-react";

export function JobRequisition() {
  const { user } = useAuth();
  const { addJob } = useJobs();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [reqType, setReqType] = useState<"remplacement" | "creation">("creation");
  const [contractType, setContractType] = useState<"CDI" | "CDD" | "Freelance" | "Stage">("CDI");
  const [title, setTitle] = useState("");
  const [site, setSite] = useState("");
  const [functionName, setFunctionName] = useState(user?.grade || "");
  const [isBudgeted, setIsBudgeted] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [salary, setSalary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sécurité Principale (Route Guard Stricte)
  const isAllowed = user?.role === "DIR_HIERARCHIQUE" || user?.role === "DIR_FONCTIONNEL" || user?.role === "SUPER_ADMIN";

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-full">
        <AlertCircle className="w-16 h-16 text-violet-500 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Non Autorisé</h2>
        <p className="text-gray-500 max-w-md">
          Seuls les <strong>Directeurs Hiérarchiques</strong> et <strong>Fonctionnels</strong> ont les droits requis pour ouvrir une nouvelle réquisition.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Add real job creation via context
    try {
      await addJob({
        title,
        dept: functionName || "Général",
        location: site,
        type: contractType,
        author_id: user?.id,
        salary
      });
      
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        addNotification(`Nouvelle réquisition créée: ${title}. En attente de validation.`, "info");
        setTimeout(() => navigate('/app/approvals'), 3000);
      }, 800);

    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const getTimelineSteps = () => {
    const baseEnd = [
      { label: 'Directeur RH', role: 'DIR_RH', status: 'pending' },
      { label: 'Directeur Général', role: 'DIR_GENERAL', status: 'pending' }
    ];

    if (user?.role === 'DIR_FONCTIONNEL') {
      return [
        { label: 'Dir. Fonctionnel', role: 'DIR_FONCTIONNEL', status: 'initiated' },
        { label: 'Dir. Hiérarchique', role: 'DIR_HIERARCHIQUE', status: 'pending' },
        ...baseEnd
      ];
    }

    return [
      { label: 'Dir. Hiérarchique', role: 'DIR_HIERARCHIQUE', status: 'initiated' },
      { label: 'Dir. Fonctionnel', role: 'DIR_FONCTIONNEL', status: 'pending' },
      ...baseEnd
    ];
  };

  const stepsList = getTimelineSteps();

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Lancer un Recrutement</h1>
          <p className="text-violet-600 mt-1 font-bold tracking-widest text-[10px] uppercase">Evolia HR &middot; Réquisition de Talents</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white p-16 rounded-[2rem] text-center border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-green-100">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Réquisition Enregistrée</h2>
            <p className="text-gray-500 mb-8 font-medium max-w-lg mx-auto">
              L'IA Evolia a validé votre requête. Le workflow d'approbation est lancé et une notification a été envoyée au signataire suivant.
            </p>
            <div className="flex items-center justify-center gap-2 text-violet-600 font-bold uppercase tracking-widest text-xs">
              <div className="animate-spin w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full" />
              Redirection en cours...
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(124,58,237,0.08)] transition-all duration-500">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Briefcase className="w-64 h-64" />
              </div>

              <div className="relative z-10 space-y-10">
                
                {/* Switches Header */}
                <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-gray-100">
                  <div className="space-y-3 flex-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">Nature du poste</label>
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl w-full">
                      <button type="button" onClick={() => setReqType('creation')} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${reqType === 'creation' ? 'bg-white text-violet-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}>Création</button>
                      <button type="button" onClick={() => setReqType('remplacement')} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${reqType === 'remplacement' ? 'bg-white text-violet-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}>Remplacement</button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">Type de contrat</label>
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl w-full">
                      {(['CDI', 'CDD', 'Freelance', 'Stage'] as const).map(ct => (
                        <button 
                          key={ct} 
                          type="button" 
                          onClick={() => setContractType(ct)} 
                          className={`flex-1 px-3 py-3 rounded-xl text-xs font-bold transition-all ${contractType === ct ? 'bg-white text-violet-700 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                          {ct}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1"><FileText className="w-3.5 h-3.5 text-violet-500"/> Intitulé du Poste</label>
                    <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900 text-lg placeholder-gray-300" placeholder="Ex: Développeur Senior React..." />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1"><MapPin className="w-3.5 h-3.5 text-violet-500"/> Lieu / Site d'affectation</label>
                    <input required type="text" value={site} onChange={e => setSite(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900 placeholder-gray-300" placeholder="Ex: Paris - Siège Social" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1"><Building2 className="w-3.5 h-3.5 text-gray-400"/> Département Demandeur</label>
                    <input required type="text" value={functionName} onChange={e => setFunctionName(e.target.value)} disabled className="w-full px-5 py-4 bg-gray-100/80 text-gray-500 border border-gray-200/80 rounded-2xl cursor-not-allowed font-medium opacity-80" />
                  </div>
                </div>

                {/* Financials & Target Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Inclus au budget ?</label>
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl">
                      <button type="button" onClick={() => setIsBudgeted(true)} className={`flex-1 px-4 py-3.5 rounded-xl text-xs font-bold transition-all ${isBudgeted ? 'bg-[#0B1E36] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Confirmé</button>
                      <button type="button" onClick={() => setIsBudgeted(false)} className={`flex-1 px-4 py-3.5 rounded-xl text-xs font-bold transition-all ${!isBudgeted ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Hors Budget</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1"><Calendar className="w-3.5 h-3.5 text-violet-500"/> Début Souhaité</label>
                    <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1"><Briefcase className="w-3.5 h-3.5 text-violet-500"/> Salaire Mensuel (MAD)</label>
                    <input required type="number" min="0" step="500" value={salary} onChange={e => setSalary(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900 placeholder-gray-300" placeholder="Ex: 15000" />
                  </div>
                </div>

                <div className="pt-8 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="group flex items-center gap-3 px-10 py-5 bg-black text-white font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-violet-600 transition-all disabled:opacity-70 shadow-xl hover:shadow-[0_8px_30px_rgb(124,58,237,0.3)]">
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Lancement...
                      </span>
                    ) : (
                      <>
                        Confirmer la Requête
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Circuit d'approbation Preview */}
            <div className="bg-[#FAF9F8] border border-gray-200 p-8 md:p-10 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Workflow Automatisé</h3>
                  <p className="text-sm font-semibold text-gray-900">Circuit d'approbation prévisionnel</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                {stepsList.map((step, idx) => {
                   const status = step.status;
                   const bg = status === 'initiated' ? 'bg-white border-violet-500 shadow-sm' : status === 'passed' ? 'bg-white border-gray-200' : 'bg-transparent border-gray-300 border-dashed opacity-60';
                   return (
                     <div key={idx} className={`relative p-5 rounded-2xl border-2 flex-1 transition-all ${bg}`}>
                       <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{step.label}</div>
                       {status === 'initiated' && <div className="text-sm font-bold text-violet-700">Initié par {user?.nom}</div>}
                       {status !== 'initiated' && <div className="text-sm font-semibold text-gray-500">En attente</div>}
                       {idx !== 3 && <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-gray-300 w-6 h-6 z-10 bg-[#FAF9F8]" />}
                     </div>
                   )
                })}
              </div>
              
              <div className="mt-8 text-xs font-bold uppercase tracking-widest text-violet-700/60 flex items-center gap-2">
                 <Sparkles className="w-4 h-4" />
                 L'IA Evolia alertera les signataires dès soumission.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
