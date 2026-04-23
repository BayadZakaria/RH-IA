import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Search, Zap, Code, ShieldCheck, PlayCircle, Star, Sparkles } from "lucide-react";
import { useJobs } from "../contexts/JobsContext";
import { BrandLogo } from "../components/BrandLogo";

export function Landing() {
  const { jobs } = useJobs();
  const openJobs = jobs.filter(job => job.status === 'OPEN');

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-gray-900 font-sans selection:bg-violet-600 selection:text-white overflow-hidden">
      
      {/* Navbar Publique */}
      <nav className="absolute top-0 w-full z-50 flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <BrandLogo size="md" />
        </Link>
        <div className="hidden md:flex items-center gap-12 font-medium text-sm text-gray-600">
          <a href="#offres" className="hover:text-violet-600 transition-colors uppercase tracking-widest text-[11px] font-bold">Talents</a>
          <a href="#produit" className="hover:text-violet-600 transition-colors uppercase tracking-widest text-[11px] font-bold">Plateforme</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:block text-xs uppercase tracking-widest font-bold hover:text-violet-600 transition-colors">
            Login
          </Link>
          <Link to="/login" state={{ tab: 'register' }} className="bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-violet-600 transition-colors shadow-xl">
            S'inscrire
          </Link>
        </div>
      </nav>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] sm:top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-violet-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob animation-delay-4000" />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 md:px-12 min-h-screen flex flex-col justify-center items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="z-10 w-full max-w-7xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-black/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 bg-white/50 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-violet-600" />
            L'IA rencontre l'humain
          </div>
          
          <h1 className="text-[12vw] sm:text-[9vw] lg:text-[8vw] font-black tracking-tighter leading-[0.85] text-black mix-blend-color-burn uppercase">
            Redéfinissez
            <br />
            Le <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500 italic pr-4">Talent.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto mt-12 text-lg sm:text-xl md:text-2xl text-gray-600 font-medium leading-relaxed">
            Nous avons créé l'expérience RH la plus fluide. 
            Évaluez, recrutez et fidélisez vos collaborateurs avec l'intelligence artificielle la plus élégante du marché.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16">
             <Link to="/login" className="group bg-black text-white px-10 py-5 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-violet-600 transition-all shadow-2xl flex items-center gap-3">
                Démarrer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </Link>
             <a href="#offres" className="px-10 py-5 rounded-full text-sm font-bold uppercase tracking-widest border-2 border-black/10 hover:bg-black hover:text-white transition-all flex items-center gap-2">
                Offres d'emploi
             </a>
          </div>
        </motion.div>
      </section>

      {/* Offres d'emplois Compactes */}
      <section id="offres" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
           <div className="max-w-xl">
             <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
               Postes <br/> Ouverts
             </h2>
           </div>
           <div className="text-left md:text-right">
             <p className="text-gray-500 font-medium max-w-sm md:ml-auto text-sm leading-relaxed">
               Rejoignez nos équipes. Postulez en quelques clics via notre interface assistée par l'IA Evolia.
             </p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {openJobs.length > 0 ? (
            openJobs.map((job) => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={job.id} 
                className="group relative bg-white/60 backdrop-blur-md rounded-[24px] border border-gray-200 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(124,58,237,0.15)] hover:border-violet-300 transition-all flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-4">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-violet-700 bg-violet-100 px-3 py-1 rounded-full">
                     {job.dept}
                   </span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                     {job.type}
                   </span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">
                  {job.title}
                </h3>
                
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-8 mt-2">
                   <span className="w-2 h-2 bg-green-500 rounded-full" /> 
                   {job.location}
                </p>
                
                <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-black text-gray-900 uppercase tracking-widest group-hover:text-violet-700 transition-colors">Postuler</span>
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-violet-600 group-hover:border-violet-600 transition-all">
                      <ArrowUpRight className="w-4 h-4 text-gray-900 group-hover:text-white transition-colors" />
                  </div>
                </div>
                
                <Link to="/login" state={{ tab: 'register' }} className="absolute inset-0 z-10" aria-label={`Postuler pour ${job.title}`} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center bg-white/50 backdrop-blur-sm rounded-[24px] border border-gray-200 border-dashed">
              <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">Aucun poste ouvert</h3>
              <p className="text-gray-500 text-sm mt-3 font-medium">Revenez bientôt pour découvrir de nouvelles opportunités.</p>
            </div>
          )}
        </div>
      </section>

      {/* Abstract Footer Graphic */}
      <div className="h-64 md:h-96 w-full flex items-end justify-center pb-12 relative overflow-hidden">
        <h1 className="text-[25vw] font-black text-black/5 leading-none absolute bottom-[-10%] whitespace-nowrap pointer-events-none select-none">
          EVOLIA
        </h1>
      </div>
    </div>
  );
}
