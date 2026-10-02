import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import GalleryCarousel from "../components/gallery/GalleryCarousel";

import gallery1 from "../assets/foto1.jpg";
import gallery2 from "../assets/foto2.jpg";
import gallery3 from "../assets/foto3.jpg";

const photos = [
  {
    id: 1,
    src: gallery1,
    alt: "Foto 1 de Asiinet",
  },
  {
    id: 2,
    src: gallery2,
    alt: "Foto 2 de Asiinet",
  },
  {
    id: 3,
    src: gallery3,
    alt: "Foto 3 de Asiinet",
  },
];

function Gallery() {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <main className="dashboard-content gallery-page">
        <h1>Galería de Fotos</h1>

        <GalleryCarousel photos={photos} />
      </main>
    </div>
  );
}

export default Gallery;