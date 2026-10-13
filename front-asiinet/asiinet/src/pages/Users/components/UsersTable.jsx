function UsersTable({ users, roles, formatDate, renderUserActions }) {
  return (
              <div className="users-table-wrap">
                <table className="users-table">
                  <caption className="users-sr-only">Cuentas registradas en Asiinet</caption>
                  <thead>
                    <tr>
                      <th scope="col">Nombre</th>
                      <th scope="col">Email</th>
                      <th scope="col">Rol</th>
                      <th scope="col">Creado</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="users-name-cell">{user.nombre}</td>
                        <td className="users-email-cell">{user.email}</td>
                        <td>
                          <span className="users-role">{roles.find((role) => role.value === user.role)?.label ?? user.role}</span>
                        </td>
                        <td>{formatDate(user.creadoEn)}</td>
                        <td>{renderUserActions(user)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
  );
}

export default UsersTable;
