import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UploadCloud, ChevronRight, ChevronLeft, Check, Briefcase, User, MapPin, Phone, GraduationCap, FileText, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useJobs } from "../contexts/JobsContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { parseResume } from "../lib/gemini";
import mammoth from "mammoth";

export function JobApplication() {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedJobId = searchParams.get('jobId') || "";

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  const [selectedJob, setSelectedJob] = useState<string>(preselectedJobId);
  const [firstName, setFirstName] = useState(user?.prenom || "");
  const [lastName, setLastName] = useState(user?.nom || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [lastExperience, setLastExperience] = useState("");
  const [totalYears, setTotalYears] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [summary, setSummary] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (selectedFile: File) => {
    console.log("File selected for parsing:", selectedFile.name, selectedFile.type);
    setFile(selectedFile);
    setIsParsing(true);
    addNotification("Document reçu. Analyse IA en cours...", "info");

    try {
      let extractedData = null;
      const isDocx = selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
                    selectedFile.name.toLowerCase().endsWith('.docx');
      const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        console.log("Processing as PDF...");
        const base64String = await readFileAsBase64(selectedFile);
        extractedData = await parseResume({ base64: base64String, mimeType: "application/pdf" });
      } else if (isDocx) {
        console.log("Processing as DOCX with mammoth...");
        const arrayBuffer = await selectedFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedData = await parseResume({ text: result.value });
      } else {
        console.warn("Unsupported format for AI magic, falling back to manual.");
        addNotification("Ce format n'est pas supporté pour le remplissage auto. Veuillez compléter manuellement.", "warning");
        setIsParsing(false);
        return;
      }
      
      if (extractedData) {
        console.log("Data extracted from CV:", extractedData);
        if (extractedData.firstName) setFirstName(extractedData.firstName);
        if (extractedData.lastName) setLastName(extractedData.lastName);
        if (extractedData.email && (!email || email === user?.email)) setEmail(extractedData.email);
        if (extractedData.phone) setPhone(extractedData.phone);
        if (extractedData.city) setCity(extractedData.city);
        if (extractedData.lastExperience) setLastExperience(extractedData.lastExperience);
        if (extractedData.totalYearsExperience) setTotalYears(extractedData.totalYearsExperience.toString());
        if (extractedData.linkedinUrl) setLinkedin(extractedData.linkedinUrl);
        if (extractedData.summary) setSummary(extractedData.summary);
        
        addNotification("Analyse terminée ! Vos informations ont été pré-remplies.", "success");
        // Slight delay to let the user see the success state before moving
        setTimeout(() => {
          nextStep();
        }, 800);
      } else {
        console.warn("Gemini returned null for CV parsing.");
        addNotification("L'analyse IA n'a pas pu extraire de données. Veuillez remplir le formulaire manuellement.", "warning");
      }
    } catch(err) {
      console.error("Critical error in handleFile:", err);
      addNotification("Erreur lors de la lecture ou de l'analyse du fichier.", "warning");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Find the job title
    const jobOffer = jobs.find(j => j.id.toString() === selectedJob);
    const roleName = jobOffer ? jobOffer.title : "Candidature Spontanée";
    const candidateName = `${firstName} ${lastName}`.trim() || 'Candidat Anonyme';
    
    // Simulate API delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      addNotification(`Dossier de ${candidateName} transmis avec succès.`, "success");

      // Redirect to Interview
      setTimeout(() => {
        navigate("/app/interview", { 
          state: { 
            candidateName, 
            roleName, 
            jobId: selectedJob,
            email: email,
            personalInfo: {
              firstName,
              lastName,
              phone,
              city,
              linkedin,
              summary,
              experienceYears: parseInt(totalYears) || 0,
              lastRole: lastExperience
            }
          } 
        });
      }, 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Dossier de Candidature</h1>
          <p className="text-violet-600 mt-1 font-bold tracking-widest text-[10px] uppercase">Evolia HR &middot; Parsing CV Automatisé</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white p-16 rounded-[3rem] text-center border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-green-100">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Candidature Transmise</h2>
            <p className="text-gray-500 mb-8 font-medium max-w-lg mx-auto">
              Votre dossier a été validé. Vous allez être redirigé vers l'interface d'Évaluation automatique...
            </p>
            <div className="flex items-center justify-center gap-2 text-violet-600 font-bold uppercase tracking-widest text-xs">
              <div className="animate-spin w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full" />
              Initialisation en cours...
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(124,58,237,0.08)] transition-all duration-500">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Briefcase className="w-64 h-64" />
              </div>

              {/* Progress Stepper */}
              <div className="flex items-center justify-center mb-12 relative z-10">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 ${step >= i ? 'bg-violet-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                      {step > i ? <Check className="w-5 h-5" /> : i}
                    </div>
                    {i < 4 && (
                      <div className={`w-12 md:w-20 h-1.5 rounded-full mx-2 transition-all duration-300 ${step > i ? 'bg-violet-600' : 'bg-gray-100'}`} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="relative z-10">
                <AnimatePresence mode="wait">

                  {/* ÉTAPE 1 : Upload CV */}
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                       
                       <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                         <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                           <Sparkles className="w-5 h-5 text-violet-600" />
                         </div>
                         <div>
                           <h4 className="text-sm font-bold text-violet-900 mb-1">Remplissage IA Magique</h4>
                           <p className="text-xs text-violet-700 font-medium leading-relaxed">
                             Déposez votre CV ici ! Notre IA va lire votre document en une fraction de seconde et pré-remplir l'intégralité du formulaire pour vous.
                           </p>
                         </div>
                       </div>
                       
                       <div 
                        onClick={() => !isParsing && fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-[2rem] p-12 text-center transition-all duration-300 ${isParsing ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${file ? 'border-violet-500 bg-violet-50/50' : 'border-gray-200 hover:border-violet-400 bg-gray-50/50 hover:bg-violet-50/30'}`}
                       >
                         <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                         
                         {file ? (
                           <div className="flex flex-col items-center">
                             <div className="w-20 h-20 bg-violet-100 rounded-[1.5rem] flex items-center justify-center mb-6 border border-violet-200 shadow-sm">
                               {isParsing ? (
                                 <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
                               ) : (
                                 <FileText className="w-10 h-10 text-violet-600" />
                               )}
                             </div>
                             <h3 className="font-bold text-gray-900 text-xl">{file.name}</h3>
                             <p className="text-sm text-gray-500 mt-2 font-medium">Poids: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                             
                             {!isParsing && (
                               <button type="button" className="text-[10px] font-black uppercase tracking-widest text-violet-600 border border-violet-200 bg-white px-4 py-2 mt-6 rounded-lg hover:bg-violet-600 hover:text-white transition-all shadow-sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                                 Changer la matrice
                               </button>
                             )}
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center py-6">
                             <div className="w-20 h-20 bg-white border border-gray-100 shadow-sm rounded-[1.5rem] flex items-center justify-center mb-6">
                               <UploadCloud className="w-10 h-10 text-gray-400" />
                             </div>
                             <h3 className="font-bold text-gray-900 text-lg mb-2">Cliquez ou glissez votre CV ici</h3>
                             <p className="text-sm text-gray-500 font-medium">Formats validés: PDF, DOCX (Max 5 MB)</p>
                           </div>
                         )}
                       </div>
                    </motion.div>
                  )}
                  
                  {/* ÉTAPE 2 : Informations Personnelles */}
                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1"><User className="w-3.5 h-3.5 text-violet-500"/> Prénom</label>
                          <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900" placeholder="Votre prénom" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1">Nom</label>
                          <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900" placeholder="Votre nom" />
                        </div>
                        <div className="space-y-3 md:col-span-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1">Email</label>
                          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900" placeholder="nom@example.com" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1"><Phone className="w-3.5 h-3.5 text-violet-500"/> Téléphone</label>
                          <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900" placeholder="+33 6 00 00 00 00" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1"><MapPin className="w-3.5 h-3.5 text-violet-500"/> Ville</label>
                          <input required type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900" placeholder="Ex: Casablanca" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ÉTAPE 3 : Expériences */}
                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1"><GraduationCap className="w-3.5 h-3.5 text-violet-500"/> Dernière expérience marquante</label>
                          <input required type="text" value={lastExperience} onChange={e => setLastExperience(e.target.value)} placeholder="Ex: Data Engineer CTO chez StartupTech" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Expérience Totale</label>
                            <div className="relative">
                              <input required type="number" min="0" value={totalYears} onChange={e => setTotalYears(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900" placeholder="Ex: 5" />
                              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Ans</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">LinkedIn / Portfolio</label>
                            <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Résumé & Motivations</label>
                          <textarea required rows={4} value={summary} onChange={e => setSummary(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900 resize-none placeholder-gray-300" placeholder="Parlez-nous brièvement de ce qui vous anime..." />
                        </div>
                    </motion.div>
                  )}

                  {/* ÉTAPE 4 : Détails Professionnels Final */}
                  {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 pl-1"><Briefcase className="w-3.5 h-3.5 text-violet-500"/> Rôle convoité</label>
                          <select required value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900 appearance-none cursor-pointer">
                            <option value="">Sélectionnez un poste...</option>
                            {jobs.filter(job => job.status === 'OPEN').map(job => (
                              <option key={job.id} value={job.id}>{job.title} - {job.dept}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Disponibilité</label>
                            <select required className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900 appearance-none cursor-pointer">
                              <option value="immediate">Immédiate</option>
                              <option value="1_month">1 Mois</option>
                              <option value="3_months">3 Mois (Préavis)</option>
                            </select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Prétentions Salariales</label>
                            <div className="relative">
                              <input required type="number" step="1000" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900" placeholder="Annuel / Mensuel" />
                              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">MAD</span>
                            </div>
                          </div>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour
                  </button>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting || isParsing || (step === 1 && !file)}
                    className="group flex items-center gap-3 px-10 py-5 bg-black text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-violet-600 transition-all disabled:opacity-50 shadow-xl hover:shadow-[0_8px_30px_rgb(124,58,237,0.3)] disabled:shadow-none disabled:hover:bg-black"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Transmission...
                      </span>
                    ) : step === 4 ? (
                      <>Transmettre au système <Check className="w-4 h-4 group-hover:scale-125 transition-transform" /></>
                    ) : (
                      <>Continuer <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
