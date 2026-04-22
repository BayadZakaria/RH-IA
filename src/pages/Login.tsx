import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";

export function Login() {
  const { login, registerCandidate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Checking default state from router (S'inscrire button pushes tab: 'register')
  const defaultTab = location.state?.tab || 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (activeTab === 'login') {
        await login(email, password);
        navigate("/app");
      } else {
        if (!nom || !prenom || !email || !password) {
          setError("Veuillez remplir tous les champs.");
          setIsLoading(false);
          return;
        }
        await registerCandidate(nom, prenom, email, password);
        navigate("/app");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-4 selection:bg-black selection:text-white relative">
      
      {/* Back to home */}
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> 
          Retour à l'accueil
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 p-8 sm:p-12 overflow-hidden"
      >
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="font-bold text-3xl tracking-tight text-gray-900">NewGen <span className="text-indigo-600">Rh</span></span>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-gray-50 p-1 rounded-xl w-full mb-8 border border-gray-100/50">
            <button 
              onClick={() => {setActiveTab('login'); setError("");}}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'login' ? 'bg-white shadow border border-gray-100 text-black' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Connexion
            </button>
            <button 
              onClick={() => {setActiveTab('register'); setError("");}}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'register' ? 'bg-white shadow border border-gray-100 text-black' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Créer un compte
            </button>
          </div>
          
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            {activeTab === 'login' ? 'Espace Professionnel' : 'Nouveau Candidat / Société'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {activeTab === 'login' ? 'Accès réservé aux administrateurs et décideurs' : 'Rejoignez NewGen Rh et démarrez votre carrière'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'login' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'login' ? 10 : -10 }}
            transition={{ duration: 0.2 }}
          >
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {activeTab === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Prénom</label>
                    <input type="text" className="form-input text-sm" placeholder="John" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Nom</label>
                    <input type="text" className="form-input text-sm" placeholder="Doe" value={nom} onChange={(e) => setNom(e.target.value)} required />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest pl-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="name@company.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest pl-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-gray-800 transition-colors mt-4 shadow-md flex items-center justify-center disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  activeTab === 'login' ? 'Se connecter' : 'Valider l\'inscription'
                )}
              </button>
            </form>
          </motion.div>
        </AnimatePresence>

        {activeTab === 'login' && (
          <div className="mt-8 text-center border-t border-gray-50 pt-8 shadow-inner bg-gray-50/50 -mx-8 -mb-8 p-8">
            <p className="text-[11px] text-gray-400 font-mono">
              [DEMO] ADMIN: bayadzakaria6@gmail.com / adminadmin1
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
