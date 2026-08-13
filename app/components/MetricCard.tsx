type MetricCardProps = {
  label: string;
  value: string;
  note: string;
  tone?: "cyan" | "orange" | "neutral";
};

export function MetricCard({
  label,
  value,
  note,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
