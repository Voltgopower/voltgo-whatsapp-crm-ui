export default function EntityHeader({
  title,
  subtitle,
  rightLabel,
  rightValue,
  rightSubValue,
  className = "",
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        <div className="text-2xl font-bold">
          {title || "-"}
        </div>

        {subtitle && (
          <div className="text-gray-500 mt-1">
            {subtitle}
          </div>
        )}
      </div>

      {(rightLabel || rightValue) && (
        <div className="text-right">
          {rightLabel && (
            <div className="text-sm text-gray-500">
              {rightLabel}
            </div>
          )}

          <div className="text-2xl font-bold">
            {rightValue || "-"}
          </div>

          {rightSubValue && (
            <div className="text-sm text-gray-500 mt-1">
              {rightSubValue}
            </div>
          )}
        </div>
      )}
    </div>
  );
}