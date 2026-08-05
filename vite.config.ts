import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import pkg from "./package.json" with { type: "json" };

export default defineConfig(() => {
  return {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
        "/oss": {
          target: "https://cloudfiles.moujitx.cn",
          changeOrigin: true,
          rewrite: (path) => path.replace("/oss", "/web-homebox-dev"),
        },
      },
    },
  };
});
