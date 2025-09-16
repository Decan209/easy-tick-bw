import { Text, Avatar, LegacyStack, RadioButton } from "@shopify/polaris";
import type { ShopifyProduct } from "app/types/shopify";

export function ProductCard({
  product,
  onPickProduct,
  onPickVariant,
  tempSelected,
  showVariants = false,
}: {
  product: ShopifyProduct;
  onPickProduct: (productId: string) => void;
  onPickVariant: (productId: string, variantId: string) => void;
  tempSelected: { productId: string; variantId?: string } | null;
  showVariants?: boolean;
}) {
  const cover = product.images[0]?.url;
  const isSelected = tempSelected?.productId === product.id;

  return (
    <div
      key={product.id}
      style={{
        border: isSelected ? "2px solid #005bd3" : "1px solid #e1e3e5",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 10,
        cursor: "pointer",
        background: isSelected ? "#eef5ff" : "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 10,
        }}
        onClick={() => !showVariants && onPickProduct(product.id)}
      >
        {cover ? (
          <img
            src={cover}
            alt={product.title}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              objectFit: "cover",
            }}
          />
        ) : (
          <Avatar initials={product.title.charAt(0)} size="md" />
        )}
        <div style={{ flex: 1 }}>
          <Text as="h3" variant="bodyMd" fontWeight="semibold">
            {product.title}
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            {product.variants.length} variant
            {product.variants.length > 1 ? "s" : ""}
          </Text>
        </div>
      </div>

      {showVariants && (
        <div
          style={{
            padding: "8px 12px 12px 12px",
            background: "#fafbfc",
          }}
        >
          <LegacyStack vertical spacing="tight">
            {product.variants.map((variant) => {
              const isVariantSelected =
                tempSelected?.productId === product.id &&
                tempSelected?.variantId === variant.id;

              return (
                <div
                  key={variant.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 10,
                    borderRadius: 8,
                    background: isVariantSelected ? "#eef5ff" : "#fff",
                    border: isVariantSelected
                      ? "2px solid #005bd3"
                      : "1px solid #e1e3e5",
                    cursor: "pointer",
                  }}
                  onClick={() => onPickVariant(product.id, variant.id)}
                >
                  <RadioButton
                    label=""
                    checked={isVariantSelected}
                    onChange={() => {}}
                  />
                  <div style={{ flex: 1 }}>
                    <Text as="p" variant="bodyMd">
                      {variant.title === "Default Title"
                        ? "Default"
                        : variant.title}
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <Text as="span" variant="bodySm" fontWeight="semibold">
                        ${variant.price}
                      </Text>
                      {variant.compareAtPrice && (
                        <Text
                          as="span"
                          variant="bodySm"
                          tone="subdued"
                          textDecorationLine="line-through"
                        >
                          ${variant.compareAtPrice}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </LegacyStack>
        </div>
      )}
    </div>
  );
}
