import type { ReactNode } from "react";
import "@/app/(admin)/admin/admin.css";

/**
 * Les écrans d'authentification font partie de l'ADMIN, pas du site public :
 * ils portent donc le même habillage (jetons forge/signal, focus, surfaces)
 * que le rail et le tableau de bord, en clair comme en sombre.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div data-admin>{children}</div>;
}
