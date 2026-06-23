"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

// Iranian work week: Sat(6), Sun(0), Mon(1), Tue(2), Wed(3)
const WORK_DAYS = new Set([0, 1, 2, 3, 6]);

const SLOTS_30MIN = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];
const SLOTS_60MIN = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

type SessionType = {
  id: string;
  slug: string;
  name_fa: string;
  name_en: string;
  duration_minutes: number;
  price_irr: number;
  price_usd: number;
  is_free: boolean;
};

type BookDict = {
  free: string;
  min: string;
  select: string;
  pick_date: string;
  pick_time: string;
  no_slots: string;
  prev_week: string;
  next_week: string;
  continue: string;
  login_required: string;
  login_cta: string;
  confirm_type: string;
  confirm_when: string;
  confirm_note: string;
  back: string;
  submit: string;
  submitting: string;
  success_title: string;
  success_body: string;
  success_cta: string;
  error: string;
};

type Step = "type" | "datetime" | "confirm" | "success";

type Props = {
  lang: Locale;
  t: BookDict;
  sessionTypes: SessionType[];
  userId: string | null;
  userEmail: string | null;
};

function getWorkDays(count = 21): Date[] {
  const days: Date[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  while (days.length < count) {
    if (WORK_DAYS.has(d.getDay())) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function slotToIso(date: Date, timeStr: string): string {
  const dateStr = date.toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
  const month = parseInt(dateStr.split("-")[1]);
  // Iran: IRDT (UTC+4:30) April–September, IRST (UTC+3:30) otherwise
  const offset = month >= 4 && month <= 9 ? "+04:30" : "+03:30";
  return `${dateStr}T${timeStr}:00${offset}`;
}

function formatDateCell(date: Date, lang: Locale): { weekday: string; day: string } {
  const locale = lang === "fa" ? "fa-IR-u-ca-persian" : "en-US";
  const tz = { timeZone: "Asia/Tehran" } as const;
  return {
    weekday: date.toLocaleDateString(locale, { ...tz, weekday: "short" }),
    day: date.toLocaleDateString(locale, { ...tz, month: "short", day: "numeric" }),
  };
}

function formatDateLong(date: Date, lang: Locale): string {
  return date.toLocaleDateString(
    lang === "fa" ? "fa-IR-u-ca-persian" : "en-US",
    { timeZone: "Asia/Tehran", weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );
}

function formatTime(timeStr: string, lang: Locale): string {
  if (lang === "en") return timeStr;
  return timeStr.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
}

function formatPrice(st: SessionType, lang: Locale, freeLabel: string): string {
  if (st.is_free) return freeLabel;
  if (lang === "fa") {
    const toman = (st.price_irr / 10).toLocaleString("fa-IR");
    return `${toman} تومان`;
  }
  return `$${st.price_usd.toFixed(0)} USD`;
}

export function BookingFlow({ lang, t, sessionTypes, userId }: Props) {
  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workDays = useMemo(() => getWorkDays(21), []);
  const visibleDays = workDays.slice(weekOffset * 7, weekOffset * 7 + 7);
  const slots = selectedType?.duration_minutes === 30 ? SLOTS_30MIN : SLOTS_60MIN;

  async function submitBooking() {
    if (!selectedType || !selectedDate || !selectedTime) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_type_id: selectedType.id,
          scheduled_at: slotToIso(selectedDate, selectedTime),
          locale: lang,
          amount: selectedType.price_irr,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? t.error);
      } else {
        setStep("success");
      }
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  // ── Step: select session type ──────────────────────────────────────────────
  if (step === "type") {
    return (
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {sessionTypes.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => {
              setSelectedType(st);
              setStep("datetime");
            }}
            className="flex flex-col rounded-lg border border-border p-8 text-start transition-colors hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <h2 className="text-xl font-semibold">
              {lang === "fa" ? st.name_fa : st.name_en}
            </h2>
            <p className="brand-gradient-text mt-1 text-sm font-semibold">
              {formatPrice(st, lang, t.free)} · {st.duration_minutes} {t.min}
            </p>
            <p className="mt-auto pt-6 text-sm font-medium text-brand-blue">
              {t.select} →
            </p>
          </button>
        ))}
      </div>
    );
  }

  // ── Step: pick date & time ─────────────────────────────────────────────────
  if (step === "datetime") {
    return (
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t.pick_date}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={weekOffset === 0}
              onClick={() => {
                setWeekOffset((w) => w - 1);
                setSelectedDate(null);
                setSelectedTime(null);
              }}
              className="rounded border border-border px-3 py-1 text-xs hover:bg-surface disabled:opacity-30"
            >
              {lang === "fa" ? `← ${t.prev_week}` : `← ${t.prev_week}`}
            </button>
            <button
              type="button"
              disabled={weekOffset >= 2}
              onClick={() => {
                setWeekOffset((w) => w + 1);
                setSelectedDate(null);
                setSelectedTime(null);
              }}
              className="rounded border border-border px-3 py-1 text-xs hover:bg-surface disabled:opacity-30"
            >
              {lang === "fa" ? `${t.next_week} →` : `${t.next_week} →`}
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {visibleDays.map((d, i) => {
            const isSelected = selectedDate?.toDateString() === d.toDateString();
            const { weekday, day } = formatDateCell(d, lang);
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedDate(d);
                  setSelectedTime(null);
                }}
                className={`flex flex-col items-center rounded-md border py-2 px-1 text-center text-xs font-medium transition-colors
                  ${
                    isSelected
                      ? "border-brand-blue bg-brand-blue/10 text-foreground"
                      : "border-border text-muted hover:border-brand-blue/50 hover:text-foreground"
                  }`}
              >
                <span className="opacity-70">{weekday}</span>
                <span className="mt-0.5 text-sm font-semibold">{day}</span>
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="mt-8">
            <h2 className="text-base font-semibold">{t.pick_time}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedTime(s)}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors
                    ${
                      selectedTime === s
                        ? "border-brand-blue bg-brand-blue text-white"
                        : "border-border hover:border-brand-blue/50"
                    }`}
                >
                  {formatTime(s, lang)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setStep("type");
              setSelectedDate(null);
              setSelectedTime(null);
            }}
            className="rounded-md border border-border px-5 py-2.5 text-sm hover:bg-surface"
          >
            {t.back}
          </button>
          <button
            type="button"
            disabled={!selectedDate || !selectedTime}
            onClick={() => setStep("confirm")}
            className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {t.continue} →
          </button>
        </div>
      </div>
    );
  }

  // ── Step: confirm ──────────────────────────────────────────────────────────
  if (step === "confirm") {
    const typeName = selectedType
      ? lang === "fa"
        ? selectedType.name_fa
        : selectedType.name_en
      : "";
    const price = selectedType ? formatPrice(selectedType, lang, t.free) : "";
    const dateStr = selectedDate ? formatDateLong(selectedDate, lang) : "";

    return (
      <div className="mt-10 max-w-md space-y-6">
        <div className="rounded-lg border border-border p-6 space-y-4">
          <div>
            <p className="text-xs text-muted">{t.confirm_type}</p>
            <p className="mt-1 font-semibold">
              {typeName} · {price}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">{t.confirm_when}</p>
            <p className="mt-1 font-medium" dir="ltr">
              {dateStr} —{" "}
              {selectedTime ? formatTime(selectedTime, lang) : ""}
            </p>
          </div>
        </div>

        {!userId ? (
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="text-sm text-muted">{t.login_required}</p>
            <Link
              href={`/${lang}/login`}
              className="mt-3 inline-flex h-10 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t.login_cta}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted">{t.confirm_note}</p>
            {error && (
              <p className="rounded border border-border bg-surface px-4 py-3 text-sm text-brand-purple">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("datetime")}
                className="rounded-md border border-border px-5 py-2.5 text-sm hover:bg-surface"
              >
                {t.back}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={submitBooking}
                className="rounded-md bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? t.submitting : t.submit}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step: success ──────────────────────────────────────────────────────────
  return (
    <div className="mt-16 max-w-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="mt-4 text-2xl font-bold">{t.success_title}</h2>
      <p className="mt-3 text-muted">{t.success_body}</p>
      <Link
        href={`/${lang}`}
        className="mt-8 inline-flex h-11 items-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        {t.success_cta}
      </Link>
    </div>
  );
}
