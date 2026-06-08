import { defineConfig } from "vitepress";

export default defineConfig({
  title: "newttrace",
  description: "Discord-native telemetry SDK",
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/exporters" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          link: "/guide/getting-started",
        },
        {
          text: "Activation Tracking",
          link: "/guide/activation",
        },
        {
          text: "Attribution",
          link: "/guide/attribution",
        },
        {
          text: "TOPGG Conversion Tracking",
          link: "/guide/topgg",
        },
      ],
      "/reference/": [
        {
          text: "Exporters",
          link: "/reference/exporters",
        },
        {
          text: "API",
          link: "/reference/api",
        },
      ],
    },
    outline: {
      level: "deep",
    },
  },
});
