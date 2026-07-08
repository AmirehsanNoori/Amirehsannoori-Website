import { TeamManager } from "./team-manager";

export default function TeamPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">اعضای پنل</h1>
      <p className="mt-1 text-sm text-muted">
        دسترسی به پنل مدیریت. فقط مالک می‌تواند عضو اضافه یا حذف کند.
      </p>
      <TeamManager />
    </div>
  );
}
