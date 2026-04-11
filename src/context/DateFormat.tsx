"use client";

export const formatMMDD = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
};

export const timeToMinutes = (time?: string | null) => {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const t = time.toString().trim();
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return Number.MAX_SAFE_INTEGER;
  return hh * 60 + mm;
};

export const formatTimeHHMM = (time: string | null): string => {
  if (!time) return "--:--";
  
  // Simply take the first 5 characters
  return time.slice(0, 5);
};