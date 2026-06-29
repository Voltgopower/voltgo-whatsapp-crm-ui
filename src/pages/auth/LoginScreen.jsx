import { useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setErrorText("");

      const res = await axios.post(`${API_BASE}/auth/login`, {
        username: username.trim(),
        password,
      });

      if (!res.data?.success || !res.data?.token || !res.data?.user) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("crm_user", JSON.stringify(res.data.user));

      onLoginSuccess(res.data.user);
    } catch (err) {
      setErrorText(
        err?.response?.data?.message || err?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-lg p-8">
        <div className="text-3xl font-bold text-center">Voltgo WhatsApp CRM</div>
        <div className="text-center text-gray-500 mt-3">
          Please sign in to continue
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <input
            type="text"
            placeholder="Username"
            className="w-full rounded-2xl border px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-gray-300"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-gray-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {errorText ? (
            <div className="text-sm text-red-600">{errorText}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black text-white py-4 text-xl font-semibold disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}