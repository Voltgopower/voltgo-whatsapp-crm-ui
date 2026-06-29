import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://voltgo-whatsapp-support-production.up.railway.app/api";

function authHeaders() {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export async function getDealerDashboard(id = 1) {
  console.log(
    "Dealer URL:",
    `${API_BASE}/dealers/${id}/dashboard`
  );

  const { data } = await axios.get(
    `${API_BASE}/dealers/${id}/dashboard`,
    {
      headers: authHeaders(),
    }
  );

  return data;
}

export async function getDealers() {
  const { data } = await axios.get(`${API_BASE}/dealers`, {
    headers: authHeaders(),
  });

  return data;
}

export async function getDealer(id) {
  const { data } = await axios.get(`${DEALER_API_BASE}/dealers/${id}`, {
    headers: authHeaders(),
  });

  return data;
}