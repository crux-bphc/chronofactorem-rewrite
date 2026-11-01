import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, type Plugin } from "vite";

// Public pages listed in the sitemap.
const sitemapPaths = ["/", "/about"];

// Signed-in pages and the API, which crawlers have no use for.
const disallowedPaths = [
  "/api/",
  "/edit/",
  "/finalize/",
  "/editProfile",
  "/getDegrees",
];

// don't hardcode URLs in robots.txt and sitemap.xml
function crawlerFiles(): Plugin {
  let siteUrl: string | undefined;
  return {
    name: "crawler-files",
    apply: "build",
    configResolved(config) {
      siteUrl = config.env.VITE_FRONTEND_URL?.replace(/\/+$/, "");
      if (!siteUrl) {
        config.logger.warn(
          "VITE_FRONTEND_URL is not set: robots.txt will have no sitemap and sitemap.xml is skipped.",
        );
      }
    },
    generateBundle() {
      const robots = [
        "User-agent: *",
        ...disallowedPaths.map((p) => `Disallow: ${p}`),
      ];
      if (siteUrl) robots.push("", `Sitemap: ${siteUrl}/sitemap.xml`);
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `${robots.join("\n")}\n`,
      });

      if (!siteUrl) return;
      const urls = sitemapPaths
        .map((p) => `  <url>\n    <loc>${siteUrl}${p}</loc>\n  </url>`)
        .join("\n");
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), crawlerFiles()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // libraries that change far less often than the app, so browsers
          // keep them cached across deploys
          groups: [
            {
              name: "vendor",
              test: /node_modules[\\/](react|react-dom|scheduler|@tanstack[\\/][^\\/]+)[\\/]/,
            },
          ],
        },
      },
    },
  },
});
