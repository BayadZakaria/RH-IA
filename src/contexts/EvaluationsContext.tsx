import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type EvalState = {
  id: number;
  name: string;
  role: string;
  date: string;
  status: "PENDING" | "ANALYZING" | "COMPLETED" | "APPROVED" | "REJECTED";
  techScore: number;
  cultureScore: number;
  globalScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  comments: string;
  isGeneratingDoc?: boolean;
  docGenerated?: boolean;
  jobId?: string;
  candidateEmail?: string;
  approvalLevel?: number; // 0=FONC, 1=HIER, 2=RH, 3=DG, 4=VALIDÉ
  approvalMetrics?: {
    fonc?: { date: string, traceId: string, name: string },
    hier?: { date: string, traceId: string, name: string },
    rh?: { date: string, traceId: string, name: string },
    dg?: { date: string, traceId: string, name: string }
  }
};

interface EvaluationsContextType {
  evaluations: EvalState[];
  addEvaluation: (evalData: Partial<EvalState> & Pick<EvalState, 'name' | 'role' | 'comments'>) => void;
  updateEvaluation: (id: number, updates: Partial<EvalState>) => void;
  approveEvaluation: (id: number) => void;
  rejectEvaluation: (id: number) => void;
  advanceApproval: (id: number, currentUserName?: string) => void;
}

const INITIAL_EVALS: EvalState[] = [];

const EvaluationsContext = createContext<EvaluationsContextType | undefined>(undefined);

export function EvaluationsProvider({ children }: { children: ReactNode }) {
  const [evaluations, setEvaluations] = useState<EvalState[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadFromStorage = () => {
      const saved = localStorage.getItem('nexahr_evaluations');
      if (saved) {
        try {
          setEvaluations(JSON.parse(saved));
        } catch (e) {
          setEvaluations(INITIAL_EVALS);
        }
      } else {
        setEvaluations(INITIAL_EVALS);
      }
      setIsLoaded(true);
    };

    loadFromStorage();

    // Ecouteur pour se synchroniser entre plusieurs fenêtres/onglets en temps réel
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nexahr_evaluations') {
         loadFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('nexahr_evaluations', JSON.stringify(evaluations));
    }
  }, [evaluations, isLoaded]);

  const addEvaluation = (evalData: Partial<EvalState> & Pick<EvalState, 'name' | 'role' | 'comments'>) => {
    const newId = Date.now();
    const newEval: EvalState = {
      status: evalData.status || "PENDING",
      techScore: evalData.techScore !== undefined ? evalData.techScore : 0,
      cultureScore: evalData.cultureScore !== undefined ? evalData.cultureScore : 0,
      globalScore: evalData.globalScore !== undefined ? evalData.globalScore : 0,
      strengths: evalData.strengths || [],
      weaknesses: evalData.weaknesses || [],
      recommendation: evalData.recommendation || "",
      ...evalData,
      id: newId,
      date: "À l'instant",
    };
    setEvaluations(prev => [newEval, ...prev]);
  };

  const updateEvaluation = (id: number, updates: Partial<EvalState>) => {
    setEvaluations(prev => prev.map(ev => ev.id === id ? { ...ev, ...updates } : ev));
  };

  const approveEvaluation = (id: number) => updateEvaluation(id, { status: "APPROVED", approvalLevel: 0 });
  const rejectEvaluation = (id: number) => updateEvaluation(id, { status: "REJECTED" });
  const advanceApproval = (id: number, currentUserName: string = "Admin") => {
    const generateTraceId = () => Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    setEvaluations(prev => prev.map(ev => {
      if (ev.id === id) {
        const currentLevel = ev.approvalLevel || 0;
        const newLevel = Math.min(currentLevel + 1, 4);
        
        let newMetrics = { ...ev.approvalMetrics };
        const payload = {
          date: new Date().toISOString(),
          traceId: `ID:${generateTraceId()}`,
          name: currentUserName
        };

        if (currentLevel === 0) newMetrics.fonc = payload;
        if (currentLevel === 1) newMetrics.hier = payload;
        if (currentLevel === 2) newMetrics.rh = payload;
        if (currentLevel === 3) newMetrics.dg = payload;

        return { ...ev, approvalLevel: newLevel, approvalMetrics: newMetrics };
      }
      return ev;
    }));
  };

  return (
    <EvaluationsContext.Provider value={{ evaluations, addEvaluation, updateEvaluation, approveEvaluation, rejectEvaluation, advanceApproval }}>
      {children}
    </EvaluationsContext.Provider>
  );
}

export function useEvaluations() {
  const context = useContext(EvaluationsContext);
  if (context === undefined) {
    throw new Error("useEvaluations must be used within an EvaluationsProvider");
  }
  return context;
}
