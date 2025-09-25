import { Card, Text } from "@shopify/polaris";
import { useState, useEffect } from "react";
import type { IFormData } from "app/types/shopify";
import "./style.css";

interface CampaignPreviewProps {
  formData: IFormData;
}

export function CampaignPreview({ formData }: CampaignPreviewProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (imageModalOpen) {
      setCurrentImageIndex(0);
    }
  }, [imageModalOpen]);

  const hasData =
    formData.heading ||
    formData.description ||
    formData.imageUrl ||
    formData.price;

  if (!hasData) {
    return (
      <div className="preview-container">
        <Card>
          <div className="preview-card-inner">
            <div className="empty-preview">
              <Text as="h3" variant="headingSm" tone="subdued">
                Select an upsell product to see preview
              </Text>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const images = formData.images || [formData.imageUrl].filter(Boolean);
  const activeColor = formData.checkboxActiveColor || "#0066CC";

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const updateDots = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="preview-container">
      <Card>
        <div className="preview-card-inner">
          <div style={{ marginBottom: "16px" }}>
            <Text as="h3" variant="headingMd">
              Upsell Preview
            </Text>
          </div>

          <div
            className={`tick-one-upsell-card ${isHovered ? "hovered" : ""}`}
            style={{
              background: formData.backgroundColor || "#FFFFFF",
              borderColor: formData.borderColor || "#E1E3E5",
              borderRadius: `${formData.borderRadius || 8}px`,
              padding: `${formData.padding || 16}px`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setImageModalOpen(true)}
          >
            <div className="card-content">
              <input
                type="checkbox"
                checked={formData.preCheck}
                readOnly
                className="tick-one-checkbox"
                style={{
                  backgroundColor:
                    formData.checkboxBackgroundColor || "#FFFFFF",
                  borderColor: formData.checkboxBorderColor || "#E1E3E5",
                  accentColor: formData.checkboxActiveColor || "#0066CC",
                  width: `${formData.checkboxSize || 20}px`,
                  height: `${formData.checkboxSize || 20}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              />

              {formData.imageUrl && formData.showImage && (
                <img
                  src={formData.imageUrl}
                  alt={formData.heading || "Product Image"}
                  className="tick-one-image"
                  style={{
                    width: `${formData.imageSize || 50}px`,
                    height: `${formData.imageSize || 50}px`,
                  }}
                  title="Click to preview"
                />
              )}

              <div className="card-text">
                <div className="card-header">
                  <span
                    className="tick-one-title"
                    style={{
                      fontSize: `${formData.fontSize || 14}px`,
                      color: formData.fontColor || "#000000",
                      fontWeight: formData.fontWeight || "normal",
                    }}
                  >
                    {formData.heading || "Product Title"}
                  </span>
                  {formData.showPrice && formData.price && (
                    <span
                      className="tick-one-price"
                      style={{
                        color: formData.checkboxActiveColor || "#0066CC",
                        fontSize: `${formData.fontSize || 14}px`,
                      }}
                    >
                      (+ ${formData.price})
                    </span>
                  )}
                </div>
                {formData.description && (
                  <div
                    className="tick-one-description"
                    style={{
                      fontSize: `${(formData.fontSize || 14) - 1}px`,
                      color: formData.fontColor || "#000000",
                      fontWeight: formData.fontWeight || "normal",
                    }}
                  >
                    {formData.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {imageModalOpen && images.length > 0 && (
        <div
          className="image-modal-overlay"
          onClick={() => setImageModalOpen(false)}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="image-modal-header">
              <h3 className="image-modal-title">
                {formData.heading || "Product Title"}
              </h3>
              <button
                className="image-modal-close"
                onClick={() => setImageModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="image-modal-body">
              {formData.shopifyDescription && (
                <p className="image-modal-description">
                  {formData.shopifyDescription}
                </p>
              )}

              <div className="image-carousel">
                {images.length > 1 && (
                  <button
                    className="tick-one-prev"
                    onClick={prevImage}
                    style={{ background: `${activeColor}80` }}
                  >
                    ‹
                  </button>
                )}

                <img
                  src={images[currentImageIndex]}
                  alt={formData.heading || "Product Image"}
                  className="image-modal-image"
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    e.currentTarget.dataset.startX = touch.clientX.toString();
                    e.currentTarget.dataset.startY = touch.clientY.toString();
                  }}
                  onTouchEnd={(e) => {
                    const startX = parseFloat(
                      e.currentTarget.dataset.startX || "0",
                    );
                    const startY = parseFloat(
                      e.currentTarget.dataset.startY || "0",
                    );
                    const endX = e.changedTouches[0].clientX;
                    const endY = e.changedTouches[0].clientY;
                    const diffX = startX - endX;
                    const diffY = startY - endY;
                    if (
                      Math.abs(diffX) > Math.abs(diffY) &&
                      Math.abs(diffX) > 50
                    ) {
                      if (diffX > 0) {
                        nextImage();
                      } else {
                        prevImage();
                      }
                    }
                  }}
                />

                {images.length > 1 && (
                  <button
                    className="tick-one-next"
                    onClick={nextImage}
                    style={{ background: `${activeColor}80` }}
                  >
                    ›
                  </button>
                )}
              </div>

              {images.length > 1 && (
                <div className="tick-one-dots">
                  {images.map((_: string, index: number) => (
                    <span
                      key={index}
                      className={`tick-one-dot ${index === currentImageIndex ? "active" : ""}`}
                      onClick={() => updateDots(index)}
                      style={{
                        background:
                          index === currentImageIndex ? activeColor : "#ccc",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
