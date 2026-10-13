function UsersCards({ users, roles, formatDate, renderUserActions }) {
  return (
              <ul className="users-cards" aria-label="Usuarios">
                {users.map((user) => (
                  <li className="users-card" key={user.id}>
                    <div className="users-card-heading">
                      <h2>{user.nombre}</h2>
                      <span className="users-role">{roles.find((role) => role.value === user.role)?.label ?? user.role}</span>
                    </div>
                    <p className="users-email-cell">{user.email}</p>
                    <p className="users-created">Creado {formatDate(user.creadoEn)}</p>
                    {renderUserActions(user)}
                  </li>
                ))}
              </ul>
  );
}

export default UsersCards;
