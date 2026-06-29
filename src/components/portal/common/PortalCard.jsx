export default function PortalCard({
  children,
  className = "",
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}