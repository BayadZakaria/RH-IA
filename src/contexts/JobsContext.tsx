import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface JobOffer {
  id: string;
  title: string;
  dept: string;
  location: string;
  type: string;
  status: 'OPEN' | 'CLOSED';
  author_id?: string;
  salary?: string;
}

interface JobsContextType {
  jobs: JobOffer[];
  addJob: (job: Omit<JobOffer, "id" | "status">) => Promise<void>;
  closeJob: (id: string) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  loading: boolean;
}

const INITIAL_JOBS: JobOffer[] = [];

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    let localJobs: JobOffer[] = [];
    const saved = localStorage.getItem('nexahr_jobs_fallback');
    if (saved) {
      try {
        localJobs = JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }

    if (!isSupabaseConfigured) {
      setJobs(localJobs.length > 0 ? localJobs : INITIAL_JOBS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching jobs from Supabase", error);
        setJobs(localJobs.length > 0 ? localJobs : INITIAL_JOBS);
      } else if (data) {
        // Hydrate and Merge Supabase with fallback local data (Supabase wins if ID matches)
        const supabaseIds = new Set(data.map(d => d.id.toString()));
        const uniqueLocal = localJobs.filter(lj => !supabaseIds.has(lj.id.toString()));
        setJobs([...(data as JobOffer[]), ...uniqueLocal]);
      }
    } catch (error) {
      console.error(error);
      setJobs(localJobs.length > 0 ? localJobs : INITIAL_JOBS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nexahr_jobs_fallback') {
         fetchJobs();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!loading) {
      // Unconditionally save to local storage as a robust fallback for the prototype
      localStorage.setItem('nexahr_jobs_fallback', JSON.stringify(jobs));
    }
  }, [jobs, loading]);

  const addJob = async (job: Omit<JobOffer, "id" | "status">) => {
    const newJobBase = { ...job, status: 'OPEN' as const };

    if (isSupabaseConfigured) {
      // Fetch authenticated user ID to satisfy Supabase RLS policies
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;

      // Strip potentially unsupported columns for the Supabase insert to prevent crashing
      const supabasePayload = {
        title: job.title,
        dept: job.dept,
        location: job.location,
        type: job.type,
        status: 'OPEN',
        ...(currentUserId && { author_id: currentUserId })
      };

      const { data, error } = await supabase.from('jobs').insert([supabasePayload]).select().single();
      
      if (error) {
        console.error('Error adding job to Supabase:', error.message);
        // Fallback to local state so the UI doesn't break for the prototype
        const newJob: JobOffer = {
          ...newJobBase,
          id: Math.random().toString(36).substring(2, 9)
        };
        setJobs(prev => [newJob, ...prev]);
        return;
      }
      
      if (data) {
        // Merge the created data with our local-only fields (like salary & author_id)
        setJobs(prev => [{...newJobBase, ...data} as JobOffer, ...prev]);
      }
    } else {
      const newJob: JobOffer = {
        ...newJobBase,
        id: Math.random().toString(36).substring(2, 9)
      };
      setJobs(prev => [newJob, ...prev]);
    }
  };

  const closeJob = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('jobs').update({ status: 'CLOSED' }).eq('id', id);
      if (error) {
        console.error('Error closing job in Supabase:', error);
        return;
      }
    }
    setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'CLOSED' } : job));
  };

  const deleteJob = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) {
        console.error('Error deleting job in Supabase:', error);
        return;
      }
    }
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  return (
    <JobsContext.Provider value={{ jobs, addJob, closeJob, deleteJob, loading }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return context;
}
