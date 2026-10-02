import UserList from "../components/UserList";
import AccountActions from "../components/dashboard/AccountActions";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import "./Users.css";


function Users() {
  const users = [
    {
      id: 1,
      name: "Juan Pérez",
      email: "juan@email.com",
      estado: false,
    },
    {
      id: 2,
      name: "María Gómez",
      email: "maria@email.com",
      estado: true,
    },
    {
      id: 3,
      name: "Carlos López",
      email: "carlos@email.com",
      estado: true,
    },
    {
      id: 4,
      name: "Ana Fernández",
      email: "ana@email.com",
      estado: false,
    },
  ];


  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main className="dashboard-content users-content">
        <AccountActions />
        <div className="users-page">
          <h1>Usuarios</h1>
          <p>Listado estático de usuarios.</p>

          <div className="users-list">
            {users.map((user) => (
              <UserList key={user.id} user={user} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}


export default Users;

