import { useState } from "react";
import { motion } from "motion/react";
import { useAuth, Role } from "../contexts/AuthContext";
import { useJobs } from "../contexts/JobsContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { useNavigate } from "react-router-dom";
import { Building2, Calendar, MapPin, Briefcase, CheckCircle2, ChevronRight, FileCheck2, AlertCircle } from "lucide-react";

export function JobRequisition() {
  const { user } = useAuth();
  const { addJob } = useJobs();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [reqType, setReqType] = useState<"remplacement" | "creation">("creation");
  const [title, setTitle] = useState("");
  const [site, setSite] = useState("");
  const [functionName, setFunctionName] = useState(user?.grade || "");
  const [isBudgeted, setIsBudgeted] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [salary, setSalary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sécurité Principale (Route Guard Stricte)
  const isAllowed = user?.role === "DIR_HIERARCHIQUE" || user?.role === "DIR_FONCTIONNEL";

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Non Autorisé</h2>
        <p className="text-gray-500 max-w-md">
          Seuls le <strong>Directeur Hiérarchique</strong> et le <strong>Directeur Fonctionnel</strong> ont les droits requis pour ouvrir une nouvelle réquisition de talent.
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
        type: reqType === 'remplacement' ? 'CDD' : 'CDI', // Simplified
        author_id: user?.id,
        salary
      });
      
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        addNotification(`Nouvelle réquisition créée: ${title}. En attente de validation.`, "info");
        setTimeout(() => navigate('/app/approvals'), 3000);
      }, 500);

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
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-serif text-[#0B1E36] tracking-tight">Nouvelle Réquisition de Talent</h1>
        <p className="text-[#8C5E3C] mt-2 font-medium tracking-wide text-sm uppercase">Business Partner &middot; Espace Manager</p>
      </div>

      {isSuccess ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#F4F1EA] p-12 rounded-3xl text-center border border-[#E5E0D8]">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-[#8C5E3C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0B1E36] mb-2">Réquisition soumise avec succès</h2>
          <p className="text-gray-600 mb-6 font-medium">
            Le Workflow d'approbation est lancé. Une notification a été envoyée au <strong>{user?.role === 'DIR_FONCTIONNEL' ? 'Directeur Hiérarchique' : 'Directeur Fonctionnel'}</strong> pour validation initiale.
          </p>
          <div className="animate-spin w-6 h-6 border-2 border-[#8C5E3C] border-t-transparent rounded-full mx-auto" />
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Formulaire Principal. Palette: Navy Blue bg / Beige canvas / Marron actions */}
          <form onSubmit={handleSubmit} className="bg-[#F4F1EA] p-8 rounded-3xl border border-[#E5E0D8] shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Building2 className="w-48 h-48" />
            </div>

            <div className="relative z-10 space-y-8">
              {/* Type Switcher */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Type de Réquisition</label>
                <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 w-fit">
                  <button type="button" onClick={() => setReqType('remplacement')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${reqType === 'remplacement' ? 'bg-[#0B1E36] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>Remplacement</button>
                  <button type="button" onClick={() => setReqType('creation')} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${reqType === 'creation' ? 'bg-[#0B1E36] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>Création de Poste</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Briefcase className="w-4 h-4"/> Intitulé du Poste</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all" placeholder="ex: Responsable Assistance Technique" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-4 h-4"/> Site / Succursale</label>
                  <input required type="text" value={site} onChange={e => setSite(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all" placeholder="ex: Siège Social - Paris" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Building2 className="w-4 h-4"/> Département (Pré-rempli)</label>
                  <input required type="text" value={functionName} onChange={e => setFunctionName(e.target.value)} disabled className="w-full px-4 py-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-[#E5E0D8]/50">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inclus au budget ?</label>
                  <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 w-fit">
                    <button type="button" onClick={() => setIsBudgeted(true)} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${isBudgeted ? 'bg-[#8C5E3C] text-white shadow-sm' : 'text-gray-600'}`}>Oui</button>
                    <button type="button" onClick={() => setIsBudgeted(false)} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${!isBudgeted ? 'bg-[#8C5E3C] text-white shadow-sm' : 'text-gray-600'}`}>Non</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-4 h-4"/> Date d'application</label>
                  <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all text-gray-700" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Briefcase className="w-4 h-4"/> Salaire Mensuel (MAD)</label>
                  <input required type="number" min="0" step="500" value={salary} onChange={e => setSalary(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all" placeholder="ex: 15000" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 bg-[#0B1E36] text-white font-semibold rounded-xl hover:bg-[#16335A] transition-colors disabled:opacity-70">
                  {isSubmitting ? 'Traitement asynchrone...' : 'Émettre la Requête'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Circuit d'approbation Preview */}
          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-4 mb-6">
               <FileCheck2 className="w-5 h-5 text-[#8C5E3C]" /> Circuit d'Approbation Prévisionnel
            </h3>
            
            <div className="grid grid-cols-4 gap-4">
              {stepsList.map((step, idx) => {
                 const status = step.status;
                 const bg = status === 'initiated' ? 'bg-[#F4F1EA] border-[#8C5E3C] border-2' : status === 'passed' ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200 opacity-50 text-gray-400 border-dashed';
                 return (
                   <div key={idx} className={`relative p-4 rounded-2xl ${bg}`}>
                     <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{step.label}</div>
                     {status === 'initiated' && <div className="text-sm font-semibold text-[#8C5E3C]">Initié par {user?.nom}</div>}
                     {status !== 'initiated' && <div className="text-sm font-medium">En attente</div>}
                     {idx !== 3 && <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 z-10" />}
                   </div>
                 )
              })}
            </div>
            
            <div className="mt-6 text-xs text-gray-400 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
               <span>L'approbation asynchrone est configurée pour alerter les signataires un par un.</span>
               <span className="font-mono bg-white px-2 py-1 rounded">RÈGLES D'ENTREPRISE STRICTES APPLIQUÉES</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
