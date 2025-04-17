import { defineConfig } from "vite";
import string from "vite-plugin-string";

export default defineConfig({
  build: {
    target: "esnext", //browsers can handle the latest ES features
  },
  plugins: [
    string({
      include: "**/*.wgsl",
    }),
  ],
  assetsInclude: ["**/*.wasm"],
});
