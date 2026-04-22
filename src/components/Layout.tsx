import { useState, useRef, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { Bell, BellRing, Info, AlertCircle, CheckCircle2 } from "lucide-react";

export function Layout() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Calculate dynamic initials safely
  const getInitials = () => {
    if (!user) return "DR";
    const first = user.prenom ? user.prenom[0] : "";
    const last = user.nom ? user.nom[0] : "";
    return `${first}${last}`.toUpperCase() || "DR";
  };

  const getNotifIcon = (type: string) => {
     if (type === 'success') return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
     if (type === 'warning') return <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />;
     return <Info className="w-4 h-4 text-blue-500 shrink-0" />
  };

  return (
    <div className="flex bg-[#fcfcfd] min-h-screen font-sans text-gray-900">
      <Sidebar />
      <main className="flex-1 w-full flex flex-col h-screen overflow-hidden">
        {/* Topbar minimalist */}
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white/50 backdrop-blur-md z-30 sticky top-0 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
              Espace de Travail
            </h2>
          </div>
          <div className="flex items-center gap-5">
            
            {/* Notifications System */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (unreadCount > 0) markAllAsRead();
                }}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Notifications"
              >
                {unreadCount > 0 ? (
                  <>
                    <BellRing className="w-5 h-5 text-gray-900" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  </>
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden flex flex-col z-50 text-left"
                  >
                    <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Flux d'événements</span>
                      <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{notifications.length} logs</span>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400 italic">
                          Aucun événement récent.
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className="p-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors flex gap-3 text-sm">
                            <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                            <div className="flex flex-col">
                              <span className="text-gray-800 leading-snug">{notif.message}</span>
                              <span className="text-[10px] text-gray-400 mt-1 font-mono">
                                {new Date(notif.date).toLocaleDateString('fr-FR')} à {new Date(notif.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <Link to="/app/settings" className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center hover:ring-2 hover:ring-gray-200 transition-all shadow-sm overflow-hidden border border-gray-200">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-white tracking-widest">{getInitials()}</span>
              )}
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto flex-1 h-full scroll-smooth">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto pb-20"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
