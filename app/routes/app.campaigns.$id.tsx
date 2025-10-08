import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useNavigation, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Page, Layout, Modal, Text, Spinner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { fetchProducts, fetchAllCollections } from "../hooks/product";
import CampaignForm from "../components/CampaignForm";
import { CampaignPreview } from "../components/CampaignPreview";
import {
  deleteCampaignById,
  getCampaignById,
  updateCampaignById,
} from "app/db/actions/campaign";
import type {
  ICampaign,
  ICampaignPlacement,
  ICampaignStatus,
} from "app/types/campaigns";
import type {
  ShopifyCollection,
  ShopifyProduct,
  IShopifyVariant,
} from "app/types/shopify";

type LoaderData = {
  campaign: ICampaign;
  products: ShopifyProduct[];
  collections: ShopifyCollection[];
  hasNextPage: boolean;
  endCursor: string | null;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  if (!params.id) {
    throw new Response("Campaign ID is required", { status: 400 });
  }

  try {
    const campaign = await getCampaignById(params.id, session.shop);

    if (!campaign) {
      throw new Response("Campaign not found", { status: 404 });
    }

    const { products, hasNextPage, endCursor } = await fetchProducts(admin, 50);
    const collections = await fetchAllCollections(admin);

    return json<LoaderData>({
      campaign: {
        ...campaign,
        selectedCollections: campaign.selectedCollections || [],
        createdAt: new Date(campaign.createdAt).toISOString(),
        updatedAt: new Date(campaign.updatedAt).toISOString(),
      },
      products,
      collections,
      hasNextPage,
      endCursor,
    });
  } catch (error) {
    console.error("Loader error:", error);
    throw new Response("Failed to load campaign", { status: 500 });
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const form = await request.formData();

  if (!params.id) {
    return json({ error: "Campaign ID is required" }, { status: 400 });
  }

  if (form.get("_action") === "delete") {
    try {
      const deletedCount = await deleteCampaignById(params.id);
      if (!deletedCount) {
        return json({ error: "Campaign not found" }, { status: 404 });
      }

      const isUrlAuth = !request.headers.get("authorization");
      const redirectUrl = isUrlAuth
        ? `/app?${new URLSearchParams(new URL(request.url).search)}`
        : "/app";
      return redirect(redirectUrl);
    } catch (error: any) {
      console.error("Delete error:", error);
      return json(
        { error: error?.message || "Failed to delete campaign" },
        { status: 500 },
      );
    }
  }

  const title = String(form.get("title") || "").trim();
  if (!title) {
    return json({ error: "Title is required" }, { status: 400 });
  }

  const status = String(form.get("status") || "Draft") as ICampaignStatus;
  const placement = String(
    form.get("placement") || "product",
  ) as ICampaignPlacement;
  const targetType = String(form.get("targetType") || "all");

  const selectedCollections = JSON.parse(
    String(form.get("selectedCollections") || "[]"),
  ) as string[];
  const targetProducts: string[] = [];
  for (let i = 0; form.get(`targetProducts[${i}]`); i++) {
    targetProducts.push(String(form.get(`targetProducts[${i}]`)));
  }

  const selectedVariantId = String(form.get("selectedVariantId") || "");
  const selectedProductHandle = String(form.get("selectedProductHandle") || "");
  const heading = String(form.get("heading") || "");
  const description = String(form.get("description") || "");

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

  try {
    await updateCampaignById(params.id, {
      title,
      status,
      placement,
      targetType,
      selectedCollections:
        selectedCollections.length > 0 ? selectedCollections : [],
      targetProducts: targetProducts.length > 0 ? targetProducts : [],
      selectedVariantId: selectedVariantId || null,
      selectedProductHandle: selectedProductHandle || null,
      heading: heading || null,
      description: description || null,
      showPrice,
      showImage,
      preCheck,
      backgroundColor,
      borderColor,
      backgroundColorActive,
      padding,
      borderRadius,
      imageSize,
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
        advanced: { updatedAt: new Date().toISOString() },
      }),
    });

    return json({ success: true, message: "Campaign updated successfully" });
  } catch (error: any) {
    console.error("Update error:", error);
    return json(
      { error: error?.message || "Failed to update campaign" },
      { status: 500 },
    );
  }
};

export default function CampaignDetail() {
  const { campaign, products, collections, hasNextPage, endCursor } =
    useLoaderData<LoaderData>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();

  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    if (actionData && "error" in actionData) {
      setShowErrorBanner(true);
      const timer = setTimeout(() => setShowErrorBanner(false), 5000);
      return () => clearTimeout(timer);
    }
    if (actionData && "success" in actionData) {
      setShowSuccessBanner(true);
      const timer = setTimeout(() => setShowSuccessBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  let metadata = null;
  try {
    metadata = campaign.metadata ? JSON.parse(campaign.metadata) : null;
  } catch (e) {
    console.error("Error parsing metadata:", e);
  }

  const parsedTargetProducts = campaign.targetProducts || [];

  const [formData, setFormData] = useState({
    title: campaign.title,
    status: campaign.status as "Active" | "Draft",
    placement: campaign.placement,
    targetType: campaign.targetType || "all",
    selectedCollections: campaign.selectedCollections || [],
    selectedProducts: parsedTargetProducts,
    selectedVariantId: campaign.selectedVariantId || "",
    selectedProductHandle: campaign.selectedProductHandle || "",
    heading: campaign.heading || "",
    description: campaign.description || "",
    showPrice: campaign.showPrice,
    showImage: campaign.showImage,
    preCheck: campaign.preCheck,
    showVariantSelector: campaign.showVariantSelector,
    backgroundColor: campaign.backgroundColor,
    borderColor: campaign.borderColor,
    backgroundColorActive: campaign.backgroundColorActive,
    padding: campaign.padding,
    borderRadius: campaign.borderRadius,
    imageSize: campaign.imageSize,
    checkboxBackgroundColor:
      metadata?.checkboxStyle?.backgroundColor || "#FFFFFF",
    checkboxBorderColor: metadata?.checkboxStyle?.borderColor || "#E1E3E5",
    checkboxActiveColor: metadata?.checkboxStyle?.activeColor || "#0066CC",
    checkboxSize: metadata?.checkboxStyle?.size || 20,
    fontSize: metadata?.fontSettings?.size || 14,
    fontColor: metadata?.fontSettings?.color || "#000000",
    fontWeight: metadata?.fontSettings?.weight || "normal",
  });

  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [targetProductSelectorOpen, setTargetProductSelectorOpen] =
    useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductSelect = (
    product: ShopifyProduct,
    variant: IShopifyVariant,
  ) => {
    updateField("selectedProductHandle", product.handle);
    updateField("selectedVariantId", variant.id);

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
      <Page title="Edit Campaign">
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
      title={`Campaign: ${campaign.title}`}
      subtitle={`Created: ${new Date(campaign.createdAt).toLocaleDateString()}`}
      primaryAction={{
        content: nav.state === "submitting" ? "Saving..." : "Save Changes",
        onAction: () =>
          (
            document.getElementById("campaign-form") as HTMLFormElement | null
          )?.requestSubmit(),
        loading: nav.state !== "idle",
      }}
      secondaryActions={[
        {
          content: "Back to Campaigns",
          onAction: () => window.history.back(),
        },
        {
          content: campaign.status === "Active" ? "Deactivate" : "Activate",
          onAction: () => {
            updateField(
              "status",
              campaign.status === "Active" ? "Draft" : "Active",
            );
            setTimeout(() => {
              (
                document.getElementById(
                  "campaign-form",
                ) as HTMLFormElement | null
              )?.requestSubmit();
            }, 100);
          },
        },
        {
          content: "Delete",
          destructive: true,
          onAction: () => setConfirmDeleteOpen(true),
        },
      ]}
    >
      <form method="post" id="delete-form">
        <input type="hidden" name="_action" value="delete" />
      </form>

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete campaign?"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: () =>
            (
              document.getElementById("delete-form") as HTMLFormElement | null
            )?.requestSubmit(),
        }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setConfirmDeleteOpen(false) },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            This action cannot be undone. Are you sure you want to delete the
            campaign "{campaign.title}"?
          </Text>
        </Modal.Section>
      </Modal>

      <Layout>
        <Layout.Section variant="oneHalf">
          <CampaignForm
            formData={formData}
            updateField={updateField}
            collections={collections}
            productSelectorOpen={productSelectorOpen}
            setProductSelectorOpen={setProductSelectorOpen}
            handleProductSelect={handleProductSelect}
            targetProductSelectorOpen={targetProductSelectorOpen}
            setTargetProductSelectorOpen={setTargetProductSelectorOpen}
            handleTargetProductsSelect={handleTargetProductsSelect}
            initialProducts={products}
            initialCursor={endCursor}
            initialHasNextPage={hasNextPage}
            error={
              actionData && "error" in actionData ? actionData.error : undefined
            }
            showErrorBanner={showErrorBanner}
            onDismissError={() => setShowErrorBanner(false)}
            successMessage={
              actionData && "success" in actionData
                ? actionData.message
                : undefined
            }
            showSuccessBanner={showSuccessBanner}
            onDismissSuccess={() => setShowSuccessBanner(false)}
          />
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <CampaignPreview formData={formData} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
