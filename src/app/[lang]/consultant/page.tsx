import type { Metadata } from "next";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return {
    title:
      lang === "fa"
        ? "مشاور هوش مصنوعی — امیراحسان نوری"
        : "AI Consultant — Amirehsan Noori",
  };
}

const SUGGESTED_FA = [
  "چه خدماتی ارائه می‌دهید؟",
  "جلسهٔ آشنایی رایگان چطور کار می‌کند؟",
  "هزینهٔ جلسهٔ استراتژی چقدر است؟",
];

export default async function ConsultantPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <div className="mx-auto flex h-[calc(100dvh-var(--header-h,64px))] max-w-3xl flex-col px-4 py-6 sm:px-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold">مشاور هوش مصنوعی</h1>
        <p className="mt-1 text-sm text-muted">
          سؤال بپرسید — دستیار بر پایهٔ دانش امیراحسان نوری پاسخ می‌دهد و در صورت نیاز شما را به
          ثبت درخواست مشاوره هدایت می‌کند.
        </p>
      </div>
      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-background">
        <ChatWindow
          channel="web"
          welcomeMessage="سلام! من دستیار هوش مصنوعی امیراحسان نوری‌ام. چطور می‌تونم کمکتون کنم؟"
          suggestedQuestions={SUGGESTED_FA}
        />
      </div>
    </div>
  );
}
