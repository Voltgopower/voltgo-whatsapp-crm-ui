export default function DataTable({
  columns = [],
  rows = [],
  emptyText = "No records.",
  rowKey = "id",
}) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-gray-500">
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              className={`px-5 py-3 ${
                column.align === "right" ? "text-right" : "text-left"
              }`}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <tr key={row[rowKey] || index} className="border-t">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-5 py-3 ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.render
                    ? column.render(row)
                    : row[column.key] || "-"}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td
              className="px-5 py-8 text-center text-gray-500"
              colSpan={columns.length}
            >
              {emptyText}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}