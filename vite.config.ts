import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
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
