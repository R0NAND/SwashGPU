import { defineConfig } from "vite";
import string from "vite-plugin-string";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  build: {
    target: "esnext", //browsers can handle the latest ES features
  },
  plugins: [
    mkcert(),
    string({
      include: "**/*.wgsl",
    }),
  ],
  assetsInclude: ["**/*.wasm"],
});
