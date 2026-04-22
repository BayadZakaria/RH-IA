import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { JobsProvider } from "./contexts/JobsContext";
import { EmployeesProvider } from "./contexts/EmployeesContext";
import { EvaluationsProvider } from "./contexts/EvaluationsContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Approvals } from "./pages/Approvals";
import { Recruitment } from "./pages/Recruitment";
import { Evaluations } from "./pages/Evaluations";
import { Insights } from "./pages/Insights";
import { Settings } from "./pages/Settings";
import { SuperAdmin } from "./pages/SuperAdmin";
import { JobRequisition } from "./pages/JobRequisition";
import { JobApplication } from "./pages/JobApplication";
import { Interview } from "./pages/Interview";
import { Landing } from "./pages/Landing";
import { JobOffers } from "./pages/JobOffers";
import { Employees } from "./pages/Employees";
import { TalentMatrix } from "./pages/TalentMatrix";
import { TurnoverRisk } from "./pages/TurnoverRisk";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Protected SaaS Routes */}
      <Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="recruitment" element={<Recruitment />} />
        <Route path="evaluations" element={<Evaluations />} />
        <Route path="insights" element={<Insights />} />
        <Route path="settings" element={<Settings />} />
        <Route path="requisition" element={<JobRequisition />} />
        <Route path="apply" element={<JobApplication />} />
        <Route path="interview" element={<Interview />} />
        <Route path="jobs" element={<JobOffers />} />
        <Route path="employees" element={<Employees />} />
        <Route path="talent" element={<TalentMatrix />} />
        <Route path="turnover" element={<TurnoverRisk />} />
        
        {user?.role === "SUPER_ADMIN" && (
          <Route path="admin" element={<SuperAdmin />} />
        )}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <JobsProvider>
      <EmployeesProvider>
        <EvaluationsProvider>
          <NotificationsProvider>
            <AuthProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </NotificationsProvider>
        </EvaluationsProvider>
      </EmployeesProvider>
    </JobsProvider>
  );
}
