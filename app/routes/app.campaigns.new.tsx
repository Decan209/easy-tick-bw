import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useNavigation, useLoaderData, useActionData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Page, Layout, Spinner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { fetchProducts, fetchAllCollections } from "../hooks/product";
import CampaignForm from "../components/CampaignForm";
import { CampaignPreview } from "../components/CampaignPreview";
import { createCampaign } from "../db/actions/campaign";
import type {
  ICampaignPlacement,
  ICampaignStatus,
  ICampaignTargetType,
} from "../types/campaigns";
import type {
  ShopifyCollection,
  ShopifyProduct,
  IShopifyVariant,
} from "app/types/shopify";

type LoaderData = {
  products: ShopifyProduct[];
  collections: ShopifyCollection[];
  hasNextPage: boolean;
  endCursor: string | null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const { products, hasNextPage, endCursor } = await fetchProducts(admin, 50);
    const collections = await fetchAllCollections(admin);

    return json<LoaderData>({ products, collections, hasNextPage, endCursor });
  } catch (error) {
    console.error("Loader error:", error);
    return json<LoaderData>({
      products: [],
      collections: [],
      hasNextPage: false,
      endCursor: null,
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();

  const title = String(form.get("title") || "").trim();
  if (!title) {
    return json({ error: "Title is required" }, { status: 400 });
  }

  const status = String(form.get("status") || "Draft") as ICampaignStatus;
  const placement = String(
    form.get("placement") || "product",
  ) as ICampaignPlacement;

  const targetType = String(
    form.get("targetType") || "all",
  ) as ICampaignTargetType;

  const selectedCollections = JSON.parse(
    String(form.get("selectedCollections") || "[]"),
  ) as string[];
  const targetProducts: string[] = [];
  for (let i = 0; form.get(`targetProducts[${i}]`); i++) {
    targetProducts.push(String(form.get(`targetProducts[${i}]`)));
  }

  const selectedVariant = String(form.get("selectedVariant") || "");
  const selectedProduct = String(form.get("selectedProduct") || "");
  const heading = String(form.get("heading") || "");
  const description = String(form.get("description") || "");
  const imageUrlInput = String(form.get("imageUrl") || "");

  const showPrice = form.get("showPrice") === "on";
  const showImage = form.get("showImage") === "on";
  const preCheck = form.get("preCheck") === "on";

  const backgroundColor = String(form.get("backgroundColor") || "#FFFFFF");
  const borderColor = String(form.get("borderColor") || "#E1E3E5");
  const backgroundColorActive = String(
    form.get("backgroundColorActive") || "#0066CC",
  );

  const padding = Math.max(
    0,
    Math.min(100, parseInt(String(form.get("padding") || "16"))),
  );
  const borderRadius = Math.max(
    0,
    Math.min(100, parseInt(String(form.get("borderRadius") || "8"))),
  );
  const imageSize = Math.max(
    0,
    Math.min(100, parseInt(String(form.get("imageSize") || "50"))),
  );

  const checkboxBackgroundColor = String(
    form.get("checkboxBackgroundColor") || "#FFFFFF",
  );
  const checkboxBorderColor = String(
    form.get("checkboxBorderColor") || "#E1E3E5",
  );
  const checkboxActiveColor = String(
    form.get("checkboxActiveColor") || "#0066CC",
  );
  const checkboxSize = Math.max(
    10,
    Math.min(50, parseInt(String(form.get("checkboxSize") || "20"))),
  );

  const fontSize = Math.max(
    8,
    Math.min(24, parseInt(String(form.get("fontSize") || "14"))),
  );
  const fontColor = String(form.get("fontColor") || "#000000");
  const fontWeight = String(form.get("fontWeight") || "normal");

  const price = String(form.get("price") || "");

  let productImageUrl: string | null = imageUrlInput || null;

  const selectedProductDataStr = String(
    form.get("selectedProductData") || "{}",
  );
  const selectedVariantDataStr = String(
    form.get("selectedVariantData") || "{}",
  );
  let selectedProductData: ShopifyProduct | null = null;
  let selectedVariantData: IShopifyVariant | null = null;

  try {
    selectedProductData = JSON.parse(selectedProductDataStr);
    selectedVariantData = JSON.parse(selectedVariantDataStr);
  } catch (e) {
    console.error("Error parsing selected data:", e);
  }

  const finalPrice = price || selectedVariantData?.price || null;

  if (
    selectedVariantData &&
    !productImageUrl &&
    selectedProductData?.images?.[0]?.url
  ) {
    productImageUrl = selectedProductData.images[0].url;
  }

  let images: string[] = [];
  let shopifyDescription: string | null = null;

  if (selectedProductData) {
    images = selectedProductData.images?.map((img: any) => img.url) || [];
    shopifyDescription = selectedProductData.description || "";
  }

  try {
    await createCampaign({
      shop: session.shop,
      title,
      status,
      placement,
      targetType,
      selectedCollections:
        selectedCollections.length > 0 ? selectedCollections : [],
      targetProducts: targetProducts.length > 0 ? targetProducts : [],
      selectedVariantId: selectedVariant || null,
      selectedProductId: selectedProduct || null,
      selectedProductData: selectedProductData
        ? JSON.stringify(selectedProductData)
        : null,
      selectedVariantData: selectedVariantData
        ? JSON.stringify(selectedVariantData)
        : null,
      heading: heading || null,
      description: description || null,
      imageUrl: productImageUrl,
      price: finalPrice,
      showPrice,
      showImage,
      preCheck,
      backgroundColor,
      borderColor,
      backgroundColorActive,
      padding,
      borderRadius,
      imageSize,
      images,
      shopifyDescription,
      metadata: JSON.stringify({
        checkboxStyle: {
          backgroundColor: checkboxBackgroundColor,
          borderColor: checkboxBorderColor,
          activeColor: checkboxActiveColor,
          size: checkboxSize,
        },
        fontSettings: {
          size: fontSize,
          color: fontColor,
          weight: fontWeight,
        },
        advanced: { createdAt: new Date().toISOString() },
      }),
    });

    const isUrlAuth = !request.headers.get("authorization");
    const redirectUrl = isUrlAuth
      ? `/app?${new URLSearchParams(new URL(request.url).search)}`
      : "/app";
    return redirect(redirectUrl);
  } catch (error: any) {
    console.error("Create campaign error:", error);
    return json(
      { error: error?.message || "Failed to create campaign" },
      { status: 500 },
    );
  }
};

export default function NewCampaign() {
  const { products, collections, hasNextPage, endCursor } =
    useLoaderData<LoaderData>();
  const actionData = useActionData<{ error?: string }>();
  const nav = useNavigation();

  const [showErrorBanner, setShowErrorBanner] = useState(false);

  useEffect(() => {
    if (actionData?.error) {
      setShowErrorBanner(true);
      const timer = setTimeout(() => {
        setShowErrorBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionData?.error]);

  const [formData, setFormData] = useState({
    title: "",
    status: "Draft" as "Active" | "Draft",
    placement: "product" as "product" | "cart" | "home",
    targetType: "all",
    selectedCollections: [] as string[],
    selectedProducts: [] as string[],
    selectedVariant: "",
    selectedProduct: "",
    selectedProductData: "",
    selectedVariantData: "",
    price: "",
    heading: "",
    description: "Check out this great product!",
    imageUrl: "",
    showPrice: true,
    showImage: true,
    preCheck: false,
    showVariantSelector: false,
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E3E5",
    backgroundColorActive: "#0066CC",
    padding: 16,
    borderRadius: 8,
    imageSize: 50,
    checkboxBackgroundColor: "#FFFFFF",
    checkboxBorderColor: "#E1E3E5",
    checkboxActiveColor: "#0066CC",
    checkboxSize: 20,
    fontSize: 14,
    fontColor: "#000000",
    fontWeight: "normal",
    images: [] as string[],
    shopifyDescription: "",
  });

  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [targetProductSelectorOpen, setTargetProductSelectorOpen] =
    useState(false);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedVariantData = (() => {
    try {
      return formData.selectedVariantData
        ? JSON.parse(formData.selectedVariantData)
        : null;
    } catch {
      return null;
    }
  })();

  const handleProductSelect = (
    product: ShopifyProduct,
    variant: IShopifyVariant,
  ) => {
    updateField("selectedProduct", product.id);
    updateField("selectedVariant", variant.id);
    updateField("selectedProductData", JSON.stringify(product));
    updateField("selectedVariantData", JSON.stringify(variant));
    updateField("price", variant.price);

    updateField("images", product.images?.map((img: any) => img.url) || []);
    updateField("shopifyDescription", product.description || "");

    if (product.images?.[0]?.url) {
      updateField("imageUrl", product.images[0].url);
    }

    if (product.title) {
      updateField("heading", product.title);
    }
  };

  const handleTargetProductsSelect = (
    selectedItems: { productId: string; variantId?: string }[],
  ) => {
    const productIds = selectedItems.map((item) => item.productId);
    updateField("selectedProducts", productIds);
  };

  if (nav.state === "loading") {
    return (
      <Page title="Create Campaign">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
          }}
        >
          <Spinner accessibilityLabel="Loading campaign data" size="large" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Create Campaign"
      primaryAction={{
        content: nav.state === "submitting" ? "Creating..." : "Create Campaign",
        onAction: () =>
          (
            document.getElementById("campaign-form") as HTMLFormElement | null
          )?.requestSubmit(),
        loading: nav.state === "submitting",
      }}
      secondaryActions={[
        {
          content: "Save as Draft",
          onAction: () => {
            updateField("status", "Draft");
            setTimeout(() => {
              (
                document.getElementById(
                  "campaign-form",
                ) as HTMLFormElement | null
              )?.requestSubmit();
            }, 100);
          },
        },
      ]}
    >
      <Layout>
        <Layout.Section variant="oneHalf">
          <CampaignForm
            formData={formData}
            updateField={updateField}
            collections={collections}
            selectedVariantData={selectedVariantData}
            productSelectorOpen={productSelectorOpen}
            setProductSelectorOpen={setProductSelectorOpen}
            handleProductSelect={handleProductSelect}
            targetProductSelectorOpen={targetProductSelectorOpen}
            setTargetProductSelectorOpen={setTargetProductSelectorOpen}
            handleTargetProductsSelect={handleTargetProductsSelect}
            initialProducts={products}
            initialCursor={endCursor}
            initialHasNextPage={hasNextPage}
            error={actionData?.error}
            showErrorBanner={showErrorBanner}
            onDismissError={() => setShowErrorBanner(false)}
          />
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <CampaignPreview formData={formData} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
