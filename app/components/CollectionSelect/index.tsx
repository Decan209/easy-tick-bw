import { Autocomplete, Text } from "@shopify/polaris";
import type { ShopifyCollection } from "app/types/shopify";
import { useState, useMemo, useCallback } from "react";

interface CollectionSelectProps {
  collections: ShopifyCollection[];
  value: string;
  onChange: (value: string) => void;
}

export function CollectionSelect({
  collections,
  value,
  onChange,
}: CollectionSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState(value ? [value] : []);

  const filteredOptions = useMemo(
    () =>
      collections
        .filter((c) => c.title.toLowerCase().includes(inputValue.toLowerCase()))
        .map((c) => ({
          value: c.id,
          label: c.title,
        })),
    [collections, inputValue],
  );

  const textField = (
    <Autocomplete.TextField
      label="Select Collection"
      value={inputValue}
      onChange={setInputValue}
      autoComplete="off"
      placeholder="Type to search..."
    />
  );

  const handleSelect = useCallback(
    (selectedItems: string[]) => {
      setSelected(selectedItems);
      onChange(selectedItems[0] || "");
    },
    [onChange],
  );

  const selectedCollectionObj = collections.find(
    (c) => c.id === (selected[0] || value),
  );

  return (
    <div>
      <Autocomplete
        options={filteredOptions}
        selected={selected}
        onSelect={handleSelect}
        textField={textField}
        allowMultiple={false}
      />
      {(selected[0] || value) && selectedCollectionObj && (
        <div className="status-badge" style={{ marginTop: 8 }}>
          <Text as="p" variant="bodySm" tone="subdued">
            ✓ Campaign will show on all products in this collection:{" "}
            <b>{selectedCollectionObj.title}</b>
          </Text>
        </div>
      )}
    </div>
  );
}
