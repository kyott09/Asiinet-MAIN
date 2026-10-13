import { Link } from "react-router-dom";
import AccountActions from "../../components/dashboard/AccountActions";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import "./Home.css";
import NetworkDiagram from "./NetworkDiagram";

const services = [
  {
    title: "Instalación",
    description: "Altas de servicio para clientes residenciales y comerciales.",
    icon: "fa-plug",
  },
  {
    title: "Reconexión",
    description: "Restablecimiento del servicio ante cortes o bajas temporales.",
    icon: "fa-rotate",
  },
  {
    title: "Servicio técnico",
    description: "Mantenimiento y resolución de fallas de conexión.",
    icon: "fa-screwdriver-wrench",
  },
  {
    title: "Desconexión",
    description: "Bajas de servicio gestionadas de forma trazable.",
    icon: "fa-link-slash",
  },
];

function getUserSession() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Home() {
  const user = getUserSession();
  const userRole = String(user?.role ?? "cliente").trim().toLowerCase();
  const isClient = userRole === "cliente" || userRole === "user" || userRole === "client";
  const primaryActionLabel = isClient ? "Solicitar servicio" : "Ver tareas";
  const secondaryActionLabel = isClient ? "Solicitar servicio" : "Ir a tareas";

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main id="main-content" tabIndex="-1" className="dashboard-content home-content">
        <AccountActions />

        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <p className="home-intro">Operaciones de Asiinet</p>
            <h1 id="home-title">Cada conexión,<br />bien coordinada.</h1>
            <p className="home-lede">
              Un espacio para organizar los pedidos de servicio y acompañar
              cada trabajo desde el primer contacto hasta su resolución.
            </p>
            <Link className="home-primary-action" to="/tareas">
              <i className="fa-solid fa-list-check" aria-hidden="true"></i>
              {primaryActionLabel}
            </Link>
          </div>
          <div className="home-network">
            <div className="network-caption">
              <span className="network-live-dot" aria-hidden="true"></span>
              Así se conecta el trabajo
            </div>
            <NetworkDiagram />
          </div>
        </section>

        <section className="home-services" aria-labelledby="services-title">
          <div className="home-section-heading">
            <div>
              <h2 id="services-title">Tipos de servicio</h2>
              <p>Las solicitudes que organiza el equipo.</p>
            </div>
            {!isClient && (
              <Link to="/tareas" className="home-text-link">{secondaryActionLabel}</Link>
            )}
          </div>
          <div className="service-list">
            {services.map((service) => (
              <article className="service-row" key={service.title}>
                <span className="service-icon" aria-hidden="true">
                  <i className={`fa-solid ${service.icon}`}></i>
                </span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
                <i className="fa-solid fa-arrow-up-right-from-square service-arrow" aria-hidden="true"></i>
              </article>
            ))}
          </div>
        </section>

        <p className="home-footnote">
          El panel centraliza tareas y solicitudes. La gestión de vehículos,
          materiales y cuadrillas está prevista para futuras etapas.
        </p>
      </main>
    </div>
  );
}

export default Home;
