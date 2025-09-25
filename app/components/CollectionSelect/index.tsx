import { useState, useEffect, useMemo } from "react";
import { Combobox, Listbox, Tag } from "@shopify/polaris";
import type { ShopifyCollection } from "app/types/shopify";

interface CollectionSelectProps {
  collections: ShopifyCollection[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function CollectionSelect({
  collections,
  value,
  onChange,
}: CollectionSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState<string[]>(value || []);

  useEffect(() => {
    setSelected(value || []);
  }, [value]);

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

  const handleSelect = (selectedValue: string) => {
    const newSelected = selected.includes(selectedValue)
      ? selected.filter((item) => item !== selectedValue)
      : [...selected, selectedValue];
    setSelected(newSelected);
    onChange(newSelected);
  };

  const removeTag = (tag: string) => {
    const newSelected = selected.filter((item) => item !== tag);
    setSelected(newSelected);
    onChange(newSelected);
  };

  const selectedCollections = collections.filter((c) =>
    selected.includes(c.id),
  );

  return (
    <div>
      <Combobox
        activator={
          <Combobox.TextField
            prefix="Collections"
            onChange={setInputValue}
            label="Select collections"
            value={inputValue}
            placeholder="Search collections"
            autoComplete="off"
          />
        }
      >
        <Listbox onSelect={handleSelect}>
          {filteredOptions.map((option) => (
            <Listbox.Option
              key={option.value}
              value={option.value}
              selected={selected.includes(option.value)}
            >
              {option.label}
            </Listbox.Option>
          ))}
        </Listbox>
      </Combobox>

      {selectedCollections.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          {selectedCollections.map((collection) => (
            <Tag key={collection.id} onRemove={() => removeTag(collection.id)}>
              {collection.title}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}
