import { Link } from "react-router-dom";
import AccountActions from "../components/dashboard/AccountActions";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import "./Home.css";

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

function NetworkDiagram() {
  return (
    <svg
      className="network-diagram"
      viewBox="0 0 540 300"
      role="img"
      aria-labelledby="network-title network-description"
    >
      <title id="network-title">Esquema de conexión de Asiinet</title>
      <desc id="network-description">
        Una línea troncal conecta un nodo central con distintos puntos de servicio.
      </desc>
      <path className="network-line network-line-muted" d="M28 150H512M270 25V275M92 55L448 245M92 245L448 55" />
      <path className="network-line network-line-main" d="M28 150H270V62M270 150V238M270 150H454" />
      <circle className="network-node network-node-main" cx="270" cy="150" r="18" />
      <circle className="network-node network-node-point" cx="270" cy="62" r="10" />
      <circle className="network-node network-node-point" cx="270" cy="238" r="10" />
      <circle className="network-node network-node-point" cx="454" cy="150" r="10" />
      <circle className="network-node network-node-point" cx="92" cy="55" r="7" />
      <circle className="network-node network-node-point" cx="92" cy="245" r="7" />
      <circle className="network-node network-node-point" cx="448" cy="55" r="7" />
      <circle className="network-node network-node-point" cx="448" cy="245" r="7" />
      <circle className="network-pulse" cx="28" cy="150" r="5" />
      <text className="network-label" x="270" y="37" textAnchor="middle">NODO</text>
      <text className="network-label" x="480" y="155">CLIENTE</text>
      <text className="network-label" x="270" y="280" textAnchor="middle">RED DE SERVICIO</text>
    </svg>
  );
}

function Home() {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main className="dashboard-content home-content">
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
              Ver tareas
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
            <Link to="/tareas" className="home-text-link">Ir a tareas</Link>
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
