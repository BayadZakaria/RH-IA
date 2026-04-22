import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, User, Bot, Loader2, CheckCircle2, ChevronRight, BrainCircuit, Activity } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEvaluations, EvalState } from "../contexts/EvaluationsContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { generateInterviewQuestions, analyzeInterview } from "../lib/gemini";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

export function Interview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addEvaluation } = useEvaluations();
  const { addNotification } = useNotifications();
  
  const { candidateName, roleName, jobId, email } = location.state || {
    candidateName: "Candidat",
    roleName: "Poste",
    jobId: "",
    email: ""
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [inputMessage, setInputMessage] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [transcript, setTranscript] = useState<{ q: string, a: string }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initQuestions = async () => {
      setIsBotTyping(true);
      const q = await generateInterviewQuestions(candidateName, roleName);
      setQuestions(q);
      setMessages([{
        id: "start",
        role: "bot",
        content: `Bonjour ${candidateName}. Bienvenue dans votre entretien pour le poste de ${roleName}. Je vais vous poser 7 questions pour mieux vous connaître. Êtes-vous prêt ?`
      }]);
      setIsBotTyping(false);
    };
    initQuestions();
  }, [candidateName, roleName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isBotTyping || interviewComplete) return;

    const userMsg = inputMessage;
    setInputMessage("");

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: userMsg
    }]);

    setIsBotTyping(true);

    // If it was the initial "Ready?" message
    if (currentQuestionIndex === -1) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: "q0",
          role: "bot",
          content: questions[0]
        }]);
        setCurrentQuestionIndex(0);
        setIsBotTyping(false);
      }, 1000);
      return;
    }

    // Save transcription
    const currentQ = questions[currentQuestionIndex];
    setTranscript(prev => [...prev, { q: currentQ, a: userMsg }]);

    // Move to next question or analyze
    if (currentQuestionIndex < 6) {
      setTimeout(() => {
        const nextIdx = currentQuestionIndex + 1;
        setMessages(prev => [...prev, {
          id: `q${nextIdx}`,
          role: "bot",
          content: questions[nextIdx]
        }]);
        setCurrentQuestionIndex(nextIdx);
        setIsBotTyping(false);
      }, 1500);
    } else {
      setTimeout(async () => {
        setMessages(prev => [...prev, {
          id: "done",
          role: "bot",
          content: "Merci énormément pour vos réponses. Notre IA NewGen Rh est en train d'analyser cet entretien. Veuillez patienter un instant..."
        }]);
        setIsBotTyping(false);
        setInterviewComplete(true);
        handleAnalysis();
      }, 1000);
    }
  };

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Using simple mapping to pass transcript correctly
    const finalTranscript = questions.map((q, i) => ({
      q,
      a: transcript[i]?.a || "Aucune réponse"
    }));

    const analysis = await analyzeInterview(candidateName, roleName, finalTranscript);
    
    const finalStatus = analysis.decision === "APPROVED" ? "APPROVED" : (analysis.decision === "REJECTED" ? "REJECTED" : "COMPLETED");

    addEvaluation({
      name: candidateName,
      role: roleName,
      comments: `Entretien Chatbot complété. Résumé IA: ${analysis.recommendation}`,
      jobId: jobId,
      candidateEmail: email,
      status: finalStatus,
      globalScore: analysis.globalScore,
      techScore: analysis.techScore,
      cultureScore: analysis.cultureScore,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendation: analysis.recommendation
    });

    addNotification(`Entretien terminé pour ${candidateName}. Global Score: ${analysis.globalScore}/100. Statut: ${finalStatus}`, "success");
    
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col pt-4">
      {/* Header */}
      <div className="bg-[#0B1E36] p-6 rounded-t-3xl border-b border-white/10 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#8C5E3C] rounded-full flex items-center justify-center shadow-inner">
            <BrainCircuit className="text-white w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Assistant Recrutement NewGen Rh</h1>
            <p className="text-[#8C5E3C] text-[10px] font-bold uppercase tracking-widest">IA en session d'interview</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
           <span className="text-white/60 text-xs font-medium">Candidat : </span>
           <span className="text-white text-xs font-bold">{candidateName}</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white border-x border-gray-100 overflow-y-auto p-4 space-y-6 flex flex-col no-scrollbar">
        {messages.map((m) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${m.role === 'user' ? 'bg-[#0B1E36]' : 'bg-[#F4F1EA]'}`}>
                {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-[#8C5E3C]" />}
              </div>
              <div className={`px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-[#0B1E36] text-white rounded-tr-none' : 'bg-[#F4F1EA] text-[#0B1E36] rounded-tl-none border border-[#EBE6DE]'}`}>
                {m.content}
              </div>
            </div>
          </motion.div>
        ))}
        {isBotTyping && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-[#F4F1EA] flex items-center justify-center">
               <Bot className="w-4 h-4 text-[#8C5E3C]" />
             </div>
             <div className="bg-[#F4F1EA] px-5 py-3 rounded-2xl flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#8C5E3C]/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-[#8C5E3C]/40 rounded-full animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 bg-[#8C5E3C]/40 rounded-full animate-bounce delay-150" />
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area or Results */}
      <div className="bg-white p-4 border-x border-b border-gray-100 rounded-b-3xl shadow-sm">
        {isAnalyzing ? (
           <div className="flex flex-col items-center justify-center py-6 text-center">
             <div className="relative mb-4">
               <div className="absolute inset-0 bg-[#8C5E3C]/20 rounded-full animate-ping" />
               <div className="relative h-16 w-16 bg-[#F4F1EA] rounded-full flex items-center justify-center border border-[#8C5E3C]/20 shadow-lg">
                 <Loader2 className="w-8 h-8 text-[#8C5E3C] animate-spin" />
               </div>
             </div>
             <h3 className="text-[#0B1E36] font-bold">Analyse multidimensionnelle en cours...</h3>
             <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Génération du Global Fit Score</p>
           </div>
        ) : interviewComplete && !isAnalyzing ? (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-4 text-center">
             <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
               <CheckCircle2 className="w-8 h-8 text-green-500" />
             </div>
             <h3 className="text-[#0B1E36] font-bold text-xl">Entretien Terminé !</h3>
             <p className="text-gray-500 text-sm mb-6 max-w-sm">Votre dossier a été transmis aux directeurs avec l'analyse complète de l'IA.</p>
             <button 
               onClick={() => navigate("/app")}
               className="bg-[#0B1E36] text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#8C5E3C] transition-all"
             >
               Retour au Tableau de Bord
               <ChevronRight className="w-4 h-4" />
             </button>
           </motion.div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Écrivez votre réponse ici..."
              disabled={isBotTyping}
              className="flex-1 bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C5E3C]/20 transition-all font-medium"
            />
            <button 
              type="submit" 
              disabled={!inputMessage.trim() || isBotTyping}
              className="bg-[#0B1E36] text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-[#8C5E3C] disabled:bg-gray-200 transition-all group"
            >
              <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
