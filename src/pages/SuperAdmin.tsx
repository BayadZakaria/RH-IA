import { useState } from "react";
import { useAuth, Role, User } from "../contexts/AuthContext";
import { CheckCircle, ShieldCheck, FileText, KeyRound, Building2, Pencil, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function SuperAdmin() {
  const { usersList, approveUser, updateProfile } = useAuth();
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', grade: '', password: '' });

  const getRoleLabel = (role: Role) => {
    const roles: Record<Role, string> = {
      SUPER_ADMIN: "Super Administrateur",
      DIR_HIERARCHIQUE: "Dir. Hiérarchique",
      DIR_FONCTIONNEL: "Dir. Fonctionnel",
      DIR_RH: "Directeur RH",
      DIR_GENERAL: "Directeur Général",
      CANDIDATE: "Candidat"
    };
    return roles[role] || role;
  };

  const handleEditClick = (u: User) => {
    setEditingUser(u);
    setEditForm({ nom: u.nom, prenom: u.prenom, grade: u.grade || '', password: '' });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const updates: Partial<User> = {
      nom: editForm.nom,
      prenom: editForm.prenom,
      grade: editForm.grade
    };
    if (editForm.password.trim() !== '') {
      updates.password = editForm.password;
    }
    await updateProfile(editingUser.id, updates);
    setEditingUser(null);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Super Administration</h1>
        <p className="text-gray-500 mt-2">Vue globale sur les comptes Directeurs pré-approuvés de la société.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Colonne de gauche : Fixation des directeurs et architecture */}
        <div className="space-y-8 xl:col-span-1">
          {/* Bloc d'Informations (Remplacement de la Création) */}
          <section className="bg-[#0B1E36] p-8 rounded-3xl border border-[#16335A] shadow-md text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
              <Building2 className="w-32 h-32 text-white" />
            </div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">Identifiants Officiels</h2>
                <p className="text-xs text-white/50">Politique stricte d'accès</p>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <p className="text-sm leading-relaxed text-blue-100">
                La politique de sécurité interdit la création manuelle de nouveaux directeurs par l'interface. Les 4 postes stratégiques sont distribués avec leurs emails fixes.
              </p>

              <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold font-mono border-b border-white/10 pb-1 mb-1">Directeur Fonctionnel</span>
                  <span className="text-xs font-medium">Email: <span className="text-[#8C5E3C]">fonctionnel@nexahr.com</span></span>
                  <span className="text-xs font-medium text-white/80">MDP: adminadmin1</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold font-mono border-b border-white/10 pb-1 mb-1">Directeur Hiérarchique</span>
                  <span className="text-xs font-medium">Email: <span className="text-[#8C5E3C]">hierarchique@nexahr.com</span></span>
                  <span className="text-xs font-medium text-white/80">MDP: adminadmin1</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold font-mono border-b border-white/10 pb-1 mb-1">Directeur RH</span>
                  <span className="text-xs font-medium">Email: <span className="text-[#8C5E3C]">rh@nexahr.com</span></span>
                  <span className="text-xs font-medium text-white/80">MDP: adminadmin1</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold font-mono border-b border-white/10 pb-1 mb-1">Directeur Général</span>
                  <span className="text-xs font-medium">Email: <span className="text-[#8C5E3C]">general@nexahr.com</span></span>
                  <span className="text-xs font-medium text-white/80">MDP: adminadmin1</span>
                </div>
              </div>
            </div>
          </section>

          {/* Définitions des responsabilités */}
          <section className="bg-gray-900 border border-gray-800 p-6 rounded-3xl text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-[0.05] pointer-events-none">
                <ShieldCheck className="w-32 h-32" />
             </div>
             
             <div className="flex items-center gap-2 mb-6 relative z-10">
               <FileText className="w-5 h-5 text-gray-400" />
               <h2 className="text-sm font-semibold tracking-widest text-gray-400 uppercase">Architecture Approbation</h2>
             </div>

             <div className="space-y-5 relative z-10">
               <RoleDescription role={getRoleLabel("DIR_HIERARCHIQUE")} color="border-blue-500">
                 Définit le besoin, évalue les compétences techniques du candidat et lance la requête initiale.
               </RoleDescription>
               <RoleDescription role={getRoleLabel("DIR_FONCTIONNEL")} color="border-purple-500">
                 Valide l'alignement de la ressource avec le projet et approuve l'allocation budgétaire.
               </RoleDescription>
               <RoleDescription role={getRoleLabel("DIR_RH")} color="border-orange-500">
                 Approuve la grille salariale, négocie le contrat (avantages) et garantit la conformité.
               </RoleDescription>
               <RoleDescription role={getRoleLabel("DIR_GENERAL")} color="border-green-500">
                 Validation exécutive finale. Son approbation déclenche la génération du contrat et le recrutement.
               </RoleDescription>
             </div>
          </section>
        </div>

        {/* Colonne de droite : Liste des comptes */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
             <div className="space-y-1">
               <h2 className="text-lg font-semibold tracking-tight">Répertoire Structuré</h2>
               <p className="text-sm text-gray-500">Les collaborateurs ci-dessous héritent de base des accès accordés.</p>
             </div>
             <span className="bg-[#e4eed7] text-[#558611] px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
               Lecture Seule Active
             </span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="space-y-3">
              {usersList.filter(u => u.role !== "SUPER_ADMIN" && u.role !== "CANDIDATE").map((u, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={u.id} 
                  className="flex items-center justify-between p-4 border border-gray-100 hover:border-gray-200 rounded-2xl bg-white transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm tracking-wider">
                      {u.prenom[0]}{u.nom[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{u.nom} {u.prenom}</span>
                        {u.status === "PENDING" && <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">En attente</span>}
                        {u.status === "APPROVED" && <span className="bg-[#e4eed7] text-[#558611] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Approuvé</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
                        <span className="group-hover:text-black transition-colors">{u.email}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="font-mono tracking-tight group-hover:text-black transition-colors">{getRoleLabel(u.role)}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{u.grade}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {u.status === "PENDING" ? (
                      <button 
                        onClick={() => approveUser(u.id)}
                        className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                      >
                        Approuver accès
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 rounded-md border border-gray-100">
                          <CheckCircle className="w-3.5 h-3.5 text-[#8C5E3C]" />
                          Système Lié
                        </div>
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="p-2 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors text-gray-400 hover:text-black shadow-sm"
                          title="Modifier les informations"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest font-semibold border-t border-gray-100 pt-8 mx-12">
               Géré de manière centralisée
            </div>
          </div>
        </div>

      </div>

      {/* Interface d'édition (Modal) */}
      <AnimatePresence>
        {editingUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                 <div>
                   <h3 className="text-lg font-bold tracking-tight text-gray-900">Modifier le Profil</h3>
                   <p className="text-xs text-gray-500 font-medium">Les accès officiels resteront liés à l'email.</p>
                 </div>
                 <button onClick={() => setEditingUser(null)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                   <X className="w-4 h-4 text-gray-500" />
                 </button>
              </div>

              <div className="p-6 space-y-5">
                 {/* Champs Fixes & Protégés */}
                 <div className="space-y-4 pt-1 pb-4 px-4 bg-gray-50 rounded-xl border border-gray-100/80 pointer-events-none opacity-80">
                   <div>
                     <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email (Inmodifiable)</label>
                     <div className="mt-1 font-mono text-xs font-semibold text-gray-500">{editingUser.email}</div>
                   </div>
                   <div>
                     <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fonction</label>
                     <div className="mt-1 text-sm font-semibold text-gray-900">{getRoleLabel(editingUser.role)}</div>
                   </div>
                 </div>

                 {/* Champs Editables */}
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-600">Nom</label>
                     <input className="form-input text-sm" value={editForm.nom} onChange={e => setEditForm({...editForm, nom: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-600">Prénom</label>
                     <input className="form-input text-sm" value={editForm.prenom} onChange={e => setEditForm({...editForm, prenom: e.target.value})} />
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-gray-600">Grade interne</label>
                   <input className="form-input text-sm" value={editForm.grade} onChange={e => setEditForm({...editForm, grade: e.target.value})} placeholder="Ex: G7" />
                 </div>

                 <div className="space-y-1.5 pt-4 border-t border-gray-100">
                   <label className="text-xs font-semibold text-gray-600">Nouveau mot de passe</label>
                   <input type="password" placeholder="Laisser vide pour ne pas changer" className="form-input text-sm w-full" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} />
                 </div>

                 <div className="pt-4 flex gap-3">
                   <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50">
                     Annuler
                   </button>
                   <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-black hover:bg-gray-800 shadow-sm">
                     Enregistrer
                   </button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Composants visuels pour l'UIs
function RoleDescription({ role, color, children }: { role: string, color: string, children: React.ReactNode }) {
  return (
    <div className={`pl-4 border-l-2 ${color}`}>
      <h3 className="text-sm font-semibold tracking-wide text-gray-200 mb-1">{role}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{children}</p>
    </div>
  )
}
