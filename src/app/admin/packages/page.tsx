import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { safeJson } from "@/lib/utils";
import { Card, CardHeader, PageHeader } from "@/components/ui/misc";
import { PackageForm, SettingsForm } from "@/components/admin/settings-forms";
import { FEATURES } from "@/lib/catalog";

export default async function AdminPackages() {
  const { d } = await getI18n();
  const [packages, s] = await Promise.all([db.package.findMany({ orderBy: { sortOrder: "asc" } }), getSettings()]);
  const a = d.admin;
  return (
    <>
      <PageHeader title={a.nav.packages} />
      <div className="grid gap-6 xl:grid-cols-3">
        {packages.map((p) => (
          <Card key={p.id}>
            <CardHeader title={<span className="capitalize">{p.slug}</span>} />
            <div className="p-5">
              <PackageForm
                id={p.id}
                defaults={{ priceGel: p.priceGel, deliveryDays: p.deliveryDays, isPopular: p.isPopular, isActive: p.isActive, content: JSON.stringify(safeJson(p.content, {}), null, 2) }}
              />
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={a.proSettings} />
          <div className="p-5">
            <SettingsForm
              section="pro"
              fields={[
                { name: "priceGel", label: a.proPrice, value: s.pro.priceGel },
                { name: "freeMods", label: a.freeMods, value: s.pro.freeMods },
                { name: "modPriceGel", label: a.modPrice, value: s.pro.modPriceGel },
                { name: "proModPriceGel", label: a.proModPrice, value: s.pro.proModPriceGel },
                { name: "orderDiscountPct", label: a.proOrderDiscount, value: s.pro.orderDiscountPct },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title={a.rates} />
          <div className="p-5">
            <SettingsForm
              section="rates"
              fields={[
                { name: "USD", label: "USD ($)", value: s.rates.USD, step: "0.0001" },
                { name: "RUB", label: "RUB (₽)", value: s.rates.RUB, step: "0.01" },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title={a.featurePrices} />
          <div className="p-5">
            <SettingsForm section="featurePrices" fields={FEATURES.map((f) => ({ name: f, label: d.labels.feature[f], value: s.featurePrices[f] }))} />
          </div>
        </Card>
        <Card>
          <CardHeader title={a.referralSettings} />
          <div className="p-5">
            <SettingsForm
              section="referral"
              toggles={[{ name: "enabled", label: a.enabled, value: s.referral.enabled }]}
              fields={[
                { name: "rewardGel", label: a.referralReward, value: s.referral.rewardGel },
                { name: "friendDiscountPct", label: a.referralFriendPct, value: s.referral.friendDiscountPct },
              ]}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
