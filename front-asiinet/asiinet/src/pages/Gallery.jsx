import AccountActions from "../components/dashboard/AccountActions";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import GalleryCarousel from "../components/gallery/GalleryCarousel";
import { galleryPhotos as photos } from "../components/gallery/galleryPhotos";
import "./Gallery.css";

function Gallery() {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <main id="main-content" tabIndex="-1" className="dashboard-content gallery-page">
        <AccountActions />
        <h1>Galería de fotos</h1>

        <GalleryCarousel photos={photos} />
      </main>
    </div>
  );
}

export default Gallery;