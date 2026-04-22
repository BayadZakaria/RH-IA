import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, FileText, Download, Loader2, CheckCircle2, ArrowRight, UserCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useEmployees } from "../contexts/EmployeesContext";
import { useEvaluations, EvalState } from "../contexts/EvaluationsContext";
import { useNotifications } from "../contexts/NotificationsContext";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

export function Approvals() {
  const { user } = useAuth();
  const { promoteCandidateToEmployee } = useEmployees();
  const { evaluations, advanceApproval, rejectEvaluation } = useEvaluations();
  const { addNotification } = useNotifications();
  const { usersList, updateProfile } = useAuth();
  
  const approvedCandidates = evaluations.filter(e => e.status === "APPROVED");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  useEffect(() => {
    if (!selectedId && approvedCandidates.length > 0) {
      setSelectedId(approvedCandidates[0].id);
    }
  }, [approvedCandidates, selectedId]);

  const selectedCandidate = approvedCandidates.find(c => c.id === selectedId);

  // 0 = en attente FONC, 1 = en attente HIER, 2 = en attente RH, 3 = en attente DG, 4 = validé
  const approvalLevel = selectedCandidate?.approvalLevel || 0;
  
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [onboardingTriggered, setOnboardingTriggered] = useState<string | null>(null); // store by id
  const documentRef = useRef<HTMLDivElement>(null);

  const getWorkflowDates = () => {
    return {
      fonc: approvalLevel >= 1 ? "19/04/2026 09:12Z" : undefined,
      hier: approvalLevel >= 2 ? "19/04/2026 10:45Z" : undefined,
      rh: approvalLevel >= 3 ? "20/04/2026 14:30Z" : undefined,
      dg: approvalLevel >= 4 ? "21/04/2026 11:21Z" : undefined,
    }
  };
  const dates = getWorkflowDates();

  const canApprove = () => {
    if (!selectedCandidate) return false;
    if (user?.role === "SUPER_ADMIN") return true;
    if (approvalLevel === 0 && user?.role === "DIR_FONCTIONNEL") return true;
    if (approvalLevel === 1 && user?.role === "DIR_HIERARCHIQUE") return true;
    if (approvalLevel === 2 && user?.role === "DIR_RH") return true;
    if (approvalLevel === 3 && user?.role === "DIR_GENERAL") return true;
    return false;
  };

  const currentRoleRequired = () => {
    if (approvalLevel === 0) return "Directeur Fonctionnel";
    if (approvalLevel === 1) return "Directeur Hiérarchique";
    if (approvalLevel === 2) return "Directeur RH";
    if (approvalLevel === 3) return "Directeur Général";
    return "Aucun";
  };

  // --- Dynamic Pricing Engine Logic ---
  const calculateCompensation = () => {
     if (!selectedCandidate) return { base: "0,00 MAD", prime: "0,00 MAD", total: "0,00 MAD", grade: "---" };
     
     // Base formula scaling with global score
     const techWeight = selectedCandidate.techScore || 50;
     const globalWeight = selectedCandidate.globalScore || 50;
     
     const calculatedRawBase = 8000 + (techWeight * 60) + (globalWeight * 45);
     const gradeCalculated = (globalWeight > 85) ? "55" : (globalWeight > 70) ? "54" : "53";
     const primeCalculated = (techWeight > 80) ? 2500 : 800;

     return {
        base: new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(calculatedRawBase),
        prime: new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(primeCalculated),
        total: new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(calculatedRawBase + primeCalculated),
        rawBase: calculatedRawBase,
        grade: gradeCalculated
     };
  };

  const compData = calculateCompensation();
  // ------------------------------------

  const handleApprove = () => {
    if (!selectedCandidate) return;
    setIsGeneratingDoc(true);
    setTimeout(async () => {
      setIsGeneratingDoc(false);
      
      const currentUserName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : "Admin";
      advanceApproval(selectedCandidate.id, currentUserName || "Admin");
      addNotification(`Dossier de candidature apprové par le ${currentRoleRequired()}`, "success");
      
      if (approvalLevel === 3) {
         addNotification(`Workflow de recrutement finalisé pour ${selectedCandidate.name}. Profil employé créé.`, "success");
         const parts = selectedCandidate.name.split(' ');
         const nom = parts.slice(1).join(' ') || selectedCandidate.name;
         const prenom = parts[0] || "Candidat";
         
         // Mapping AI global score to Performance (1-3) and Potential (1-3)
         const performanceVal = (selectedCandidate.globalScore > 85) ? 3 : (selectedCandidate.globalScore > 70) ? 2 : 1;
         const potentialVal = (selectedCandidate.techScore > 80) ? 3 : (selectedCandidate.techScore > 65) ? 2 : 1;

         await promoteCandidateToEmployee({
           nom: nom.toUpperCase(),
           prenom: prenom,
           grade: compData.grade,
           salary: compData.rawBase,
           department: selectedCandidate.role,
           performance: performanceVal,
           potential: potentialVal
         });

         // Sync candidate's account if they have registered
         if (selectedCandidate.candidateEmail) {
           const candidateUser = usersList.find(u => u.email.toLowerCase() === selectedCandidate.candidateEmail?.toLowerCase());
           if (candidateUser) {
              await updateProfile(candidateUser.id, {
                grade: compData.grade,
                nom: nom.toUpperCase(),
                prenom: prenom,
                // Transitioning role slightly (for the app we can keep CANDIDATE or transition to a base role)
                // Here we usually keep them as having employee data
              });
           }
         }

         setTimeout(() => {
           setOnboardingTriggered(selectedCandidate.id.toString());
         }, 1500);
      }
    }, 1500);
  };

  const handleReject = () => {
    if (!selectedCandidate) return;
    if(confirm("Confirmer le rejet de cette demande d'approbation ?")) {
      rejectEvaluation(selectedCandidate.id);
    }
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current || !selectedCandidate) return;
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
      
      let finalWidth = pdfWidth;
      let finalHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      if (finalHeight > pageHeight) {
        finalHeight = pageHeight;
        finalWidth = (imgProps.width * pageHeight) / imgProps.height;
      }
      
      const xOffset = (pdfWidth - finalWidth) / 2;
      
      pdf.addImage(dataUrl, 'PNG', xOffset, 0, finalWidth, finalHeight);
      pdf.save(`Approbation_RH_${selectedCandidate.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (approvedCandidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Aucune demande en attente</h2>
        <p className="text-gray-500 mt-2 max-w-sm">
          Les candidats approuvés par la RH dans le pipeline de recrutement apparaîtront ici pour la validation finale.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-12 max-w-7xl mx-auto items-start h-full">
      
      {/* Sidebar List */}
      <div className="w-full lg:w-80 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 overflow-y-auto max-h-[85vh] sticky top-8">
        <h2 className="text-lg font-semibold tracking-tight mb-4 px-2">Dossiers Approuvés ({approvedCandidates.length})</h2>
        <div className="flex flex-col gap-2">
          {approvedCandidates.map(c => {
            const isSelected = selectedId === c.id;
            const lvl = c.approvalLevel || 0;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected 
                    ? 'border-black bg-gray-50/80 shadow-sm ring-1 ring-black/5' 
                    : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex flex-col items-center justify-center overflow-hidden shrink-0">
                    <UserCircle className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{c.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{c.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {lvl === 4 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Validé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-700 text-[10px] font-bold">
                      <Loader2 className="w-3 h-3" /> Niv {lvl}/4
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Document Content */}
      {selectedCandidate && (
      <div className="flex-1 max-w-4xl min-w-0">
        {/* Onboarding Success Banner */}
        <AnimatePresence>
          {onboardingTriggered === selectedCandidate.id.toString() && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-900">Embauche validée avec succès !</h3>
                <p className="text-sm text-green-800 mt-1">L'approbation du Directeur Général a déclenché le workflow RH : création du profil employé (Onboarding) et finalisation du dossier.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">Dossier d'Approbation RH</h1>
              {approvalLevel === 4 ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold rounded-full border border-green-200">
                  TOTALEMENT VALIDÉ
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-600 px-3 py-1 text-xs font-semibold rounded-full border border-gray-200">
                  EN ATTENTE : {currentRoleRequired().toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-2">Dossier de candidature de {selectedCandidate.name}.</p>
          </div>
          
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading || approvalLevel < 4}
              title={approvalLevel < 4 ? "Le document PDF n'est disponible qu'après la signature finale du DG" : "Télécharger le dossier complet"}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group relative"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">Générer le PDF</span>
            </button>
            
            {approvalLevel < 4 && (
              <button onClick={handleReject} disabled={!canApprove() || isGeneratingDoc} className="flex items-center gap-2 px-5 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Rejeter</span>
              </button>
            )}

            {approvalLevel < 4 && (
              <button 
                onClick={handleApprove}
                disabled={!canApprove() || isGeneratingDoc}
                className="flex items-center min-w-[140px] justify-center gap-2 px-5 py-2 bg-[#0B1E36] text-white text-sm font-medium rounded-xl hover:bg-black shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingDoc ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Check className="w-4 h-4" /> Approuver</>
                )}
              </button>
            )}
          </div>
        </div>

      {/* Structured Document Container - Emulating a pristine SaaS document */}
      <div ref={documentRef} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10 mt-8 relative overflow-hidden">
        {/* Subtle background branding/watermark */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <FileText className="w-64 h-64" />
        </div>

        <div className="relative z-10 space-y-12">
          
          {/* Section: Informations générales */}
          <section>
            <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-6 border-b border-gray-100 pb-2">Informations Générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DataSnippet label="Nom du collaborateur" value={selectedCandidate.name} highlight />
              <DataSnippet label="Type de demande" value="Recrutement" />
              <DataSnippet label="Date d'embauche" value="16/03/2026" />
              <DataSnippet label="Date d'application" value="16/03/2026" />
              <DataSnippet label="Date de naissance" value="07/08/1999" />
              <DataSnippet label="Situation Familiale" value="Célibataire" />
              <DataSnippet label="Personnes à charge" value="0" />
            </div>
          </section>

          {/* Section: Informations organisationnelles */}
          <section>
            <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-6 border-b border-gray-100 pb-2">Informations Organisationnelles</h2>
            <div className="grid grid-cols-1 gap-4">
              <DataRow label="Site (Succursale)" value="Siège" />
              <DataRow label="Entité Organisationnelle" value="Administration" />
              <DataRow label="Fonction" value={selectedCandidate.role} highlight />
              <DataRow label="Emploi de référence" value={`E12.10 - ${selectedCandidate.role}`} />
              <DataRow label="Type de rémunération" value="Mensuelle" />
              <DataRow label="Grade" value={compData.grade} highlight />
            </div>
          </section>

          {/* Section: Situation Salariale */}
          <section>
            <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-6 border-b border-gray-100 pb-2">Situation Salariale</h2>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100/50">
              <div className="grid grid-cols-1 gap-2">
                <SalaryRow label="Salaire de base calculé" value={compData.base} highlight />
                <SalaryRow label="Prime d'acquisition IA" value={compData.prime} />
                <SalaryRow label="Indemnité Transport" value="550,00 MAD" />
                <SalaryRow label="Prime Loyer" value="150,00 MAD" />
                
                <div className="my-4 border-b border-gray-200 border-dashed" />
                
                <SalaryRow label="Salaire mensuel brut global" value={compData.total} highlight />
              </div>
            </div>
          </section>

          {/* Section: Avantages & Positionnement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-6 border-b border-gray-100 pb-2">Avantages</h2>
              <div className="space-y-2">
                <SalaryRow label="Primes Aïd" value="2 100,00 MAD" />
                <SalaryRow label="Taux CIMR" value="6,00%" />
              </div>
            </section>
            <section>
              <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-6 border-b border-gray-100 pb-2">Positionnement</h2>
              <div className="space-y-2">
                <SalaryRow label="Salaire Annuel Garanti" value="258 550 MAD" highlight />
                <SalaryRow label="% Grille Salariale (SAG)" value="75%" />
              </div>
            </section>
          </div>

          {/* Commentaires Section */}
          <section className="bg-[#fcfdf2] border border-[#ecefd2] rounded-2xl p-6">
            <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-gray-400 mb-3">Commentaires RH</h2>
            <p className="text-sm leading-relaxed text-gray-700 italic">
              Recrutement d'un {selectedCandidate.role} pour le renforcement de l'équipe (Poste budgété 2026). <br/>
              Salaire actuel de M. {selectedCandidate.name.split(' ').slice(1).join(' ') || selectedCandidate.name} : 12k dhs NET/13 mois + prime annuelle.
            </p>
          </section>

          {/* Workflow Approvals Visual Component - Exact Rule 2 Sequence */}
          <section className="pt-6 border-t border-[#0B1E36]/10 mt-12 bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
             <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-gray-400 mb-6 text-center">Bloc d'Approbation - Signatures Numériques</h2>
             
             <div className="grid grid-cols-4 divide-x divide-gray-200/60">
               {/* 1. Fonctionnel */}
               <ApprovalSigner 
                  role="Directeur Fonctionnel" 
                  status={approvalLevel > 0 ? "approved" : "pending"} 
                  date={selectedCandidate.approvalMetrics?.fonc?.date} 
                  name={selectedCandidate.approvalMetrics?.fonc?.name || "M. LAHRACH"} 
                  traceId={selectedCandidate.approvalMetrics?.fonc?.traceId}
               />
               
               {/* 2. Hiérarchique */}
               <ApprovalSigner 
                  role="Directeur Hiérarchique" 
                  status={approvalLevel > 1 ? "approved" : "pending"} 
                  date={selectedCandidate.approvalMetrics?.hier?.date} 
                  name={selectedCandidate.approvalMetrics?.hier?.name || "Mme. BENALI"} 
                  traceId={selectedCandidate.approvalMetrics?.hier?.traceId}
               />
               
               {/* 3. RH */}
               <ApprovalSigner 
                  role="Directeur RH" 
                  status={approvalLevel > 2 ? "approved" : "pending"} 
                  date={selectedCandidate.approvalMetrics?.rh?.date} 
                  name={selectedCandidate.approvalMetrics?.rh?.name || "A. EL GUIR"} 
                  traceId={selectedCandidate.approvalMetrics?.rh?.traceId}
               />
               
               {/* 4. Général */}
               <ApprovalSigner 
                  role="Directeur Général" 
                  status={approvalLevel > 3 ? "approved" : "pending"} 
                  date={selectedCandidate.approvalMetrics?.dg?.date} 
                  name={selectedCandidate.approvalMetrics?.dg?.name || `${user?.prenom?.[0] || 'A'}. ${user?.nom || 'BENNANI'}`} 
                  traceId={selectedCandidate.approvalMetrics?.dg?.traceId}
               />
             </div>
          </section>

        </div>
      </div>

      {/* --- HIDDEN PRINT VIEW: EXCEL LIKE FORMAT --- */}
      <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none opacity-0">
        <div ref={documentRef} className="bg-white p-8" style={{ width: "950px", fontFamily: "Arial, sans-serif", color: "#000" }}>
          
          <div className="flex justify-between items-end mb-1">
            <h1 className="text-[44px] font-extrabold tracking-tighter text-black" style={{ margin: 0, padding: 0, lineHeight: 1 }}>NewGen <span className="text-indigo-600">Rh</span></h1>
            <h2 className="text-[28px] font-light text-gray-700 tracking-wide mb-1" style={{ margin: 0, padding: 0, lineHeight: 1 }}>Demande d'Approbation RH</h2>
          </div>
          
          <div className="flex justify-end items-center mb-2">
            <span className="text-[9px] italic text-gray-500 mr-2">Merci de renseigner tous les champs en couleur grise</span>
            <div className="w-5 h-3 border border-gray-400" style={{ backgroundColor: "#e2efda" }}></div>
            <div className="w-5 h-3 border border-gray-400 bg-white ml-2"></div>
          </div>

          <table className="w-full border-collapse border-[2px] border-black text-[12px] mb-4">
            <tbody>
              <tr>
                <td className="border border-black bg-[#7f7f7f] text-white p-1 px-2 w-[16.6%]">Nature de la demande RH</td>
                <td className="border border-black p-1 px-2 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0", width: "16.6%" }}>Recrutement</td>
                <td className="border border-black bg-[#7f7f7f] text-white p-1 px-2 w-[16.6%]">Budgétisation RH</td>
                <td className="border border-black p-1 px-2 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0", width: "16.6%" }}>Oui</td>
                <td className="border border-black bg-[#7f7f7f] text-white p-1 px-2 w-[16.6%]">Date d'application</td>
                <td className="border border-black p-1 px-2 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0", width: "16.6%" }}>16/03/2026</td>
              </tr>
            </tbody>
          </table>

          <div className="bg-[#595959] text-white p-1 text-[13px] font-bold border-2 border-black border-b-0 pl-2">Informations générales</div>
          <table className="w-full border-collapse border-[2px] border-black text-[12px] mb-4">
            <tbody>
              <tr>
                <td className="border border-black bg-[#7f7f7f] text-white p-1 px-2 w-[25%]">Nom du collaborateur</td>
                <td className="border border-black p-1 px-2 italic w-[25%]" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>{selectedCandidate.name}</td>
                <td className="border border-black bg-[#bfbfbf] p-1 px-2 w-[25%]"></td><td className="border border-black bg-[#bfbfbf] p-1 px-2 w-[25%]"></td>
              </tr>
              <tr>
                <td className="border border-black bg-[#7f7f7f] text-white p-1 px-2">Date d'embauche</td><td className="border border-black p-1 px-2 italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>16/03/2026</td>
                <td className="border border-black bg-[#7f7f7f] text-white p-1 px-2">Personnes à charge</td><td className="border border-black p-1 px-2 italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0</td>
              </tr>
              <tr>
                <td className="border border-black bg-[#7f7f7f] text-white p-1 px-2">Date de naissance</td><td className="border border-black p-1 px-2 italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>07/08/1999</td>
                <td className="border border-black bg-[#7f7f7f] text-white p-1 px-2">Situation Familiale</td><td className="border border-black p-1 px-2 italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>Celibataire</td>
              </tr>
            </tbody>
          </table>

          <div className="bg-[#595959] text-white p-1 text-[13px] font-bold border-2 border-black border-b-0 pl-2">Informations organisationnelles</div>
          <table className="w-full border-collapse border-[2px] border-black text-[12px] mb-4">
            <thead>
              <tr><th className="border border-black bg-[#7f7f7f] text-white p-1 font-normal w-[35%] text-left pl-2">Intitulé</th><th className="border border-black bg-[#595959] text-white p-1 font-normal w-[65%] text-center">Situation Proposée</th></tr>
            </thead>
            <tbody>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Site (Succursale)</td><td className="border border-black p-1 px-2 italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>Siège</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Entité Organisationnelle</td><td className="border border-black p-1 px-2 italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>Administration</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Fonction</td><td className="border border-black p-1 px-2 italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>{selectedCandidate.role}</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Emploi de référence</td><td className="border border-black p-1 px-2 italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>{`E12.10 - ${selectedCandidate.role}`}</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Type de rémunération</td><td className="border border-black p-1 px-2 italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>Mensuelle</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Grade</td><td className="border border-black p-1 px-2 italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>{compData.grade}</td></tr>
            </tbody>
          </table>

          <div className="bg-[#595959] text-white p-1 text-[13px] font-bold border-2 border-black border-b-0 pl-2">Situation salariale</div>
          <table className="w-full border-collapse border-[2px] border-black text-[12px] mb-4">
            <thead>
              <tr><th colSpan={2} className="border border-black bg-[#7f7f7f] text-white p-1 font-normal w-[65%] text-center">Rubrique</th><th className="border border-black bg-[#595959] text-white p-1 font-normal w-[35%] text-center">Situation Proposée</th></tr>
            </thead>
            <tbody>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Salaire de base calculé</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>{compData.base}</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Prime d'acquisition IA</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>{compData.prime}</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Indemnité Représentation</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Indemnité Panier</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Indemnité GSM</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Indemnité Transport</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>550,00 MAD</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Indemnité Caisse Recettes</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Indemnité Caisse Depenses</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2 relative"><div className="border-l-[2px] border-dotted border-black h-full absolute left-[45%] top-0"></div>Indemnité Spéciale</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Prime Loyer</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>150,00 MAD</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Prime d'encadrement</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2 relative"><div className="border-l-[2px] border-dotted border-black h-full absolute left-[45%] top-0"></div>Prime Spéciale</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2 font-bold">Salaire mensuel brut global</td><td className="border border-black p-1 text-center italic font-bold" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>{compData.total}</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Taux CIMR</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>6,00%</td></tr>
              <tr><td colSpan={2} className="border border-black bg-[#d9d9d9] p-1 px-2">Variation mensuelle nette</td><td className="border border-black bg-[#d9d9d9] p-1 text-center italic"></td></tr>
            </tbody>
          </table>

          <div className="bg-[#595959] text-white p-1 text-[13px] font-bold border-2 border-black border-b-0 pl-2">Avantages</div>
          <table className="w-full border-collapse border-[2px] border-black text-[12px] mb-4">
            <thead>
              <tr><th className="border border-black bg-[#7f7f7f] text-white p-1 font-normal w-[65%] text-center">Rubrique</th><th className="border border-black bg-[#595959] text-white p-1 font-normal w-[35%] text-center">Situation Proposée</th></tr>
            </thead>
            <tbody>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Primes Aïd</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>2 100,00 MAD</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Prime Scolarité</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Transport Personnel</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>Non</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Indemnités Kilométriques Mensuelles</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Véhicule Fonction (Valorisation Mensuelle)</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>Non</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Carte de carburant (Dotation Mensuelle)</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>0,00 MAD</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Taux CIMR</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>6,00%</td></tr>
            </tbody>
          </table>

          <div className="bg-[#595959] text-white p-1 text-[13px] font-bold border-2 border-black border-b-0 pl-2">Positionnement salarial</div>
          <table className="w-full border-collapse border-[2px] border-black text-[12px] mb-4">
            <thead>
              <tr><th className="border border-black bg-[#7f7f7f] text-white p-1 font-normal w-[65%] text-center">Rubrique</th><th className="border border-black bg-[#595959] text-white p-1 font-normal w-[35%] text-center">Situation Proposée</th></tr>
            </thead>
            <tbody>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Salaire Annuel Garanti</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>258 550 MAD</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">% Comparatif Grille Salariale (SAG)</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>75%</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Variable Annuel Réel (Total 12 M)</td><td className="border border-black bg-[#d9d9d9] p-1 text-center italic"></td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">Salaire Annuel Total</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>310 260 MAD</td></tr>
              <tr><td className="border border-black bg-[#d9d9d9] p-1 px-2">% Comparatif Grille Salariale (SAT)</td><td className="border border-black p-1 text-center italic" style={{ backgroundColor: "#e2efda", color: "#0070c0" }}>75%</td></tr>
            </tbody>
          </table>

          <div className="bg-[#595959] text-white p-1 text-[13px] font-bold border-2 border-black border-b-0 pl-2 mt-4">Commentaires</div>
          <div className="border-2 border-black p-2 mb-4 italic text-[12px] leading-snug" style={{ backgroundColor: "#e2efda", color: "#0070c0", minHeight: "60px" }}>
            Recrutement d'un {selectedCandidate.role} pour le renforcement de l'équipe ( Poste budgété 2026)<br/>
            Salaire actuel de M. {selectedCandidate.name.split(' ').slice(1).join(' ') || selectedCandidate.name} : 12k dhs NET/13 mois + prime annuelle.
          </div>

          <div className="bg-[#595959] text-white p-1 text-[13px] font-bold border-2 border-black border-b-0 pl-2 mt-2">Approbations numériques</div>
          <div className="flex gap-2 mb-1 h-[110px]">
            <div className="flex-1 border-2 border-black bg-white flex flex-col">
              <div className="bg-[#7f7f7f] text-white text-center border-b border-black text-[12px] py-1 h-[28px]">Directeur Hiérarchique</div>
              <div className="flex-1 p-2 text-[11px] flex flex-col justify-end text-[#595959] relative">
                {(approvalLevel > 1) && selectedCandidate.approvalMetrics?.hier && (
                  <div className="absolute top-1 left-2 text-center" style={{ transform: "rotate(2deg)" }}>
                    <div className="border border-[#8C5E3C] text-[#8C5E3C] px-2 py-0.5 rounded-sm transform mb-1 font-serif text-[10px] font-bold uppercase">
                      Approuvé numériquement
                    </div>
                    <div className="text-[9px] text-black leading-tight">
                        {selectedCandidate.approvalMetrics.hier.name}<br/>
                        {new Date(selectedCandidate.approvalMetrics.hier.date).toLocaleDateString('fr-FR')} {new Date(selectedCandidate.approvalMetrics.hier.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}<br/>
                        {selectedCandidate.approvalMetrics.hier.traceId}
                    </div>
                  </div>
                )}
                <div>Nom :</div><div>Date :</div>
              </div>
            </div>
            <div className="flex-1 border-2 border-black bg-white flex flex-col">
              <div className="bg-[#7f7f7f] text-white text-center border-b border-black text-[12px] py-1 h-[28px]">Directeur Fonctionnel</div>
              <div className="flex-1 p-2 text-[11px] flex flex-col justify-end relative text-[#595959]">
                {(approvalLevel > 0) && selectedCandidate.approvalMetrics?.fonc && (
                  <div className="absolute top-1 left-4 text-center pb-2" style={{ transform: "rotate(-2deg)" }}>
                    <div className="border border-[#1e3a8a] text-[#1e3a8a] px-2 py-0.5 rounded-sm transform mb-1 font-serif text-[10px] font-bold uppercase">
                      Approuvé numériquement
                    </div>
                    <div className="text-[9px] text-black leading-tight">
                        {selectedCandidate.approvalMetrics.fonc.name}<br/>
                        {new Date(selectedCandidate.approvalMetrics.fonc.date).toLocaleDateString('fr-FR')} {new Date(selectedCandidate.approvalMetrics.fonc.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}<br/>
                        {selectedCandidate.approvalMetrics.fonc.traceId}
                    </div>
                  </div>
                )}
                <div>Nom :</div><div>Date :</div>
              </div>
            </div>
            <div className="flex-1 border-2 border-black bg-white flex flex-col">
              <div className="bg-[#7f7f7f] text-white text-center border-b border-black text-[12px] py-1 h-[28px]">Directeur RH</div>
              <div className="flex-1 p-2 text-[11px] flex flex-col justify-end relative text-[#595959]">
                {(approvalLevel > 2) && selectedCandidate.approvalMetrics?.rh && (
                  <div className="absolute top-1 right-2 text-center" style={{ transform: "rotate(1deg)" }}>
                     <div className="border border-[#1e3a8a] text-[#1e3a8a] px-2 py-0.5 rounded-sm transform mb-1 font-serif text-[10px] font-bold uppercase">
                      Approuvé numériquement
                    </div>
                    <div className="text-[9px] text-black leading-tight">
                        {selectedCandidate.approvalMetrics.rh.name}<br/>
                        {new Date(selectedCandidate.approvalMetrics.rh.date).toLocaleDateString('fr-FR')} {new Date(selectedCandidate.approvalMetrics.rh.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}<br/>
                        {selectedCandidate.approvalMetrics.rh.traceId}
                    </div>
                  </div>
                )}
                <div>Nom :</div><div>Date :</div>
              </div>
            </div>
            <div className="flex-1 border-2 border-black bg-white flex flex-col">
              <div className="bg-[#7f7f7f] text-white text-center border-b border-black text-[12px] py-1 h-[28px]">Directeur Général</div>
              <div className="flex-1 p-2 text-[11px] flex flex-col justify-end relative text-[#595959]">
                {(approvalLevel > 3) && selectedCandidate.approvalMetrics?.dg && (
                  <div className="absolute top-0 right-2 text-center flex flex-col items-center" style={{ transform: "rotate(-1deg)" }}>
                    <div className="border border-[#0066ff] text-[#0066ff] px-2 py-0.5 rounded-sm transform mb-1 font-serif text-[10px] font-bold uppercase mt-2">
                      Approuvé numériquement
                    </div>
                    <div className="text-[9px] text-black font-semibold tracking-tight uppercase leading-tight">
                        {selectedCandidate.approvalMetrics.dg.name}<br/>
                        {new Date(selectedCandidate.approvalMetrics.dg.date).toLocaleDateString('fr-FR')} {new Date(selectedCandidate.approvalMetrics.dg.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}<br/>
                        {selectedCandidate.approvalMetrics.dg.traceId}
                    </div>
                  </div>
                )}
                <div>Nom :</div><div>Date :</div>
              </div>
            </div>
          </div>
          <div className="text-right text-[#c00000] text-[9px] italic mb-6">Modèle mis à jour au 01/11/2021</div>
        </div>
      </div>
      </div>
      )}

    </div>
  );
}

// Subcomponents for the form aesthetics

function DataSnippet({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className={`text-base ${highlight ? 'font-semibold text-black' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}

function DataRow({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-2 rounded-md -mx-2">
      <span className="text-[13px] font-medium text-gray-500">{label}</span>
      <span className={`text-[14px] text-right ${highlight ? 'font-semibold text-black' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

function SalaryRow({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className={`text-sm ${highlight ? 'font-medium text-gray-700' : 'text-gray-500'}`}>{label}</span>
      <span className={`font-mono text-sm tracking-tight ${highlight ? 'font-semibold text-black' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}

function ApprovalSigner({ role, status, date, name, traceId }: { role: string, status: 'approved' | 'pending', date?: string, name?: string, traceId?: string }) {
  const renderSignature = () => {
    return (
      <div className="border border-[#0B1E36] bg-[#0B1E36]/5 px-2 py-1.5 rounded transform -rotate-1 mb-2">
         <div className="font-mono text-[8px] tracking-tight text-[#0B1E36]/60 mb-0.5">CERTIFIÉ NUMÉRIQUEMENT</div>
         <div className="font-serif text-[11px] font-bold uppercase tracking-widest text-[#0B1E36]">APPROUVÉ</div>
         <div className="font-mono text-[7px] tracking-tighter text-[#0B1E36]/60 mt-0.5">{traceId || 'TRACE-1X9A'}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-start text-center px-4 h-32">
      <span className="text-[10px] font-bold text-[#0B1E36]/40 uppercase tracking-widest mb-2 leading-tight min-h-[28px] flex items-center justify-center">{role}</span>
      
      {status === 'approved' ? (
        <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-500 w-full">
           <div className="flex-1 flex items-center justify-center min-h-[50px] w-full">
             {renderSignature()}
           </div>
           
           <span className="text-[11px] font-bold text-[#0B1E36] uppercase tracking-wide truncate max-w-full">{name}</span>
           <span className="text-[9px] text-[#0B1E36]/60 font-mono mt-0.5">Le {new Date(date || '').toLocaleDateString('fr-FR')} à {new Date(date || '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full opacity-30 mt-4">
           <div className="w-8 h-8 rounded-full border border-dashed border-[#0B1E36] mb-2 flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-[#0B1E36]/20 rounded-full" />
           </div>
           <span className="text-[10px] text-[#0B1E36] font-medium tracking-wide">En attente...</span>
        </div>
      )}
    </div>
  )
}
