import { PublicShell } from "@/components/PublicShell";
import { NotFoundContent } from "@/components/NotFoundContent";

export const metadata = {
  title: "Page introuvable · Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PublicShell>
      <NotFoundContent />
    </PublicShell>
  );
}
