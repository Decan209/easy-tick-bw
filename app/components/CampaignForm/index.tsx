import {
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  RangeSlider,
  Text,
  Button,
  Banner,
} from "@shopify/polaris";
import { Form as RemixForm } from "@remix-run/react";
import { TargetProducts } from "../TargetProducts";
import { ColorPickerField } from "../ColorPickerField";
import ProductSelector from "../ProductSelector";
import MultiProductSelector from "../MultiProductSelector";
import type {
  IFormData,
  ShopifyProduct,
  IShopifyVariant,
} from "app/types/shopify";
import "./style.css";

interface CampaignFormProps {
  formData: IFormData;
  updateField: (field: string, value: any) => void;
  collections: Array<{
    id: string;
    title: string;
    handle: string;
    description: string;
  }>;
  selectedVariantData: {
    product: { title: string; images?: Array<{ url: string }> };
    variant: { title: string; price: string; inventoryQuantity: number };
  } | null;
  productSelectorOpen: boolean;
  setProductSelectorOpen: (open: boolean) => void;
  handleProductSelect: (
    product: ShopifyProduct,
    variant: IShopifyVariant,
  ) => void;
  targetProductSelectorOpen: boolean;
  setTargetProductSelectorOpen: (open: boolean) => void;
  handleTargetProductsSelect: (
    selectedItems: { productId: string; variantId?: string }[],
  ) => void;
  initialProducts?: any[];
  initialCursor?: string | null;
  initialHasNextPage?: boolean;
  error?: string;
  showErrorBanner?: boolean;
  onDismissError?: () => void;
  successMessage?: string;
  showSuccessBanner?: boolean;
  onDismissSuccess?: () => void;
}

export default function CampaignForm({
  formData,
  updateField,
  collections,
  selectedVariantData,
  productSelectorOpen,
  setProductSelectorOpen,
  handleProductSelect,
  targetProductSelectorOpen,
  setTargetProductSelectorOpen,
  handleTargetProductsSelect,
  initialProducts,
  initialCursor,
  initialHasNextPage,
  error,
  showErrorBanner,
  onDismissError,
  successMessage,
  showSuccessBanner,
  onDismissSuccess,
}: CampaignFormProps) {
  return (
    <>
      {error && showErrorBanner && (
        <div style={{ marginBottom: "1rem" }}>
          <Banner
            title="Create campaign failed"
            tone="critical"
            onDismiss={onDismissError}
          >
            <p>{error}</p>
          </Banner>
        </div>
      )}

      {successMessage && showSuccessBanner && (
        <div style={{ marginBottom: "1rem" }}>
          <Banner title="Success" tone="success" onDismiss={onDismissSuccess}>
            <p>{successMessage}</p>
          </Banner>
        </div>
      )}

      <RemixForm id="campaign-form" method="post">
        <Card>
          <FormLayout>
            <TextField
              label="Campaign Name"
              name="title"
              value={formData.title}
              onChange={(v) => updateField("title", v)}
              autoComplete="off"
              placeholder="Enter campaign name"
              requiredIndicator
            />
            <Select
              label="Status"
              name="status"
              options={[
                { label: "Active", value: "Active" },
                { label: "Draft", value: "Draft" },
              ]}
              value={formData.status}
              onChange={(v) => updateField("status", v)}
            />
            <Select
              label="Placement"
              name="placement"
              options={[
                { label: "Product Page", value: "product" },
                { label: "Cart Page", value: "cart" },
              ]}
              value={formData.placement}
              onChange={(v) => updateField("placement", v)}
              helpText="Select where this campaign will be shown"
            />
          </FormLayout>
        </Card>

        <Card>
          <TargetProducts
            targetType={formData.targetType}
            selectedCollection={formData.selectedCollection}
            selectedProducts={formData.selectedProducts}
            collections={collections.map((c) => ({
              ...c,
              handle: c.handle ?? "",
              description: c.description ?? "",
            }))}
            onTargetTypeChange={(v) => updateField("targetType", v)}
            onCollectionChange={(v) => updateField("selectedCollection", v)}
            onSelectProducts={() => setTargetProductSelectorOpen(true)}
            getSelectedProductsText={() =>
              Array.isArray(formData.selectedProducts) &&
              formData.selectedProducts.length > 0
                ? `${formData.selectedProducts.length} product(s) selected`
                : "No products selected"
            }
          />
        </Card>

        <Card>
          <FormLayout>
            <Text as="h3" variant="headingMd">
              Upsell Product
            </Text>
            <Button onClick={() => setProductSelectorOpen(true)} fullWidth>
              {selectedVariantData &&
              selectedVariantData.product &&
              selectedVariantData.variant
                ? `${selectedVariantData.product.title} - ${selectedVariantData.variant.title} ($${selectedVariantData.variant.price})`
                : "Select upsell product variant"}
            </Button>
          </FormLayout>
        </Card>

        <Card>
          <FormLayout>
            <Text as="h3" variant="headingMd">
              Content Settings
            </Text>
            <TextField
              label="Heading"
              name="heading"
              value={formData.heading}
              onChange={(v) => updateField("heading", v)}
              autoComplete="off"
              placeholder="Custom heading for the upsell offer"
              helpText="Leave empty to use product title"
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={(v) => updateField("description", v)}
              autoComplete="off"
              placeholder="Description"
            />
            <TextField
              label="Image URL"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={(v) => updateField("imageUrl", v)}
              autoComplete="off"
              placeholder="https://... (optional custom image)"
              helpText="Leave empty to use product image"
            />

            {!formData.imageUrl &&
              selectedVariantData?.product?.images?.[0]?.url && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={selectedVariantData.product.images[0].url}
                    alt={selectedVariantData.product.title}
                    className="form-image-preview"
                  />
                  <Text as="p" variant="bodySm" tone="subdued">
                    Preview product image
                  </Text>
                </div>
              )}
          </FormLayout>
        </Card>

        <Card>
          <FormLayout>
            <Text as="h3" variant="headingMd">
              Display Options
            </Text>
            <Checkbox
              label="Show Price"
              checked={formData.showPrice}
              onChange={(v) => updateField("showPrice", v)}
              helpText="Display the product price next to the offer"
            />
            <Checkbox
              label="Show Image"
              checked={formData.showImage}
              onChange={(v) => updateField("showImage", v)}
              helpText="Display the product image next to the offer"
            />
            <Checkbox
              label="Pre-check"
              checked={formData.preCheck}
              onChange={(v) => updateField("preCheck", v)}
              helpText="Auto-select the upsell when customer clicks main Add to Cart"
            />
          </FormLayout>
        </Card>

        <Card>
          <FormLayout>
            <Text as="h3" variant="headingMd">
              Styling Options
            </Text>
            <TextField
              label="Background Color"
              value={formData.backgroundColor}
              onChange={(v) => updateField("backgroundColor", v)}
              autoComplete="off"
              placeholder="#FFFFFF"
            />
            <TextField
              label="Border Color"
              value={formData.borderColor}
              onChange={(v) => updateField("borderColor", v)}
              autoComplete="off"
              placeholder="#E1E3E5"
            />
            <TextField
              label="Background Color Active"
              value={formData.backgroundColorActive}
              onChange={(v) => updateField("backgroundColorActive", v)}
              autoComplete="off"
              placeholder="#0066CC"
            />
            <RangeSlider
              label={`Padding: ${formData.padding}px`}
              min={0}
              max={100}
              value={formData.padding}
              onChange={(v) => updateField("padding", v)}
            />
            <RangeSlider
              label={`Border Radius: ${formData.borderRadius}px`}
              min={0}
              max={100}
              value={formData.borderRadius}
              onChange={(v) => updateField("borderRadius", v)}
            />
            <RangeSlider
              label={`Image Size: ${formData.imageSize}px`}
              min={20}
              max={100}
              value={formData.imageSize}
              onChange={(v) => updateField("imageSize", v)}
            />
          </FormLayout>
        </Card>

        <Card>
          <FormLayout>
            <Text as="h3" variant="headingMd">
              Checkbox Styling
            </Text>
            <ColorPickerField
              label="Checkbox Background Color"
              value={formData.checkboxBackgroundColor}
              onChange={(v) => updateField("checkboxBackgroundColor", v)}
              isOpen={false}
              onToggle={() => {}}
              hexToHsb={(hex: string) => ({ h: 0, s: 0, b: 0 })}
              hsbToHex={(hsb: { h: number; s: number; b: number }) => "#FFFFFF"}
            />
            <ColorPickerField
              label="Checkbox Border Color"
              value={formData.checkboxBorderColor}
              onChange={(v) => updateField("checkboxBorderColor", v)}
              isOpen={false}
              onToggle={() => {}}
              hexToHsb={(hex: string) => ({ h: 0, s: 0, b: 0 })}
              hsbToHex={(hsb: { h: number; s: number; b: number }) => "#E1E3E5"}
            />
            <ColorPickerField
              label="Checkbox Active Color"
              value={formData.checkboxActiveColor}
              onChange={(v) => updateField("checkboxActiveColor", v)}
              isOpen={false}
              onToggle={() => {}}
              hexToHsb={(hex: string) => ({ h: 0, s: 0, b: 0 })}
              hsbToHex={(hsb: { h: number; s: number; b: number }) => "#0066CC"}
            />
            <RangeSlider
              label={`Checkbox Size: ${formData.checkboxSize}px`}
              min={12}
              max={32}
              value={formData.checkboxSize}
              onChange={(v) => updateField("checkboxSize", v)}
            />
          </FormLayout>
        </Card>

        <Card>
          <FormLayout>
            <Text as="h3" variant="headingMd">
              Font Settings
            </Text>
            <RangeSlider
              label={`Font Size: ${formData.fontSize}px`}
              min={8}
              max={24}
              value={formData.fontSize}
              onChange={(v) => updateField("fontSize", v)}
            />
            <TextField
              label="Font Color"
              value={formData.fontColor}
              onChange={(v) => updateField("fontColor", v)}
              autoComplete="off"
              placeholder="#000000"
            />
            <Select
              label="Font Weight"
              options={[
                { label: "Normal", value: "normal" },
                { label: "Bold", value: "bold" },
                { label: "Light", value: "300" },
                { label: "Medium", value: "500" },
                { label: "Semi Bold", value: "600" },
              ]}
              value={formData.fontWeight}
              onChange={(v) => updateField("fontWeight", v)}
            />
          </FormLayout>
        </Card>

        <input type="hidden" name="targetType" value={formData.targetType} />
        <input
          type="hidden"
          name="selectedCollection"
          value={formData.selectedCollection}
        />
        <input
          type="hidden"
          name="selectedVariant"
          value={formData.selectedVariant}
        />
        <input
          type="hidden"
          name="selectedProduct"
          value={formData.selectedProduct}
        />
        <input
          type="hidden"
          name="selectedProductData"
          value={formData.selectedProductData}
        />
        <input
          type="hidden"
          name="selectedVariantData"
          value={formData.selectedVariantData}
        />

        {Array.isArray(formData.selectedProducts) &&
          formData.selectedProducts.map((productId: string, index: number) => (
            <input
              key={`product-${index}`}
              type="hidden"
              name={`targetProducts[${index}]`}
              value={productId}
            />
          ))}

        {formData.showPrice && (
          <input type="hidden" name="showPrice" value="on" />
        )}
        {formData.showImage && (
          <input type="hidden" name="showImage" value="on" />
        )}
        {formData.preCheck && (
          <input type="hidden" name="preCheck" value="on" />
        )}

        <input type="hidden" name="padding" value={String(formData.padding)} />
        <input
          type="hidden"
          name="borderRadius"
          value={String(formData.borderRadius)}
        />
        <input
          type="hidden"
          name="imageSize"
          value={String(formData.imageSize)}
        />
        <input
          type="hidden"
          name="checkboxSize"
          value={String(formData.checkboxSize)}
        />
        <input
          type="hidden"
          name="fontSize"
          value={String(formData.fontSize)}
        />

        <input
          type="hidden"
          name="backgroundColor"
          value={formData.backgroundColor}
        />
        <input type="hidden" name="borderColor" value={formData.borderColor} />
        <input
          type="hidden"
          name="backgroundColorActive"
          value={formData.backgroundColorActive}
        />
        <input
          type="hidden"
          name="checkboxBackgroundColor"
          value={formData.checkboxBackgroundColor}
        />
        <input
          type="hidden"
          name="checkboxBorderColor"
          value={formData.checkboxBorderColor}
        />
        <input
          type="hidden"
          name="checkboxActiveColor"
          value={formData.checkboxActiveColor}
        />
        <input type="hidden" name="fontColor" value={formData.fontColor} />
        <input type="hidden" name="fontWeight" value={formData.fontWeight} />

        <ProductSelector
          open={productSelectorOpen}
          onClose={() => setProductSelectorOpen(false)}
          onSelect={(product, variant) => {
            handleProductSelect(product, variant);
            setProductSelectorOpen(false);
          }}
          selectedProductId={formData.selectedProduct}
          selectedVariantId={formData.selectedVariant}
          initialProducts={initialProducts}
          initialCursor={initialCursor}
          initialHasNextPage={initialHasNextPage}
        />

        <MultiProductSelector
          open={targetProductSelectorOpen}
          onClose={() => setTargetProductSelectorOpen(false)}
          onSelect={handleTargetProductsSelect}
          selectedItems={formData.selectedProducts.map((id) => ({
            productId: id,
          }))}
          initialProducts={initialProducts}
          initialCursor={initialCursor}
          initialHasNextPage={initialHasNextPage}
        />
      </RemixForm>
    </>
  );
}
