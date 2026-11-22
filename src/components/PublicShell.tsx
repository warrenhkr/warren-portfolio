import type { ReactNode } from "react";
import { Providers } from "./Providers";
import { MobileBar, ScrollProgress, SideRail } from "./Nav";
import { Footer } from "./Footer";

/** Habillage du site public : thème, langue, navigation flottante, footer. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <a href="#main" className="skip-link">
        Aller au contenu / Skip to content
      </a>
      <ScrollProgress />
      <SideRail />
      <MobileBar />
      <div className="flex min-h-screen flex-col xl:pl-[110px]">
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
