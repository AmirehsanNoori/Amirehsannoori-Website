import { KnowledgeManager } from "./knowledge-manager";

export default function KnowledgePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">پایگاه دانش</h1>
      <p className="mt-1 text-sm text-muted">
        منابع را آپلود کنید تا قطعه‌بندی و بردار‌سازی شوند و مبنای پاسخ‌های دستیار باشند.
      </p>
      <KnowledgeManager />
    </div>
  );
}
