type NumberFieldProps = {
  label: string;
  unit: string;
  value: number;
  min?: number;
  max?: number;
  step?: number | "any";
  hint?: string;
  onChange: (value: number) => void;
};

export function NumberField({
  label,
  unit,
  value,
  min,
  max,
  step = "any",
  hint,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="number-field">
      <span className="field-label">
        <span>{label}</span>
        <span className="field-unit">{unit}</span>
      </span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
