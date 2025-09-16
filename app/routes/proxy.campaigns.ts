import { json, type ActionFunction } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getActiveCampaignsByShop } from "../db/actions/campaign";
import type { ICampaign } from "app/types/campaigns";

export const loader = async ({ request }: any) => {
  const { session, storefront } = await authenticate.public.appProxy(request);

  if (!session || !storefront) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id") || "";
  const collectionId = url.searchParams.get("collection_id") || "";
  const shop = url.searchParams.get("shop") || "";

  const pageType = (
    url.searchParams.get("page_type") || "product"
  ).toLowerCase();

  try {
    const campaigns = await getActiveCampaignsByShop(shop);

    const normalizeId = (id: string): string => {
      if (id.startsWith("gid://shopify/")) {
        return id.split("/").pop() || id;
      }
      return id;
    };

    const matchesId = (targetId: string, checkId: string): boolean => {
      const normalizedTarget = normalizeId(targetId);
      const normalizedCheck = normalizeId(checkId);
      return normalizedTarget === normalizedCheck;
    };

    const filtered: ICampaign[] = campaigns
      .filter((campaign: ICampaign) => {
        if (campaign.placement !== pageType) return false;

        if (campaign.targetType === "all") return true;

        if (campaign.targetType === "collection") {
          if (!collectionId) return false;

          if (campaign.selectedCollectionId) {
            return matchesId(campaign.selectedCollectionId, collectionId);
          }

          if (campaign.targetProducts?.length) {
            return campaign.targetProducts.some((targetCollectionId: string) =>
              matchesId(targetCollectionId, collectionId),
            );
          }

          return false;
        }

        if (campaign.targetType === "product") {
          if (!productId) return false;

          if (!campaign.targetProducts?.length) return false;
          return campaign.targetProducts.some((targetProductId: string) =>
            matchesId(targetProductId, productId),
          );
        }

        return false;
      })
      .map((campaign: any) => {
        let parsedMetadata = null;
        try {
          parsedMetadata = campaign.metadata
            ? JSON.parse(campaign.metadata)
            : null;
        } catch (e) {
          console.error(
            "Error parsing metadata for campaign:",
            campaign._id,
            e,
          );
        }

        return {
          id: campaign._id?.toString() || campaign.id,
          shop: campaign.shop,
          title: campaign.title,
          heading: campaign.heading,
          description: campaign.description,
          imageUrl: campaign.imageUrl,
          status: campaign.status,
          placement: campaign.placement,
          targetType: campaign.targetType,
          selectedCollectionId: campaign.selectedCollectionId,
          targetProducts: campaign.targetProducts || [],
          selectedVariantId: campaign.selectedVariantId,
          selectedProductId: campaign.selectedProductId,
          showPrice: campaign.showPrice,
          price: campaign.price,
          preCheck: campaign.preCheck,
          showVariantSelector: campaign.showVariantSelector,
          backgroundColor: campaign.backgroundColor,
          borderColor: campaign.borderColor,
          backgroundColorActive: campaign.backgroundColorActive,
          padding: campaign.padding,
          borderRadius: campaign.borderRadius,
          imageSize: campaign.imageSize,
          showImage: campaign.showImage,
          metadata: parsedMetadata,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        };
      });

    return json({
      campaigns: filtered,
      debug: {
        productId: productId ? normalizeId(productId) : null,
        collectionId: collectionId ? normalizeId(collectionId) : null,
        pageType,
        totalCampaigns: campaigns.length,
        filteredCampaigns: filtered.length,
      },
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return json(
      {
        error: "Failed to fetch campaigns",
        campaigns: [],
      },
      { status: 500 },
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const action = formData.get("_action");

    switch (action) {
      case "track_impression":
        return json({ success: true, message: "Impression tracked" });

      case "track_conversion":
        return json({ success: true, message: "Conversion tracked" });

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Proxy action error:", error);
    return json({ error: "Action failed" }, { status: 500 });
  }
};
