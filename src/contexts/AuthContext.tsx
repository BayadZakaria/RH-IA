import { createContext, useContext, useState, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { createClient } from "@supabase/supabase-js";

export type Role = "SUPER_ADMIN" | "DIR_HIERARCHIQUE" | "DIR_FONCTIONNEL" | "DIR_RH" | "DIR_GENERAL" | "CANDIDATE";

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  grade: string;
  telephone: string;
  role: Role;
  status: "PENDING" | "APPROVED";
  password?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  usersList: User[];
  login: (email: string, mdp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  createUser: (userData: Omit<User, "id" | "status">) => Promise<void>;
  updatePassword: (userId: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  registerCandidate: (nom: string, prenom: string, email: string, mdp: string) => Promise<void>;
}

const mockInitialUsers: User[] = [
  {
    id: "admin-1",
    email: "bayadzakaria6@gmail.com",
    nom: "Bayad",
    prenom: "Zakaria",
    grade: "Super Admin",
    telephone: "-",
    role: "SUPER_ADMIN",
    status: "APPROVED",
  },
  {
    id: "uuid-df-1",
    email: "fonctionnel@nexahr.com",
    nom: "Lahrach",
    prenom: "Hassan",
    grade: "Directeur Fonctionnel",
    telephone: "-",
    role: "DIR_FONCTIONNEL",
    status: "APPROVED",
    password: "admin",
  },
  {
    id: "uuid-dh-1",
    email: "hierarchique@nexahr.com",
    nom: "Benali",
    prenom: "Fatima",
    grade: "Directeur Hiérarchique",
    telephone: "-",
    role: "DIR_HIERARCHIQUE",
    status: "APPROVED",
    password: "admin",
  },
  {
    id: "uuid-rh-1",
    email: "rh@nexahr.com",
    nom: "El Guir",
    prenom: "Samir",
    grade: "Directeur RH",
    telephone: "-",
    role: "DIR_RH",
    status: "APPROVED",
    password: "admin",
  },
  {
    id: "uuid-dg-1",
    email: "general@nexahr.com",
    nom: "Bennani",
    prenom: "Adil",
    grade: "Directeur Général",
    telephone: "-",
    role: "DIR_GENERAL",
    status: "APPROVED",
    password: "admin",
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>(mockInitialUsers);

  const mapRoleFromDB = (dbRole: string): Role => {
    if (dbRole === 'DIRECTEUR_FONCTIONNEL') return 'DIR_FONCTIONNEL';
    if (dbRole === 'DIRECTEUR_HIERARCHIQUE') return 'DIR_HIERARCHIQUE';
    if (dbRole === 'DIRECTEUR_RH') return 'DIR_RH';
    if (dbRole === 'DIRECTEUR_GENERAL') return 'DIR_GENERAL';
    return dbRole as Role;
  };

  const mapRoleToDB = (reactRole: Role): string => {
    if (reactRole === 'DIR_FONCTIONNEL') return 'DIRECTEUR_FONCTIONNEL';
    if (reactRole === 'DIR_HIERARCHIQUE') return 'DIRECTEUR_HIERARCHIQUE';
    if (reactRole === 'DIR_RH') return 'DIRECTEUR_RH';
    if (reactRole === 'DIR_GENERAL') return 'DIRECTEUR_GENERAL';
    return reactRole;
  };

  const login = async (rawEmail: string, rawMdp: string): Promise<boolean> => {
    const email = rawEmail.trim().toLowerCase();
    const mdp = rawMdp.trim();
    
    if (isSupabaseConfigured) {
      const officialAccount = mockInitialUsers.find(u => u.email.toLowerCase() === email);
      
      // 1. Initial attempt with provided credentials
      let authResponse = await supabase.auth.signInWithPassword({ email, password: mdp });
      
      // 2. Resilience for short 'admin' passwords (mapped to admin123 by our bootstrapper)
      if (authResponse.error && officialAccount && mdp === "admin") {
         authResponse = await supabase.auth.signInWithPassword({ email, password: "admin123" });
      }

      // 3. Auto-Registration for official accounts if they don't exist yet
      if (authResponse.error && officialAccount && (mdp === "admin" || mdp === "adminadmin1" || (officialAccount.password && mdp === officialAccount.password))) {
        console.log(`Checking/Bootstrapping official account ${email}...`);
        const supabasePassword = (mdp.length < 6 && mdp === "admin") ? "admin123" : mdp;
        
        const signUpRes = await supabase.auth.signUp({ email, password: supabasePassword });
        
        // If we created a new user or they already existed (signUp often returns user object even if already exists depending on config)
        if (signUpRes.data?.user || (signUpRes.error?.message?.includes("already registered"))) {
           await new Promise(resolve => setTimeout(resolve, 500));
           
           // We try to sign in again after potential registration
           authResponse = await supabase.auth.signInWithPassword({ email, password: supabasePassword });
           
           if (!authResponse.error && authResponse.data.user) {
              await supabase.from('profiles').upsert({
                id: authResponse.data.user.id,
                email: email,
                nom: officialAccount.nom,
                prenom: officialAccount.prenom,
                role: mapRoleToDB(officialAccount.role),
                status: 'APPROVED'
              });
           }
        }
      }

      // 4. Panic Fallback: If still failing and it's an official account with 'admin' password, FORCE local login.
      if (authResponse.error && officialAccount && (mdp === "admin" || mdp === "adminadmin1")) {
         console.warn(`Critical: Supabase auth failed for ${email}. Granting local emergency access.`);
         setUser(officialAccount);
         return true;
      }

      const data = authResponse.data;
      if (authResponse.error) {
        throw new Error(authResponse.error.message === "Invalid login credentials" ? "Mot de passe ou email incorrect." : authResponse.error.message);
      }

      if (data?.user) {
        let { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        
        // Universal Self-Healing: Force upgrade any official email to its defined role and status if they got stuck as a CANDIDATE due to prior manual registration
        const accountDef = mockInitialUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (accountDef && (profileError || !profile || profile.role !== mapRoleToDB(accountDef.role) || profile.status !== 'APPROVED')) {
           console.log(`Forcing configuration for official account ${email} (Self-Healing)...`);
           const upsertData = {
              id: data.user.id,
              email: email,
              nom: accountDef.nom,
              prenom: accountDef.prenom,
              role: mapRoleToDB(accountDef.role),
              status: 'APPROVED'
           };
           await supabase.from('profiles').upsert(upsertData);
           profile = upsertData;
           profileError = null;
        }

        if (profileError || !profile) {
          console.warn("Profil introuvable dans la table profiles:", profileError);
          // On le connecte quand même mais en mode dégradé (sans rôle précis)
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            nom: 'Nom inconnu',
            prenom: 'Profil',
            role: 'CANDIDATE',
            grade: 'Veuillez configurer ce profil dans Supabase',
            telephone: '-',
            status: 'APPROVED'
          });
          return true;
        }

        setUser({
          id: profile.id,
          email: profile.email,
          nom: profile.nom || '',
          prenom: profile.prenom || '',
          role: mapRoleFromDB(profile.role),
          grade: profile.role,
          telephone: '-',
          status: 'APPROVED'
        });
        return true;
      }
      return false;
    } else {
      // Version Fallback Locale (Mock)
      if (email === "bayadzakaria6@gmail.com" && mdp === "adminadmin1") {
        const adminUser = usersList.find((u) => u.email === email);
        if (adminUser) setUser(adminUser);
        return true;
      }
      
      const foundUser = usersList.find((u) => u.email === email);
      if (foundUser && foundUser.status === "APPROVED") {
        if (mdp === "password" || foundUser.password === mdp || mdp === "admin") {
          setUser(foundUser);
          return true;
        }
      }
      throw new Error("Identifiants incorrects ou compte Local non approuvé.");
    }
  };

  const logout = async (): Promise<void> => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const approveUser = async (id: string): Promise<void> => {
    if (isSupabaseConfigured) {
      // In production, we assume we might have the status flag
      await supabase.from('profiles').update({ status: 'APPROVED' }).eq('id', id);
    }
    setUsersList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "APPROVED" } : u))
    );
  };

  const createUser = async (userData: Omit<User, "id" | "status">): Promise<void> => {
    const cleanEmail = userData.email.trim();
    const cleanPassword = (userData.password || 'admin123456').trim();
    if (isSupabaseConfigured) {
      try {
        // Astuce : Créer un client secondaire pour ne pas déconnecter le SuperAdmin
        const adminAuthClient = createClient(
          import.meta.env.VITE_SUPABASE_URL || '',
          import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          { auth: { persistSession: false, autoRefreshToken: false } }
        );

        const { data, error } = await adminAuthClient.auth.signUp({
          email: cleanEmail,
          password: cleanPassword
        });

        if (error) {
          console.error("Supabase creation error", error);
          alert("Erreur création : " + error.message);
          return;
        }

        if (data.user) {
          // Si le trigger SQL n'est pas créé sur la base du client, on force l'insertion (upsert)
          await new Promise(resolve => setTimeout(resolve, 800));

          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            nom: userData.nom,
            prenom: userData.prenom,
            telephone: userData.telephone || '-',
            role: mapRoleToDB(userData.role),
            status: 'APPROVED' // Auto-approuvé car créé par admin
          });

          if (profileError) {
             console.error("Erreur mise à jour profil", profileError);
          }

          const newUser: User = {
            ...userData,
            id: data.user.id,
            status: "APPROVED",
          };
          setUsersList((prev) => [...prev, newUser]);
          alert("Succès ! Directeur créé avec succès dans la base de données.");
        }
      } catch (err: any) {
        console.error(err);
        alert("Une erreur inattendue s'est produite lors de la connexion à la base.");
      }
      return;
    }

    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substring(2, 9),
      status: "PENDING",
    };
    setUsersList((prev) => [...prev, newUser]);
  };

  const updatePassword = async (userId: string, newPassword: string): Promise<void> => {
    if (isSupabaseConfigured && user?.id === userId) {
      await supabase.auth.updateUser({ password: newPassword });
    }
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );
    if (user && user.id === userId) {
      setUser({ ...user, password: newPassword });
    }
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    if (isSupabaseConfigured) {
      const allowedUpdates: any = { prenom: updates.prenom, nom: updates.nom, role: updates.role, grade: updates.grade };
      
      // Clean undefined keys
      Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);
      
      await supabase.from('profiles').update(allowedUpdates).eq('id', userId);
      
      if (updates.password) {
        console.warn("Mise à jour du mot de passe en cours. (Note: La modification du mot de passe d'un AUTRE utilisateur nécessite des clés Admin Supabase inaccessibles depuis le navigateur, la mise à jour s'effectue dans l'état local pour le prototype)");
      }
    }
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
    if (user && user.id === userId) {
      setUser({ ...user, ...updates });
    }
  };

  const registerCandidate = async (nom: string, prenom: string, rawEmail: string, rawMdp: string): Promise<void> => {
    const email = rawEmail.trim();
    const mdp = rawMdp.trim();
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: mdp
      });
      
      if (error) {
        console.error("Erreur d'inscription Supabase:", error.message);
        throw new Error(error.message);
      }
      
      if (data.user) {
        // En prod, le trigger handle_new_user crée le profile.
        // On attend un court instant. On utilise upsert au lieu de update pour pallier l'absence du trigger.
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { error: updateError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email,
          nom: nom,
          prenom: prenom,
          role: 'CANDIDATE',
          status: 'APPROVED'
        });
          
        if (updateError) {
           console.error("Erreur maj profil:", updateError);
        }

        const newUser: User = { id: data.user.id, nom, prenom, email, grade: 'Candidat', telephone: '-', role: 'CANDIDATE', status: 'APPROVED' };
        setUser(newUser);
      }
    } else {
      const newUser: User = {
        id: 'cand-' + Math.random().toString(36).substring(2, 9),
        nom,
        prenom,
        email,
        grade: 'Candidat',
        telephone: '-',
        role: 'CANDIDATE',
        status: 'APPROVED',
        password: mdp,
      };
      setUsersList((prev) => [...prev, newUser]);
      setUser(newUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, usersList, login, logout, approveUser, createUser, updatePassword, updateProfile, registerCandidate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
