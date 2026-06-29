export default function PortalSidebar({ tab, setTab }) {
  const items = [
    {
      key: "batches",
      label: "Batches",
    },
    {
      key: "documents",
      label: "Documents",
    },
    {
      key: "reports",
      label: "Reports",
    },
{
  key: "statements",
  label: "Statements",
},
  ];

  return (
    <div className="w-56 bg-white border-r p-3 space-y-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => setTab(item.key)}
          className={`w-full text-left px-4 py-3 rounded-lg text-sm transition ${
            tab === item.key
              ? "bg-gray-900 text-white"
              : "hover:bg-gray-100"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}