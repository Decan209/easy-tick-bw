import {
  Modal,
  Text,
  LegacyStack,
  Scrollable,
  Button,
  Spinner,
  Badge,
} from "@shopify/polaris";
import { useEffect, useMemo, useState, useCallback } from "react";
import { SearchBar } from "../SearchBar";
import { ProductCard } from "../ProductCard";
import type { ShopifyProduct } from "app/types/shopify";

interface MultiProductSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (
    selectedItems: { productId: string; variantId?: string }[],
  ) => void;
  selectedItems: { productId: string; variantId?: string }[];
  initialProducts?: ShopifyProduct[];
  initialCursor?: string | null;
  initialHasNextPage?: boolean;
}

const PAGE_SIZE = 50;

function MultiProductSelector({
  open,
  onClose,
  onSelect,
  selectedItems,
  initialProducts = [],
  initialCursor = null,
  initialHasNextPage = true,
}: MultiProductSelectorProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const normalizeProductId = useCallback((id: string) => {
    if (id?.startsWith("gid://shopify/Product/")) {
      return id.split("/").pop() || id;
    }
    return id;
  }, []);

  const findProductById = useCallback(
    (productId: string) => {
      const normalizedSearchId = normalizeProductId(productId);
      return products.find((product) => {
        const normalizedProductId = normalizeProductId(product.id);
        return normalizedProductId === normalizedSearchId;
      });
    },
    [products, normalizeProductId],
  );

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setTempSelected(selectedItems.map((item) => item.productId));

      if (!isInitialized && products.length === 0) {
        loadProducts(true);
        setIsInitialized(true);
      }
    }
  }, [open, selectedItems]);

  const loadProducts = async (initial = false) => {
    if (loading || (!hasNextPage && !initial)) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/products?limit=${PAGE_SIZE}${cursor ? `&cursor=${cursor}` : ""}`,
      );
      const data = await res.json();

      setProducts((prev) =>
        initial ? data.products : [...prev, ...data.products],
      );
      setHasNextPage(data.hasNextPage);
      setCursor(data.endCursor);
    } catch (err) {
      console.error("Failed to load products:", err);
      setHasNextPage(false);
    }
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((product) =>
      product.title.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 80 &&
      hasNextPage &&
      !loading
    ) {
      loadProducts();
    }
  };

  const handleProductToggle = useCallback(
    (productId: string) => {
      setTempSelected((prev) => {
        const normalizedProductId = normalizeProductId(productId);
        const exists = prev.some(
          (id) => normalizeProductId(id) === normalizedProductId,
        );

        if (exists) {
          return prev.filter(
            (id) => normalizeProductId(id) !== normalizedProductId,
          );
        }
        return [...prev, productId];
      });
    },
    [normalizeProductId],
  );

  const handleConfirm = () => {
    const selectedObjects = tempSelected.map((productId) => ({ productId }));
    onSelect(selectedObjects);
    onClose();
  };

  const handleCancel = () => {
    setSearchQuery("");
    setTempSelected(selectedItems.map((item) => item.productId));
    onClose();
  };

  const getDisplayName = useCallback(
    (productId: string) => {
      const product = findProductById(productId);
      if (product) return product.title;
      return loading ? "Loading..." : "Product not loaded";
    },
    [findProductById, loading],
  );

  const isProductSelected = useCallback(
    (productId: string) => {
      const normalizedProductId = normalizeProductId(productId);
      return tempSelected.some(
        (id) => normalizeProductId(id) === normalizedProductId,
      );
    },
    [tempSelected, normalizeProductId],
  );

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="Select target products"
      primaryAction={{
        content: "Select",
        onAction: handleConfirm,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: handleCancel,
        },
      ]}
    >
      <Modal.Section>
        <LegacyStack vertical>
          <SearchBar
            query={searchQuery}
            setQuery={setSearchQuery}
            onlyInStock={false}
            setOnlyInStock={() => {}}
          />

          <LegacyStack vertical spacing="tight">
            <Text as="p" variant="bodyMd">
              Selected products ({tempSelected.length}):
            </Text>
            {tempSelected.length === 0 ? (
              <Text as="p" variant="bodySm" tone="subdued">
                No products selected
              </Text>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {tempSelected.map((productId, index) => {
                  const product = findProductById(productId);
                  if (!product && !loading) return null;
                  return (
                    <Badge key={`${normalizeProductId(productId)}-${index}`}>
                      {getDisplayName(productId)}
                    </Badge>
                  );
                })}
              </div>
            )}
          </LegacyStack>

          <div
            style={{
              height: 400,
              border: "1px solid #e1e3e5",
              borderRadius: 8,
              position: "relative",
            }}
          >
            <Scrollable style={{ height: "100%" }} onScroll={handleScroll}>
              <div style={{ padding: 16 }}>
                <LegacyStack vertical spacing="tight">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onPickProduct={handleProductToggle}
                      onPickVariant={() => {}}
                      tempSelected={
                        isProductSelected(product.id)
                          ? { productId: product.id }
                          : null
                      }
                      showVariants={false}
                    />
                  ))}
                  {loading && (
                    <div style={{ textAlign: "center", padding: 12 }}>
                      <Spinner size="small" />
                    </div>
                  )}
                  {!loading && hasNextPage && (
                    <div style={{ textAlign: "center", padding: 12 }}>
                      <Button onClick={() => loadProducts()} size="slim">
                        Load more products
                      </Button>
                    </div>
                  )}
                  {!loading &&
                    !hasNextPage &&
                    filteredProducts.length === 0 && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        {searchQuery
                          ? "No products found matching your search."
                          : "No products found."}
                      </Text>
                    )}
                </LegacyStack>
              </div>
            </Scrollable>
          </div>

          {process.env.NODE_ENV === "development" && (
            <Text as="p" variant="bodySm" tone="subdued">
              Loaded {products.length} products
            </Text>
          )}
        </LegacyStack>
      </Modal.Section>
    </Modal>
  );
}

export default MultiProductSelector;
