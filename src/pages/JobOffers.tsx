import { useState } from "react";
import { useJobs } from "../contexts/JobsContext";
import { useAuth } from "../contexts/AuthContext";
import { Plus, Briefcase, MapPin, Search, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function JobOffers() {
  const { jobs, addJob, closeJob, deleteJob } = useJobs();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("CDI");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dept || !location) return;
    
    addJob({ title, dept, location, type, author_id: user?.id });
    setShowAdd(false);
    setTitle("");
    setDept("");
    setLocation("");
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(search.toLowerCase()) || 
    j.dept.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Postes ouverts</h1>
          <p className="text-gray-500 mt-2">Gérez les offres d'emploi visibles sur le portail public.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nouvelle offre
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mb-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Créer une offre</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">INTITULÉ</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ex: Développeur React" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">DÉPARTEMENT</label>
                <input required type="text" value={dept} onChange={e => setDept(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ex: IT & Engineering" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">LIEU</label>
                <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ex: Casablanca / Remote" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">CONTRAT</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Stage">Stage</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-black">Annuler</button>
              <button type="submit" className="px-5 py-2 bg-black text-white rounded-lg text-sm font-semibold">Publier l'offre</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="relative mb-6 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Rechercher une offre..." 
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold tracking-widest text-gray-500">
              <th className="px-6 py-4">Poste</th>
              <th className="px-6 py-4">Département</th>
              <th className="px-6 py-4">Détails</th>
              <th className="px-6 py-4 text-center">Statut</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredJobs.map((job) => {
              const canDelete = job.author_id === user?.id || user?.role === 'SUPER_ADMIN';

              return (
                <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-gray-900">{job.title}</span>
                        {job.salary && <span className="text-xs text-[#8C5E3C] font-mono mt-0.5">Salaire: {job.salary} MAD</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800">
                      {job.dept}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin className="w-3 h-3"/> {job.location}</span>
                      <span className="text-xs font-medium text-gray-700">{job.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {job.status === 'OPEN' ? (
                      <span className="inline-flex w-2 h-2 rounded-full bg-green-500" title="Ouvert"></span>
                    ) : (
                      <span className="inline-flex w-2 h-2 rounded-full bg-gray-300" title="Fermé"></span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {job.status === 'OPEN' ? (
                        <button onClick={() => closeJob(job.id)} className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">
                          Fermer
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Archivé</span>
                      )}
                      
                      {canDelete && (
                        <button onClick={() => {
                          if(window.confirm('Voulez-vous vraiment supprimer définitivement cette offre ?')) {
                            deleteJob(job.id)
                          }
                        }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Supprimer l'offre">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                  Aucun poste trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
