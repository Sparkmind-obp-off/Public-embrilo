import { createContext, useCallback, useContext, useEffect, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

/**
 * Minimal History-API router. Cloudflare Pages serves index.html for unknown
 * paths (SPA fallback when no top-level 404.html exists), so deep links work.
 */

interface RouterValue {
  path: string;
  navKey: number;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterValue>({ path: "/", navKey: 0, navigate: () => undefined });

const normalise = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path) || "/";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return false;
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  return true;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalise(window.location.pathname));
  // Increments on every navigation so routes remount (e.g. /brief?layanan=… re-reads its query).
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    // Only react to real location changes. Hash-only changes (e.g. Clerk's hash routing
    // inside the sign-in widget) must not remount the current page.
    let last = window.location.pathname + window.location.search;
    const onPop = () => {
      const current = window.location.pathname + window.location.search;
      if (current === last) return;
      last = current;
      setPath(normalise(window.location.pathname));
      setNavKey((key) => key + 1);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    const nextPath = normalise(url.pathname);
    const samePage = nextPath === normalise(window.location.pathname);

    if (samePage && url.hash && !url.search) {
      window.history.pushState(null, "", `${nextPath}${url.hash}`);
      scrollToHash(url.hash);
      return;
    }

    window.history.pushState(null, "", `${nextPath}${url.search}${url.hash}`);
    setPath(nextPath);
    setNavKey((key) => key + 1);

    // Wait for the new route to render, then move scroll + focus.
    requestAnimationFrame(() => {
      if (url.hash && scrollToHash(url.hash)) return;
      window.scrollTo({ top: 0 });
      document.getElementById("main")?.focus({ preventScroll: true });
    });
  }, []);

  return <RouterContext.Provider value={{ path, navKey, navigate }}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const { navigate, path } = useRouter();
  const targetPath = normalise(to.split(/[?#]/)[0] || path);
  const isCurrent = targetPath === path && !/[?#]/.test(to);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} aria-current={isCurrent ? "page" : undefined} {...rest}>
      {children}
    </a>
  );
}

export interface PageMeta {
  title: string;
  description: string;
}

/** Sets <title> and meta description per route. */
export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  }, [title, description]);
}
