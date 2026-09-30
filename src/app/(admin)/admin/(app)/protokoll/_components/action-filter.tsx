"use client";

import { useRouter } from "next/navigation";

import { AUDIT_ACTIONS } from "@/cms/audit/types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__alle";

// Narrows the log to one kind of entry; the choice lives in the URL (?aktion=…).
export function ActionFilter({ value }: { value: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="protokoll-filter">Zeigen</Label>
      <Select
        value={value || ALL}
        onValueChange={(next) =>
          router.push(
            (next === ALL
              ? "/admin/protokoll"
              : `/admin/protokoll?aktion=${encodeURIComponent(next)}`) as never,
          )
        }
      >
        <SelectTrigger id="protokoll-filter" className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Alle Einträge</SelectItem>
          {Object.entries(AUDIT_ACTIONS).map(([key, name]) => (
            <SelectItem key={key} value={key}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
