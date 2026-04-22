import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Zap, Code, ShieldCheck, PlayCircle } from "lucide-react";
import { useJobs } from "../contexts/JobsContext";

export function Landing() {
  const { jobs } = useJobs();
  // Filter only open jobs for landing page
  const openJobs = jobs.filter(job => job.status === 'OPEN');

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-black selection:text-white pb-32">
      {/* Navbar Publique */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-gray-900">NewGen <span className="text-indigo-600">Rh</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
          <a href="#offres" className="hover:text-black transition-colors">Offres d'emploi</a>
          <a href="#produit" className="hover:text-black transition-colors">Découvrir le SaaS</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold hover:text-gray-600 transition-colors">
            Se connecter
          </Link>
          <Link to="/login" state={{ tab: 'register' }} className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg">
            S'inscrire
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 pt-20 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-semibold uppercase tracking-widest text-gray-600 border border-gray-200 mb-8">
            <Zap className="w-3 h-3 text-black" />
            La nouvelle ère du recrutement
          </div>
          <h1 className="text-6xl md:text-8xl font-semibold tracking-tight leading-[0.9] text-black">
            L'IA au service <br/> de vos talents.
          </h1>
          <p className="max-w-2xl mx-auto mt-8 text-xl text-gray-500 leading-relaxed font-light">
            Une plateforme épurée, intelligente et connectée pour gérer vos recrutements, 
            évaluer automatiquement les CV et orchestrer vos processus RH.
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-12">
             <Link to="/login" className="bg-black text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2">
                Espace Entreprise (SaaS) <ArrowRight className="w-4 h-4" />
             </Link>
             <a href="#offres" className="px-8 py-4 rounded-full text-base font-semibold border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2">
                <Search className="w-4 h-4" /> Parcourir les emplois
             </a>
          </div>
        </motion.div>
        
        {/* Abstract App Preview */}
        <motion.div 
           initial={{ opacity: 0, y: 40 }} 
           animate={{ opacity: 1, y: 0 }} 
           transition={{ duration: 0.8, delay: 0.2 }}
           className="mt-20 max-w-5xl mx-auto rounded-[2.5rem] bg-gray-50 border border-gray-200 p-4 shadow-2xl relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-12 opacity-5">
             <Code className="w-64 h-64" />
           </div>
           <div className="bg-white rounded-[2rem] border border-gray-100 h-[400px] shadow-sm flex flex-col pt-8 px-8">
              <div className="w-1/3 h-6 bg-gray-100 rounded-lg mb-8" />
              <div className="flex gap-4">
                 <div className="w-1/4 h-24 bg-gray-50 rounded-xl border border-gray-100 p-4">
                   <div className="w-8 h-8 rounded-full bg-blue-100 mb-4" />
                   <div className="w-1/2 h-3 bg-gray-200 rounded-full" />
                 </div>
                 <div className="w-1/4 h-24 bg-gray-50 rounded-xl border border-gray-100 p-4">
                   <div className="w-8 h-8 rounded-full bg-purple-100 mb-4" />
                   <div className="w-1/2 h-3 bg-gray-200 rounded-full" />
                 </div>
                 <div className="w-1/4 h-24 bg-gray-50 rounded-xl border border-gray-100 p-4">
                   <div className="w-8 h-8 rounded-full bg-orange-100 mb-4" />
                   <div className="w-1/2 h-3 bg-gray-200 rounded-full" />
                 </div>
                 <div className="w-1/4 h-24 bg-gray-50 rounded-xl border border-gray-100 p-4">
                   <div className="w-8 h-8 rounded-full bg-green-100 mb-4" />
                   <div className="w-1/2 h-3 bg-gray-200 rounded-full" />
                 </div>
              </div>
           </div>
        </motion.div>
      </section>

      {/* Offres d'emplois Publiques */}
      <section id="offres" className="max-w-4xl mx-auto px-8 pt-20">
        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
           <div>
             <h2 className="text-3xl font-semibold tracking-tight">Postes ouverts</h2>
             <p className="text-gray-500 mt-2">Rejoignez-nous et propulsez votre carrière avec NewGen Rh.</p>
           </div>
           <div className="hidden sm:block">
             <ShieldCheck className="w-10 h-10 text-gray-200" />
           </div>
        </div>

        <div className="space-y-4">
          {openJobs.map((job) => (
            <motion.div 
               whileHover={{ scale: 1.01 }}
               key={job.id} 
               className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl border border-gray-100 hover:border-black hover:shadow-lg transition-all bg-white cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <span className="text-xs font-bold uppercase tracking-wider text-black bg-gray-100 px-3 py-1 rounded-sm">{job.dept}</span>
                   <span className="text-xs font-medium text-gray-500">{job.type}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> 
                   {job.location}
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0">
                 <Link to="/login" state={{ tab: 'register' }} className="px-5 py-2.5 bg-white border border-gray-200 text-black font-semibold rounded-full text-sm group-hover:bg-black group-hover:text-white transition-colors duration-300">
                   Postuler via le portail
                 </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
