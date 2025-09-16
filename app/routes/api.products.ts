import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { fetchProducts } from "../hooks/product";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const search = url.searchParams.get("search") || "";

  try {
    const { products, hasNextPage, endCursor } = await fetchProducts(
      admin,
      limit,
      cursor,
      search,
    );
    return json({ products, hasNextPage, endCursor });
  } catch (error) {
    console.error("API error:", error);
    return json(
      { products: [], hasNextPage: false, endCursor: null },
      { status: 500 },
    );
  }
};
