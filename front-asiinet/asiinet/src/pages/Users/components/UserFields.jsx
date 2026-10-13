function UserFields({ form, onChange, isCreating, passwordHelpId, roles }) {
  return (
    <>
      <label className="users-field">
        <span>Nombre completo</span>
        <input
          autoComplete="name"
          name="nombre"
          value={form.nombre}
          onChange={onChange}
          required
        />
      </label>
      <label className="users-field">
        <span>Email</span>
        <input
          autoComplete="email"
          name="email"
          type="email"
          spellCheck="false"
          value={form.email}
          onChange={onChange}
          required
        />
      </label>
      {isCreating && (
        <label className="users-field">
          <span>Contraseña inicial</span>
          <input
            autoComplete="new-password"
            name="password"
            type="password"
            minLength={8}
            aria-describedby={passwordHelpId}
            value={form.password}
            onChange={onChange}
            required
          />
          <small id={passwordHelpId}>
            Usá entre 8 y 72 bytes. No hace falta combinar tipos de caracteres.
          </small>
        </label>
      )}
      <label className="users-field">
        <span>Rol</span>
        <select name="role" value={form.role} onChange={onChange} required>
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export default UserFields;
