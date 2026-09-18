import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

function DashboardSidebar({ user }) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  const navigationSections = [
    {
      title: "Registrar",
      icon: "fa-file-signature",
      active: true,
      expandable: true,
      items: [
        { label: "Vehículo", icon: "fa-car", href: "/vehiculos" },
        { label: "Empleado", icon: "fa-users", href: "/empleados" },
        { label: "Tarea", icon: "fa-list-check", href: "/tareas" },
        ...(isAdmin ? [{ label: "Roles", icon: "fa-lock", href: "/roles" }] : []),
      ],
    },
    {
      title: "Otros",
      items: [
        { label: "Calendario", icon: "fa-calendar-days", href: "/calendario" },
        { label: "Galería de Fotos", icon: "fa-image", href: "/galeria" },
      ],
    },
    {
      title: "Información General",
      items: [{ label: "Documentación", icon: "fa-file", href: "/documentacion" }],
    },
  ];

  return (
    <aside className="dashboard-sidebar" aria-label="Navegación principal">
      <Link className="sidebar-brand" to="/home">
        <span className="sidebar-brand-mark" aria-hidden="true">
          <i className="fa-solid fa-play"></i>
        </span>
        <span>Asiinet</span>
      </Link>
      <br />
      <nav className="sidebar-navigation">
        {navigationSections.map((section) => (
          <div className="sidebar-section" key={section.title}>
            {section.expandable ? (
              <button
                className={`sidebar-section-heading sidebar-section-button${section.active ? " is-active" : ""}`}
                type="button"
                aria-expanded={isRegisterOpen}
                onClick={() => setIsRegisterOpen((isOpen) => !isOpen)}
              >
                <i className={`fa-solid ${section.icon}`} aria-hidden="true"></i>
                <span>{section.title}</span>
                <i
                  className={`fa-solid fa-chevron-down sidebar-chevron${isRegisterOpen ? " is-open" : ""}`}
                  aria-hidden="true"
                ></i>
              </button>
            ) : (
              <div className="sidebar-section-heading">
                <span>{section.title}</span>
              </div>
            )}
            {(!section.expandable || isRegisterOpen) && (
              <div className="sidebar-section-items">
                {section.items.map((item) => (
                  <Link className="sidebar-link" to={item.href} key={item.label}>
                    <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default DashboardSidebar;
