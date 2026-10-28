import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faLinkSlash,
  faPlug,
  faRotate,
  faRightToBracket,
  faScrewdriverWrench,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import logoAsiinet from "../../assets/brand/logos/logo asiinet.png";
import GalleryCarousel from "../../components/gallery/GalleryCarousel";
import { galleryPhotos } from "../../components/gallery/galleryPhotos";
import "../Gallery.css";
import "./Home.css";
import NetworkDiagram from "./NetworkDiagram";

const services = [
  {
    title: "Instalación",
    description: "Conectamos hogares y comercios para que puedan empezar.",
    icon: faPlug,
  },
  {
    title: "Reconexión",
    description: "Restablecemos el servicio para volver a estar en línea.",
    icon: faRotate,
  },
  {
    title: "Servicio técnico",
    description: "Revisamos la conexión y resolvemos problemas de servicio.",
    icon: faScrewdriverWrench,
  },
  {
    title: "Desconexión",
    description: "Gestionamos la baja del servicio de manera ordenada.",
    icon: faLinkSlash,
  },
];

const roleLabels = {
  admin: "admin",
  supervisor: "supervisor",
  operador: "operador",
  cliente: "cliente",
  user: "cliente",
  client: "cliente",
  empleado: "operador",
  employee: "operador",
};

function getUserSession() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Home() {
  const [user, setUser] = useState(getUserSession);
  const role = String(user?.role ?? "").trim().toLowerCase();
  const isClient = role === "cliente" || role === "user" || role === "client";
  const displayName = user?.nombre?.trim() || user?.email?.split("@")[0] || "de vuelta";
  const roleLabel = roleLabels[role] ?? "cuenta Asiinet";
  const actionHref = user ? (isClient ? "/tareas" : "/panel") : "/login";
  const actionLabel = user
    ? (isClient ? "Ver mis Solicitudes" : "Ir al Panel Operativo")
    : "Ingresar al Portal";

  useEffect(() => {
    const syncUser = () => setUser(getUserSession());
    window.addEventListener("storage", syncUser);
    window.addEventListener("asiinet:user-updated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("asiinet:user-updated", syncUser);
    };
  }, []);

  return (
    <div id="public-home" className="public-home">
      <header className="home-header">
        <Link className="home-brand" to="/" aria-label="Asiinet, inicio">
          <img src={logoAsiinet} alt="Asiinet" />
        </Link>
        <nav className="home-header-nav" aria-label="Navegación principal">
          <a href="#servicios">Servicios</a>
          <a href="#trabajo">Nuestro trabajo</a>
          {user ? (
            <Link className="home-header-account" to="/profile">
              Mi cuenta
            </Link>
          ) : (
            <Link className="home-header-account" to="/login">
              Iniciar sesión
            </Link>
          )}
        </nav>
      </header>

      <main id="main-content" className="home-main" tabIndex="-1">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            {user ? (
              <p className="home-intro">
                Hola, {displayName}. Bienvenido a Asiinet. Tu rol: {roleLabel}.
              </p>
            ) : (
              <p className="home-intro">Conectividad para hogares y comercios</p>
            )}
            <h1 id="home-title">Cada conexión,<br />bien coordinada.</h1>
            <p className="home-lede">
              Somos Asiinet. Acercamos internet por cable a hogares y comercios,
              y coordinamos cada servicio con un equipo técnico cercano.
            </p>
            <Link className="home-primary-action" to={actionHref}>
              <span>{actionLabel}</span>
              <FontAwesomeIcon icon={user ? faArrowRight : faRightToBracket} aria-hidden="true" />
            </Link>
          </div>
          <div className="home-network">
            <div className="network-caption">
              <span className="network-live-dot" aria-hidden="true"></span>
              Una red, muchos puntos conectados
            </div>
            <NetworkDiagram />
          </div>
        </section>

        <section className="home-services" id="servicios" aria-labelledby="services-title">
          <div className="home-section-heading">
            <div>
              <h2 id="services-title">Servicios que mantienen todo conectado</h2>
              <p>Un equipo, desde la primera conexión hasta el soporte.</p>
            </div>
          </div>
          <div className="service-list">
            {services.map((service) => (
              <article className="service-row" key={service.title}>
                <span className="service-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={service.icon} />
                </span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="home-gallery" id="trabajo" aria-labelledby="home-gallery-title">
          <div className="home-section-heading">
            <div>
              <h2 id="home-gallery-title">Así trabajamos</h2>
              <p>Personas y trabajo en terreno, detrás de cada conexión.</p>
            </div>
          </div>
          <GalleryCarousel photos={galleryPhotos} />
        </section>
      </main>

      <footer className="home-footer">
        <span>Asiinet</span>
        <p>Conectividad y servicio para la comunidad.</p>
      </footer>
    </div>
  );
}

export default Home;
