import { useEffect, useState } from "react";
import GalleryArrows from "./GalleryArrows";
import GalleryIndicators from "./GalleryIndicators";

function GalleryCarousel({ photos }) {
  const carouselPhotos = [
    photos[photos.length - 1],
    ...photos,
    photos[0],
  ];

  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Cambio automático cada 5 segundos.
  // Al cambiar manualmente, el contador vuelve a empezar.
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((current) => current + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // Maneja el salto invisible necesario para el carrusel infinito.
  useEffect(() => {
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
  }, [currentIndex, photos.length]);

  const previousPhoto = () => {
    setCurrentIndex((current) => {
      if (current === 0) {
        return photos.length;
      }

      return current - 1;
    });
  };

  const nextPhoto = () => {
    setCurrentIndex((current) => current + 1);
  };

  const goToPhoto = (index) => {
    setCurrentIndex(index + 1);
  };

  return (
    <>
      <div className="gallery-container">
        <GalleryArrows
          onPrevious={previousPhoto}
          onNext={nextPhoto}
        />

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
      </div>

      <GalleryIndicators
        photos={photos}
        currentIndex={currentIndex}
        onSelect={goToPhoto}
      />
    </>
  );
}

export default GalleryCarousel;