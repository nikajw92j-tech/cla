"use client";

import { useState } from "react";
import { useApp } from "@/components/providers/app-providers";
import { ActionForm, Input, Select, SubmitButton, Switch } from "@/components/ui/form";
import { FileDrop } from "@/components/dashboard/widgets";
import { STAGES, WEBSITE_STATUSES } from "@/lib/catalog";
import { adminUpdateWebsiteAction, adminUploadPreviewAction } from "@/app/actions/admin";

type Defaults = { name: string; stage: string; progress: number; status: string; url: string; previewUrl: string; eta: string; managed: boolean };

export function WebsiteEditor({ id, defaults }: { id: string; defaults: Defaults }) {
  const { d } = useApp();
  const a = d.admin;
  const [stage, setStage] = useState(defaults.stage);
  const [progress, setProgress] = useState(defaults.progress);
  return (
    <ActionForm action={adminUpdateWebsiteAction.bind(null, id)} className="grid gap-4 sm:grid-cols-2">
      <Input name="name" label={a.projectTitle} defaultValue={defaults.name} wrapClass="sm:col-span-2" />
      <Select
        name="stage"
        label={a.stage}
        value={stage}
        onChange={(e) => {
          setStage(e.target.value);
          // Suggest the stage's default progress.
          setProgress(STAGES.find((s) => s.code === e.target.value)?.progress ?? progress);
        }}
      >
        {STAGES.map((s) => (
          <option key={s.code} value={s.code}>
            {d.status.stage[s.code]} ({s.progress}%)
          </option>
        ))}
      </Select>
      <Input name="progress" type="number" min={0} max={100} label={`${a.progress} (%)`} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
      <Select name="status" label={d.common.status} defaultValue={defaults.status}>
        {WEBSITE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {d.status.website[s]}
          </option>
        ))}
      </Select>
      <Input name="eta" type="date" label={a.eta} defaultValue={defaults.eta} />
      <Input name="url" label={a.url} defaultValue={defaults.url} placeholder="https://" />
      <Input name="previewUrl" label={a.previewUrl} defaultValue={defaults.previewUrl} placeholder="https://" />
      <div className="sm:col-span-2">
        <Switch name="managed" label={a.managed} defaultChecked={defaults.managed} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{d.common.save}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PreviewUpload({ id }: { id: string }) {
  const { d } = useApp();
  return (
    <ActionForm action={adminUploadPreviewAction.bind(null, id)} reset className="space-y-3">
      <FileDrop max={10} />
      <SubmitButton size="sm">{d.admin.uploadPreview}</SubmitButton>
    </ActionForm>
  );
}
