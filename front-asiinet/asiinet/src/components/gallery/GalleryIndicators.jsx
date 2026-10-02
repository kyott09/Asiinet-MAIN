function GalleryIndicators({ photos, currentIndex, onSelect }) {
  let indicatorIndex = currentIndex - 1;

  if (indicatorIndex < 0) {
    indicatorIndex = photos.length - 1;
  }

  if (indicatorIndex >= photos.length) {
    indicatorIndex = 0;
  }

  return (
    <div className="gallery-indicators">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          className={`gallery-indicator ${
            index === indicatorIndex ? "active" : ""
          }`}
          onClick={() => onSelect(index)}
          aria-label={`Ir a la foto ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default GalleryIndicators;