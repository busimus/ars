import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
// import legacy from "@vitejs/plugin-legacy";
import vue2 from "@vitejs/plugin-vue2";
// import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    vue2(),
    // legacy({
    //   targets: ["chrome >= 87"],
    //   additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    // }),
    // visualizer(),
  ],
  build: {
    target: "es2020"
  },
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
