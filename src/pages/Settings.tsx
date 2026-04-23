import { useState, useRef, FormEvent } from "react";
import { motion } from "motion/react";
import { useAuth, User } from "../contexts/AuthContext";
import { Bell, Shield, KeyRound, Building, Palette, AlertCircle, Camera } from "lucide-react";
// Renamed User import from lucide-react to UserIcon to avoid collision with User type
import { User as UserIcon } from "lucide-react";

export function Settings() {
  const { user, updatePassword, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('Profil personnel');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState<Partial<User>>({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: user?.email || '',
    grade: user?.grade || '',
  });

  const ALL_SETTINGS_TABS = [
    { label: 'Profil personnel', icon: UserIcon },
    { label: 'Sécurité & Accès', icon: Shield },
    { label: 'Notifications', icon: Bell },
    { label: 'API & Clés (Dev)', icon: KeyRound },
    { label: 'Mon Organisation', icon: Building },
    { label: 'Apparence', icon: Palette },
  ];

  const SETTINGS_TABS = user?.role === 'SUPER_ADMIN' 
    ? ALL_SETTINGS_TABS
    : ALL_SETTINGS_TABS.filter(tab => !['API & Clés (Dev)', 'Mon Organisation', 'Apparence'].includes(tab.label));

  const handleProfileUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (user?.id) {
      updateProfile(user.id, profileData);
      alert("Profil mis à jour avec succès !");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
       // Convert file to Base64 to save quickly in local state
       const reader = new FileReader();
       reader.onloadend = () => {
         const base64String = reader.result as string;
         // Immediatley update profile image in global context to trigger topbar update
         updateProfile(user.id, { profileImage: base64String });
       };
       reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-gray-500 mt-2">Gérez les préférences de votre plateforme Evolia AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar interne des paramètres */}
        <div className="md:col-span-1 space-y-1">
          {SETTINGS_TABS.map((item, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === item.label ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Contenu Actif */}
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'Profil personnel' && (
            <>
              <motion.section initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                <form onSubmit={handleProfileUpdate}>
                  <h2 className="text-lg font-semibold mb-6">Informations Personnelles</h2>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative w-20 h-20 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-500 text-2xl tracking-wider overflow-hidden">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <>{user?.prenom?.[0]}{user?.nom?.[0]}</>
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif" 
                        onChange={handleImageChange}
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Changer la photo
                      </button>
                      <p className="text-xs text-gray-400 mt-2">JPG, GIF ou PNG. 1MB max.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Prénom</label>
                      <input 
                        type="text" 
                        required
                        className="form-input bg-white focus:bg-white" 
                        value={profileData.prenom} 
                        onChange={e => setProfileData({...profileData, prenom: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Nom</label>
                      <input 
                        type="text" 
                        required
                        className="form-input bg-white focus:bg-white" 
                        value={profileData.nom} 
                        onChange={e => setProfileData({...profileData, nom: e.target.value})} 
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Email professionnel</label>
                      <input 
                        type="email" 
                        required
                        className="form-input bg-white focus:bg-white" 
                        value={profileData.email} 
                        onChange={e => setProfileData({...profileData, email: e.target.value})} 
                      />
                    </div>
                    {user?.role !== 'CANDIDATE' && (
                      <div className="col-span-2 space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Grade Fonctionnel</label>
                        <input 
                          type="text" 
                          required
                          className="form-input bg-white focus:bg-white" 
                          value={profileData.grade} 
                          onChange={e => setProfileData({...profileData, grade: e.target.value})} 
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-8 mt-6 border-t border-gray-100">
                    <button type="submit" className="px-6 py-3 bg-black text-white font-semibold rounded-xl text-sm shadow-md hover:bg-gray-800 transition-colors">
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              </motion.section>

              <motion.section initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-red-50/50 border border-red-100 rounded-3xl p-8">
                <h2 className="text-lg font-semibold text-red-700 mb-2">Zone de Danger</h2>
                <p className="text-sm text-red-600/80 mb-6 max-w-xl">Désactiver votre compte coupera vos accès aux workflows d'approbations. Cette action contactera votre Super Administrateur.</p>
                <button className="px-6 py-3 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 font-semibold rounded-xl text-sm transition-colors border border-red-200" onClick={() => alert("Demande de désactivation envoyée à l'administrateur.")}>
                  Désactiver mon compte
                </button>
              </motion.section>
            </>
          )}

          {activeTab === 'Sécurité & Accès' && (
            <motion.section initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Sécurité & Mot de Passe</h2>
              <p className="text-sm text-gray-500 mb-6">Vous pouvez modifier votre mot de passe provisoire ici. Aucune validation du Super Administrateur n'est requise.</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const newPw = (e.currentTarget.elements.namedItem('new_pw') as HTMLInputElement).value;
                if(user?.id) updatePassword(user.id, newPw);
                alert("Mot de passe mis à jour avec succès !");
                // Clear input
                (e.currentTarget.elements.namedItem('new_pw') as HTMLInputElement).value = '';
              }}>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Nouveau mot de passe</label>
                     <input type="password" required minLength={6} name="new_pw" className="form-input" placeholder="Min. 6 caractères" />
                   </div>
                   <div className="flex items-end">
                      <button type="submit" className="w-full h-11 bg-black text-white font-semibold rounded-xl text-sm shadow-md hover:bg-gray-800 transition-colors">
                        Mettre à jour
                      </button>
                   </div>
                </div>
              </form>
            </motion.section>
          )}

          {/* Placeholder tab content for everything else */}
          {['Notifications', 'API & Clés (Dev)', 'Mon Organisation', 'Apparence'].includes(activeTab) && (
            <motion.section initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-white border border-gray-100 rounded-3xl p-16 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">Module en cours de développement</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                L'onglet <span className="font-semibold text-gray-700">{activeTab}</span> n'est pas encore implémenté ou est restreint dans cette version de démonstration de la plateforme.
              </p>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
}
