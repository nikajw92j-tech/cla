import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/motion";
import { getCurrentUser, isProActive } from "@/lib/auth/session";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const navUser = user ? { name: user.firstName, role: user.role, isPro: isProActive(user) } : null;
  return (
    <>
      <ScrollProgress />
      <Navbar user={navUser} />
      <main id="main" className="overflow-x-clip">
        {children}
      </main>
      <Footer />
    </>
  );
}
