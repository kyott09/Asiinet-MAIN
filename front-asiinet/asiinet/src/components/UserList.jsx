const UserList = ({user}) => {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ margin: "0 0 10px" }}>{user.name}</h2>
      <p>
        <strong>ID:</strong> {user.id}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Estado:</strong> {user.estado ? "Activo" : "Inactivo"}
      </p>
    </div>
  );
};


export default UserList;







