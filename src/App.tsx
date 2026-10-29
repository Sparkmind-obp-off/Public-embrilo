import type { ComponentType } from "react";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { BriefPage } from "./pages/Brief";
import { ExamplesPage, FaqPage, NotFoundPage, PrivacyPage, ProcessPage, ServicesPage, TermsPage } from "./pages/InfoPages";
import { RouterProvider, useRouter } from "./lib/router";
import { AuthBoundary } from "./auth/AuthBoundary";
import { AccountPage, RequestDetailPage, SignInPage } from "./pages/Account";

export const routes: Record<string, ComponentType> = {
  "/": HomePage,
  "/layanan": ServicesPage,
  "/cara-kerja": ProcessPage,
  "/contoh": ExamplesPage,
  "/brief": BriefPage,
  "/faq": FaqPage,
  "/privasi": PrivacyPage,
  "/ketentuan": TermsPage,
  "/masuk": SignInPage,
  "/akun": AccountPage,
};

const REQUEST_DETAIL = /^\/akun\/permintaan\/(EMB-[A-Z0-9]{8})$/;

function RouteView() {
  const { path, navKey } = useRouter();
  const detail = REQUEST_DETAIL.exec(path);
  if (detail) return <RequestDetailPage key={`${path}-${navKey}`} refId={detail[1]} />;
  const Page = routes[path] ?? NotFoundPage;
  return <Page key={`${path}-${navKey}`} />;
}

export function App() {
  return (
    <RouterProvider>
      <AuthBoundary>
        <Layout>
          <RouteView />
        </Layout>
      </AuthBoundary>
    </RouterProvider>
  );
}
