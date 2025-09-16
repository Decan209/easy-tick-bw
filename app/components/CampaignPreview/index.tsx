import { Card, Text } from "@shopify/polaris";
import { useState } from "react";
import "./style.css";
import type { IFormData } from "app/types/shopify";

interface CampaignPreviewProps {
  formData: IFormData;
}

export function CampaignPreview({ formData }: CampaignPreviewProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  const imageUrl = formData.imageUrl;

  const cardStyle = {
    background: formData.backgroundColor || "#FFFFFF",
    border: `1px solid ${formData.borderColor || "#E1E3E5"}`,
    borderRadius: `${formData.borderRadius || 8}px`,
    padding: `${formData.padding || 16}px`,
    transition: "all 0.2s ease",
    cursor: "pointer",
    boxShadow: isHovered
      ? "0 4px 12px rgba(0, 0, 0, 0.15)"
      : "0 1px 3px rgba(0, 0, 0, 0.1)",
    transform: isHovered ? "translateY(-1px)" : "none",
  };

  const imageStyle = {
    width: `${formData.imageSize || 50}px`,
    height: `${formData.imageSize || 50}px`,
    borderRadius: "6px",
    objectFit: "cover" as const,
    cursor: "pointer",
    transition: "opacity 0.2s ease",
  };

  const checkboxStyle = {
    backgroundColor: formData.checkboxBackgroundColor || "#FFFFFF",
    border: `1px solid ${formData.checkboxBorderColor || "#E1E3E5"}`,
    accentColor: formData.checkboxActiveColor || "#0066CC",
    width: `${formData.checkboxSize || 20}px`,
    height: `${formData.checkboxSize || 20}px`,
    margin: 0,
    cursor: "pointer",
    flexShrink: 0,
  };

  const fontStyle = {
    fontSize: `${formData.fontSize || 14}px`,
    color: formData.fontColor || "#000000",
    fontWeight: formData.fontWeight || "normal",
  };

  const titleStyle = {
    ...fontStyle,
    fontWeight: "600",
    margin: 0,
  };

  const descriptionStyle = {
    ...fontStyle,
    fontSize: `${(formData.fontSize || 14) - 1}px`,
    opacity: 0.8,
    margin: "4px 0 0 0",
    lineHeight: 1.4,
  };

  const priceStyle = {
    color: formData.checkboxActiveColor || "#0066CC",
    fontWeight: "600",
    fontSize: `${formData.fontSize || 14}px`,
    whiteSpace: "nowrap" as const,
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
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="checkbox"
                checked={formData.preCheck}
                readOnly
                style={checkboxStyle}
              />

              {imageUrl && formData.showImage && (
                <img
                  src={imageUrl}
                  alt={formData.heading || "Product Image"}
                  style={imageStyle}
                  onClick={() => setImageModalOpen(true)}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                  title="Click to preview"
                />
              )}

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span style={titleStyle}>
                    {formData.heading || "Product Title"}
                  </span>
                  {formData.showPrice && formData.price && (
                    <span style={priceStyle}>(+ ${formData.price})</span>
                  )}
                </div>
                {formData.description && (
                  <div style={descriptionStyle}>{formData.description}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {imageModalOpen && imageUrl && formData.showImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "pointer",
          }}
          onClick={() => setImageModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "hidden",
              cursor: "default",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                {formData.heading || "Product Title"}
              </h3>
              <button
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: 0,
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  color: "#666",
                }}
                onClick={() => setImageModalOpen(false)}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f5f5f5";
                  e.currentTarget.style.color = "#333";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#666";
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 0 }}>
              <img
                src={imageUrl}
                alt={formData.heading || "Product Image"}
                style={{
                  width: "100%",
                  height: "auto",
                  maxWidth: "600px",
                  maxHeight: "600px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
