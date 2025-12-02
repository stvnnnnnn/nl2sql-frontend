import { Calendar, Database } from "lucide-react";
import { QueryHistory } from "@/types";

interface Props {
  item: QueryHistory;
}

export default function QueryCard({ item }: Props) {
  return (
    <div className="bg-neutral-800 p-4 rounded-lg hover:bg-neutral-700 transition cursor-pointer">
      <div className="flex items-center gap-2 text-white font-semibold">
        <Database size={18} />
        {item.natural_query}
      </div>

      <div className="text-neutral-400 text-sm flex items-center gap-2 mt-1">
        <Calendar size={14} />
        {new Date(item.created_at).toLocaleString()}
      </div>
    </div>
  );
}