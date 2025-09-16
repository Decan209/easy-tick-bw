import { useLoaderData } from "@remix-run/react";
import type { ShopifyCollection, ShopifyProduct } from "app/types/shopify";

export async function fetchProducts(
  admin: any,
  first: number = 50,
  cursor: string | null = null,
  search: string = "",
) {
  try {
    const response = await admin.graphql(
      `
      query GetProducts($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            title
            handle
            images(first: 1) {
              nodes {
                url
                altText
              }
            }
            variants(first: 10) {
              nodes {
                id
                title
                price
                compareAtPrice
                inventoryQuantity
              }
            }
          }
        }
      }
      `,
      {
        variables: {
          first,
          after: cursor,
          query: search && search.trim() ? search.trim() : null,
        },
      },
    );

    const data = await response.json();

    if (data.errors) {
      return { products: [], hasNextPage: false, endCursor: null };
    }

    const rawProducts = data.data?.products?.nodes || [];
    const transformedProducts: ShopifyProduct[] = rawProducts.map(
      (product: any) => ({
        id: product.id,
        title: product.title || "Untitled Product",
        handle: product.handle || "",
        images: product.images?.nodes || [],
        variants: product.variants?.nodes || [],
      }),
    );

    return {
      products: transformedProducts,
      hasNextPage: data.data.products.pageInfo.hasNextPage,
      endCursor: data.data.products.pageInfo.endCursor,
    };
  } catch (error) {
    console.error("Error in fetchProducts:", error);
    return { products: [], hasNextPage: false, endCursor: null };
  }
}

export async function fetchAllCollections(admin: any) {
  let collections: any[] = [];
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage) {
    const response: Response = await admin.graphql(
      `
      query GetCollections($first: Int!, $after: String) {
        collections(first: $first, after: $after) {
          pageInfo { hasNextPage, endCursor }
          nodes { id title handle description }
        }
      }
      `,
      { variables: { first: 100, after: endCursor } },
    );
    const data = await response.json();
    const nodes = data.data?.collections?.nodes || [];
    collections = collections.concat(nodes);
    hasNextPage = data.data?.collections?.pageInfo?.hasNextPage;
    endCursor = data.data?.collections?.pageInfo?.endCursor;
  }
  return collections;
}

export async function fetchProductById(admin: any, productId: string) {
  try {
    const response: Response = await admin.graphql(
      `
      query GetProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          description
          images(first: 5) {
            nodes {
              url
              altText
            }
          }
          variants(first: 100) {
            nodes {
              id
              title
              price
              compareAtPrice
              inventoryQuantity
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    `,
      {
        variables: { id: productId },
      },
    );

    const data = await response.json();
    if (data.errors) {
      return null;
    }

    const product = data.data?.product;
    if (!product) return null;

    return {
      ...product,
      images: product.images?.nodes || [],
      variants: product.variants?.nodes || [],
    };
  } catch (error) {
    console.error("Error in fetchProductById:", error);
    return null;
  }
}

export function useProducts() {
  const data = useLoaderData<{ products: ShopifyProduct[] }>();
  return data.products || [];
}

export function useCollections() {
  const data = useLoaderData<{ collections: ShopifyCollection[] }>();
  return data.collections || [];
}

export function createProductOptions(products: ShopifyProduct[]) {
  if (!Array.isArray(products)) {
    console.warn("createProductOptions: products is not an array");
    return [];
  }

  return products.map((product) => ({
    label: product.title,
    value: product.id,
  }));
}

export function createVariantOptions(products: ShopifyProduct[]) {
  if (!Array.isArray(products)) {
    console.warn("createVariantOptions: products is not an array");
    return [];
  }

  return products.flatMap((product) => {
    if (!product || !Array.isArray(product.variants)) {
      console.warn("Product missing variants array:", product);
      return [];
    }

    return product.variants.map((variant) => ({
      label: `${product.title} - ${variant.title} ($${variant.price})`,
      value: variant.id,
      product: product.id,
    }));
  });
}

export function createCollectionOptions(collections: ShopifyCollection[]) {
  if (!Array.isArray(collections)) {
    console.warn("createCollectionOptions: collections is not an array");
    return [];
  }

  return collections.map((collection) => ({
    label: collection.title,
    value: collection.id,
  }));
}

export function filterProductsByTitle(
  products: ShopifyProduct[],
  query: string,
) {
  if (!Array.isArray(products) || !query.trim()) return products;

  return products.filter((product) =>
    product.title.toLowerCase().includes(query.toLowerCase()),
  );
}

export function getProductsWithInventory(
  products: ShopifyProduct[],
  minQty: number = 1,
) {
  if (!Array.isArray(products)) return [];

  return products.filter((product) =>
    product.variants.some((variant) => variant.inventoryQuantity >= minQty),
  );
}
