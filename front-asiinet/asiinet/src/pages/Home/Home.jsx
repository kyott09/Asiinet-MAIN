import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faClock,
  faLinkSlash,
  faNetworkWired,
  faPlug,
  faRightToBracket,
  faRotate,
  faScrewdriverWrench,
  faShieldHalved,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import logoAsiinet from "../../assets/brand/logos/logo asiinet-SinFondo.png";
import GalleryCarousel from "../../components/gallery/GalleryCarousel";
import { galleryPhotos } from "../../components/gallery/galleryPhotos";
import "../Gallery.css";
import "./Home.css";
import NetworkDiagram from "./NetworkDiagram";

const guarantees = [
  {
    title: "Atención operativa en el día",
    description: "Coordinamos cada pedido para poner en marcha la atención.",
    icon: faClock,
  },
  {
    title: "Cobertura de red y diagnóstico trazable",
    description: "Seguimos cada intervención desde el punto de conexión.",
    icon: faNetworkWired,
  },
  {
    title: "Personal especializado y calificado",
    description: "Un equipo técnico preparado para trabajar en campo.",
    icon: faUserGear,
  },
  {
    title: "Garantía y seguimiento de tareas",
    description: "Cada solicitud conserva su estado y registro de avance.",
    icon: faShieldHalved,
  },
];

const services = [
  {
    title: "Instalaciones domiciliarias y comerciales",
    description:
      "Conectamos hogares y comercios a la red de internet y cable de Asiinet.",
    icon: faPlug,
  },
  {
    title: "Reconexión e interrupciones de servicio",
    description:
      "Atendemos cortes y coordinamos la reconexión para recuperar el servicio.",
    icon: faRotate,
  },
  {
    title: "Mantenimiento de fibra y cable",
    description:
      "Revisamos conexiones e infraestructura para resolver incidencias técnicas.",
    icon: faScrewdriverWrench,
  },
  {
    title: "Bajas y gestión de equipos",
    description:
      "Coordinamos la baja del servicio y la gestión de los equipos asociados.",
    icon: faLinkSlash,
  },
];

const workSteps = [
  {
    title: "Solicitud de servicio",
    description: "El cliente o supervisor registra el pedido y sus detalles.",
  },
  {
    title: "Asignación de cuadrilla",
    description: "El operador recibe la tarea y la información necesaria.",
  },
  {
    title: "Trabajo en campo",
    description: "El equipo resuelve la incidencia y actualiza el estado.",
  },
  {
    title: "Confirmación y cierre",
    description: "Se revisa el resultado y se completa el seguimiento.",
  },
];

const questions = [
  {
    question: "¿Cómo solicito una reparación?",
    answer:
      "Ingresá al portal de Asiinet y registrá una solicitud de servicio técnico. Si todavía no tenés una sesión, primero podés iniciar sesión o crear una cuenta.",
  },
  {
    question: "¿Qué horarios de atención cubre el servicio técnico?",
    answer:
      "El horario se coordina al gestionar cada solicitud. El equipo confirma la disponibilidad y los próximos pasos según el pedido.",
  },
  {
    question: "¿Cómo sigo el estado de mi solicitud?",
    answer:
      "Ingresá al portal y abrí la sección de tareas para consultar el estado y los detalles de tus solicitudes.",
  },
];

const roleLabels = {
  admin: "administración",
  supervisor: "supervisión",
  operador: "operaciones",
  cliente: "cliente",
  user: "cliente",
  client: "cliente",
  empleado: "operaciones",
  employee: "operaciones",
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
  const displayName = user?.nombre?.trim() || user?.email?.split("@")[0];
  const roleLabel = roleLabels[role] ?? "cuenta Asiinet";
  const actionHref = user ? (isClient ? "/tareas" : "/panel") : "/login";
  const actionLabel = user
    ? isClient
      ? "Ver mis solicitudes"
      : "Ir al Panel Operativo"
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
          <a href="#proceso">Cómo trabajamos</a>
          <a href="#preguntas">Preguntas frecuentes</a>
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
                {displayName ? `Hola, ${displayName}. ` : ""}Tu espacio de{" "}
                {roleLabel}.
              </p>
            ) : (
              <p className="home-intro">
                Internet por cable para hogares y comercios
              </p>
            )}
            <h1 id="home-title">
              Servicio Técnico y Conectividad de Alta Calidad
            </h1>
            <p className="home-lede">
              Un equipo operativo que coordina cada instalación, reparación y
              solicitud para que hogares y comercios sigan conectados.
            </p>
            <div className="home-hero-actions">
              <Link className="home-primary-action" to={actionHref}>
                <span>{actionLabel}</span>
                <FontAwesomeIcon
                  icon={user ? faArrowRight : faRightToBracket}
                  aria-hidden="true"
                />
              </Link>
              <a className="home-secondary-action" href="#servicios">
                Ver servicios disponibles
              </a>
            </div>
          </div>
          <div className="home-network">
            <div className="network-caption">
              <span className="network-live-dot" aria-hidden="true"></span>
              Una red, muchos puntos conectados
            </div>
            <NetworkDiagram />
          </div>
        </section>

        <section
          className="home-guarantees"
          aria-labelledby="guarantees-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-kicker">El servicio Asiinet</p>
              <h2 id="guarantees-title">Por qué elegir Asiinet</h2>
            </div>
          </div>
          <div className="guarantee-grid">
            {guarantees.map((guarantee) => (
              <article className="guarantee-item" key={guarantee.title}>
                <span className="guarantee-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={guarantee.icon} />
                </span>
                <div>
                  <h3>{guarantee.title}</h3>
                  <p>{guarantee.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="home-services"
          id="servicios"
          aria-labelledby="services-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-kicker">Soluciones de conectividad</p>
              <h2 id="services-title">Servicios disponibles</h2>
              <p>
                Instalación, soporte y gestión para cada etapa del servicio.
              </p>
            </div>
          </div>
          <div className="service-list">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                <span className="service-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={service.icon} />
                </span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <Link className="service-link" to={actionHref}>
                  {user ? "Gestionar solicitud" : "Ingresar para solicitar"}
                  <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section
          className="home-process"
          id="proceso"
          aria-labelledby="process-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-kicker">De principio a fin</p>
              <h2 id="process-title">Cómo trabajamos</h2>
              <p>
                Un proceso coordinado para dar seguimiento a cada pedido.
              </p>
            </div>
          </div>
          <ol className="process-list">
            {workSteps.map((step, index) => (
              <li className="process-step" key={step.title}>
                <span className="process-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="home-gallery"
          id="trabajo"
          aria-labelledby="home-gallery-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-kicker">Asiinet en terreno</p>
              <h2 id="home-gallery-title">Personas detrás de cada conexión</h2>
              <p>El trabajo técnico que mantiene hogares y comercios conectados.</p>
            </div>
          </div>
          <GalleryCarousel photos={galleryPhotos} />
        </section>

        <section
          className="home-faq"
          id="preguntas"
          aria-labelledby="faq-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-kicker">Te ayudamos a empezar</p>
              <h2 id="faq-title">Preguntas frecuentes</h2>
            </div>
          </div>
          <div className="faq-list">
            {questions.map((item) => (
              <details className="faq-item" key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-footer-about">
          <Link className="home-footer-brand" to="/" aria-label="Asiinet, inicio">
            <img src={logoAsiinet} alt="Asiinet" />
          </Link>
          <p>
            Internet por cable, servicio técnico y coordinación operativa para
            hogares y comercios.
          </p>
        </div>
        <nav className="home-footer-nav" aria-label="Navegación del pie">
          <h2>Enlaces rápidos</h2>
          <Link to="/">Inicio</Link>
          <Link to="/login">Ingresar al portal</Link>
          <Link to="/panel">Panel operativo</Link>
        </nav>
        <p className="home-footer-copyright">
          © {new Date().getFullYear()} Asiinet. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

export default Home;
