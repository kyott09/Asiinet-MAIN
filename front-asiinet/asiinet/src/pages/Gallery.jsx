import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import AccountActions from "../components/dashboard/AccountActions";
import GalleryCarousel from "../components/gallery/GalleryCarousel";
import "./Gallery.css";

import gallery1 from "../assets/foto1.jpg";
import gallery2 from "../assets/foto2.jpg";
import gallery3 from "../assets/foto3.jpg";

const photos = [
  {
    id: 1,
    src: gallery1,
    alt: "Equipo de Asiinet durante una jornada de trabajo",
  },
  {
    id: 2,
    src: gallery2,
    alt: "Instalación de un servicio de conectividad",
  },
  {
    id: 3,
    src: gallery3,
    alt: "Personal técnico de Asiinet",
  },
];

function Gallery() {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <main className="dashboard-content gallery-page">
        <AccountActions />
        <h1>Galería de Fotos</h1>

        <GalleryCarousel photos={photos} />
      </main>
    </div>
  );
}

export default Gallery;