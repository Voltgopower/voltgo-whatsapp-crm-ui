import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const SOCKET_BASE =
  import.meta.env.VITE_SOCKET_BASE || "http://localhost:3000";

function sameId(a, b) {
  return String(a ?? "").trim() === String(b ?? "").trim();
}

function getDisplayName(row) {
  if (!row) return "Unknown";

  return (
    row.customer_name ||
    row.customerName ||
    row.name ||
    row.profile_name ||
    row.profileName ||
    row.customer?.name ||
    row.customer?.profile_name ||
    row.phone ||
    "Unknown"
  );
}

function LoginScreen({ onLoginSuccess }) {
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

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [apiConnected, setApiConnected] = useState(true);

  const [apiStatus, setApiStatus] = useState("unknown");
  const [socketStatus, setSocketStatus] = useState("unknown");
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState(null);
  const [lastInboundSignalAt, setLastInboundSignalAt] = useState(null);
  const [warningBanner, setWarningBanner] = useState("");

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [mediaUrlMap, setMediaUrlMap] = useState({});

  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [replyText, setReplyText] = useState("");
  const [assignInput, setAssignInput] = useState("");
  const [newTag, setNewTag] = useState("");
  const [noteInput, setNoteInput] = useState("");

  const [customerTags, setCustomerTags] = useState([]);
  const [notes, setNotes] = useState([]);
  const [customerDetail, setCustomerDetail] = useState(null);

  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  const [sending, setSending] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [savingTag, setSavingTag] = useState(false);

  const [errorBanner, setErrorBanner] = useState("");

  // Change Password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedConversationIdRef = useRef(null);

  const assignableUsers = [
    { id: 1, username: "admin", role: "admin", label: "admin (admin)" },
    { id: 2, username: "sales", role: "sales", label: "sales (sales)" },
    { id: 3, username: "support", role: "support", label: "support (support)" },
    { id: 4, username: "qa.test", role: "qa", label: "qa.test (qa)" },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("crm_user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("crm_user");
        localStorage.removeItem("token");
      }
    }

    setAuthReady(true);
  }, []);

useEffect(() => {
  const loadMediaUrls = async () => {
    const newMap = {};

    for (const msg of messages) {
      if (msg.media_assets?.length > 0) {
        const media = msg.media_assets[0];

        // 避免重复请求
        if (mediaUrlMap[media.id]) continue;

        try {
          const res = await fetch(
  `${API_BASE}/media/${media.id}/url`
);
          const data = await res.json();

          if (data.success) {
            newMap[media.id] = data.data.url;
          }
        } catch (err) {
          console.error("load media url error", err);
        }
      }
    }

    if (Object.keys(newMap).length > 0) {
      setMediaUrlMap((prev) => ({ ...prev, ...newMap }));
    }
  };

  if (messages.length > 0) {
    loadMediaUrls();
  }
}, [messages]);
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => sameId(c.id, selectedConversationId)) || null;
  }, [conversations, selectedConversationId]);

  const selectedCustomerId = selectedConversation?.customer_id ?? null;

  const clearErrorSoon = useCallback(() => {
    setTimeout(() => {
      setErrorBanner("");
    }, 2500);
  }, []);

  const setFriendlyError = useCallback(
    (message) => {
      setErrorBanner(message);
      clearErrorSoon();
    },
    [clearErrorSoon]
  );

  const clearWarningSoon = useCallback(() => {
    setTimeout(() => {
      setWarningBanner("");
    }, 5000);
  }, []);

  const setFriendlyWarning = useCallback(
    (message) => {
      setWarningBanner(message);
      clearWarningSoon();
    },
    [clearWarningSoon]
  );

  const markSuccessfulSync = useCallback(() => {
    const now = new Date().toISOString();
    setLastSuccessfulSyncAt(now);
    setApiStatus("connected");
    setApiConnected(true);
  }, []);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("crm_user");
    setUser(null);
    setConversations([]);
    setMessages([]);
    setCustomerTags([]);
    setNotes([]);
    setCustomerDetail(null);
    setSelectedConversationId(null);
    setApiStatus("unknown");
    setSocketStatus("unknown");
    setLastSuccessfulSyncAt(null);
    setLastInboundSignalAt(null);
    setWarningBanner("");
  }, []);

  const scrollMessagesToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "end",
        });
      });
    });
  }, []);

  const tryRequest = useCallback(
    async (requests = []) => {
      let lastError = null;

      for (const request of requests) {
        try {
          const res = await request();
          return res;
        } catch (err) {
          lastError = err;

          if (err?.response?.status === 401) {
            handleUnauthorized();
            throw err;
          }
        }
      }

      throw lastError;
    },
    [handleUnauthorized]
  );

  function normalizeConversation(row = {}) {
    return {
      id: row.id,
      customer_id: row.customer_id ?? row.customerId ?? row.customer?.id ?? null,
      status: row.status ?? "open",
      unread_count: Number(row.unread_count ?? row.unreadCount ?? 0),
      assigned_to: row.assigned_to ?? row.assignedTo ?? null,
      assigned_at: row.assigned_at ?? row.assignedAt ?? null,
      assigned_username: row.assigned_username ?? row.assignedUsername ?? null,
      assigned_role: row.assigned_role ?? row.assignedRole ?? null,
      phone:
        row.phone ??
        row.customer_phone ??
        row.customer?.phone ??
        row.wa_id ??
        row.from ??
        "",
      customer_name:
        row.customer_name ??
        row.customerName ??
        row.name ??
        row.customer?.name ??
        null,
      profile_name:
        row.profile_name ??
        row.profileName ??
        row.customer?.profile_name ??
        null,
      last_message_preview:
        row.last_message_preview ??
        row.lastMessagePreview ??
        row.preview ??
        "",
      last_message_at:
        row.last_message_at ??
        row.lastMessageAt ??
        row.updated_at ??
        row.updatedAt ??
        row.created_at ??
        null,
      failed_count: Number(row.failed_count ?? row.failedCount ?? (row.has_failed ? 1 : 0)),
      raw: row,
    };
  }

  function normalizeMessage(row = {}) {
    return {
      id: row.id,
      conversation_id: row.conversation_id ?? row.conversationId ?? null,
      customer_id: row.customer_id ?? row.customerId ?? null,
      direction:
        row.direction ??
        row.message_direction ??
        (row.from_me ? "outbound" : "inbound"),
      content:
        row.content ??
        row.text ??
        row.message_text ??
        row.body ??
        row.preview ??
        "",
      created_at:
        row.created_at ??
        row.createdAt ??
        row.sent_at ??
        row.sentAt ??
        row.timestamp ??
        new Date().toISOString(),
      status: row.status ?? "sent",
      type: row.type ?? row.message_type ?? "text",
      media_assets: row.media_assets ?? [],
      raw: row,
    };
  }

  function normalizeTagList(data) {
    if (Array.isArray(data?.tags)) return data.tags;
    if (Array.isArray(data?.customer?.tags)) return data.customer.tags;
    if (Array.isArray(data?.data?.tags)) return data.data.tags;
    return [];
  }

  function normalizeNotesList(data) {
    const rows =
      data?.notes ??
      data?.data ??
      data?.rows ??
      (Array.isArray(data) ? data : []);

    return rows.map((n) => ({
      ...n,
      content: n.content || n.note || "",
    }));
  }

  function formatDateTime(value) {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return String(value);
    }
  }

  function formatMessageTime(value) {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return String(value);
    }
  }

  const loadConversations = useCallback(async () => {
    if (!user) return;

    setLoadingConversations(true);

    try {
      const backendStatus =
        scope !== "all"
          ? scope
          : statusFilter !== "all"
          ? statusFilter
          : "all";

      const res = await tryRequest([
        () =>
          axios.get(`${API_BASE}/conversations`, {
            params: {
              status: backendStatus,
              search: search || undefined,
            },
          }),
        () =>
          axios.get(`${API_BASE}/conversations`, {
            params: {
              status: backendStatus,
              q: search || undefined,
            },
          }),
        () => axios.get(`${API_BASE}/conversations`),
      ]);

      const rows =
        res.data?.conversations ??
        res.data?.data ??
        res.data?.rows ??
        (Array.isArray(res.data) ? res.data : []);

      let normalized = rows.map(normalizeConversation);

      if (scope === "unassigned") {
        normalized = normalized.filter((c) => !c.assigned_to);
      } else if (scope === "failed") {
        normalized = normalized.filter((c) => Number(c.failed_count) > 0);
      } else if (scope === "mine" && user?.id) {
        normalized = normalized.filter((c) => String(c.assigned_to || "") === String(user.id));
      }

      if (statusFilter === "open") {
        normalized = normalized.filter((c) => c.status === "open");
      } else if (statusFilter === "unread") {
        normalized = normalized.filter((c) => Number(c.unread_count) > 0);
      } else if (statusFilter === "closed") {
        normalized = normalized.filter((c) => c.status === "closed");
      }

      if (search.trim()) {
        const keyword = search.trim().toLowerCase();
        normalized = normalized.filter((c) => {
          return (
            String(getDisplayName(c) || "").toLowerCase().includes(keyword) ||
            String(c.phone || "").toLowerCase().includes(keyword) ||
            String(c.last_message_preview || "").toLowerCase().includes(keyword)
          );
        });
      }

      normalized.sort((a, b) => {
        const aTime = new Date(a.last_message_at || 0).getTime();
        const bTime = new Date(b.last_message_at || 0).getTime();
        return bTime - aTime;
      });

      setConversations(normalized);
      markSuccessfulSync();

      if (normalized.length === 0) {
        setSelectedConversationId(null);
      } else {
        const currentId = selectedConversationIdRef.current;
        const stillExists = normalized.find((c) => sameId(c.id, currentId));

        if (stillExists) {
          setSelectedConversationId(stillExists.id);
        } else {
          setSelectedConversationId(normalized[0].id);
        }
      }
    } catch (err) {
      if (err?.response?.status === 401) return;
      console.error("loadConversations error:", err);
      setApiConnected(false);
      setApiStatus("disconnected");
      setFriendlyError("Failed to load conversations.");
    } finally {
      setLoadingConversations(false);
    }
  }, [user, scope, statusFilter, search, tryRequest, setFriendlyError, markSuccessfulSync]);

  const loadMessages = useCallback(
    async (conversationId) => {
      if (!conversationId || !user) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);

      try {
        const res = await tryRequest([
          () => axios.get(`${API_BASE}/conversations/${conversationId}/messages`),
          () => axios.get(`${API_BASE}/messages/${conversationId}`),
        ]);

        const rows =
          res.data?.messages ??
          res.data?.data ??
          res.data?.rows ??
          (Array.isArray(res.data) ? res.data : []);

        const normalized = rows.map(normalizeMessage);

        normalized.sort((a, b) => {
          const aTime = new Date(a.created_at || 0).getTime();
          const bTime = new Date(b.created_at || 0).getTime();
          if (aTime !== bTime) return aTime - bTime;
          return String(a.id || "").localeCompare(String(b.id || ""));
        });

        setMessages(normalized);
        markSuccessfulSync();

        setTimeout(() => {
          scrollMessagesToBottom(false);
        }, 120);
      } catch (err) {
        if (err?.response?.status === 401) return;
        console.error("loadMessages error:", err);
        setApiConnected(false);
        setApiStatus("disconnected");
        setFriendlyError("Failed to load messages.");
      } finally {
        setLoadingMessages(false);
      }
    },
    [user, tryRequest, scrollMessagesToBottom, setFriendlyError, markSuccessfulSync]
  );

  const loadCustomerDetail = useCallback(
    async (customerId) => {
      if (!customerId || !user) {
        setCustomerDetail(null);
        return;
      }

      setLoadingCustomer(true);

      try {
        const res = await axios.get(`${API_BASE}/customers/${customerId}`);
        setCustomerDetail(res.data?.customer ?? res.data?.data ?? null);
        markSuccessfulSync();
      } catch (err) {
        if (err?.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        console.error("loadCustomerDetail error:", err);
        setCustomerDetail(null);
      } finally {
        setLoadingCustomer(false);
      }
    },
    [user, handleUnauthorized, markSuccessfulSync]
  );

  const loadTags = useCallback(
    async (customerId) => {
      if (!customerId || !user) {
        setCustomerTags([]);
        return;
      }

      setLoadingTags(true);

      try {
        const res = await tryRequest([
          () => axios.get(`${API_BASE}/customers/${customerId}/tags`),
          () => axios.get(`${API_BASE}/customers/${customerId}`),
        ]);

        setCustomerTags(normalizeTagList(res.data));
        markSuccessfulSync();
      } catch (err) {
        if (err?.response?.status === 401) return;
        console.error("loadTags error:", err);
        setCustomerTags([]);
      } finally {
        setLoadingTags(false);
      }
    },
    [user, tryRequest, markSuccessfulSync]
  );

  const loadNotes = useCallback(
    async (customerId) => {
      if (!customerId || !user) {
        setNotes([]);
        return;
      }

      setLoadingNotes(true);

      try {
        const res = await axios.get(`${API_BASE}/customers/${customerId}/notes`);
        setNotes(normalizeNotesList(res.data));
        markSuccessfulSync();
      } catch (err) {
        if (err?.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        console.error("loadNotes error:", err);
        setNotes([]);
      } finally {
        setLoadingNotes(false);
      }
    },
    [user, handleUnauthorized, markSuccessfulSync]
  );

  const markReadByConversationId = useCallback(
    async (conversationId, unreadCount = 0) => {
      if (!conversationId || !user) return;
      if (Number(unreadCount || 0) === 0) return;

      try {
        await tryRequest([
          () => axios.post(`${API_BASE}/conversations/${conversationId}/read`),
          () => axios.patch(`${API_BASE}/conversations/${conversationId}/read`),
          () => axios.post(`${API_BASE}/conversations/${conversationId}/mark-read`),
        ]);

        setConversations((prev) =>
          prev.map((c) =>
            sameId(c.id, conversationId) ? { ...c, unread_count: 0 } : c
          )
        );
        markSuccessfulSync();
      } catch (err) {
        if (err?.response?.status === 401) return;
        console.error("markReadByConversationId error:", err);
      }
    },
    [user, tryRequest, markSuccessfulSync]
  );

  const markRead = useCallback(async () => {
    if (!selectedConversation) return;
    await markReadByConversationId(
      selectedConversation.id,
      selectedConversation.unread_count
    );
    await loadConversations();
  }, [selectedConversation, markReadByConversationId, loadConversations]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      loadConversations();
    }, 250);

    return () => clearTimeout(timer);
  }, [user, search, loadConversations]);

  useEffect(() => {
    if (!user || !selectedConversation) return;

    setAssignInput(
      selectedConversation?.assigned_to !== null &&
        selectedConversation?.assigned_to !== undefined
        ? String(selectedConversation.assigned_to)
        : ""
    );

    loadMessages(selectedConversation.id);
    loadCustomerDetail(selectedConversation.customer_id);
    loadTags(selectedConversation.customer_id);
    loadNotes(selectedConversation.customer_id);

    if (Number(selectedConversation.unread_count || 0) > 0) {
      markReadByConversationId(
        selectedConversation.id,
        selectedConversation.unread_count
      );
    }
  }, [
    user,
    selectedConversation?.id,
    selectedConversation?.customer_id,
    selectedConversation?.assigned_to,
    selectedConversation?.unread_count,
    loadMessages,
    loadCustomerDetail,
    loadTags,
    loadNotes,
    markReadByConversationId,
  ]);

  useEffect(() => {
    if (!messages.length) return;

    setTimeout(() => {
      scrollMessagesToBottom(false);
    }, 120);
  }, [messages, scrollMessagesToBottom]);

  useEffect(() => {
    if (!user) return;

    const heartbeat = setInterval(async () => {
      try {
        await axios.get(`${API_BASE}/conversations`, {
          params: { limit: 1 },
        });
        setApiStatus("connected");
        setApiConnected(true);
      } catch (err) {
        if (err?.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        setApiStatus("disconnected");
        setApiConnected(false);
      }
    }, 15000);

    return () => clearInterval(heartbeat);
  }, [user, handleUnauthorized]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (!lastInboundSignalAt) return;

      const diff = Date.now() - new Date(lastInboundSignalAt).getTime();

      if (diff > 10 * 60 * 1000) {
        setFriendlyWarning("No new incoming activity for over 10 minutes. Please check webhook/system status.");
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user, lastInboundSignalAt, setFriendlyWarning]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");

    const socket = io(SOCKET_BASE, {
      transports: ["websocket", "polling"],
      auth: token ? { token } : undefined,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("socket connected:", socket.id);
      setSocketStatus("connected");
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected");
      setSocketStatus("disconnected");
    });

    socket.on("conversation:updated", ({ conversation }) => {
      const incoming = normalizeConversation(conversation);

      setConversations((prev) => {
        const exists = prev.some((c) => sameId(c.id, incoming.id));
        const next = exists
          ? prev.map((c) => (sameId(c.id, incoming.id) ? { ...c, ...incoming } : c))
          : [incoming, ...prev];

        return [...next].sort((a, b) => {
          const aTime = new Date(a.last_message_at || 0).getTime();
          const bTime = new Date(b.last_message_at || 0).getTime();
          return bTime - aTime;
        });
      });

      markSuccessfulSync();

      if (sameId(selectedConversationIdRef.current, incoming.id)) {
        loadMessages(incoming.id);
      }
    });

    socket.on("message:new", ({ conversationId, message }) => {
      const normalizedMessage = normalizeMessage(message);
      const currentConversationId = selectedConversationIdRef.current;

      setLastInboundSignalAt(new Date().toISOString());
      markSuccessfulSync();

      if (sameId(currentConversationId, conversationId)) {
        setMessages((prev) => {
          const exists = prev.some((m) => sameId(m.id, normalizedMessage.id));
          if (exists) return prev;

          const next = [...prev, normalizedMessage];
          next.sort((a, b) => {
            const aTime = new Date(a.created_at || 0).getTime();
            const bTime = new Date(b.created_at || 0).getTime();
            if (aTime !== bTime) return aTime - bTime;
            return String(a.id || "").localeCompare(String(b.id || ""));
          });
          return next;
        });

        scrollMessagesToBottom();
      }

      loadConversations();
    });

    socket.on("message:status", ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (sameId(m.id, messageId) ? { ...m, status: status ?? m.status } : m))
      );

      markSuccessfulSync();
      loadConversations();
    });

    socket.on("message:deleted", ({ messageId, conversationId }) => {
      if (sameId(selectedConversationIdRef.current, conversationId)) {
        setMessages((prev) => prev.filter((m) => !sameId(m.id, messageId)));
      }

      markSuccessfulSync();
      loadConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [user, loadConversations, loadMessages, scrollMessagesToBottom, markSuccessfulSync]);

  async function sendReply() {
    if (!selectedConversation?.id || !replyText.trim() || sending) return;

    setSending(true);

    try {
      await axios.post(`${API_BASE}/messages/send`, {
        conversationId: selectedConversation.id,
        text: replyText,
      });

      setReplyText("");
      markSuccessfulSync();
      await loadMessages(selectedConversation.id);
      await loadConversations();
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.error("sendReply error:", err);
      setFriendlyError(
        `Send failed: ${
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message
        }`
      );
    } finally {
      setSending(false);
    }
  }

  async function updateConversationStatus(nextStatus) {
    if (!selectedConversation?.id) return;

    try {
      await tryRequest([
        () =>
          axios.patch(`${API_BASE}/conversations/${selectedConversation.id}/status`, {
            status: nextStatus,
          }),
        () =>
          axios.patch(`${API_BASE}/conversations/${selectedConversation.id}`, {
            status: nextStatus,
          }),
      ]);

      markSuccessfulSync();
      await loadConversations();
    } catch (err) {
      if (err?.response?.status === 401) return;
      console.error("updateConversationStatus error:", err);
      setFriendlyError("Status update failed.");
    }
  }

  async function assignConversation() {
    if (!selectedConversation?.id) return;

    setSavingAssignment(true);
    try {
      await tryRequest([
        () =>
          axios.patch(`${API_BASE}/conversations/${selectedConversation.id}/assign`, {
            assignedTo: assignInput ? Number(assignInput) : null,
          }),
        () =>
          axios.patch(`${API_BASE}/conversations/${selectedConversation.id}`, {
            assignedTo: assignInput ? Number(assignInput) : null,
          }),
      ]);

      markSuccessfulSync();
      await loadConversations();
    } catch (err) {
      if (err?.response?.status === 401) return;
      console.error("assignConversation error:", err);
      setFriendlyError("Assignment failed.");
    } finally {
      setSavingAssignment(false);
    }
  }

  async function addTag() {
    if (!selectedCustomerId || !newTag.trim()) return;

    setSavingTag(true);
    try {
      await tryRequest([
        () =>
          axios.post(`${API_BASE}/customers/${selectedCustomerId}/tags`, {
            tag: newTag.trim(),
          }),
        () =>
          axios.post(`${API_BASE}/customers/${selectedCustomerId}/tags`, {
            name: newTag.trim(),
          }),
      ]);

      setNewTag("");
      markSuccessfulSync();
      await loadTags(selectedCustomerId);
    } catch (err) {
      if (err?.response?.status === 401) return;
      console.error("addTag error:", err);
      setFriendlyError("Add tag failed.");
    } finally {
      setSavingTag(false);
    }
  }

  async function removeTag(tag) {
    if (!selectedCustomerId) return;

    try {
      await tryRequest([
        () =>
          axios.delete(`${API_BASE}/customers/${selectedCustomerId}/tags`, {
            data: { tag },
          }),
        () =>
          axios.post(`${API_BASE}/customers/${selectedCustomerId}/tags/remove`, {
            tag,
          }),
      ]);

      markSuccessfulSync();
      await loadTags(selectedCustomerId);
    } catch (err) {
      if (err?.response?.status === 401) return;
      console.error("removeTag error:", err);
      setFriendlyError("Remove tag failed.");
    }
  }

  async function addNote() {
    if (!selectedCustomerId || !noteInput.trim() || savingNote) return;

    setSavingNote(true);
    try {
      await axios.post(`${API_BASE}/customers/${selectedCustomerId}/notes`, {
        content: noteInput.trim(),
        created_by: "Bruce",
      });

      setNoteInput("");
      markSuccessfulSync();
      await loadNotes(selectedCustomerId);
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.error("addNote error:", err);
      setFriendlyError("Add handling log failed.");
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote(noteId) {
    if (!noteId || !selectedCustomerId) return;

    const confirmed = window.confirm("Delete this handling log entry?");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/customers/notes/${noteId}`);
      markSuccessfulSync();
      await loadNotes(selectedCustomerId);
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.error("deleteNote error:", err);
      setFriendlyError("Delete note failed.");
    }
  }

  async function retryFailedMessage() {
    if (!selectedConversation?.id) return;

    try {
      await tryRequest([
        () => axios.post(`${API_BASE}/conversations/${selectedConversation.id}/retry-failed`),
        () =>
          axios.post(`${API_BASE}/failed-messages/retry`, {
            conversationId: selectedConversation.id,
          }),
      ]);

      markSuccessfulSync();
      await loadConversations();
      await loadMessages(selectedConversation.id);
    } catch (err) {
      if (err?.response?.status === 401) return;
      console.error("retryFailedMessage error:", err);
      setFriendlyError("Retry failed.");
    }
  }

  async function dismissFailedMessage() {
    if (!selectedConversation?.id) return;

    try {
      await tryRequest([
        () => axios.post(`${API_BASE}/conversations/${selectedConversation.id}/dismiss-failed`),
        () =>
          axios.post(`${API_BASE}/failed-messages/dismiss`, {
            conversationId: selectedConversation.id,
          }),
      ]);

      markSuccessfulSync();
      await loadConversations();
      await loadMessages(selectedConversation.id);
    } catch (err) {
      if (err?.response?.status === 401) return;
      console.error("dismissFailedMessage error:", err);
      setFriendlyError("Dismiss failed.");
    }
  }

  async function deleteFailedMessage() {
    if (!selectedConversation?.id) return;

    try {
      await tryRequest([
        () => axios.delete(`${API_BASE}/conversations/${selectedConversation.id}/failed-messages`),
        () =>
          axios.post(`${API_BASE}/failed-messages/delete`, {
            conversationId: selectedConversation.id,
          }),
      ]);

      markSuccessfulSync();
      await loadConversations();
      await loadMessages(selectedConversation.id);
    } catch (err) {
      if (err?.response?.status === 401) return;
      console.error("deleteFailedMessage error:", err);
      setFriendlyError("Delete failed message failed.");
    }
  }

  async function handleChangePassword() {
    setChangePasswordError("");
    setChangePasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangePasswordError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordError("New password must be at least 6 characters.");
      return;
    }

    if (currentPassword === newPassword) {
      setChangePasswordError("New password must be different from current password.");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await axios.patch(`${API_BASE}/auth/change-password`, {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.data?.success) {
        setChangePasswordSuccess("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          setShowChangePassword(false);
          setChangePasswordSuccess("");
        }, 1200);
      } else {
        setChangePasswordError(res.data?.message || "Failed to change password.");
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setChangePasswordError(
        err?.response?.data?.message || err?.message || "Failed to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  function closeChangePasswordModal() {
    if (changingPassword) return;
    setShowChangePassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordError("");
    setChangePasswordSuccess("");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("crm_user");
    setUser(null);
    setConversations([]);
    setMessages([]);
    setCustomerTags([]);
    setNotes([]);
    setCustomerDetail(null);
    setSelectedConversationId(null);
    setApiStatus("unknown");
    setSocketStatus("unknown");
    setLastSuccessfulSyncAt(null);
    setLastInboundSignalAt(null);
    setWarningBanner("");

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }

  const customerDisplayName =
    customerDetail?.name ||
    customerDetail?.customer_name ||
    customerDetail?.profile_name ||
    selectedConversation?.customer_name ||
    selectedConversation?.profile_name ||
    selectedConversation?.phone ||
    "Unknown";

  const customerPhone =
    customerDetail?.phone ||
    selectedConversation?.phone ||
    "-";

  const customerNotesText =
    customerDetail?.notes ||
    "";

  const filteredCounts = useMemo(() => {
    return {
      all: conversations.length,
      open: conversations.filter((c) => c.status === "open").length,
      unread: conversations.filter((c) => Number(c.unread_count) > 0).length,
      closed: conversations.filter((c) => c.status === "closed").length,
    };
  }, [conversations]);

  const systemHealth = useMemo(() => {
    if (apiStatus === "disconnected") return "down";
    if (socketStatus === "disconnected") return "warning";
    if (apiStatus === "unknown" || socketStatus === "unknown") return "warning";
    return "healthy";
  }, [apiStatus, socketStatus]);

  const systemHealthLabel =
    systemHealth === "healthy"
      ? "🟢 System Healthy"
      : systemHealth === "warning"
      ? "🟡 Warning"
      : "🔴 System Down";

  const systemHealthClass =
    systemHealth === "healthy"
      ? "bg-green-100 text-green-700 border border-green-200"
      : systemHealth === "warning"
      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
      : "bg-red-100 text-red-700 border border-red-200";

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={setUser} />;
  }

  return (
    <div className="h-screen bg-gray-100 text-gray-900">
      <div className="h-full flex flex-col">
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
              Last sync: {lastSuccessfulSyncAt ? formatDateTime(lastSuccessfulSyncAt) : "No sync yet"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadConversations}
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

            <div className={`px-3 py-2 rounded text-sm ${systemHealthClass}`}>
              {systemHealthLabel}
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
              type="button"
            >
              Logout
            </button>
          </div>
        </div>

        {warningBanner ? (
          <div className="px-4 py-2 text-sm bg-yellow-50 border-b border-yellow-200 text-yellow-800">
            {warningBanner}
          </div>
        ) : null}

        {errorBanner ? (
          <div className="px-4 py-2 text-sm bg-red-50 border-b border-red-200 text-red-700">
            {errorBanner}
          </div>
        ) : null}

        <div className="flex-1 min-h-0 flex">
          <div className="w-[360px] bg-white border-r flex flex-col min-h-0">
            <div className="p-3 border-b">
              <input
                type="text"
                placeholder="Search by name, phone, or message"
                className="w-full border rounded px-3 py-2 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="mt-3 flex gap-2 flex-wrap">
                {[
                  { key: "all", label: "All" },
                  { key: "mine", label: "Mine" },
                  { key: "unassigned", label: "Unassigned" },
                  { key: "failed", label: "Failed" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setScope(item.key)}
                    className={`px-3 py-1.5 text-sm rounded border ${
                      scope === item.key
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {[
                  { key: "all", label: `All ${filteredCounts.all}` },
                  { key: "open", label: `Open ${filteredCounts.open}` },
                  { key: "unread", label: `Unread ${filteredCounts.unread}` },
                  { key: "closed", label: `Closed ${filteredCounts.closed}` },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setStatusFilter(item.key)}
                    className={`px-3 py-1.5 text-sm rounded border ${
                      statusFilter === item.key
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-4 text-sm text-gray-500">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No conversations found.</div>
              ) : (
                conversations.map((conv) => {
                  const active = sameId(selectedConversationId, conv.id);

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${
                        active ? "bg-blue-50" : "bg-white"
                      }`}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold truncate">{getDisplayName(conv)}</div>

                            {Number(conv.unread_count || 0) > 0 && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                {conv.unread_count}
                              </span>
                            )}

                            {Number(conv.failed_count || 0) > 0 && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                Failed {conv.failed_count}
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-500 truncate">{conv.phone}</div>

                          <div className="mt-1 text-sm truncate">
                            {conv.last_message_preview || "No messages yet"}
                          </div>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                conv.status === "closed"
                                  ? "bg-gray-200 text-gray-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {conv.status || "open"}
                            </span>

                            {conv.assigned_to ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {conv.assigned_username || `User #${conv.assigned_to}`}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-gray-400 whitespace-nowrap">
                          {formatMessageTime(conv.last_message_at)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {selectedConversation ? (
              <>
                <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{getDisplayName(selectedConversation)}</div>
                    <div className="text-sm text-gray-500">
                      {selectedConversation.phone} · Conversation ID: {selectedConversation.id}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                      onClick={markRead}
                      className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
                      type="button"
                    >
                      Mark Read
                    </button>

                    {selectedConversation.status === "closed" ? (
                      <button
                        onClick={() => updateConversationStatus("open")}
                        className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
                        type="button"
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        onClick={() => updateConversationStatus("closed")}
                        className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
                        type="button"
                      >
                        Close
                      </button>
                    )}

                    <button
                      onClick={retryFailedMessage}
                      className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
                      type="button"
                    >
                      Retry Failed
                    </button>

                    <button
                      onClick={dismissFailedMessage}
                      className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
                      type="button"
                    >
                      Dismiss Failed
                    </button>

                    <button
                      onClick={deleteFailedMessage}
                      className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
                      type="button"
                    >
                      Delete Failed
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 bg-gray-50">
                  {loadingMessages ? (
                    <div className="text-sm text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-gray-500">No messages yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOutbound =
                          msg.direction === "outbound" ||
                          msg.direction === "out" ||
                          msg.direction === "sent";

                        const media = msg.media_assets?.[0];
                        const mediaUrl = media ? mediaUrlMap[media.id] : null;

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                                isOutbound
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-gray-900 border"
                              }`}
                            >
                              {msg.content ? (
                                <div className="whitespace-pre-wrap break-words text-sm">
                                  {msg.content}
                                </div>
                              ) : null}

                              {media && mediaUrl ? (
                                <div className="mt-2">
                                  {media.media_type === "image" ? (
                                    <img
                                      src={mediaUrl}
                                      alt={media.original_filename || "image"}
                                      className="max-w-[220px] rounded-lg cursor-pointer"
                                    />
                                  ) : null}

                                  {media.media_type === "video" ? (
                                    <video
                                      src={mediaUrl}
                                      controls
                                      className="max-w-[220px] rounded-lg"
                                    />
                                  ) : null}
                                </div>
                              ) : null}

                              <div
                                className={`mt-1 text-[11px] ${
                                  isOutbound ? "text-blue-100" : "text-gray-400"
                                }`}
                              >
                                {formatMessageTime(msg.created_at)}
                                {msg.status ? ` · ${msg.status}` : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <textarea
                      rows={3}
                      className="flex-1 border rounded px-3 py-2 text-sm"
                      placeholder="Type a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending}
                      className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                      type="button"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation
              </div>
            )}
          </div>

          <div className="w-[360px] bg-white border-l flex flex-col min-h-0">
            {selectedConversation ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <div className="text-lg font-semibold">
                    {loadingCustomer ? "Loading..." : customerDisplayName}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{customerPhone}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Status: {selectedConversation.status}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Last message: {formatDateTime(selectedConversation.last_message_at)}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-semibold mb-2">Assigned To</div>

                  <div className="flex gap-2">
                    <select
                      className="flex-1 border rounded px-3 py-2 text-sm bg-white"
                      value={assignInput}
                      onChange={(e) => setAssignInput(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {assignableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={assignConversation}
                      disabled={savingAssignment}
                      className="px-3 py-2 rounded bg-gray-900 text-white text-sm disabled:opacity-50"
                      type="button"
                    >
                      {savingAssignment ? "Saving..." : "Assign"}
                    </button>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Current: {selectedConversation.assigned_username || "Unassigned"}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-semibold mb-2">Tags</div>

                  <div className="flex items-start gap-2 mb-3">
                    <input
                      className="flex-1 border rounded px-3 py-2 text-sm"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTag();
                      }}
                    />
                    <button
                      onClick={addTag}
                      disabled={savingTag}
                      className="px-3 py-2 rounded bg-gray-900 text-white text-sm disabled:opacity-50"
                      type="button"
                    >
                      {savingTag ? "Adding..." : "Add"}
                    </button>
                  </div>

                  {loadingTags ? (
                    <div className="text-sm text-gray-500">Loading tags...</div>
                  ) : customerTags.length === 0 ? (
                    <div className="text-sm text-gray-500">No tags</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {customerTags.map((tag, idx) => {
                        const tagText =
                          typeof tag === "string"
                            ? tag
                            : tag.name ?? tag.tag ?? tag.label ?? `tag-${idx}`;

                        return (
                          <div
                            key={`${tagText}-${idx}`}
                            className="flex items-center gap-2 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs"
                          >
                            <span>{tagText}</span>
                            <button
                              onClick={() => removeTag(tagText)}
                              className="font-bold hover:text-red-600"
                              type="button"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-semibold mb-2">Customer Notes</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap rounded border bg-gray-50 p-3 min-h-[80px]">
                    {customerNotesText || "No customer notes."}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-semibold mb-2">Handling Log</div>

                  <div className="flex items-start gap-2 mb-3">
                    <textarea
                      className="flex-1 border rounded p-2 text-sm"
                      rows={3}
                      placeholder="Add handling update, decision, or follow-up..."
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                    />

                    <button
                      onClick={addNote}
                      disabled={savingNote}
                      className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
                      type="button"
                    >
                      {savingNote ? "Saving..." : "Add"}
                    </button>
                  </div>

                  {loadingNotes ? (
                    <div className="text-sm text-gray-500">Loading handling log...</div>
                  ) : notes.length === 0 ? (
                    <div className="text-sm text-gray-500">No handling updates yet.</div>
                  ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto">
                      {notes
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(b.created_at || 0).getTime() -
                            new Date(a.created_at || 0).getTime()
                        )
                        .map((n) => (
                          <div
                            key={n.id}
                            className="border rounded-lg p-3 bg-white shadow-sm"
                          >
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span className="font-medium text-gray-700">
                                    {n.created_by || "Bruce"}
                                  </span>
                                  <span>{formatMessageTime(n.created_at)}</span>
                                </div>

                                <div className="mt-2">
                                  <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    Handling
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => deleteNote(n.id)}
                                className="text-xs text-gray-400 hover:text-red-600 px-2 py-1"
                                type="button"
                              >
                                Delete
                              </button>
                            </div>

                            <div className="text-sm whitespace-pre-wrap break-words">
                              {n.content || n.note || ""}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Customer details
              </div>
            )}
          </div>
        </div>
      </div>

      {showChangePassword && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <div className="text-xl font-semibold">Change Password</div>
            <div className="text-sm text-gray-500 mt-1">
              Update your account password
            </div>

            <div className="mt-5 space-y-3">
              <input
                type="password"
                placeholder="Current Password"
                className="w-full border rounded px-3 py-2 text-sm"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />

              <input
                type="password"
                placeholder="New Password"
                className="w-full border rounded px-3 py-2 text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full border rounded px-3 py-2 text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />

              {changePasswordError ? (
                <div className="text-sm text-red-600">{changePasswordError}</div>
              ) : null}

              {changePasswordSuccess ? (
                <div className="text-sm text-green-600">{changePasswordSuccess}</div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeChangePasswordModal}
                disabled={changingPassword}
                className="px-4 py-2 rounded border bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                type="button"
              >
                {changingPassword ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}