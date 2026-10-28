import type { ComponentType } from "react";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { BriefPage } from "./pages/Brief";
import { ExamplesPage, FaqPage, NotFoundPage, PrivacyPage, ProcessPage, ServicesPage, TermsPage } from "./pages/InfoPages";
import { RouterProvider, useRouter } from "./lib/router";

export const routes: Record<string, ComponentType> = {
  "/": HomePage,
  "/layanan": ServicesPage,
  "/cara-kerja": ProcessPage,
  "/contoh": ExamplesPage,
  "/brief": BriefPage,
  "/faq": FaqPage,
  "/privasi": PrivacyPage,
  "/ketentuan": TermsPage,
};

function RouteView() {
  const { path, navKey } = useRouter();
  const Page = routes[path] ?? NotFoundPage;
  return <Page key={`${path}-${navKey}`} />;
}

export function App() {
  return (
    <RouterProvider>
      <Layout>
        <RouteView />
      </Layout>
    </RouterProvider>
  );
}
