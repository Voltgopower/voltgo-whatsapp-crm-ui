export default function SummaryCard({
  label,
  value,
  subValue,
  className = "",
}) {
  return (
    <div className={`rounded-xl bg-gray-50 p-4 ${className}`}>
      <div className="text-xs text-gray-500">{label}</div>

      <div className="font-semibold mt-1">{value || "-"}</div>

      {subValue && (
        <div className="text-xs text-gray-500 mt-1">{subValue}</div>
      )}
    </div>
  );
}