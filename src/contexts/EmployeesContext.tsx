import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { isSupabaseConfigured } from "../lib/supabase";

export interface Employee {
  id: string;
  nom: string;
  prenom: string;
  grade: string;
  salary: number;
  hire_date: string;
  matricule: string;
  department?: string;
  performance?: number; // 1-3
  potential?: number;   // 1-3
}

interface EmployeesContextType {
  employees: Employee[];
  loading: boolean;
  promoteCandidateToEmployee: (candidate: any) => Promise<void>;
  fetchEmployees: () => Promise<void>;
}

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "1",
    nom: "Benali",
    prenom: "Fatima",
    grade: "Directrice Marketing",
    salary: 45000,
    hire_date: "2023-01-15T10:00:00Z",
    matricule: "MAT-0001",
    department: "Marketing",
    performance: 3,
    potential: 3
  },
  {
    id: "2",
    nom: "Mounir",
    prenom: "Raji",
    grade: "Seniors Developer",
    salary: 38000,
    hire_date: "2023-03-20T10:00:00Z",
    matricule: "MAT-0002",
    department: "IT",
    performance: 3,
    potential: 2
  },
  {
    id: "3",
    nom: "Tazi",
    prenom: "Lina",
    grade: "HR Manager",
    salary: 35000,
    hire_date: "2023-06-12T10:00:00Z",
    matricule: "MAT-0003",
    department: "RH",
    performance: 2,
    potential: 3
  },
  {
    id: "4",
    nom: "Amrani",
    prenom: "Driss",
    grade: "Comptable",
    salary: 28000,
    hire_date: "2024-01-05T10:00:00Z",
    matricule: "MAT-0004",
    department: "Finance",
    performance: 1,
    potential: 1
  }
];

const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined);

export function EmployeesProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    let dbEmployees: Employee[] = [];
    
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('employees').select('*').order('hire_date', { ascending: false });
        if (!error && data) {
          dbEmployees = data;
        }
      } catch (e) {
        console.error("Failed to fetch employees", e);
      }
    } else {
      const stored = localStorage.getItem('nexahr_employees');
      if (stored) {
        dbEmployees = JSON.parse(stored);
      }
    }

    // Merge with INITIAL_EMPLOYEES to ensure demo data is always there if not already in DB
    const merged = [...dbEmployees];
    INITIAL_EMPLOYEES.forEach(initial => {
      if (!merged.find(e => e.matricule === initial.matricule)) {
        merged.push(initial);
      }
    });

    setEmployees(merged);
    if (!isSupabaseConfigured && !localStorage.getItem('nexahr_employees')) {
      localStorage.setItem('nexahr_employees', JSON.stringify(merged));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const promoteCandidateToEmployee = async (candidate: { 
    nom: string; 
    prenom: string; 
    grade: string; 
    salary: number; 
    department: string;
    performance?: number;
    potential?: number;
  }) => {
    const newEmployee: Omit<Employee, 'id'> = {
      nom: candidate.nom,
      prenom: candidate.prenom,
      grade: candidate.grade,
      salary: candidate.salary,
      hire_date: new Date().toISOString(),
      matricule: `MAT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      department: candidate.department,
      performance: candidate.performance,
      potential: candidate.potential
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('employees').insert([newEmployee]).select();
        if (!error && data) {
          setEmployees(prev => [data[0], ...prev]);
        }
      } catch (err) {
        console.error("Failed to insert employee into Supabase", err);
      }
    } else {
      const newEmpWithId = { ...newEmployee, id: crypto.randomUUID() };
      const updated = [newEmpWithId, ...employees];
      setEmployees(updated);
      localStorage.setItem('nexahr_employees', JSON.stringify(updated));
    }
  };

  return (
    <EmployeesContext.Provider value={{ employees, loading, promoteCandidateToEmployee, fetchEmployees }}>
      {children}
    </EmployeesContext.Provider>
  );
}

export const useEmployees = () => {
  const context = useContext(EmployeesContext);
  if (!context) throw new Error("useEmployees must be used within an EmployeesProvider");
  return context;
};
