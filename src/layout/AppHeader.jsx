export default function AppHeader({
  user,
  lastSuccessfulSyncAt,
  formatDateTime,
  loadConversations,
  setShowChangePassword,
  showRightPanel,
  setShowRightPanel,
  systemHealthClass,
  systemHealthLabel,
  activeModule,
  setActiveModule,
  handleLogout,
}) {
  const modules = [
    { key: "crm", label: "CRM" },
    { key: "portal", label: "Portal" },
    { key: "dealer", label: "Dealer" },
  ];
  return (
    <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
      <div>
        <div className="text-xl font-bold">WhatsApp CRM</div>
        <div className="text-sm text-gray-500">
          Voltgo support console · React + Tailwind + Axios MVP
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Logged in as {user?.username}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Last sync:{" "}
          {lastSuccessfulSyncAt
            ? formatDateTime(lastSuccessfulSyncAt)
            : "No sync yet"}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => loadConversations()}
          className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
          type="button"
        >
          Refresh
        </button>

        <button
          onClick={() => setShowChangePassword(true)}
          className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
          type="button"
        >
          Change Password
        </button>

        <button
          onClick={() => setShowRightPanel((prev) => !prev)}
          className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
          type="button"
        >
          {showRightPanel ? "Hide Details" : "Show Details"}
        </button>

        <div className={`px-3 py-2 rounded text-sm ${systemHealthClass}`}>
          {systemHealthLabel}
        </div>

        {modules.map((item) => (
  <button
    key={item.key}
    onClick={() => setActiveModule(item.key)}
    className={`px-3 py-2 rounded border text-sm ${
      activeModule === item.key
        ? "bg-black text-white"
        : "bg-white hover:bg-gray-50"
    }`}
    type="button"
  >
    {item.label}
  </button>
))}

        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
          type="button"
        >
          Logout
        </button>
      </div>
    </div>
  );
}