import { ThreadView } from "./thread-view";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold">جزئیات گفتگو</h1>
      <ThreadView id={id} />
    </div>
  );
}
