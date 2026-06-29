import PortalCard from "./PortalCard";

export default function PageHeader({
  title,
  description,
  right,
}) {
  return (
    <PortalCard className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold">
            {title}
          </div>

          {description && (
            <div className="text-sm text-gray-500 mt-1">
              {description}
            </div>
          )}
        </div>

        {right}
      </div>
    </PortalCard>
  );
}