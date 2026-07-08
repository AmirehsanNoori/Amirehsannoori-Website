import { FeedbackReview } from "./feedback-review";

export default function FeedbackPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">بازخورد و بهبود</h1>
      <p className="mt-1 text-sm text-muted">
        پاسخ‌های 👎شده و سؤالاتی که دستیار در پایگاه دانش پاسخی برایشان نیافت.
      </p>
      <FeedbackReview />
    </div>
  );
}
