import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  PageHeader,
  QueryCard,
  SummaryCard,
} from "../../components/portal/common";

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

function buildStatementUrl({ customerId, startDate, endDate }) {
  return (
    `${API_BASE}/portal/statements/customer/export` +
    `?customer_id=${customerId}` +
    `&start_date=${startDate}` +
    `&end_date=${endDate}`
  );
}

export default function StatementCenter() {
  const yearRange = getYearRange();

  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [period, setPeriod] = useState("this_year");
  const [startDate, setStartDate] = useState(yearRange.startDate);
  const [endDate, setEndDate] = useState(yearRange.endDate);

  const [loading, setLoading] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  async function loadCustomers() {
    setLoading(true);

    try {
      const res = await axios.get(`${API_BASE}/portal/customers`);
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }

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

  function downloadStatement() {
    if (!selectedCustomer?.id) {
      alert("Please select a customer");
      return;
    }

    if (!startDate || !endDate) {
      alert("Please select start date and end date");
      return;
    }

    const url = buildStatementUrl({
      customerId: selectedCustomer.id,
      startDate,
      endDate,
    });

    const customerName =
      selectedCustomer.company ||
      selectedCustomer.name ||
      `Customer_${selectedCustomer.id}`;

    setLastExport({
      customerName,
      startDate,
      endDate,
      generatedAt: new Date().toLocaleString(),
      url,
    });

    window.open(url, "_blank");
  }

  const filteredCustomers = useMemo(() => {
    const value = keyword.trim().toLowerCase();

    if (!value) return customers.slice(0, 10);

    return customers
      .filter((customer) => {
        const name = String(customer.name || "").toLowerCase();
        const company = String(customer.company || "").toLowerCase();
        const email = String(customer.email || "").toLowerCase();

        return (
          name.includes(value) ||
          company.includes(value) ||
          email.includes(value)
        );
      })
      .slice(0, 10);
  }, [customers, keyword]);

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Statement Center"
        description="Export customer account statements based on payment allocations."
      />

      <QueryCard
        title="Statement Query"
        description="Select a customer and period, then download the account statement."
      >
        <div className="space-y-6">
          <section>
            <div className="font-semibold mb-3">Customer</div>

            <div className="max-w-3xl">
              <label className="block text-sm text-gray-500 mb-1">
                Customer Name / Company / Email
              </label>

              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Search customer..."
              />

              <div className="mt-3 border rounded-xl overflow-hidden">
                {loading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Loading customers...
                  </div>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
                    const isSelected = selectedCustomer?.id === customer.id;

                    return (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setKeyword(
                            customer.company ||
                              customer.name ||
                              customer.email ||
                              ""
                          );
                        }}
                        className={`w-full text-left px-4 py-3 border-b last:border-b-0 text-sm ${
                          isSelected
                            ? "bg-gray-900 text-white"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium">
                          {customer.company || customer.name || "-"}
                        </div>

                        <div
                          className={`text-xs mt-1 ${
                            isSelected ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {customer.name || "-"} · {customer.email || "-"}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No customers found.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="font-semibold mb-3">Selected Customer</div>

            {selectedCustomer ? (
              <div className="grid grid-cols-3 gap-4 max-w-4xl">
                <SummaryCard
                  label="Company"
                  value={selectedCustomer.company || "-"}
                />

                <SummaryCard
                  label="Contact"
                  value={selectedCustomer.name || "-"}
                />

                <SummaryCard
                  label="Email"
                  value={selectedCustomer.email || "-"}
                />
              </div>
            ) : (
              <div className="rounded-xl border bg-gray-50 px-4 py-4 text-sm text-gray-500 max-w-3xl">
                No customer selected.
              </div>
            )}
          </section>

          <section>
            <div className="font-semibold mb-3">Statement Period</div>

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
              onClick={downloadStatement}
              className="px-8 py-3 rounded-lg bg-gray-900 text-white text-sm font-medium"
            >
              Download Statement (Excel)
            </button>

            {lastExport && (
              <div className="mt-4 rounded-xl bg-gray-50 border px-4 py-3 text-sm text-gray-600 max-w-3xl">
                <div className="font-semibold text-gray-900 mb-1">
                  Last Export
                </div>

                <div>
                  {lastExport.customerName} · {lastExport.startDate} to{" "}
                  {lastExport.endDate}
                </div>

                <div className="mt-1">Generated: {lastExport.generatedAt}</div>

                <button
                  type="button"
                  onClick={() => window.open(lastExport.url, "_blank")}
                  className="mt-3 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                >
                  Download Again
                </button>
              </div>
            )}
          </section>
        </div>
      </QueryCard>
    </div>
  );
}