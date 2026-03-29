import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  getTemplatesByDepartment,
  getTemplateStatusLabel,
} from "./config/messageTemplates";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const SOCKET_BASE =
  import.meta.env.VITE_SOCKET_BASE || "http://localhost:3000";

console.log("API_BASE =", API_BASE);

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

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

function getMediaKind(media = {}) {
  if (media.media_type) return media.media_type;

  const mime = media.mime_type || media.mimetype || "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

function getTemplateWaitingState(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) return false;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];

    if (msg.direction === "outbound" && msg.message_type === "template") {
      const hasReplyAfter = messages.slice(i + 1).some(
        (m) => m.direction === "inbound"
      );

      return !hasReplyAfter;
    }
  }

  return false;
}
function getMediaFileName(media = {}) {
  return (
    media.original_filename ||
    media.file_name ||
    media.filename ||
    media.name ||
    "attachment"
  );
}

function getStatusLabel(status) {
  const raw = String(status || "").toLowerCase();

  if (raw === "sending") return "⏳ Sending...";
  if (raw === "sent") return "✔ Sent";
  if (raw === "delivered") return "✔ Delivered";
  if (raw === "read") return "👁 Read";
  if (raw === "failed") return "❌ Failed";
  if (raw === "received") return "Received";
  return raw || "";
}

function isProbablyUrl(text = "") {
  return /^https?:\/\/\S+$/i.test(String(text).trim());
}

function renderTextWithLinks(text = "") {
  const raw = String(text || "");
  const parts = raw.split(/(https?:\/\/[^\s]+)/gi);

  return parts.map((part, index) => {
    if (isProbablyUrl(part)) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="underline break-all"
        >
          {part}
        </a>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function getFileBadge(mediaType = "") {
  const t = String(mediaType || "").toLowerCase();
  if (t === "image") return "Image";
  if (t === "video") return "Video";
  if (t === "audio") return "Audio";
  if (t === "document") return "Document";
  return "File";
}

function getMessageText(row = {}) {
  return (
    row.content ??
    row.text ??
    row.text_content ??
    row.message_text ??
    row.body ??
    row.caption ??
    row.preview ??
    ""
  );
}

function getMessageMeta(row = {}) {
  return (
    row.meta ||
    row.metadata ||
    row.extra ||
    row.payload ||
    row.raw?.meta ||
    row.raw?.metadata ||
    row.raw?.extra ||
    row.raw?.payload ||
    {}
  );
}

function isOutboundDirection(value = "") {
  const direction = String(value || "").toLowerCase();
  return (
    direction === "outbound" ||
    direction === "out" ||
    direction === "sent" ||
    direction === "agent"
  );
}

function getFallbackFileName(row = {}) {
  const meta = getMessageMeta(row);
  const rawPayload = row.raw_payload || row.raw?.raw_payload || {};

  return (
    row.file_name ||
    row.filename ||
    row.media_name ||
    row.document_name ||
    meta.file_name ||
    meta.filename ||
    meta.media_name ||
    meta.document_name ||
    rawPayload._file_name ||
    (Array.isArray(row.media_assets) && row.media_assets.length > 0
      ? getMediaFileName(row.media_assets[0])
      : null) ||
    (Array.isArray(row.raw?.media_assets) && row.raw.media_assets.length > 0
      ? getMediaFileName(row.raw.media_assets[0])
      : null) ||
    "attachment"
  );
}

function isLargeFileFallback(row = {}) {
  const meta = getMessageMeta(row);
  const rawPayload = row.raw_payload || row.raw?.raw_payload || {};
  const text = String(getMessageText(row) || "").toLowerCase();

  if (
    rawPayload?._transport === "r2_link" ||
    rawPayload?._fallback_reason ||
    rawPayload?._media_url
  ) {
    return true;
  }

  const explicitFlags = [
    row.is_fallback,
    row.is_large_file_fallback,
    row.large_file_fallback,
    row.fallback_to_link,
    row.sent_as_link,
    meta.is_fallback,
    meta.is_large_file_fallback,
    meta.large_file_fallback,
    meta.fallback_to_link,
    meta.sent_as_link,
  ];

  if (explicitFlags.some((value) => value === true)) {
    return true;
  }

  const explicitTypes = [
    row.fallback_type,
    row.delivery_mode,
    row.send_mode,
    row.message_subtype,
    row.transport,
    meta.fallback_type,
    meta.delivery_mode,
    meta.send_mode,
    meta.message_subtype,
    meta.transport,
    rawPayload._transport,
    rawPayload._fallback_reason,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  if (
    explicitTypes.some((value) =>
      [
        "large_file",
        "large-file",
        "fallback_link",
        "fallback-link",
        "link_fallback",
        "link-fallback",
        "sent_as_link",
        "sent-as-link",
        "large_file_fallback",
        "large-file-fallback",
        "r2_link",
        "r2-link",
        "force_link_over_20mb",
        "force-link-over-20mb",
      ].includes(value)
    )
  ) {
    return true;
  }

  if (
    text.includes("file too large") ||
    text.includes("sent as link") ||
    text.includes("fallback link") ||
    text.includes("download link") ||
    text.includes("文件过大") ||
    text.includes("改为链接发送") ||
    text.includes("已改为链接发送")
  ) {
    return true;
  }

  return false;
}

function getFallbackLink(row = {}, mediaUrlMap = {}) {
  const meta = getMessageMeta(row);
  const rawPayload = row.raw_payload || row.raw?.raw_payload || {};

  const direct =
    row.fallback_url ||
    row.download_url ||
    row.file_url ||
    row.link_url ||
    row.public_url ||
    row.media_url ||
    meta.fallback_url ||
    meta.download_url ||
    meta.file_url ||
    meta.link_url ||
    meta.public_url ||
    meta.media_url ||
    rawPayload._media_url;

  if (direct) return direct;

  const assets = Array.isArray(row.media_assets)
    ? row.media_assets
    : Array.isArray(row.raw?.media_assets)
    ? row.raw.media_assets
    : [];

  for (const media of assets) {
    if (media?.public_url) return media.public_url;
    if (media?.download_url) return media.download_url;
    if (media?.file_url) return media.file_url;
    if (media?.url) return media.url;
    if (media?.id && mediaUrlMap?.[media.id]) return mediaUrlMap[media.id];
  }

  const text = String(getMessageText(row) || "");
  const firstUrl = text.match(/https?:\/\/[^\s]+/i)?.[0];
  return firstUrl || "";
}

function shouldHideFallbackText(row = {}) {
  if (!isLargeFileFallback(row)) return false;

  const text = String(getMessageText(row) || "").trim();
  if (!text) return true;

  const normalized = text.toLowerCase();

  if (isProbablyUrl(text)) return true;

  if (
    normalized.includes("file too large") ||
    normalized.includes("sent as link") ||
    normalized.includes("fallback link") ||
    normalized.includes("download link") ||
    normalized.includes("文件过大") ||
    normalized.includes("改为链接发送") ||
    normalized.includes("已改为链接发送")
  ) {
    return true;
  }

  return false;
}

function getConversationPreviewText(row = {}) {
  const isOutbound = isOutboundDirection(
    row.direction ||
      row.message_direction ||
      row.last_message_direction ||
      row.lastMessageDirection ||
      row.raw?.direction ||
      row.raw?.message_direction ||
      row.raw?.last_message_direction ||
      row.raw?.lastMessageDirection ||
      (row.from_me ? "outbound" : "")
  );

  if (isOutbound && isLargeFileFallback(row)) {
    return `Large file sent as link: ${getFallbackFileName(row)}`;
  }

  const previewText =
    row.last_message_preview ??
    row.lastMessagePreview ??
    row.preview ??
    (getMessageText(row) || "");

  return previewText;
}

function OutboundFallbackCard({ msg, mediaUrlMap = {}, timeColor = "text-blue-100" }) {
  const link = getFallbackLink(msg, mediaUrlMap);
  const fileName = getFallbackFileName(msg);

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
      <div className="mb-2 inline-flex rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
        Sent as link
      </div>

      <div className="font-semibold">Large file fallback</div>

      <div className="mt-1 break-all">
        <span className="font-medium">File:</span> {fileName}
      </div>

      <div className="mt-1 leading-6">
        This file was too large to send as native WhatsApp media, so it was sent as a link instead.
      </div>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Open file link
        </a>
      ) : (
        <div className={`mt-3 text-xs ${timeColor}`}>Link unavailable</div>
      )}
    </div>
  );
}

function getConversationWindowInfo(messages = [], conversation = null) {
  const explicitExpiresAt =
    conversation?.service_window_expires_at ||
    conversation?.serviceWindowExpiresAt ||
    conversation?.raw?.service_window_expires_at ||
    conversation?.raw?.serviceWindowExpiresAt ||
    null;

  const now = Date.now();

  if (explicitExpiresAt) {
    const expiresAtMs = new Date(explicitExpiresAt).getTime();
    return {
      isOpen: Number.isFinite(expiresAtMs) ? expiresAtMs > now : true,
      expiresAt: explicitExpiresAt,
      lastCustomerMessageAt:
        conversation?.last_customer_message_at ||
        conversation?.raw?.last_customer_message_at ||
        null,
    };
  }

  const lastInbound = [...messages]
    .filter((msg) => {
      const direction = String(msg?.direction || "").toLowerCase();
      return direction === "inbound" || direction === "received";
    })
    .sort(
      (a, b) =>
        new Date(b?.created_at || 0).getTime() -
        new Date(a?.created_at || 0).getTime()
    )[0];

  if (!lastInbound?.created_at) {
    return { isOpen: true, expiresAt: null, lastCustomerMessageAt: null };
  }

  const lastInboundMs = new Date(lastInbound.created_at).getTime();
  const expiresAtMs = lastInboundMs + 24 * 60 * 60 * 1000;

  return {
    isOpen: expiresAtMs > now,
    expiresAt: new Date(expiresAtMs).toISOString(),
    lastCustomerMessageAt: lastInbound.created_at,
  };
}

function formatRemainingWindow(expiresAt) {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return "expired";

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m left`;
  return `${hours}h ${minutes}m left`;
}

function getDefaultTemplateParamValue(
  key,
  { customerDisplayName, selectedConversation } = {}
) {
  const normalized = String(key || "").trim();

  if (normalized === "customer_name") {
    return customerDisplayName && customerDisplayName !== "Unknown"
      ? customerDisplayName
      : "";
  }

  if (normalized === "phone") {
    return selectedConversation?.phone || "";
  }

  return "";
}

function looksLikePhoneNumber(value = "") {
  const normalized = String(value || "").replace(/[\s\-().]/g, "");
  return /^\+?\d{7,}$/.test(normalized);
}

function getPoliteTemplateName(value = "") {
  const raw = String(value || "").trim();

  if (!raw) return "";
  if (raw.toLowerCase() === "unknown") return "";
  if (raw.toLowerCase() === "null") return "";
  if (looksLikePhoneNumber(raw)) return "";
  if (raw.length > 24) return "";
  if (/^[^\p{L}\p{N}]+$/u.test(raw)) return "";

  return raw;
}
function renderTemplatePreview(template, params) {
  if (!template) return "";

  let text = template.description || "";

  const count = Number(template.bodyParamCount || 0);

  for (let i = 0; i < count; i++) {
    const value =
      i === 0
        ? getPoliteTemplateName(params[`param${i + 1}`] || "") || "there"
        : params[`param${i + 1}`] || "";

    const regex = new RegExp(`{{\\s*${i + 1}\\s*}}`, "g");
    text = text.replace(regex, value);
  }

  return text;
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
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [previewImageName, setPreviewImageName] = useState("");

  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [replyText, setReplyText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [mediaSendStage, setMediaSendStage] = useState("idle");
  const [predictedFallback, setPredictedFallback] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState(null);
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

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateParams, setTemplateParams] = useState({});
  const previewCustomerName =
    getPoliteTemplateName(templateParams.param1 || "") || "there";
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedConversationIdRef = useRef(null);
  const fileInputRef = useRef(null);

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
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => sameId(c.id, selectedConversationId)) || null;
  }, [conversations, selectedConversationId]);

  const selectedCustomerId = useMemo(() => {
    return (
      selectedConversation?.customer_id ||
      customerDetail?.id ||
      customerDetail?.customer_id ||
      null
    );
  }, [selectedConversation, customerDetail]);

  const conversationWindow = useMemo(() => {
    return getConversationWindowInfo(messages, selectedConversation);
  }, [messages, selectedConversation]);

  const isWindowExpired = !conversationWindow.isOpen;

  const isWaitingReply = getTemplateWaitingState(messages);

  const latestFailedMessage = useMemo(() => {
    return (
      [...messages]
        .filter(
          (m) => isOutboundDirection(m.direction) && String(m.status || "").toLowerCase() === "failed"
        )
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        )[0] || null
    );
  }, [messages]);

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
    setMediaUrlMap({});
    setPreviewImageUrl("");
    setPreviewImageName("");
    setSelectedFile(null);
    setPredictedFallback(false);
    setMediaSendStage("idle");
    setRetryingMessageId(null);
  }, []);

  const closeImagePreview = useCallback(() => {
    setPreviewImageUrl("");
    setPreviewImageName("");
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
      last_message_preview: getConversationPreviewText(row),
      last_message_at:
        row.last_message_at ??
        row.lastMessageAt ??
        row.updated_at ??
        row.updatedAt ??
        row.created_at ??
        null,
      last_message_direction:
        row.last_message_direction ??
        row.lastMessageDirection ??
        row.direction ??
        row.message_direction ??
        null,
      last_message_type:
        row.last_message_type ??
        row.lastMessageType ??
        row.type ??
        row.message_type ??
        null,
      last_message_file_name:
        row.last_message_file_name ??
        row.lastMessageFileName ??
        row.file_name ??
        row.filename ??
        null,
      is_large_file_fallback: isLargeFileFallback(row),
      failed_count: Number(
        row.failed_count ?? row.failedCount ?? (row.has_failed ? 1 : 0)
      ),
      raw: row,
    };
  }

  function normalizeMessage(row = {}) {
    const createdAt =
      row.created_at ??
      row.createdAt ??
      row.sent_at ??
      row.sentAt ??
      row.timestamp ??
      new Date().toISOString();

    let status = row.status ?? "sent";
    const createdAtMs = new Date(createdAt).getTime();
    const rawPayload = row.raw_payload ?? row.rawPayload ?? {};

    if (
      status === "sending" &&
      Number.isFinite(createdAtMs) &&
      Date.now() - createdAtMs > 30000
    ) {
      status = "failed";
    }

    return {
      id: row.id,
      conversation_id: row.conversation_id ?? row.conversationId ?? null,
      customer_id: row.customer_id ?? row.customerId ?? null,
      direction:
        row.direction ??
        row.message_direction ??
        (row.from_me ? "outbound" : "inbound"),
      content: getMessageText(row),
      created_at: createdAt,
      status,
      type: row.type ?? row.message_type ?? "text",
      file_name:
        row.file_name ??
        row.filename ??
        row.media_name ??
        row.document_name ??
        rawPayload._file_name ??
        null,
      fallback_url:
        row.fallback_url ??
        row.download_url ??
        row.file_url ??
        row.link_url ??
        row.public_url ??
        row.media_url ??
        rawPayload._media_url ??
        null,
      is_large_file_fallback: isLargeFileFallback(row),
      wa_message_id: row.wa_message_id ?? row.waMessageId ?? null,
      whatsapp_message_id:
        row.whatsapp_message_id ?? row.whatsappMessageId ?? null,
      media_assets: Array.isArray(row.media_assets) ? row.media_assets : [],
      raw_payload: rawPayload,
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

  const loadConversations = useCallback(
    async (options = {}) => {
      const { silent = false } = options;

      if (!user) return;

      if (!silent) {
        setLoadingConversations(true);
      }

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
        } else if (scope === "mine") {
          normalized = normalized.filter(
            (c) =>
              String(c.assigned_to || "") === String(user?.id ?? "") ||
              String(c.assigned_to || "") === String(user?.username ?? "")
          );
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

        setConversations((prev) => {
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(normalized);
          return prevStr === nextStr ? prev : normalized;
        });

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

        if (!silent) {
          setFriendlyError("Failed to load conversations.");
        }
      } finally {
        if (!silent) {
          setLoadingConversations(false);
        }
      }
    },
    [
      user,
      scope,
      statusFilter,
      search,
      tryRequest,
      setFriendlyError,
      markSuccessfulSync,
    ]
  );

  const loadMessages = useCallback(
    async (conversationId, options = {}) => {
      const { silent = false } = options;

      if (!conversationId || !user) {
        setMessages([]);
        return;
      }

      if (!silent) {
        setLoadingMessages(true);
      }

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

        if (!silent) {
          setTimeout(() => {
            scrollMessagesToBottom(false);
          }, 120);
        }
      } catch (err) {
        if (err?.response?.status === 401) return;
        console.error("loadMessages error:", err);
        setApiConnected(false);
        setApiStatus("disconnected");
        if (!silent) {
          setFriendlyError("Failed to load messages.");
        }
      } finally {
        if (!silent) {
          setLoadingMessages(false);
        }
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
        console.error("loadNotes error:", err?.response?.data || err);
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
      loadConversations({ silent: true });
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

    loadMessages(selectedConversation.id, { silent: false });
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

    const timer = setTimeout(() => {
      scrollMessagesToBottom(false);
    }, 200);

    scrollMessagesToBottom(false);

    return () => clearTimeout(timer);
  }, [messages, scrollMessagesToBottom]);

  useEffect(() => {
    const loadMediaUrls = async () => {
      const newMap = {};

      for (const msg of messages) {
        if (!msg.media_assets?.length) continue;

        for (const media of msg.media_assets) {
          if (!media?.id) continue;
          if (mediaUrlMap[media.id]) continue;

          try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${API_BASE}/media/${media.id}/url`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const data = await res.json();

            if (data?.success && data?.data?.url) {
              newMap[media.id] = data.data.url;
            } else if (data?.url) {
              newMap[media.id] = data.url;
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
  }, [messages, mediaUrlMap]);

  useEffect(() => {
    if (!previewImageUrl) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        closeImagePreview();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewImageUrl, closeImagePreview]);

  useEffect(() => {
    if (!user) return;

    const heartbeat = setInterval(async () => {
      try {
        await axios.get(`${API_BASE}/health`);
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
        setFriendlyWarning(
          "No new incoming activity for over 10 minutes. Please check webhook/system status."
        );
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
      if (!conversation) return;

      const incoming = normalizeConversation(conversation);

      setConversations((prev) => {
        const exists = prev.some((c) => sameId(c.id, incoming.id));
        const next = exists
          ? prev.map((c) => (sameId(c.id, incoming.id) ? { ...c, ...incoming } : c))
          : [incoming, ...prev];

        const prevStr = JSON.stringify(prev);
        const nextStr = JSON.stringify(next);
        return prevStr === nextStr ? prev : next;
      });

      markSuccessfulSync();
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

      loadConversations({ silent: true });
    });

    socket.on("message:status", ({ messageId, waMessageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => {
          const sameMessage =
            sameId(m.id, messageId) ||
            sameId(m.wa_message_id, waMessageId) ||
            sameId(m.whatsapp_message_id, waMessageId);

          return sameMessage ? { ...m, status: status ?? m.status } : m;
        })
      );

      markSuccessfulSync();
      loadConversations({ silent: true });
    });

    socket.on("message:deleted", ({ messageId, conversationId }) => {
      if (sameId(selectedConversationIdRef.current, conversationId)) {
        setMessages((prev) => prev.filter((m) => !sameId(m.id, messageId)));
      }

      markSuccessfulSync();
      loadConversations({ silent: true });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, loadConversations, scrollMessagesToBottom, markSuccessfulSync]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadConversations({ silent: true });
    }, 20000);

    return () => clearInterval(interval);
  }, [user, loadConversations]);

  function willUseLinkFallback(file) {
    if (!file) return false;
    return Number(file.size || 0) > 20 * 1024 * 1024;
  }

  function handleSelectFile(e) {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setMediaSendStage("idle");
    setPredictedFallback(willUseLinkFallback(file));
  }

  async function sendReply() {
    if (!selectedConversation?.id || !replyText.trim() || sending) return;

    if (isWindowExpired) {
      setFriendlyWarning("Free-form reply expired. Please send an approved template.");
      return;
    }

    setSending(true);

    try {
      await axios.post(`${API_BASE}/messages/send`, {
        conversationId: selectedConversation.id,
        text: replyText,
      });

      setReplyText("");
      markSuccessfulSync();
      await loadMessages(selectedConversation.id, { silent: true });
      await loadConversations({ silent: true });
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

  async function sendMediaMessage() {
    if (
      !selectedConversation?.id ||
      !selectedCustomerId ||
      !selectedFile ||
      sendingMedia
    ) {
      return;
    }

    if (isWindowExpired) {
      setFriendlyWarning("Free-form reply expired. Please send an approved template.");
      return;
    }

    setSendingMedia(true);
    setMediaSendStage("uploading");

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("conversationId", selectedConversation.id);
      formData.append("customerId", selectedCustomerId);
      formData.append("caption", replyText?.trim() || "");

      const uploadRes = await fetch(`${API_BASE}/media/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData?.success || !uploadData?.data?.id) {
        throw new Error(uploadData?.message || "Media upload failed");
      }

      const mediaId = uploadData.data.id;
      setMediaSendStage("sending");

      const sendRes = await axios.post(`${API_BASE}/messages/send-media`, {
        conversationId: selectedConversation.id,
        customerId: selectedCustomerId,
        mediaId,
        caption: replyText?.trim() || "",
      });

      if (!sendRes.data?.success) {
        throw new Error(sendRes.data?.message || "Send media failed");
      }

      setSelectedFile(null);
      setReplyText("");
      setPredictedFallback(false);
      setMediaSendStage("idle");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      markSuccessfulSync();
      await loadMessages(selectedConversation.id, { silent: true });
      await loadConversations({ silent: true });
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      console.error("sendMediaMessage error:", err);
      setFriendlyError(
        err?.response?.data?.message || err?.message || "Send media failed."
      );
    } finally {
      setSendingMedia(false);
      setMediaSendStage("idle");
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
    const customerId = String(selectedCustomerId || "").trim();
    const content = String(noteInput || "").trim();

    if (!customerId || !content || savingNote) return;

    setSavingNote(true);

    try {
      const res = await axios.post(`${API_BASE}/customers/${customerId}/notes`, {
        content,
        created_by: user?.username || "Bruce",
      });

      const createdNote =
        res.data?.note ||
        res.data?.data ||
        null;

      setNoteInput("");
      markSuccessfulSync();

      if (createdNote) {
        setNotes((prev) => [
          {
            ...createdNote,
            content: createdNote.content || createdNote.note || content,
          },
          ...prev,
        ]);
      }

      await loadNotes(customerId);
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      console.error("addNote error:", {
        customerId,
        selectedConversationId,
        selectedCustomerId,
        response: err?.response?.data,
        message: err?.message,
      });

      setFriendlyError(
        err?.response?.data?.message || "Add handling log failed."
      );
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

      setNotes((prev) => prev.filter((n) => !sameId(n.id, noteId)));
      markSuccessfulSync();
      await loadNotes(selectedCustomerId);
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      console.error("deleteNote error:", err?.response?.data || err);
      setFriendlyError(
        err?.response?.data?.message || "Delete note failed."
      );
    }
  }

  async function retryFailedMessage(failedMsg = null) {
  if (!selectedConversation?.id) return;

  const target = failedMsg || latestFailedMessage || null;
  if (!target) return;

  const targetMessageId = target.id || "__conversation__";
  setRetryingMessageId(targetMessageId);

  try {
    const hasMedia =
      Array.isArray(target.media_assets) && target.media_assets.length > 0;
    const firstMedia = hasMedia ? target.media_assets[0] : null;

    if (hasMedia && firstMedia?.id) {
      const captionText = String(target.content || "").trim();
      const placeholderTexts = new Set([
        "[image message]",
        "[video message]",
        "[audio message]",
        "[document message]",
        "[file message]",
      ]);

      const safeCaption = placeholderTexts.has(captionText.toLowerCase())
        ? ""
        : captionText;

      const res = await axios.post(`${API_BASE}/messages/send-media`, {
        conversationId: selectedConversation.id,
        customerId: selectedCustomerId,
        mediaId: firstMedia.id,
        caption: safeCaption,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Retry media failed");
      }
    } else {
      const text = String(target.content || "").trim();

      if (!text) {
        throw new Error("No retryable content found.");
      }

      const res = await axios.post(`${API_BASE}/messages/send`, {
        conversationId: selectedConversation.id,
        text,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Retry text failed");
      }
    }

    markSuccessfulSync();
    await loadConversations({ silent: true });
    await loadMessages(selectedConversation.id, { silent: true });
  } catch (err) {
    if (err?.response?.status === 401) return;
    console.error("retryFailedMessage error:", err);
    setFriendlyError(
      err?.response?.data?.message || err?.message || "Retry failed."
    );
  } finally {
    setRetryingMessageId(null);
  }
}

  async function dismissFailedMessage() {
    if (!selectedConversation?.id) return;

    try {
      await tryRequest([
        () =>
          axios.post(
            `${API_BASE}/conversations/${selectedConversation.id}/dismiss-failed`
          ),
        () =>
          axios.post(`${API_BASE}/failed-messages/dismiss`, {
            conversationId: selectedConversation.id,
          }),
      ]);

      markSuccessfulSync();
      await loadConversations({ silent: true });
      await loadMessages(selectedConversation.id, { silent: true });
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
        () =>
          axios.delete(
            `${API_BASE}/conversations/${selectedConversation.id}/failed-messages`
          ),
        () =>
          axios.post(`${API_BASE}/failed-messages/delete`, {
            conversationId: selectedConversation.id,
          }),
      ]);

      markSuccessfulSync();
      await loadConversations({ silent: true });
      await loadMessages(selectedConversation.id, { silent: true });
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
      setChangePasswordError(
        "New password must be different from current password."
      );
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
        setChangePasswordError(
          res.data?.message || "Failed to change password."
        );
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setChangePasswordError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to change password."
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
    setMediaUrlMap({});
    setPreviewImageUrl("");
    setPreviewImageName("");
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

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

  const customerPhone = customerDetail?.phone || selectedConversation?.phone || "-";
  const templateDepartment = useMemo(() => {
  const role = String(user?.role || "").toLowerCase();

  if (role === "sales") return "sales";
  if (role === "support") return "support";
  return "all";
}, [user?.role]);

const templates = useMemo(() => {
  return getTemplatesByDepartment(templateDepartment);
}, [templateDepartment]);

  
  function openTemplatePicker() {
  setShowTemplatePicker(true);
  setTemplatesError("");
}

function closeTemplatePicker() {
  if (sendingTemplate) return;
  setShowTemplatePicker(false);
  setSelectedTemplate(null);
  setTemplateParams({});
  setTemplatesError("");
}

function selectTemplate(template) {
  setSelectedTemplate(template);

  const defaults = {};
  const count = Number(template?.bodyParamCount || 0);

  for (let i = 0; i < count; i += 1) {
    const key = `param${i + 1}`;

    if (i === 0) {
  defaults[key] = getPoliteTemplateName(customerDisplayName);
} else {
  defaults[key] = "";
   }
  }

  setTemplateParams(defaults);
  setTemplatesError("");
}

function updateTemplateParam(key, value) {
  setTemplateParams((prev) => ({
    ...prev,
    [key]: value,
  }));
}

async function sendTemplateMessage() {
  if (!selectedConversation?.id || !selectedTemplate || sendingTemplate) return;

  const paramCount = Number(selectedTemplate.bodyParamCount || 0);
  const bodyParams = [];

  for (let i = 0; i < paramCount; i += 1) {
  const key = `param${i + 1}`;
  let value = String(templateParams[key] || "").trim();

  if (i === 0) {
    value = getPoliteTemplateName(value) || "there";
  }

  if (!value) {
    const label =
      selectedTemplate.bodyParamLabels?.[i] || `Parameter ${i + 1}`;
    setTemplatesError(`${label} is required.`);
    return;
  }

  bodyParams.push(value);
}

  setSendingTemplate(true);
  setTemplatesError("");

  try {
    const res = await axios.post(`${API_BASE}/messages/send-template`, {
      conversationId: selectedConversation.id,
      to: customerPhone === "-" ? "" : customerPhone,
      templateName: selectedTemplate.templateName,
      languageCode: selectedTemplate.languageCode || "en_US",
      bodyParams,
    });

    if (!res.data?.success) {
      throw new Error(res.data?.message || "Send template failed");
    }

    closeTemplatePicker();
    markSuccessfulSync();
    setFriendlyWarning(
      "Template sent. Waiting for customer reply to reopen the 24h window."
    );
    await loadMessages(selectedConversation.id, { silent: true });
    await loadConversations({ silent: true });
  } catch (err) {
    if (err?.response?.status === 401) {
      handleUnauthorized();
      return;
    }

    console.error("sendTemplateMessage error:", err);
    setTemplatesError(
      err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to send template."
    );
  } finally {
    setSendingTemplate(false);
  }
}

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
    <>
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
          <div className="w-[280px] bg-white border-r flex flex-col min-h-0">
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
                <div className="p-4 text-sm text-gray-500">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  No conversations found.
                </div>
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
                            <div className="font-semibold truncate">
                              {getDisplayName(conv)}
                            </div>

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

                          <div className="text-sm text-gray-500 truncate">
                            {conv.phone}
                          </div>

                          <div className="mt-1 text-sm truncate">
                            {getConversationPreviewText(conv) || "No messages yet"}
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
                                {conv.assigned_username ||
                                  `User #${conv.assigned_to}`}
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
                    <div className="font-semibold text-lg">
                      {getDisplayName(selectedConversation)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedConversation.phone} · Conversation ID:{" "}
                      {selectedConversation.id}
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
                      onClick={() => retryFailedMessage(latestFailedMessage)}
                      disabled={!latestFailedMessage || Boolean(retryingMessageId)}
                      className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
                      type="button"
                    >
                      {retryingMessageId ? "Retrying..." : "Retry Failed"}
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
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOutbound = isOutboundDirection(msg.direction);
                        const isFallback =
  isOutbound && (msg.is_large_file_fallback || isLargeFileFallback(msg));

                        const bubbleBase = isOutbound
                          ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                          : "bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-md";

                        const timeColor = isOutbound ? "text-blue-100" : "text-gray-400";
                        const subtleCard = isOutbound
                          ? "bg-white/10 border border-white/20"
                          : "bg-gray-50 border border-gray-200";

                        const visibleText = shouldHideFallbackText(msg)
                          ? ""
                          : String(msg.content || "").trim();

                        const hasVisibleText = Boolean(visibleText);

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${
                              isOutbound ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div className={isOutbound 
  ? "w-fit max-w-[85%] min-w-0" 
  : "w-fit max-w-[75%] min-w-0"
}>
                              <div
                                className={`${bubbleBase} px-4 py-3 shadow-sm overflow-hidden`}
                              >
                                {hasVisibleText ? (
                                  <div className="text-sm leading-6 whitespace-pre-wrap break-words break-all">
                                    {renderTextWithLinks(visibleText)}
                                  </div>
                                ) : null}

                                {isFallback ? (
                                  <div className={hasVisibleText ? "mt-3" : ""}>
                                    <OutboundFallbackCard
                                      msg={msg}
                                      mediaUrlMap={mediaUrlMap}
                                      timeColor={timeColor}
                                    />
                                  </div>
                                ) : msg.media_assets?.length > 0 ? (
                                  <div className={`${hasVisibleText ? "mt-3" : ""} space-y-3`}>
                                    {msg.media_assets.map((media) => {
                                      const mediaUrl =
                                        media?.public_url ||
                                        media?.download_url ||
                                        media?.file_url ||
                                        media?.url ||
                                        (media?.id ? mediaUrlMap[media.id] : null);
                                      if (!mediaUrl) return null;

                                      const mediaType = getMediaKind(media);
                                      const fileName = getMediaFileName(media);

                                      if (mediaType === "image") {
                                        return (
                                          <div key={media.id || `${msg.id}-${fileName}`}>
                                            <img
                                              src={mediaUrl}
                                              alt={fileName}
                                              className="
                                                w-full max-w-[320px] max-h-[360px]
                                                object-cover rounded-2xl cursor-zoom-in
                                                hover:opacity-95 transition
                                              "
                                              onClick={() => {
                                                setPreviewImageUrl(mediaUrl);
                                                setPreviewImageName(fileName);
                                              }}
                                            />
                                            {fileName && fileName !== "attachment" ? (
                                              <div className={`mt-2 text-xs ${timeColor} break-all`}>
                                                {fileName}
                                              </div>
                                            ) : null}
                                          </div>
                                        );
                                      }

                                      if (mediaType === "video") {
                                        return (
                                          <div key={media.id || `${msg.id}-${fileName}`}>
                                            <video
                                              src={mediaUrl}
                                              controls
                                              className="w-full max-w-[320px] rounded-2xl"
                                            />
                                            <div className={`mt-2 text-xs ${timeColor} break-all`}>
                                              {fileName}
                                            </div>
                                          </div>
                                        );
                                      }

                                      if (mediaType === "audio") {
                                        return (
                                          <div
                                            key={media.id || `${msg.id}-${fileName}`}
                                            className={`rounded-2xl px-3 py-3 ${subtleCard}`}
                                          >
                                            <div className={`text-xs mb-2 ${timeColor}`}>
                                              Audio
                                            </div>
                                            <audio
                                              src={mediaUrl}
                                              controls
                                              className="w-full max-w-[320px]"
                                            />
                                            <div className={`mt-2 text-xs ${timeColor} break-all`}>
                                              {fileName}
                                            </div>
                                          </div>
                                        );
                                      }

                                      return (
                                        <a
                                          key={media.id || `${msg.id}-${fileName}`}
                                          href={mediaUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`
                                            block rounded-2xl px-4 py-3 no-underline
                                            ${subtleCard}
                                            hover:opacity-95 transition
                                          `}
                                        >
                                          <div className="flex items-start gap-3 min-w-0">
                                            <div
                                              className={`
                                                h-10 w-10 rounded-xl flex items-center justify-center
                                                ${isOutbound ? "bg-white/15" : "bg-white"}
                                                shrink-0
                                              `}
                                            >
                                              📄
                                            </div>

                                            <div className="min-w-0 flex-1">
                                              <div className={`text-xs ${timeColor}`}>
                                                {getFileBadge(mediaType)}
                                              </div>
                                              <div className="text-sm font-medium break-all mt-1">
                                                {fileName}
                                              </div>
                                              {media.file_size ? (
                                                <div className={`text-xs mt-1 ${timeColor}`}>
                                                  {(Number(media.file_size) / 1024 / 1024).toFixed(2)} MB
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        </a>
                                      );
                                    })}
                                  </div>
                                ) : null}

                                <div
                                  className={`mt-3 flex items-center gap-1 text-[11px] ${timeColor}`}
                                >
                                  <span>{formatMessageTime(msg.created_at)}</span>
                                  {msg.status ? (
                                    <>
                                      <span>·</span>
                                      {msg.status === "failed" ? (
                                        <span className="text-red-200 font-medium">
                                          {getStatusLabel(msg.status)}
                                        </span>
                                      ) : (
                                        <span>{getStatusLabel(msg.status)}</span>
                                      )}
                                    </>
                                  ) : null}
                                </div>

                                {msg.status === "failed" && isOutbound ? (
                                  <div className="mt-2">
                                    <button
                                      onClick={() => retryFailedMessage(msg)}
                                      disabled={retryingMessageId === msg.id}
                                      className="text-xs underline text-red-200 hover:text-white disabled:opacity-60"
                                      type="button"
                                    >
                                      {retryingMessageId === msg.id ? "Retrying..." : "Retry"}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="p-4 border-t bg-white space-y-3">
                  <div
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      isWindowExpired
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-green-50 border-green-200 text-green-700"
                    }`}
                  >
                    {isWindowExpired ? (
  <div className="flex items-center justify-between gap-3">
    <div>
      {isWaitingReply ? (
        <>
          <div className="font-medium">
            Template sent. Waiting for customer reply.
          </div>
          <div className="text-xs mt-1">
            The 24h window will reopen after the customer responds.
          </div>
        </>
      ) : (
        <>
          <div className="font-medium">24h window expired</div>
          <div className="text-xs mt-1">
            Free-form reply is disabled. Please send an approved template.
          </div>
        </>
      )}
    </div>

    {!isWaitingReply ? (
      <button
        type="button"
        onClick={openTemplatePicker}
        className="shrink-0 rounded bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700"
      >
        Choose Template
      </button>
    ) : null}
  </div>
) : (
        <>
          <div className="font-medium">24h window expired</div>
          <div className="text-xs mt-1">
            Free-form reply is disabled. Please send an approved template.
          </div>
        </>
      )}
    </div>

    {/* 👇 关键：只有非 waiting 才显示按钮 */}
    {!isWaitingReply ? (
      <button
        type="button"
        onClick={openTemplatePicker}
        className="shrink-0 rounded bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700"
      >
        Choose Template
      </button>
    ) : null}
  </div>
) : (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">24h window active</div>
                          <div className="text-xs mt-1">
                            {conversationWindow.expiresAt
                              ? `Free-form reply available · ${formatRemainingWindow(
                                  conversationWindow.expiresAt
                                )}`
                              : "Free-form reply available"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={openTemplatePicker}
                          className="shrink-0 rounded border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Choose Template
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedFile ? (
                    <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>

                      <button
                        type="button"
                        className="ml-3 text-sm text-red-600 hover:text-red-700"
                        onClick={() => {
                          setSelectedFile(null);
                          setPredictedFallback(false);
                          setMediaSendStage("idle");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}

                  {selectedFile && predictedFallback ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      This file is large and will likely be sent as a link instead of native WhatsApp media.
                    </div>
                  ) : null}

                  {selectedFile && sendingMedia && mediaSendStage === "uploading" ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      Uploading file...
                    </div>
                  ) : null}

                  {selectedFile && sendingMedia && mediaSendStage === "sending" ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      Sending message...
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <textarea
                      rows={3}
                      className="flex-1 border rounded px-3 py-2 text-sm"
                      placeholder={
                        selectedFile ? "Add a caption..." : "Type a reply..."
                      }
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={isWindowExpired}
                    />

                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleSelectFile}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isWindowExpired}
                        className="px-4 py-2 rounded border bg-white hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Upload
                      </button>

                      {selectedFile ? (
                        <button
                          onClick={sendMediaMessage}
                          disabled={sendingMedia || isWindowExpired}
                          className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                        >
                          {sendingMedia
                            ? mediaSendStage === "uploading"
                              ? "Uploading..."
                              : "Sending..."
                            : "Send File"}
                        </button>
                      ) : (
                        <button
                          onClick={sendReply}
                          disabled={sending || isWindowExpired}
                          className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                        >
                          {sending ? "Sending..." : "Send"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation
              </div>
            )}
          </div>

          {showRightPanel ? (
          <div className="w-[300px] bg-white border-l flex flex-col min-h-0">
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
                      disabled={savingNote || !selectedCustomerId || !noteInput.trim()}
                      className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
                      type="button"
                    >
                      {savingNote ? "Saving..." : "Add"}
                    </button>
                  </div>

                  {loadingNotes ? (
                    <div className="text-sm text-gray-500">
                      Loading handling log...
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No handling updates yet.
                    </div>
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
          ) : null}
        </div>
      </div>
      </div>

      {showTemplatePicker && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
      <div className="border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="text-lg font-semibold">Choose Template</div>
          <div className="text-sm text-gray-500 mt-1">
            Send an approved template to reopen the conversation.
          </div>
        </div>
        <button
          onClick={closeTemplatePicker}
          disabled={sendingTemplate}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          type="button"
        >
          Close
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[320px,1fr]">
        <div className="border-r p-4 space-y-3 overflow-y-auto min-h-0">
          {templatesError ? (
            <div className="text-sm text-red-600">{templatesError}</div>
          ) : templates.length === 0 ? (
            <div className="text-sm text-gray-500">No templates available.</div>
          ) : (
            templates.map((template) => {
              const active = selectedTemplate?.key === template.key;

              return (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => selectTemplate(template)}
                  className={`w-full rounded-xl border px-4 py-4 text-left transition ${
                    active
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{template.label}</div>
                    <span className="text-[11px] text-gray-500 whitespace-nowrap">
                      {getTemplateStatusLabel(template.reviewStatus)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {template.department} · {template.languageCode}
                  </div>

                  {template.description ? (
                    <div className="text-xs text-gray-600 mt-2 line-clamp-3">
                      {template.description}
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 p-6">
            {selectedTemplate ? (
              <div className="space-y-5">
                <div>
                  <div className="text-lg font-semibold">
                    {selectedTemplate.label}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {selectedTemplate.templateName} · {selectedTemplate.languageCode}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      {selectedTemplate.category}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      {getTemplateStatusLabel(selectedTemplate.reviewStatus)}
                    </span>
                  </div>

                  {selectedTemplate.description ? (
                    <div className="text-sm text-gray-600 mt-3">
                      {selectedTemplate.description}
                    </div>
                  ) : null}
                </div>

                {Number(selectedTemplate.bodyParamCount || 0) > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-800">
                      Template parameters
                    </div>

                    {Array.from(
                      { length: Number(selectedTemplate.bodyParamCount || 0) },
                      (_, index) => {
                        const key = `param${index + 1}`;
                        const label =
                          selectedTemplate.bodyParamLabels?.[index] ||
                          `Parameter ${index + 1}`;

                        return (
                          <div key={key} className="mb-4">
                            <label className="block text-sm text-gray-700 mb-1">
  {label}
</label>

{index === 0 ? (
  <div className="mb-2 text-xs text-gray-500">
    Auto-filled when available. You can edit it before sending. If left blank,
    the message will use “there” for a polite greeting.
  </div>
) : null}

<input
  type="text"
  value={templateParams[key] || ""}
  onChange={(e) => updateTemplateParam(key, e.target.value)}
  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
  placeholder={
    index === 0
      ? "Enter customer name (optional)"
      : `Enter ${String(label || "").toLowerCase()}`
  }
/>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    This template does not require parameters.
                  </div>
                )}

                {templatesError ? (
                  <div className="text-sm text-red-600">{templatesError}</div>
                ) : null}
<div className="mt-6">
  <div className="text-sm font-medium text-gray-800 mb-2">
    Preview
  </div>

  <div className="rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-800 leading-6 whitespace-pre-wrap">
    {selectedTemplate
  ? renderTemplatePreview(selectedTemplate, templateParams)
  : "Select a template to preview"}
  </div>
</div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Select a template to preview and send.
              </div>
            )}
          </div>

          <div className="border-t px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={closeTemplatePicker}
              disabled={sendingTemplate}
              className="rounded-xl border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={sendTemplateMessage}
              disabled={!selectedTemplate || sendingTemplate}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {sendingTemplate ? "Sending..." : "Send Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

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

      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
          onClick={closeImagePreview}
        >
          <div
            className="relative max-w-[96vw] max-h-[96vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeImagePreview}
              className="absolute -top-12 right-0 text-white text-3xl leading-none hover:opacity-80"
              aria-label="Close image preview"
            >
              ×
            </button>

            <img
              src={previewImageUrl}
              alt={previewImageName || "preview"}
              className="max-w-[96vw] max-h-[88vh] object-contain rounded-lg shadow-2xl bg-white"
            />

            <div className="mt-3 text-white text-sm text-center break-all max-w-[90vw]">
              {previewImageName || "Image preview"}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}