import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { Card, CardHeader, PageHeader } from "@/components/ui/misc";
import { SettingsForm } from "@/components/admin/settings-forms";

export default async function AdminContent() {
  const { d } = await getI18n();
  const s = await getSettings();
  const h = d.home.stats;
  return (
    <>
      <PageHeader title={d.admin.nav.content} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={d.admin.statsContent} />
          <div className="p-5">
            <SettingsForm
              section="stats"
              fields={[
                { name: "websites", label: h.websites, value: s.stats.websites },
                { name: "customers", label: h.customers, value: s.stats.customers },
                { name: "projects", label: h.projects, value: s.stats.projects },
                { name: "responseHours", label: `${h.response} (${h.hours})`, value: s.stats.responseHours },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title={d.admin.contact} />
          <div className="p-5">
            <SettingsForm
              section="contact"
              fields={[
                { name: "email", label: d.auth.email, value: s.contact.email, type: "email" },
                { name: "phone", label: d.auth.phone, value: s.contact.phone, type: "text" },
                { name: "address", label: "Address", value: s.contact.address, type: "text" },
                { name: "instagram", label: "Instagram", value: s.contact.instagram, type: "url" },
                { name: "facebook", label: "Facebook", value: s.contact.facebook, type: "url" },
                { name: "linkedin", label: "LinkedIn", value: s.contact.linkedin, type: "url" },
                { name: "github", label: "GitHub", value: s.contact.github, type: "url" },
              ]}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
