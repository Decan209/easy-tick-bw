import { FormLayout, Select, Button, Text } from "@shopify/polaris";
import type { ShopifyCollection } from "app/types/shopify";
import { CollectionSelect } from "../CollectionSelect";

interface TargetProductsProps {
  targetType: string;
  selectedCollection: string;
  selectedProducts: string[];
  collections: ShopifyCollection[];
  onTargetTypeChange: (value: string) => void;
  onCollectionChange: (value: string) => void;
  onSelectProducts: () => void;
  getSelectedProductsText: () => string;
}

export function TargetProducts({
  targetType,
  selectedCollection,
  selectedProducts,
  collections,
  onTargetTypeChange,
  onCollectionChange,
  onSelectProducts,
  getSelectedProductsText,
}: TargetProductsProps) {
  return (
    <>
      <Text as="p" variant="bodySm" tone="subdued">
        Choose where this upsell campaign will appear
      </Text>
      <div style={{ marginTop: 16 }}>
        <FormLayout>
          <Select
            label="Target product type"
            name="targetType"
            options={[
              { label: "All Products", value: "all" },
              { label: "Specific Products", value: "specific" },
              { label: "Product Collections", value: "collection" },
            ]}
            value={targetType}
            onChange={onTargetTypeChange}
          />

          {targetType === "specific" && (
            <div>
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Select specific products
              </Text>
              <div style={{ marginTop: 8 }}>
                <Button onClick={onSelectProducts} fullWidth>
                  {getSelectedProductsText()}
                </Button>
                {selectedProducts.map((productId, index) => (
                  <input
                    key={productId}
                    type="hidden"
                    name={`targetProducts[${index}]`}
                    value={productId}
                  />
                ))}
              </div>
              {selectedProducts.length > 0 && (
                <div className="status-badge">
                  <Text as="p" variant="bodySm" tone="subdued">
                    ✓ Campaign will show only on {selectedProducts.length}{" "}
                    selected product
                    {selectedProducts.length > 1 ? "s" : ""}
                  </Text>
                </div>
              )}
            </div>
          )}

          {targetType === "collection" && (
            <div>
              <CollectionSelect
                collections={collections}
                value={selectedCollection}
                onChange={onCollectionChange}
              />
            </div>
          )}
          {targetType === "all" && (
            <div className="status-badge">
              <Text as="p" variant="bodySm" tone="subdued">
                ✓ Campaign will show on all products in your store
              </Text>
            </div>
          )}
        </FormLayout>
      </div>
    </>
  );
}
