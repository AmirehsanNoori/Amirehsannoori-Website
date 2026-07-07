import { SettingsForms } from "./settings-forms";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">مدل و Embedding</h1>
      <p className="mt-1 text-sm text-muted">
        مدل تولید پاسخ (از طریق OpenRouter) و تنظیمات بردار‌سازی/بازیابی.
      </p>
      <SettingsForms />
    </div>
  );
}
