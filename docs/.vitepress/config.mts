import { defineConfig } from "vitepress";

export default defineConfig({
  title: "newttrace",
  description: "Discord-native telemetry SDK for structured lifecycle analytics",
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/exporters" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Setup",
          collapsed: false,
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Attribution", link: "/guide/attribution" },
          ],
        },
        {
          text: "Understanding Your Data",
          collapsed: false,
          items: [
            { text: "Events Explained", link: "/guide/activation" },
            { text: "TOPGG Conversion Tracking", link: "/guide/topgg" },
            { text: "Datadog Query Cookbook", link: "/guide/datadog-queries" },
          ],
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
