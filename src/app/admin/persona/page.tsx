import { PersonaEditor } from "./persona-editor";

export default function PersonaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">پرسونا و System Prompt</h1>
      <p className="mt-1 text-sm text-muted">
        لحن، قوانین رفتاری و محدودهٔ دستیار. هر ذخیره یک نسخهٔ جدید می‌سازد؛ می‌توانید به
        نسخه‌های قبلی برگردید.
      </p>
      <PersonaEditor />
    </div>
  );
}
