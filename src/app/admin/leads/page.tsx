import { LeadsManager } from "./leads-manager";

export default function LeadsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">لیدها</h1>
      <p className="mt-1 text-sm text-muted">
        لیدهای فرم سایت و چت‌بات — یکپارچه در یک جدول.
      </p>
      <LeadsManager />
    </div>
  );
}
