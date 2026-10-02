import { useEffect, useState } from "react";
import AccountActions from "../components/dashboard/AccountActions";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

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
  // Agregamos una copia de la última al principio
  // y una copia de la primera al final.
  const carouselPhotos = [
    photos[photos.length - 1],
    ...photos,
    photos[0],
  ];

  // Empezamos en 1 porque la posición 0 es la copia de la última foto.
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // =========================
  // CAMBIO AUTOMÁTICO
  // =========================

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((current) => current + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // =========================
  // REINICIO DEL CARRUSEL
  // =========================

  useEffect(() => {
    // Llegamos a la copia de la primera foto.
    if (currentIndex === photos.length + 1) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(1);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitioning(true);
          });
        });
      }, 600);

      return () => clearTimeout(timeout);
    }

    // Llegamos a la copia de la última foto.
    if (currentIndex === 0) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(photos.length);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitioning(true);
          });
        });
      }, 600);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);

  // =========================
  // FLECHA IZQUIERDA
  // =========================

  const previousPhoto = () => {
    setCurrentIndex((current) => {
      if (current === 0) {
        return photos.length;
      }

      return current - 1;
    });
  };

  // =========================
  // FLECHA DERECHA
  // =========================

  const nextPhoto = () => {
    setCurrentIndex((current) => {
      return current + 1;
    });
  };

  // Índice real para los indicadores.
  let indicatorIndex = currentIndex - 1;

  if (indicatorIndex < 0) {
    indicatorIndex = photos.length - 1;
  }

  if (indicatorIndex >= photos.length) {
    indicatorIndex = 0;
  }

  // =========================
  // CAMBIO MANUAL DESDE LOS INDICADORES
  // =========================

  const goToPhoto = (index) => {
    setCurrentIndex(index + 1);
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <main className="dashboard-content gallery-page">
        <AccountActions />
        <h1>Galería de Fotos</h1>

        <div className="gallery-container">
          <button
            type="button"
            className="gallery-arrow gallery-arrow-left"
            onClick={previousPhoto}
            aria-label="Foto anterior"
          >
            &#10094;
          </button>

          <div
            className="gallery-track"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: isTransitioning
                ? "transform 0.6s ease-in-out"
                : "none",
            }}
          >
            {carouselPhotos.map((photo, index) => (
              <div
                className="gallery-slide"
                key={`${photo.id}-${index}`}
              >
                <img
                  className="gallery-image"
                  src={photo.src}
                  alt={photo.alt}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="gallery-arrow gallery-arrow-right"
            onClick={nextPhoto}
            aria-label="Foto siguiente"
          >
            &#10095;
          </button>
        </div>

        <div className="gallery-indicators">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              className={`gallery-indicator ${
                index === indicatorIndex ? "active" : ""
              }`}
              onClick={() => goToPhoto(index)}
              aria-label={`Ir a la foto ${index + 1}`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default Gallery;