import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function getUserSession() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function AccountActions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserSession);
  const displayName = user?.nombre || user?.email || "Usuario";
  const initials = displayName.trim().charAt(0).toUpperCase();

  useEffect(() => {
    const syncUser = () => setUser(getUserSession());
    window.addEventListener("storage", syncUser);
    window.addEventListener("asiinet:user-updated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("asiinet:user-updated", syncUser);
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch(`${API_BASE_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Clear the local session even if the API is temporarily unavailable.
    } finally {
      sessionStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="account-actions">
      <div className="profile-cluster">
        <div className="profile-name-stack">
          <Link className="profile-button" to="/profile">
            {user?.fotoPerfil ? (
              <img className="profile-avatar" src={user.fotoPerfil} alt={displayName} />
            ) : (
              <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
                {initials}
              </span>
            )}
            <span>{displayName}</span>
          </Link>

          <button type="button" className="logout-button" onClick={handleLogout}>
            <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountActions;
