import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { supabase } from "../lib/supabase";
import { VALUES, FEELINGS } from "../types/value";

// ---- Pure helpers (verbatim logic from web reportGenerator.ts) ----
interface MilestoneRecord {
  date: string;
  dateStr: string;
  timeStr: string;
  type: string;
  rating: string;
  duration: string;
  output: string;
  notes: string;
  intention: string;
}

export function parseMilestone(msg: { created_at: string; message: string }): MilestoneRecord | null {
  const date = new Date(msg.created_at);
  const dateStr = date.toLocaleDateString("en-US");
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (msg.message === "__KISS__") return { date: msg.created_at, dateStr, timeStr, type: "قبلة حميمية", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  if (msg.message === "__TOUCH__") return { date: msg.created_at, dateStr, timeStr, type: "لمس حنون", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  if (msg.message === "__SHOWER__") return { date: msg.created_at, dateStr, timeStr, type: "دش دافئ حميمي", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  if (msg.message === "__SELFHUG__") return { date: msg.created_at, dateStr, timeStr, type: "حضن ذاتي", rating: "-", duration: "-", output: "-", notes: "-", intention: "-" };
  if (msg.message.startsWith("__REALITY__")) {
    const parts = msg.message.split("|");
    const eventDate = parts.length >= 4 ? parts[1] : parts.length === 3 ? parts[1] : "";
    const eventTime = parts.length >= 4 ? parts[2] : "";
    const notes = parts.length >= 4 ? parts[3] : parts.length === 3 ? parts[2] : parts.length > 1 ? parts[1] : "";
    const label = [eventDate, eventTime].filter(Boolean).join(" ");
    const combined = [label, notes].filter(Boolean).join(" - ");
    return { date: msg.created_at, dateStr, timeStr, type: "حدث في الواقع", rating: "-", duration: "-", output: "-", notes: combined || "-", intention: "-" };
  }
  if (msg.message.startsWith("__DREAM__")) {
    const parts = msg.message.split("|");
    const eventDate = parts.length >= 4 ? parts[1] : parts.length === 3 ? parts[1] : "";
    const eventTime = parts.length >= 4 ? parts[2] : "";
    const notes = parts.length >= 4 ? parts[3] : parts.length === 3 ? parts[2] : parts.length > 1 ? parts[1] : "";
    const label = [eventDate, eventTime].filter(Boolean).join(" ");
    const combined = [label, notes].filter(Boolean).join(" - ");
    return { date: msg.created_at, dateStr, timeStr, type: "حلم", rating: "-", duration: "-", output: "-", notes: combined || "-", intention: "-" };
  }
  if (msg.message.startsWith("__FALL__")) {
    const stripped = msg.message.replace(/^__FALL__\|?/, "");
    const parts = stripped.split("|");
    const description = parts[parts.length - 1] || parts[0] || "";
    return { date: msg.created_at, dateStr, timeStr, type: "سقوط", rating: "0", duration: "-", output: "-", notes: description, intention: "-" };
  }
  if (msg.message.startsWith("__MILESTONE__")) {
    const parts = msg.message.replace("__MILESTONE__", "").split("|");
    const isSacred = parts.length > 8;
    const notes = isSacred ? "" : parts[2] || "";
    const intention = isSacred ? parts[9] || "" : parts[4] || "";
    const duration = !isSacred && parts[5] ? (parts[5] === "long" ? "طويل" : parts[5] === "medium" ? "متوسط" : "قصير") : "-";
    const output = !isSacred && parts[6] ? (parts[6] === "full" ? "كامل" : parts[6] === "simple" ? "بسيط" : "محفوظ") : "-";
    return { date: msg.created_at, dateStr, timeStr, type: parts[0] || "", rating: parts[1] || "", duration, output, notes, intention };
  }
  return null;
}

export function buildValueMarkdown(input: {
  valueId: string;
  valueName: string;
  balancePercentage: number;
  isPinned?: boolean;
  feelingsBeingHealed?: string[];
  feelingsHealed?: string[];
  feelingsHealedDates?: Record<string, string>;
  beliefs?: Record<string, string>;
  notes?: string;
  exportedAt?: string;
}): string {
  const {
    valueId,
    valueName,
    balancePercentage,
    isPinned = false,
    feelingsBeingHealed = [],
    feelingsHealed = [],
    feelingsHealedDates = {},
    beliefs = {},
    notes = "",
    exportedAt = new Date().toISOString(),
  } = input;
  const parseTasks = (raw: string) => {
    if (!raw) return [] as Array<{ text: string; severity: number; healed: boolean }>;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((t: any) => ({
          text: t.text || "",
          severity: typeof t.severity === "number" ? t.severity : 0,
          healed: t.healed === true || t.completed === true,
        }));
      }
      return [{ text: String(parsed), severity: 0, healed: false }];
    } catch {
      return raw.trim() ? [{ text: raw.trim(), severity: 0, healed: false }] : [];
    }
  };
  const stateLabel = (feeling: string): string =>
    feelingsBeingHealed.includes(feeling) ? "جاري العلاج" : feelingsHealed.includes(feeling) ? "تم علاجه" : "غير مُفعّل";
  const severityLabel = (sev: number): string => `${(sev % 10) + 1}/10`;
  const sanitize = (s: string): string => (s ?? "").toString().replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  let md = "";
  md += `# ${valueName}\n\n> تقرير تفصيلي للقيمة\n\n## نظرة عامة\n\n`;
  md += `| الحقل | القيمة |\n| --- | --- |\n`;
  md += `| المعرّف | \`${sanitize(valueId || "-")}\` |\n`;
  md += `| نسبة الاتزان | **${balancePercentage}%** |\n`;
  md += `| مثبّتة | ${isPinned ? "نعم" : "لا"} |\n`;
  md += `| تاريخ التصدير | ${sanitize(exportedAt)} |\n\n## المشاعر\n\n`;
  if (feelingsBeingHealed.length === 0 && feelingsHealed.length === 0) {
    md += `_لا توجد مشاعر مُسجّلة لهذه القيمة._\n\n`;
  } else {
    if (feelingsBeingHealed.length > 0) md += `**جاري العلاج:** ${feelingsBeingHealed.map(sanitize).join("، ")}\n\n`;
    if (feelingsHealed.length > 0) {
      const healedWithDates = feelingsHealed.map((f) => {
        const d = feelingsHealedDates?.[f];
        return d ? `${sanitize(f)} _(بتاريخ ${sanitize(new Date(d).toLocaleDateString("en-US"))})_` : sanitize(f);
      });
      md += `**تم علاجها:** ${healedWithDates.join("، ")}\n\n`;
    }
  }
  md += `## المعتقدات حسب الشعور\n\n`;
  (FEELINGS as readonly string[]).forEach((feeling) => {
    const tasks = parseTasks(beliefs[feeling] || "");
    const state = stateLabel(feeling);
    const healedDate = feelingsHealedDates?.[feeling];
    const suffix = state === "غير مُفعّل" ? "" : ` — _${state}${healedDate ? ` • ${sanitize(new Date(healedDate).toLocaleDateString("en-US"))}` : ""}_`;
    md += `### ${sanitize(feeling)}${suffix}\n\n`;
    if (tasks.length === 0) md += `_لا توجد معتقدات مسجلة._\n\n`;
    else {
      md += `| # | المعتقد | الشدة | تم علاجه |\n| --- | --- | --- | --- |\n`;
      tasks.forEach((t, i) => {
        md += `| ${i + 1} | ${sanitize(t.text) || "_(فارغ)_"} | ${severityLabel(t.severity)} | ${t.healed ? "✅" : "—"} |\n`;
      });
      md += `\n`;
    }
  });
  md += `## ملاحظات وتأملات\n\n${notes && notes.trim() ? `${notes.trim()}\n\n` : `_لا توجد ملاحظات._\n\n`}---\n\n*تم إنشاء هذا التقرير تلقائياً — ${new Date().toLocaleString("en-US")}*\n`;
  return md;
}

// ---- Native share (replaces Blob + a.click download) ----
export async function shareMarkdown(filename: string, markdown: string): Promise<void> {
  try {
    const path = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(path, markdown, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: "text/markdown", dialogTitle: filename });
    } else {
      Alert.alert("تم حفظ التقرير", path);
    }
  } catch (e) {
    console.error("shareMarkdown failed", e);
    Alert.alert("خطأ", "تعذر مشاركة التقرير");
  }
}

async function fetchValuesMap(userId: string) {
  const { data } = await supabase.from("spiritual_values").select("*").eq("user_id", userId);
  return data || [];
}

export async function downloadComprehensiveReport(userId: string, userEmail: string | undefined): Promise<void> {
  try {
    const [valuesRes, dialogueRes, calendarRes, divineNamesRes, behavioralRes, relRes] = await Promise.all([
      supabase.from("spiritual_values").select("*").eq("user_id", userId),
      supabase.from("self_dialogue_messages").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      supabase.from("anima_calendar").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("divine_names").select("*").eq("user_id", userId),
      supabase.from("behavioral_values").select("*").eq("user_id", userId),
      supabase.from("relationship_cards").select("*").eq("user_id", userId),
    ]);
    const seen = new Set<string>();
    const rows: any[] = [];
    (valuesRes.data || []).forEach((item: any) => {
      if (item.value_id === "0" || !item.value_id) return;
      const idx = parseInt(item.value_id);
      const name = !isNaN(idx) && idx >= 0 && idx < VALUES.length ? VALUES[idx] : item.value_name || "غير معروف";
      if (seen.has(name)) return;
      seen.add(name);
      rows.push({ name, balance: item.balance_percentage ?? 50 });
    });
    (VALUES as readonly string[]).forEach((name) => {
      if (!seen.has(name)) rows.push({ name, balance: 50 });
    });
    const avg = Math.round(rows.reduce((a, r) => a + r.balance, 0) / Math.max(1, rows.length));
    const milestones = (dialogueRes.data || []).map((m: any) => parseMilestone(m)).filter(Boolean);
    let md = `# التقرير الشامل\n\nالمستخدم: ${userEmail || "-"}  \nتاريخ التوليد: ${new Date().toLocaleString("en-US")}\n\n`;
    md += `## متوسط الاتزان العام: ${avg}%\n\n## القيم (${rows.length})\n\n| القيمة | الاتزان |\n| --- | --- |\n`;
    rows.forEach((r) => {
      md += `| ${r.name} | ${r.balance}% |\n`;
    });
    md += `\n## المعالم (${milestones.length})\n\n`;
    milestones.forEach((m: any) => {
      md += `- ${m.dateStr} ${m.timeStr} | ${m.type} | تقييم ${m.rating}\n`;
    });
    md += `\n## مهام التقويم (${(calendarRes.data || []).length})\n\n`;
    (calendarRes.data || []).forEach((t: any) => {
      const bar = "█".repeat(Math.round((t.progress ?? 0))) + "░".repeat(10 - Math.round((t.progress ?? 0)));
      md += `- ${t.title} ${bar} ${(t.progress ?? 0).toFixed(1)}/10\n`;
    });
    md += `\n## الأسماء الإلهية (${(divineNamesRes.data || []).length})\n\n## القيم السلوكية (${(behavioralRes.data || []).length})\n\n## العلاقات (${(relRes.data || []).length})\n\n`;
    (relRes.data || []).forEach((c: any) => {
      md += `- ${c.name} [${c.level}]\n`;
    });
    await shareMarkdown(`comprehensive-report-${Date.now()}.md`, md);
  } catch (e) {
    console.error(e);
    Alert.alert("خطأ", "تعذر إنشاء التقرير الشامل");
  }
}

export async function downloadMasculineValuesReport(userId: string, _userEmail: string | undefined): Promise<void> {
  const rows = await fetchValuesMap(userId);
  const byName: Record<string, any> = {};
  rows.forEach((item: any) => {
    const idx = parseInt(item.value_id);
    const name = !isNaN(idx) && idx < VALUES.length ? (VALUES as readonly string[])[idx] : item.value_name;
    if (name) byName[name] = item;
  });
  let md = `# تقرير القيم\n\nتاريخ التوليد: ${new Date().toLocaleString("en-US")}\n\n`;
  (VALUES as readonly string[]).forEach((name, i) => {
    const item = byName[name];
    md += buildValueMarkdown({
      valueId: String(i),
      valueName: name,
      balancePercentage: item?.balance_percentage ?? 50,
      isPinned: item?.is_pinned ?? false,
      feelingsBeingHealed: item?.feelings_being_healed ?? [],
      feelingsHealed: item?.positive_feelings ?? [],
      feelingsHealedDates: item?.positive_feeling_dates ?? {},
      beliefs: item?.beliefs ?? {},
      notes: item?.notes ?? "",
    });
    md += `\n\n---\n\n`;
  });
  await shareMarkdown(`values-report-${Date.now()}.md`, md);
}

export async function downloadAllValuesReport(userId: string, userEmail: string | undefined): Promise<void> {
  return downloadMasculineValuesReport(userId, userEmail);
}
