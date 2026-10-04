import { ArrowLeft } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { Logo } from "@/components/site/logo";
import { Aurora } from "@/components/site/motion";
import { ButtonLink } from "@/components/ui/button";

export default async function NotFound() {
  const { d } = await getI18n();
  return (
    <main id="main" className="relative grid min-h-dvh place-items-center overflow-hidden px-4 text-center">
      <Aurora />
      <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
      <div className="relative">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>
        <p className="text-gradient animate-gradient font-display text-[7rem] leading-none font-bold tracking-tighter sm:text-[11rem]">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-fg sm:text-3xl">{d.errors.notFoundTitle}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">{d.errors.notFoundText}</p>
        <ButtonLink href="/" size="lg" className="mt-10" icon={<ArrowLeft className="size-4" />}>
          {d.common.goHome}
        </ButtonLink>
      </div>
    </main>
  );
}
