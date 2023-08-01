import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
// import legacy from "@vitejs/plugin-legacy";
import vue2 from "@vitejs/plugin-vue2";
// import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: {
    target: "es2020",
    sourcemap: true,
  },
  plugins: [
    vue2(),
    // legacy({
    //   targets: ["chrome >= 87"],
    //   additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    // }),
    // visualizer(),
    sentryVitePlugin({
      org: "bus-inc",
      project: "croc",
      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and need `project:releases` and `org:read` scopes
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "process.env": {},
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
      define: {
        global: "globalThis",
      },
    },
  },
});
