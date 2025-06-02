import { defineConfig } from "vite";
import vitePluginWasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [vitePluginWasm(), topLevelAwait()],
  build: {
    rollupOptions: {
      treeshake: false,
    },
  },
});
