function GalleryArrows({ onPrevious, onNext }) {
  return (
    <>
      <button
        type="button"
        className="gallery-arrow gallery-arrow-left"
        onClick={onPrevious}
        aria-label="Foto anterior"
      >
        &#10094;
      </button>

      <button
        type="button"
        className="gallery-arrow gallery-arrow-right"
        onClick={onNext}
        aria-label="Foto siguiente"
      >
        &#10095;
      </button>
    </>
  );
}

export default GalleryArrows;