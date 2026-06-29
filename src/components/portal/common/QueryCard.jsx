import PortalCard from "./PortalCard";

export default function QueryCard({
  title,
  description,
  children,
  footer,
  className = "",
}) {
  return (
    <PortalCard className={`overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b">
        <div className="font-semibold">{title}</div>

        {description && (
          <div className="text-sm text-gray-500 mt-1">{description}</div>
        )}
      </div>

      <div className="p-6">{children}</div>

      {footer && <div className="px-6 py-4 border-t bg-gray-50">{footer}</div>}
    </PortalCard>
  );
}