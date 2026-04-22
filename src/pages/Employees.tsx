import { motion } from "motion/react";
import { useEmployees } from "../contexts/EmployeesContext";
import { Briefcase, Building2, Calendar, FileText, UserCircle, Users, CheckCircle2, ClipboardCheck, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useEvaluations } from "../contexts/EvaluationsContext";

// Subcomponents
function StatsCard({ label, value, icon, color = "bg-white" }: { label: string, value: number, icon: React.ReactNode, color?: string }) {
  return (
    <div className={`${color} p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4`}>
       <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600">
          {icon}
       </div>
       <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
       </div>
    </div>
  );
}

export function Employees() {
  const { employees, loading } = useEmployees();
  const { evaluations } = useEvaluations();
  const { user } = useAuth();

  // Candidats validés en Evaluation mais pas encore promus totalement à Employee (level < 4)
  const pendingOnboarding = evaluations.filter(ev => ev.status === "APPROVED" && (ev.approvalLevel || 0) < 4);

  const isRecentRecruit = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      // Within last 48h
      return (now.getTime() - date.getTime()) < (48 * 60 * 60 * 1000);
    } catch { return false; }
  };

  const newRecruitsCount = employees.filter(e => isRecentRecruit(e.hire_date)).length;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Répertoire des Employés</h1>
          <p className="text-gray-500 mt-2">Visibilité : {user?.role === "SUPER_ADMIN" ? "Vue Globale Admin" : "Vue Direction"}</p>
        </div>
        
        {newRecruitsCount > 0 && (
          <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-2xl flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-sm font-semibold text-green-700">{newRecruitsCount} Recrutement(s) cette semaine</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatsCard label="Effectif Total" value={employees.length} icon={<Users className="w-5 h-5" />} />
         <StatsCard label="En Signature" value={pendingOnboarding.length} icon={<Clock className="w-5 h-5 text-indigo-600" />} color="bg-indigo-50/30" />
         <StatsCard label="Dpt. Actifs" value={new Set(employees.map(e => e.department)).size} icon={<Building2 className="w-5 h-5" />} />
      </div>

      {/* Section 1: Futur Collaborateurs */}
      {pendingOnboarding.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold tracking-tight">Futurs Collaborateurs (Validés RH)</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{pendingOnboarding.length} Dossiers en cours</span>
          </div>
          
          <div className="bg-white border border-indigo-100 shadow-sm rounded-3xl overflow-hidden ring-1 ring-indigo-50/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-indigo-50/20 border-b border-indigo-50">
                    <th className="px-6 py-4 font-semibold text-indigo-900/60 uppercase tracking-widest text-[10px]">Candidat</th>
                    <th className="px-6 py-4 font-semibold text-indigo-900/60 uppercase tracking-widest text-[10px]">Poste</th>
                    <th className="px-6 py-4 font-semibold text-indigo-900/60 uppercase tracking-widest text-[10px]">Circuit de Signature</th>
                    <th className="px-6 py-4 font-semibold text-indigo-900/60 uppercase tracking-widest text-[10px] text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/30 text-gray-600">
                  {pendingOnboarding.map(cand => (
                    <tr key={cand.id} className="hover:bg-indigo-50/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{cand.name}</td>
                      <td className="px-6 py-4">{cand.role}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4].map(step => (
                            <div 
                              key={step} 
                              className={`h-1.5 w-6 rounded-full ${step <= (cand.approvalLevel || 0) ? 'bg-indigo-500 shadow-sm shadow-indigo-200' : 'bg-indigo-100'}`} 
                            />
                          ))}
                          <span className="ml-2 text-[10px] font-bold text-indigo-600">{(cand.approvalLevel || 0)} / 4</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                          <Clock className="w-3 h-3" /> Signature
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Section 2: Répertoire Actif */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2 text-gray-500">
          <Users className="w-5 h-5" />
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Collaborateurs Actifs</h2>
        </div>
        
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
               <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0B1E36] rounded-full animate-spin mb-4" />
               Chargement du personnel...
            </div>
          ) : employees.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center justify-center bg-gray-50/50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <UserCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Dossier vide</h3>
              <p className="text-gray-500 max-w-sm">Les collaborateurs s'afficheront ici une fois la validation DG terminée.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-widest text-[10px]">Collaborateur</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-widest text-[10px]">Matricule</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-widest text-[10px]">Grade & Département</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-widest text-[10px]">Date d'entrée</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-widest text-[10px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 italic-serif-headers">
                  {employees.map((emp, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={emp.id} 
                      className="hover:bg-gray-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0B1E36] text-white flex items-center justify-center font-bold tracking-wider text-xs uppercase">
                            {emp.prenom[0]}{emp.nom[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              {emp.nom} {emp.prenom}
                              {isRecentRecruit(emp.hire_date) && (
                                <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-[10px] font-bold text-green-700 uppercase tracking-tighter shadow-sm shadow-green-100">Nouveau</span>
                              )}
                            </div>
                            <div className="text-xs text-secondary-text">{(emp.salary).toLocaleString()} MAD</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-600">
                          {emp.matricule}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-gray-400" /> {emp.grade}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {emp.department || "NewGen Rh Division"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#8C5E3C] opacity-70" />
                          {new Date(emp.hire_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-white hover:shadow-md text-gray-500 transition-all inline-flex items-center gap-2 text-xs font-medium">
                          <FileText className="w-4 h-4" /> Dossier
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
