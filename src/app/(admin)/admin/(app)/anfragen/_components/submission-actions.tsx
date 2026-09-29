"use client";

import { MailOpenIcon, MailIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteSubmissionAction, markSubmissionAction } from "../../../_actions/forms";

export function SubmissionActions({ id, read }: { id: number; read: boolean }) {
  const router = useRouter();
  const mark = async () => {
    const result = await markSubmissionAction({ id, read: !read });
    if (result.serverError) return void toast.error(result.serverError.message);
    router.refresh();
  };
  const remove = async () => {
    const result = await deleteSubmissionAction({ id });
    if (result.serverError) return void toast.error(result.serverError.message);
    toast.success("Anfrage gelöscht.");
    router.push("/admin/anfragen" as never);
  };
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => void mark()}>
        {read ? <MailIcon data-icon="inline-start" /> : <MailOpenIcon data-icon="inline-start" />}
        {read ? "Als ungelesen markieren" : "Als gelesen markieren"}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Trash2Icon data-icon="inline-start" /> Löschen
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anfrage löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Nachricht wird endgültig entfernt. Wenn Sie sie noch brauchen, beantworten Sie sie
              vorher per E-Mail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void remove()}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
