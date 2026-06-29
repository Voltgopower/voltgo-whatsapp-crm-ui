import { useState } from "react";

import { PageHeader, QueryCard } from "../../components/portal/common";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

function getYearRange() {
  const year = new Date().getFullYear();

  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

function getMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export default function ReportCenter() {
  const yearRange = getYearRange();

  const [period, setPeriod] = useState("this_year");
  const [startDate, setStartDate] = useState(yearRange.startDate);
  const [endDate, setEndDate] = useState(yearRange.endDate);

  function applyPeriod(value) {
    setPeriod(value);

    if (value === "this_year") {
      const range = getYearRange();
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }

    if (value === "this_month") {
      const range = getMonthRange();
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }

  function exportExcel() {
    if (!startDate || !endDate) {
      alert("Please select start date and end date");
      return;
    }

    const url =
      `${API_BASE}/portal/reports/sales/export` +
      `?start_date=${startDate}` +
      `&end_date=${endDate}`;

    window.open(url, "_blank");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Report Center"
        description="Export operational data for management reporting."
      />

      <QueryCard
        title="Report Query"
        description="Select a report period and export the sales report Excel file."
      >
        <div className="space-y-6">
          <section>
            <div className="font-semibold mb-3">Report Period</div>

            <div className="flex gap-3 mb-5">
              <button
                type="button"
                onClick={() => applyPeriod("this_month")}
                className={`px-4 py-2 rounded-lg border text-sm ${
                  period === "this_month"
                    ? "bg-gray-900 text-white"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                This Month
              </button>

              <button
                type="button"
                onClick={() => applyPeriod("this_year")}
                className={`px-4 py-2 rounded-lg border text-sm ${
                  period === "this_year"
                    ? "bg-gray-900 text-white"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                This Year
              </button>

              <button
                type="button"
                onClick={() => setPeriod("custom")}
                className={`px-4 py-2 rounded-lg border text-sm ${
                  period === "custom"
                    ? "bg-gray-900 text-white"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                Custom
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setPeriod("custom");
                    setStartDate(e.target.value);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setPeriod("custom");
                    setEndDate(e.target.value);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="pt-2">
            <button
              type="button"
              onClick={exportExcel}
              className="px-8 py-3 rounded-lg bg-gray-900 text-white text-sm font-medium"
            >
              Export Sales Report (Excel)
            </button>
          </section>
        </div>
      </QueryCard>
    </div>
  );
}