import { Link } from "react-router-dom";
import logoAsiinet from "../assets/brand/logos/logo asiinet.png";
import "./NotFound.css";

function NotFound() {
  return (
    <main id="main-content" tabIndex="-1" className="not-found-page">
      <img className="not-found-logo" src={logoAsiinet} alt="Asiinet" />
      <p className="not-found-code">Error 404</p>
      <h1>No encontramos esa página</h1>
      <p className="not-found-copy">
        La dirección puede haber cambiado o no estar disponible.
      </p>
      <Link className="not-found-link" to="/login">
        Volver al inicio de sesión
      </Link>
    </main>
  );
}

export default NotFound;
