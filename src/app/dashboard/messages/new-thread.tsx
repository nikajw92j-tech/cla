"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/misc";
import { ActionForm, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { FileDrop } from "@/components/dashboard/widgets";
import { createThreadAction } from "@/app/actions/messaging";

export function NewThread({ related, defaultOpen, defaultRelated }: { related: { value: string; label: string }[]; defaultOpen?: boolean; defaultRelated?: string }) {
  const { d } = useApp();
  const m = d.messages;
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <>
      <Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>
        {m.newThread}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={m.newThread} wide>
        <ActionForm action={createThreadAction} className="space-y-4" onSuccess={() => setOpen(false)}>
          <Input name="subject" label={m.subject} placeholder={m.subjectPh} maxLength={140} autoFocus />
          <Select name="related" label={m.relatedTo} defaultValue={related.some((r) => r.value === defaultRelated) ? defaultRelated : ""}>
            <option value="">{m.none}</option>
            {related.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <Textarea name="body" label={d.support.message} rows={5} maxLength={5000} />
          <FileDrop max={5} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {d.common.cancel}
            </Button>
            <SubmitButton>{d.common.send}</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
