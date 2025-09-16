import { TextField, Button } from "@shopify/polaris";

export function SearchBar({
  query,
  setQuery,
  onlyInStock,
  setOnlyInStock,
}: {
  query: string;
  setQuery: (value: string) => void;
  onlyInStock: boolean;
  setOnlyInStock: (value: boolean) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
      <TextField
        label=""
        placeholder="Search products or variants"
        value={query}
        onChange={setQuery}
        autoComplete="off"
        clearButton
        onClearButtonClick={() => setQuery("")}
      />
      <Button
        pressed={onlyInStock}
        onClick={() => setOnlyInStock(!onlyInStock)}
        accessibilityLabel="Toggle only in stock"
      >
        {onlyInStock ? "In stock ✓" : "All stock"}
      </Button>
    </div>
  );
}
