import { ConversationList } from "./conversation-list";

export default function ConversationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">گفتگوها</h1>
      <p className="mt-1 text-sm text-muted">
        صندوق ورودی همهٔ مکالمات — فیلتر بر اساس کانال/وضعیت، مشاهدهٔ منابع RAG هر پاسخ، و ارجاع به اپراتور.
      </p>
      <ConversationList />
    </div>
  );
}
