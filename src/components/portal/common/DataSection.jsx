import PortalCard from "./PortalCard";

export default function DataSection({
  title,
  description,
  right,
  children,
  className = "",
}) {
  return (
    <PortalCard className={`overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">{title}</div>

          {description && (
            <div className="text-sm text-gray-500 mt-1">{description}</div>
          )}
        </div>

        {right && <div>{right}</div>}
      </div>

      {children}
    </PortalCard>
  );
}