import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileCheck, CheckSquare, BrainCircuit, ShieldAlert, Settings, LogOut, Briefcase } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { BrandLogo } from "./BrandLogo";

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  let NAV_ITEMS = [
    { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  ];

  if (user?.role === "DIR_HIERARCHIQUE" || user?.role === "DIR_FONCTIONNEL" || user?.role === "SUPER_ADMIN" || user?.role === "DIR_RH") {
    NAV_ITEMS.push(
      { name: "Lancer un Recrutement", href: "/app/requisition", icon: Briefcase },
      { name: "Postes Ouverts", href: "/app/jobs", icon: Briefcase }
    );
  }

  NAV_ITEMS.push(
    { name: "Recrutement", href: "/app/recruitment", icon: Users },
    { name: "Évaluations", href: "/app/evaluations", icon: CheckSquare },
    { name: "Approbations", href: "/app/approvals", icon: FileCheck },
    { name: "Employés", href: "/app/employees", icon: Users },
    { name: "Talent (9-Box)", href: "/app/talent", icon: BrainCircuit },
    { name: "Risque Turnover", href: "/app/turnover", icon: ShieldAlert },
    { name: "IA & Insights", href: "/app/insights", icon: BrainCircuit }
  );

  if (user?.role === "CANDIDATE") {
    NAV_ITEMS = [
      { name: "Mon Espace", href: "/app", icon: LayoutDashboard },
      { name: "Nouvelle Candidature", href: "/app/apply", icon: Briefcase },
    ];
  } else if (user?.role === "SUPER_ADMIN") {
    NAV_ITEMS.push({ name: "Super Admin", href: "/app/admin", icon: ShieldAlert });
  }

  return (
    <aside className="w-64 border-r border-gray-100 bg-white h-screen flex flex-col shrink-0">
      {/* Brand */}
      <div className="h-20 flex items-center px-8 shrink-0 mt-2">
        <Link to="/app" className="flex flex-col hover:opacity-80 transition-opacity">
          <BrandLogo size="sm" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="mb-6 px-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Menu Principal</p>
        </div>
        
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                isActive 
                  ? "bg-gray-50 text-black shadow-sm border border-gray-100/50" 
                  : "text-gray-500 hover:bg-gray-50/50 hover:text-gray-900"
              )}
            >
              {isActive && (
                <span className="absolute left-0 w-1 h-5 bg-black rounded-r-md" />
              )}
              <item.icon className={cn("w-4 h-4", isActive ? "text-black" : "text-gray-400 group-hover:text-gray-600")} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100/50 shrink-0">
        <div className="px-4 mb-4 flex flex-col">
          <span className="text-xs font-semibold text-gray-900">{user?.nom} {user?.prenom}</span>
          <span className="text-[10px] text-gray-500 tracking-wider uppercase font-mono mt-0.5">{user?.grade}</span>
        </div>
        <div className="space-y-1">
          <Link to="/app/settings" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50/50 hover:text-gray-900 transition-all">
            <Settings className="w-4 h-4 text-gray-400" />
            Paramètres
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
        <div className="mt-4 px-4">
          <p className="text-[10px] text-gray-400 font-medium italic">App created by Zakaria Bayad</p>
        </div>
      </div>
    </aside>
  );
}
