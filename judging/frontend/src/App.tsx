import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import JudgeDashboard from "./pages/JudgeDashboard";
import ScoreProject from "./pages/ScoreProject";
import Organizer from "./pages/Organizer";
import Import from "./pages/Import";
import Results from "./pages/Results";

function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "";
  if (!token) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0 && !roles.includes(role)) {
    if (role === "organizer") return <Navigate to="/organizer" replace />;
    if (role === "judge") return <Navigate to="/judge" replace />;
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/judge"
          element={
            <RequireAuth roles={["judge"]}>
              <JudgeDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/judge/:id"
          element={
            <RequireAuth roles={["judge"]}>
              <ScoreProject />
            </RequireAuth>
          }
        />
        <Route
          path="/organizer"
          element={
            <RequireAuth roles={["organizer"]}>
              <Organizer />
            </RequireAuth>
          }
        />
        <Route
          path="/organizer/import"
          element={
            <RequireAuth roles={["organizer"]}>
              <Import />
            </RequireAuth>
          }
        />
        <Route
          path="/organizer/results"
          element={
            <RequireAuth roles={["organizer"]}>
              <Results />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
