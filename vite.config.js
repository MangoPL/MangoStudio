import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import macrosPlugin from "vite-plugin-babel-macros";
import plainText from "vite-plugin-plain-text";

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    jsxFactory: "jsx",
    jsxInject: `
      import { jsx } from '@emotion/react';
    `,
  },

  server: {
    port: 3200,
  },
  plugins: [reactRefresh(), macrosPlugin(), plainText(/\.pegjs$/)],
  define: {
    "process.env": {},
  },
});
