import { useEffect, useState } from "react";
import {
  Modal,
  Text,
  Scrollable,
  LegacyStack,
  Button,
  Spinner,
} from "@shopify/polaris";
import { SearchBar } from "../SearchBar";
import { ProductCard } from "../ProductCard";
import type { IShopifyVariant, ShopifyProduct } from "app/types/shopify";

interface ProductSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: ShopifyProduct, variant: IShopifyVariant) => void;
  selectedProductId?: string;
  selectedVariantId?: string;
  initialProducts?: ShopifyProduct[];
  initialCursor?: string | null;
  initialHasNextPage?: boolean;
}

const PAGE_SIZE = 50;

export default function ProductSelector({
  open,
  onClose,
  onSelect,
  selectedProductId,
  selectedVariantId,
  initialProducts = [],
  initialCursor = null,
  initialHasNextPage = true,
}: ProductSelectorProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>(initialProducts);
  const [searchResults, setSearchResults] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [query, setQuery] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [temp, setTemp] = useState<{
    productId: string;
    variantId: string;
  } | null>(null);

  const resetState = () => {
    setProducts(initialProducts);
    setSearchResults([]);
    setCursor(initialCursor);
    setHasNextPage(initialHasNextPage);
    setQuery("");
    setOnlyInStock(false);
    setTemp(null);
  };

  useEffect(() => {
    if (open) {
      resetState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialProducts, initialCursor, initialHasNextPage]);

  useEffect(() => {
    if (open) {
      if (query) {
        loadProducts(true, query, true);
      } else {
        loadProducts(true, "", false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  const loadProducts = async (
    initial = false,
    search = "",
    isSearch = false,
  ) => {
    if (loading || (!hasNextPage && !initial)) return;
    setLoading(true);
    try {
      const params = [
        `limit=${PAGE_SIZE}`,
        initial ? "" : cursor ? `cursor=${cursor}` : "",
        search ? `search=${encodeURIComponent(search)}` : "",
      ]
        .filter(Boolean)
        .join("&");
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (isSearch) {
        setSearchResults((prev) =>
          initial ? data.products : [...prev, ...data.products],
        );
      } else {
        setProducts((prev) =>
          initial ? data.products : [...prev, ...data.products],
        );
      }
      setHasNextPage(data.hasNextPage);
      setCursor(data.endCursor);
    } catch (err) {
      console.error("Error loading products:", err);
      setHasNextPage(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (products.length > 0 || searchResults.length > 0) {
      const currentProducts = query ? searchResults : products;
      if (selectedVariantId) {
        const p = currentProducts.find((pr) =>
          pr.variants.some((v) => v.id === selectedVariantId),
        );
        if (p) {
          setTemp({ productId: p.id, variantId: selectedVariantId });
          return;
        }
      } else if (selectedProductId) {
        const p = currentProducts.find((pr) => pr.id === selectedProductId);
        if (p) {
          setTemp({ productId: p.id, variantId: "" });
          return;
        }
      }
    }
    setTemp(null);
  }, [selectedProductId, selectedVariantId, products, searchResults, query]);

  const displayProducts = query ? searchResults : products;
  const filtered = displayProducts.filter((p) =>
    onlyInStock ? p.variants.some((v) => v.inventoryQuantity > 0) : true,
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 80 &&
      hasNextPage &&
      !loading
    ) {
      loadProducts(false, query, !!query);
    }
  };

  const confirm = () => {
    if (temp) {
      const product = displayProducts.find((p) => p.id === temp.productId);
      if (!product) return;

      const variant = temp.variantId
        ? product.variants.find((v) => v.id === temp.variantId)
        : product.variants[0];

      if (!variant) return;

      if (query && !products.some((p) => p.id === product.id)) {
        setProducts((prev) => [...prev, product]);
      }
      onSelect(product, variant);
    }
    cleanup();
  };

  const cleanup = () => {
    onClose();
    resetState();
  };

  const selectedCount = temp ? 1 : 0;

  return (
    <Modal
      open={open}
      onClose={cleanup}
      title="Select a variant"
      primaryAction={{ content: "Select", onAction: confirm, disabled: !temp }}
      secondaryActions={[{ content: "Cancel", onAction: cleanup }]}
    >
      <Modal.Section>
        <LegacyStack vertical>
          <SearchBar
            query={query}
            setQuery={setQuery}
            onlyInStock={onlyInStock}
            setOnlyInStock={setOnlyInStock}
          />

          <Text as="p" variant="bodyMd">
            {selectedCount} variant selected
          </Text>

          <div
            style={{
              height: 440,
              border: "1px solid #e1e3e5",
              borderRadius: 8,
              position: "relative",
            }}
          >
            <Scrollable style={{ height: "100%" }} onScroll={handleScroll}>
              <div style={{ padding: 12 }}>
                <LegacyStack vertical spacing="tight">
                  {filtered.length > 0 ? (
                    filtered.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onPickProduct={(productId) => {
                          setTemp({ productId, variantId: "" });
                        }}
                        onPickVariant={(productId, variantId) => {
                          setTemp({ productId, variantId });
                        }}
                        tempSelected={temp}
                        showVariants={true}
                      />
                    ))
                  ) : (
                    <Text as="p" variant="bodySm" tone="subdued">
                      No products available.
                    </Text>
                  )}
                  {loading && (
                    <div style={{ textAlign: "center", padding: 12 }}>
                      <Spinner size="small" />
                    </div>
                  )}
                  {!loading && hasNextPage && (
                    <div style={{ textAlign: "center", padding: 12 }}>
                      <Button
                        onClick={() => loadProducts(false, query, !!query)}
                        size="slim"
                      >
                        {loading ? "Loading..." : "Load more products"}
                      </Button>
                    </div>
                  )}
                </LegacyStack>
              </div>
            </Scrollable>
          </div>
        </LegacyStack>
      </Modal.Section>
    </Modal>
  );
}
