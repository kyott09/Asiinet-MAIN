import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home/Home";
import Panel from "../pages/Panel";
import Users from "../pages/Users";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import Tareas from "../pages/Tareas";
import NotFound from "../pages/NotFound";
import Calendar from "../pages/Calendar";
import Vehiculos from "../pages/Vehiculos";

function getUserSession() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, requireAdmin = false, allowedRoles = null }) {
  const user = getUserSession();

  if (!user) {
    return <Navigate to="/login" replace />;
  } //Si no hay usuario logueado, lo manda a /login

  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/panel" replace />;
  } //Si la ruta requiere admin y el usuario no es admin, lo manda a /panel

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/panel" replace />;
  } //Si la ruta pide roles específicos y el usuario no tiene uno de esos roles, lo manda a /panel

  return children; //Si pasa todas las validaciones, renderiza el componente hijo
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <Panel /> 
            </ProtectedRoute>
          } //Ruta que solo requiere usuario logueado
        />
        <Route path="/home" element={<Navigate to="/panel" replace />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin> 
              <Users />
            </ProtectedRoute>
          } //Ruta protegida que solo permite acceso a usuarios con rol "admin". requireAdmin se envía como True
        />

        <Route path="/galeria" element={<Navigate to="/" replace />} />
        <Route
          path="/tareas"
          element={
            <ProtectedRoute>
              <Tareas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendario"
          element={
            <ProtectedRoute allowedRoles={["admin", "supervisor", "operador"]}>
              <Calendar />
            </ProtectedRoute>
          } //Ruta protegida solo para usuarios con rol "admin", "supervisor" o "operador"
        />
        <Route
          path="/vehiculos"
          element={
            <ProtectedRoute allowedRoles={["admin", "supervisor", "operador"]}>
              <Vehiculos />
            </ProtectedRoute>
          } //Ruta protegida solo para usuarios con rol "admin", "supervisor" o "operador"
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;