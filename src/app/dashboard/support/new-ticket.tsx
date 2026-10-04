"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/misc";
import { ActionForm, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { FileDrop } from "@/components/dashboard/widgets";
import { TICKET_CATEGORIES } from "@/lib/catalog";
import { createTicketAction } from "@/app/actions/messaging";

export function NewTicket() {
  const { d } = useApp();
  const s = d.support;
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>
        {s.newTicket}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={s.newTicket} wide>
        <ActionForm action={createTicketAction} className="space-y-4" onSuccess={() => setOpen(false)}>
          <Input name="subject" label={s.subject} maxLength={140} autoFocus />
          <Select name="category" label={s.category} defaultValue="GENERAL">
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {d.labels.ticketCategory[c]}
              </option>
            ))}
          </Select>
          <Textarea name="body" label={s.message} rows={6} maxLength={5000} />
          <FileDrop max={5} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {d.common.cancel}
            </Button>
            <SubmitButton>{s.create}</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
