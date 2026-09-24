function TextField({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  label,
  required = true,
  minLength,
}) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span className="sr-only">{label}</span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
      />
    </label>
  );
}

export default TextField;
