import AccountActions from "../components/dashboard/AccountActions";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import "./Users.css";

function Users() {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main className="dashboard-content users-content">
        <AccountActions />
        <section className="users-page" aria-labelledby="users-title">
          <h1 id="users-title">Usuarios</h1>
          <div className="users-unavailable">
            <span className="users-unavailable-icon" aria-hidden="true">
              <i className="fa-solid fa-users"></i>
            </span>
            <div>
              <h2>La gestión de usuarios aún no está conectada</h2>
              <p>
                La API actual no ofrece un listado general ni acciones para
                administrar cuentas. No se muestran registros de ejemplo.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Users;
