import { TextField, Text, ColorPicker } from "@shopify/polaris";

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  hexToHsb: (hex: string) => any;
  hsbToHex: (hsb: any) => string;
}

export function ColorPickerField({
  label,
  value,
  onChange,
  isOpen,
  onToggle,
  hexToHsb,
  hsbToHex,
}: ColorPickerFieldProps) {
  return (
    <div>
      <Text as="p" variant="bodyMd" fontWeight="medium">
        {label}
      </Text>
      <div className="color-picker-input">
        <div
          className="color-preview"
          style={{ backgroundColor: value }}
          onClick={onToggle}
        />
        <TextField
          label=""
          value={value}
          onChange={onChange}
          autoComplete="off"
        />
      </div>
      {isOpen && (
        <div style={{ marginTop: 8 }}>
          <ColorPicker
            color={hexToHsb(value)}
            onChange={(color) => onChange(hsbToHex(color))}
          />
        </div>
      )}
    </div>
  );
}
