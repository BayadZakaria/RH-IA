import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Brain, Users, Clock, AlertCircle, FileText, Send, Bot, User as UserIcon, Briefcase, MapPin, CheckCircle2, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useJobs } from "../contexts/JobsContext";
import { useEvaluations } from "../contexts/EvaluationsContext";
import { useEmployees } from "../contexts/EmployeesContext";
import { Link } from "react-router-dom";

const DATA = [
  { name: "Lun", value: 12 },
  { name: "Mar", value: 19 },
  { name: "Mer", value: 15 },
  { name: "Jeu", value: 25 },
  { name: "Ven", value: 22 },
  { name: "Sam", value: 5 },
  { name: "Dim", value: 8 },
];

export function Dashboard() {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const { evaluations, addEvaluation } = useEvaluations();
  const { employees } = useEmployees();
  
  // Stats calculées sur données réelles
  const totalEmployees = employees.length;
  const openJobsCount = jobs.filter(j => j.status === 'OPEN').length;
  const pendingApprovalsCount = evaluations.filter(ev => ev.status === "APPROVED" && (ev.approvalLevel || 0) < 4).length;
  const candidateVolume = evaluations.length;

  // Calcul du risque turnover (simulé mais déterministe pour rester consistant avec la page Turnover)
  const getRiskScore = (emp: any) => {
    const hash = (emp.nom + emp.prenom).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return ((hash * 13) % 90) + 5;
  };
  const criticalEmployees = employees.filter(e => getRiskScore(e) > 60);

  const stats = [
    { label: "Collaborateurs", value: totalEmployees.toString(), trend: "+4%", icon: Users, alert: false },
    { label: "Postes Ouverts", value: openJobsCount.toString(), trend: "Actifs", icon: Briefcase, alert: false },
    { label: "En Signature", value: pendingApprovalsCount.toString(), trend: "Urgent", icon: Clock, alert: pendingApprovalsCount > 0 },
    { label: "Risques Turnover", value: criticalEmployees.length.toString(), trend: "Analyse IA", icon: AlertCircle, alert: criticalEmployees.length > 0 },
  ];

  // Insights IA Réels
  const aiInsights = [
    { 
       label: "Alerte Turnover", 
       text: criticalEmployees.length > 0 
        ? `${criticalEmployees.length} départ(s) à risque identifié(s) (dont ${criticalEmployees[0].nom}).` 
        : "Risque de turnover faible cette semaine." 
    },
    { 
       label: "Matching Talent", 
       text: evaluations.filter(ev => ev.globalScore > 85).length > 0 
        ? `${evaluations.filter(ev => ev.globalScore > 85).length} candidats exceptionnels détectés par le chatbot.` 
        : "Nouveaux CV en cours d'analyse par NewGen Rh IA." 
    }
  ];

  // Activité réelle (Dernières évaluations)
  const recentActivity = evaluations.slice(0, 6).map(ev => {
    let type = 'event';
    let title = 'Activité';
    if (ev.status === 'APPROVED') {
       type = 'approval';
       title = (ev.approvalLevel || 0) < 4 ? 'En cours de signature' : 'Approbation Finale';
    } else if (ev.status === 'ANALYZING') {
       type = 'ai_score';
       title = 'Analyse IA en cours';
    } else if (ev.status === 'COMPLETED') {
       type = 'ai_score';
       title = `Score IA: ${ev.globalScore}%`;
    } else if (ev.status === 'REJECTED') {
       type = 'alert';
       title = 'Candidature Rejetée';
    }

    return {
      title,
      desc: `${ev.name} - ${ev.role}`,
      time: ev.date || "Récemment",
      type
    };
  });
  
  // Chatbot State
  const [messages, setMessages] = useState<{role: 'ai'|'user', text: string}[]>([
    { role: 'ai', text: 'Bonjour ! Je suis l\'assistant IA de NewGen Rh. Pourriez-vous me décrire brièvement la plus grande réussite de votre carrière et ce que vous en avez appris ?' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatbotCompleted, setChatbotCompleted] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, chatbotCompleted]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: inputValue }]);
    setInputValue("");
    setIsTyping(true);

    // Simulate NLP Delay & Behavioral Scoring
    setTimeout(() => {
      setIsTyping(false);
      const generatedScore = Math.floor(Math.random() * 20) + 75; // 75-95
      setAiScore(generatedScore);
      setMessages(prev => [...prev, { role: 'ai', text: `Merci pour vos réponses. L'IA a complété l'analyse de votre profil. Votre candidature spontanée a bien été enregistrée et sera traitée par notre équipe !` }]);
      setChatbotCompleted(true);
      
      // Enregistrer comme candidature spontanée dans le système d'évaluation
      // L'ajouter aux Évaluations pour que le directeur puisse la voir
      const fullName = user ? `${user.prenom} ${user.nom}`.trim() : 'Candidat Anonyme';
      
      const chatTranscript = messages.map(m => `${m.role === 'ai' ? 'NewGen Rh IA' : fullName}: ${m.text}`).join('\n') + `\n${fullName}: ${inputValue}`;

      const tech = Math.floor(Math.random() * 20) + 70; // 70-90
      const culture = Math.floor(Math.random() * 20) + 75; // 75-95

      addEvaluation({
        name: fullName,
        role: "Candidature Spontanée (Interview IA)",
        comments: `Qualification via entretien IA.\n\nTranscription:\n${chatTranscript}`,
        candidateEmail: user?.email,
        status: "COMPLETED",
        globalScore: generatedScore,
        techScore: tech,
        cultureScore: culture,
        strengths: ["Bonne communication", "Soft skills remarqués", "Réponses fluides orientées résultat"],
        weaknesses: ["Évaluation uniquement comportementale (pas de test métier)"],
        recommendation: generatedScore >= 85 ? "Embauche Fortement Recommandée" : "À discuter avec l'équipe"
      });

    }, 2000);
  };

  if (user?.role === "CANDIDATE") {
    // Mes candidatures
    const myApplications = evaluations.filter(ev => ev.candidateEmail === user?.email);
    
    // Offres disponibles (pas encore postulées)
    const openJobs = jobs.filter(j => 
      j.status === 'OPEN' && 
      !myApplications.some(app => app.jobId === j.id.toString())
    );

    return (
      <div className="max-w-6xl mx-auto py-8 space-y-8 flex flex-col h-[calc(100vh-8rem)]">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Bonjour, {user.prenom}</h1>
          <p className="text-gray-500 mt-2">Bienvenue sur votre espace de recrutement. Parcourez nos offres, suivez vos candidatures ou discutez avec notre IA.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
          {/* Job Offers & Applications List */}
          <div className="flex flex-col h-full bg-white border border-gray-100 shadow-sm rounded-3xl p-6 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2 space-y-8">
              
              {/* === MES CANDIDATURES === */}
              {myApplications.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    <FileText className="w-5 h-5 text-[#8C5E3C]" /> Mes Candidatures
                  </h2>
                  <div className="space-y-3">
                    {myApplications.map(app => (
                      <div key={app.id} className="p-4 border border-[#8C5E3C]/20 bg-[#8C5E3C]/5 rounded-2xl relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{app.role}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm shrink-0 uppercase
                            ${app.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              app.status === 'COMPLETED' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-gray-200 text-gray-700'}`}>
                            {app.status === 'APPROVED' ? 'Acceptée' :
                             app.status === 'REJECTED' ? 'Refusée' :
                             app.status === 'COMPLETED' ? 'À l\'étude' :
                             app.status === 'ANALYZING' ? 'Analyse IA...' :
                             'En attente'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Candidature du {app.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === NOUVELLES OPPORTUNITÉS === */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                  <Briefcase className="w-5 h-5 text-gray-500" /> Nouvelles opportunités
                </h2>
                <div className="space-y-3">
                  {openJobs.length > 0 ? openJobs.map(job => (
                    <div key={job.id} className="p-4 border border-gray-100 rounded-2xl hover:border-black transition-colors group relative overflow-hidden bg-white">
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{job.title}</h3>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm shrink-0 uppercase">
                          {job.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 relative z-10">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {job.location}</span>
                        <span>•</span>
                        <span>{job.dept}</span>
                      </div>
                      <Link to={`/app/apply?jobId=${job.id}`} className="block text-center w-full py-2.5 bg-gray-50 group-hover:bg-black group-hover:text-white text-gray-700 rounded-xl text-sm font-semibold transition-all relative z-10">
                        Sélectionner ce poste
                      </Link>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      Aucune offre ouverte pour le moment.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Chatbot Interface */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-3xl flex-1 flex flex-col overflow-hidden h-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 line-clamp-1">NewGen Rh Assistant IA</h2>
                  <p className="text-xs text-gray-500">{chatbotCompleted ? 'Qualification complète' : 'Pré-qualification & candidature spontanée'}</p>
                </div>
              </div>
              {chatbotCompleted && (
                <div className="flex flex-col items-end">
                   <span className="text-xs font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-md">Transmise</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/30">
              {messages.map((m, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'ai' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {m.role === 'ai' ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm ${m.role === 'ai' ? 'bg-white border border-gray-100 shadow-sm text-gray-800' : 'bg-black text-white leading-relaxed'}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-gray-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75" />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150" />
                  </div>
                </motion.div>
              )}
              {chatbotCompleted && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-green-50/50 border border-green-100 rounded-3xl p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-800 mb-2">Candidature Transmise</h3>
                    <p className="text-sm text-green-700/80 mb-4">Votre premier contact a été analysé par notre moteur IA de sélection. Il a été directement transmis aux directeurs pour traitement.</p>
                 </motion.div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            <div className="p-3 sm:p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={chatbotCompleted ? "Conversation terminée." : "Répondez..."} 
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all font-medium disabled:opacity-50"
                  disabled={chatbotCompleted || isTyping}
                />
                <button 
                  type="submit" 
                  disabled={!inputValue.trim() || chatbotCompleted || isTyping}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ... rest of dashboard ...


  return (
    <div className="space-y-12 pb-12">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bonjour, {user?.prenom || 'Directeur'}</h1>
        <p className="text-gray-500 mt-2">Aperçu en temps réel de l'activité RH pour NewGen Rh.</p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            key={i}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            {stat.alert && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full m-4" />}
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
              <stat.icon className={`w-5 h-5 ${stat.alert ? 'text-red-500' : 'text-gray-700'}`} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold tracking-tight">{stat.value}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.alert ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts & Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-semibold text-lg hover:text-gray-700 transition-colors">Volume de Candidatures</h3>
                <p className="text-sm text-gray-400">Évolution sur les 7 derniers jours</p>
              </div>
              <select className="bg-gray-50 border border-gray-100 text-sm rounded-lg px-4 py-2 font-medium text-gray-600 outline-none focus:ring-2 focus:ring-gray-200">
                <option>Cette semaine</option>
                <option>Mois dernier</option>
              </select>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111827" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#111827" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Quick AI Insights */}
          <div className="bg-gray-900 text-white p-8 rounded-3xl relative overflow-hidden">
             {/* Abstract background graphics */}
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-[0.02] rounded-full blur-3xl" />
             <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500 opacity-[0.05] rounded-full blur-3xl" />
             
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <Brain className="w-6 h-6 text-blue-400" />
                <h3 className="font-semibold text-lg tracking-wide">Insights IA</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className="border border-white/10 bg-white/5 rounded-xl p-4">
                     <p className="text-xs text-blue-300 font-mono tracking-wider uppercase mb-2">{insight.label}</p>
                     <p className="text-sm font-medium leading-relaxed opacity-90">{insight.text}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Activity Feed Column */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full h-[600px]">
          <h3 className="font-semibold text-lg mb-6">Activité Récente</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {recentActivity.map((act, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="relative flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full z-10 
                    ${act.type === 'alert' ? 'bg-red-400 ring-4 ring-red-50' : 
                      act.type === 'ai_score' ? 'bg-purple-400 ring-4 ring-purple-50' : 
                      act.type === 'approval' ? 'bg-green-400 ring-4 ring-green-50' : 
                      'bg-gray-300 ring-4 ring-gray-100'}`} 
                  />
                  {i !== 4 && <div className="w-[1px] h-full bg-gray-100 absolute top-2.5 group-hover:bg-gray-200 transition-colors" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">{act.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{act.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-wider">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
