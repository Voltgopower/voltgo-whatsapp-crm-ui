export const MESSAGE_TEMPLATES = [
  {
    key: "general_reopen",
    label: "general_reopen",
    templateName: "general_reopen",
    languageCode: "en_US",
    department: "general",
    category: "utility",
    reviewStatus: "pending",
    description: "Hi {{1}}, we are following up regarding your previous inquiry.",
    bodyParamCount: 1,
    bodyParamLabels: ["Customer Name"],
    enabled: true,
    sortOrder: 10,
  },
  {
    key: "sales_reopen_followup",
    label: "sales_reopen_followup",
    templateName: "sales_reopen_followup",
    languageCode: "en_US",
    department: "sales",
    category: "marketing",
    reviewStatus: "pending",
    description: "Hi {{1}}, we are following up regarding your previous sales inquiry.",
    bodyParamCount: 1,
    bodyParamLabels: ["Customer Name"],
    enabled: true,
    sortOrder: 20,
  },
  {
    key: "sales_quote_followup",
    label: "sales_quote_followup",
    templateName: "sales_quote_followup",
    languageCode: "en_US",
    department: "sales",
    category: "utility",
    reviewStatus: "pending",
    description: "Hi {{1}}, this message is regarding the quotation we shared earlier.",
    bodyParamCount: 1,
    bodyParamLabels: ["Customer Name"],
    enabled: true,
    sortOrder: 30,
  },
  {
    key: "support_request_video",
    label: "support_request_video",
    templateName: "support_request_video",
    languageCode: "en_US",
    department: "support",
    category: "utility",
    reviewStatus: "pending",
    description: "Hi {{1}}, could you please send us a short video of the issue?",
    bodyParamCount: 1,
    bodyParamLabels: ["Customer Name"],
    enabled: true,
    sortOrder: 40,
  },
  {
    key: "support_case_update",
    label: "support_case_update",
    templateName: "support_case_update",
    languageCode: "en_US",
    department: "support",
    category: "utility",
    reviewStatus: "pending",
    description: "Hi {{1}}, here is an update on your support case.",
    bodyParamCount: 1,
    bodyParamLabels: ["Customer Name"],
    enabled: true,
    sortOrder: 50,
  },
  {
    key: "support_followup",
    label: "support_followup",
    templateName: "support_followup",
    languageCode: "en_US",
    department: "support",
    category: "utility",
    reviewStatus: "pending",
    description: "Hi {{1}}, we are following up on your support request.",
    bodyParamCount: 1,
    bodyParamLabels: ["Customer Name"],
    enabled: true,
    sortOrder: 60,
  },
];

export function getEnabledTemplates() {
  return MESSAGE_TEMPLATES
    .filter((item) => item.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getTemplatesByDepartment(department) {
  return getEnabledTemplates().filter((item) => {
    if (!department || department === "all") return true;
    return item.department === department || item.department === "general";
  });
}

export function getTemplateStatusLabel(status) {
  if (status === "active") return "Active";
  if (status === "rejected") return "Rejected";
  return "In Review";
}