/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  experimental: {
    // Envoi de fichiers depuis l'ADMIN : la limite par défaut d'une Server Action est 1 Mo,
    // la médiathèque accepte des images jusqu'à 5 Mo.
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    // En-têtes de sécurité communs à toutes les routes. La CSP est volontairement absente :
    // Next 14 injecte des scripts inline (hydratation, thème) et une CSP stricte exigerait des nonces.
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ];
    // HSTS uniquement en production : inutile en HTTP local, et on ne veut pas figer localhost.
    if (process.env.NODE_ENV === "production") {
      common.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    }
    return [{ source: "/:path*", headers: common }];
  },
};
export default nextConfig;
