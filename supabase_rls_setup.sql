-- ==============================================================================
-- Script de configuration initiale pour Supabase (NexaMate)
-- ==============================================================================
-- Instructions :
-- 1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard/
-- 2. Ouvrez votre projet, puis allez dans l'onglet "SQL Editor" (à gauche).
-- 3. Créez un nouveau "New query" et collez TOUT le code ci-dessous.
-- 4. Cliquez sur "Run" (ou Exécuter).
-- ==============================================================================

-- 1. Création de la table 'profiles'
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nom TEXT,
  prenom TEXT,
  role TEXT DEFAULT 'CANDIDATE',
  grade TEXT,
  telephone TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Création de la table 'jobs'
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  dept TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  salary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Création de la table 'employees'
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  grade TEXT,
  salary NUMERIC,
  hire_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  matricule TEXT,
  department TEXT,
  performance INTEGER,
  potential INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Autoriser les requêtes (Désactivation de la sécurité en phase de test)
-- Par défaut, Supabase bloque l'insertion/lecture via RLS (Row Level Security).
-- Ces commandes désactivent ces protections le temps de mettre en place l'application.
-- Vous pourrez re-configurer ces politiques plus tard pour sécuriser l'application en production.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- 5. (Optionnel) Ajout d'un trigger pour insérer automatiquement dans 'profiles' après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, role, status)
  VALUES (
    new.id,
    new.email,
    'Utilisateur',
    'Nouveau',
    'CANDIDATE',
    'APPROVED'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- On associe le trigger à la table auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
