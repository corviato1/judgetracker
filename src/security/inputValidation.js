export const sanitizeSearchQuery = (query) => {
  if (!query) return "";

  const trimmed = query.trim();

  if (!trimmed) return "";

  // Remove characters that have no meaning in a name search
  const cleaned = trimmed.replace(/[<>;$]/g, "");

  return cleaned.slice(0, 80);
};
