import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UploadCloud, ChevronRight, ChevronLeft, Check, Briefcase, User, MapPin, Phone, GraduationCap, FileText, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useJobs } from "../contexts/JobsContext";
import { useEvaluations } from "../contexts/EvaluationsContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { processCandidateByAI } from "../lib/gemini";

export function JobApplication() {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const { addEvaluation } = useEvaluations();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedJobId = searchParams.get('jobId') || "";

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [selectedJob, setSelectedJob] = useState<string>(preselectedJobId);
  const [firstName, setFirstName] = useState(user?.prenom || "");
  const [lastName, setLastName] = useState(user?.nom || "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 1. Find the job title
    const jobOffer = jobs.find(j => j.id.toString() === selectedJob);
    const roleName = jobOffer ? jobOffer.title : "Candidature Spontanée";
    const candidateName = `${firstName} ${lastName}`.trim() || 'Candidat Anonyme';
    
    // Simulate parsing success
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      addNotification(`Dossier de ${candidateName} reçu. Passage à l'entretien IA.`, "info");

      // Redirect to Interview instead of dashboard
      setTimeout(() => {
        navigate("/app/interview", { 
          state: { 
            candidateName, 
            roleName, 
            jobId: selectedJob,
            email: user?.email
          } 
        });
      }, 3000);
    }, 1500);
  };



  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#F4F1EA] rounded-[2rem] border border-[#E5E0D8] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#8C5E3C] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#002147] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-blob animation-delay-2000" />

      {isSuccess ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="text-center z-10 flex flex-col items-center bg-white p-12 rounded-[2rem] shadow-xl border border-[#E5E0D8]"
        >
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-[#002147] text-3xl font-serif font-bold mb-4">Candidature Transmise</h2>
          <p className="text-gray-500 max-w-md mb-8">
            Notre Intelligence Artificielle est en train d'analyser votre profil. Votre dossier sera transmis au Directeur Hiérarchique avec notre "AI Scoring".
          </p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3 }}
              className="h-full bg-[#002147]"
            />
          </div>
        </motion.div>
      ) : (
        <div className="w-full max-w-2xl bg-white p-10 rounded-[2rem] shadow-xl border border-[#E5E0D8] relative z-10">
          
          {/* Header & Progress */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold font-serif text-[#002147] mb-2 tracking-tight">Dossier de Candidature</h1>
            <p className="text-[#8C5E3C] font-medium tracking-wide text-sm uppercase">Processus de recrutement</p>
            
            <div className="flex items-center justify-center mt-8 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step >= i ? 'bg-[#002147] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {step > i ? <Check className="w-4 h-4" /> : i}
                  </div>
                  {i < 4 && (
                    <div className={`w-12 h-1 transition-all duration-300 ${step > i ? 'bg-[#002147]' : 'bg-gray-100'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
            <AnimatePresence mode="wait">
              {/* ÉTAPE 1 : Informations Personnelles */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1"><User className="w-3 h-3 inline mr-1 mb-0.5"/> Prénom</label>
                      <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all" />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1">Nom</label>
                      <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1">Email</label>
                      <input required type="email" defaultValue={user?.email} className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all" />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1"><Phone className="w-3 h-3 inline mr-1 mb-0.5"/> Téléphone</label>
                      <input required type="tel" className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all" />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1"><MapPin className="w-3 h-3 inline mr-1 mb-0.5"/> Ville</label>
                      <input required type="text" className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ÉTAPE 2 : Détails Professionnels */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1"><Briefcase className="w-3 h-3 inline mr-1 mb-0.5"/> Poste convoité</label>
                      <select required value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all appearance-none cursor-pointer">
                        <option value="">Sélectionnez un poste...</option>
                        {jobs.filter(job => job.status === 'OPEN').map(job => (
                          <option key={job.id} value={job.id}>
                            {job.title} - {job.dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1">Disponibilité</label>
                      <select required className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all appearance-none cursor-pointer">
                        <option value="immediate">Immédiate</option>
                        <option value="1_month">1 Mois</option>
                        <option value="3_months">3 Mois (Préavis)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1">Prétentions Salariales (Annuel)</label>
                      <div className="relative">
                        <input required type="number" step="1000" className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">MAD</span>
                      </div>
                    </div>
                </motion.div>
              )}

              {/* ÉTAPE 3 : Expériences */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1"><GraduationCap className="w-3 h-3 inline mr-1 mb-0.5"/> Dernière expérience pertinente</label>
                      <input required type="text" placeholder="Ex: Lead Developer chez EntrepriseX" className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] focus:ring-1 focus:ring-[#8C5E3C] transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1">Années d'expérience totale</label>
                        <input required type="number" min="0" className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1">Site / LinkedIn</label>
                        <input type="url" placeholder="https://" className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#002147]/60 uppercase tracking-widest pl-1">Courte description (Summary)</label>
                      <textarea required rows={3} className="w-full bg-[#F4F1EA]/50 border border-[#E5E0D8] px-4 py-3 rounded-xl text-[#002147] focus:outline-none focus:border-[#8C5E3C] transition-all resize-none" placeholder="Résumez vos compétences clés..." />
                    </div>
                </motion.div>
              )}

              {/* ÉTAPE 4 : Upload CV */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                   <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                     <p className="text-sm text-blue-800 text-center">
                       Votre CV sera analysé par notre module de <strong>Scoring IA</strong>. <br/>Veuillez soumettre un document lisible (PDF).
                     </p>
                   </div>
                   
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${file ? 'border-[#8C5E3C] bg-[#8C5E3C]/5' : 'border-[#E5E0D8] hover:border-[#002147] bg-[#F4F1EA]/30'}`}
                   >
                     <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                     
                     {file ? (
                       <div className="flex flex-col items-center">
                         <div className="w-16 h-16 bg-[#8C5E3C]/10 rounded-full flex items-center justify-center mb-4">
                           <FileText className="w-8 h-8 text-[#8C5E3C]" />
                         </div>
                         <h3 className="font-semibold text-[#002147] text-lg">{file.name}</h3>
                         <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                         <button type="button" className="text-sm text-[#8C5E3C] font-semibold mt-4 hover:underline" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                           Changer le document
                         </button>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center">
                         <div className="w-16 h-16 bg-[#002147]/5 rounded-full flex items-center justify-center mb-4">
                           <UploadCloud className="w-8 h-8 text-[#002147]" />
                         </div>
                         <h3 className="font-semibold text-[#002147] mb-1">Cliquez ou glissez votre CV ici</h3>
                         <p className="text-sm text-gray-500">PDF, DOCX jusqu'à 5 MB</p>
                       </div>
                     )}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#E5E0D8]">
              <button 
                type="button" 
                onClick={prevStep}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>
              
              <button 
                type="submit" 
                disabled={isSubmitting || (step === 4 && !file)}
                className="flex items-center gap-2 px-8 py-3 bg-[#002147] text-white rounded-xl font-semibold shadow-lg hover:bg-[#8C5E3C] transition-all disabled:opacity-50 disabled:hover:bg-[#002147]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Traitement IA...
                  </span>
                ) : step === 4 ? (
                  <>Transmettre <Check className="w-4 h-4" /></>
                ) : (
                  <>Continuer <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>

        </div>
      )}
    </div>
  );
}
