import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useLocation,
  useSearchParams,
  useNavigate,
} from "@remix-run/react";
import { useCallback, useMemo, useState } from "react";
import { Page, Card, Button, TextField, Tabs } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getCampaigns, countCampaigns } from "../db/actions/campaign";
import { CampaignTable } from "app/components/CampaignTable";
import type { ICampaign } from "app/types/campaigns";

type LoaderData = {
  campaigns: ICampaign[];
  totals: { all: number; active: number; draft: number };
  filters: { status: "all" | "active" | "draft"; q: string };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const status = (url.searchParams.get("status") || "all").toLowerCase() as
    | "all"
    | "active"
    | "draft";
  const q = (url.searchParams.get("q") || "").trim();

  const where: any = { shop: session.shop };
  if (status === "active") where.status = "Active";
  if (status === "draft") where.status = "Draft";
  if (q) where.title = { $regex: q, $options: "i" };

  const [rows, all, active, draft] = await Promise.all([
    getCampaigns(where),
    countCampaigns({ shop: session.shop }),
    countCampaigns({ shop: session.shop, status: "Active" }),
    countCampaigns({ shop: session.shop, status: "Draft" }),
  ]);

  const campaigns: ICampaign[] = rows.map((r: any) => ({
    ...r,
    id: r._id.toString(),
    shop: r.shop,
    title: r.title,
    status: r.status || "Draft",
    targetType: r.targetType || "product",
    selectedCollectionId: r.selectedCollectionId || null,
    targetProducts: r.targetProducts || null,
    selectedVariantId: r.selectedVariantId || null,
    selectedProductId: r.selectedProductId || null,
    heading: r.heading || null,
    description: r.description || null,
    imageUrl: r.imageUrl || null,
    price: r.price || null,
    showPrice: r.showPrice || false,
    preCheck: r.preCheck || false,
    showVariantSelector: r.showVariantSelector || false,
    backgroundColor: r.backgroundColor || "#FFFFFF",
    borderColor: r.borderColor || "#000000",
    backgroundColorActive: r.backgroundColorActive || "#0066CCFF",
    padding: r.padding || 50,
    borderRadius: r.borderRadius || 50,
    imageSize: r.imageSize || 50,
    metadata: r.metadata || null,
    createdAt: new Date(r.createdAt).toISOString(),
    updatedAt: new Date(r.updatedAt).toISOString(),
  }));

  return json<LoaderData>({
    campaigns,
    totals: { all, active, draft },
    filters: { status, q },
  });
};

export default function AppIndex() {
  const { campaigns, totals, filters } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(filters.q);
  const navigate = useNavigate();

  const tabs = useMemo(
    () => [
      { id: "all", content: `All (${totals.all})` },
      { id: "active", content: `Active (${totals.active})` },
      { id: "draft", content: `Draft (${totals.draft})` },
    ],
    [totals],
  );
  const selected = tabs.findIndex((t) => t.id === filters.status);

  const applySearch = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (search) next.set("q", search);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  }, [search, searchParams, setSearchParams]);

  const onTabSelect = useCallback(
    (index: number) => {
      const next = new URLSearchParams(searchParams);
      next.set("status", tabs[index].id);
      setSearchParams(next, { replace: true });
    },
    [tabs, searchParams, setSearchParams],
  );

  return (
    <Page
      title="Campaigns"
      primaryAction={{
        content: "Create Upsell",
        onAction: () => {
          const redirectUrl = `/app/campaigns/new${location.search}`;
          navigate(redirectUrl);
        },
      }}
    >
      <Card>
        <div
          style={{
            padding: "16px 20px 0",
            width: "100%",
            overflow: "visible",
          }}
        >
          <Tabs
            tabs={tabs}
            selected={selected < 0 ? 0 : selected}
            onSelect={onTabSelect}
            fitted={false}
          />
        </div>

        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            alignItems: "center",
            borderTop: "1px solid #e1e3e5",
            marginTop: 16,
          }}
        >
          <div style={{ width: 300 }}>
            <TextField
              label=""
              placeholder="Search campaigns..."
              value={search}
              onChange={setSearch}
              onBlur={applySearch}
              autoComplete="off"
              clearButton
              onClearButtonClick={() => {
                setSearch("");
                const next = new URLSearchParams(searchParams);
                next.delete("q");
                setSearchParams(next, { replace: true });
              }}
            />
          </div>
          <Button onClick={applySearch} variant="primary">
            Search
          </Button>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>

        <div
          style={{
            padding: "0 20px 20px",
            minHeight: 200,
          }}
        >
          <CampaignTable items={campaigns} searchSuffix={location.search} />
        </div>
      </Card>
    </Page>
  );
}
