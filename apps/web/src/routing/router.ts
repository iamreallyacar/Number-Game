// Page routing with the browser history, so plain <a href> links switch pages without a reload.
// The server answers every unknown path with index.html, so a reload on any page still works.

type PathListener = (path: string) => void;

const pathListeners = new Set<PathListener>();

function notifyPathChange(): void {
  for (const listener of pathListeners) {
    listener(window.location.pathname);
  }
}

export function navigate(path: string): void {
  if (path !== window.location.pathname) {
    window.history.pushState(null, '', path);
  }
  window.scrollTo(0, 0);
  notifyPathChange();
}

function findInAppLink(event: MouseEvent): HTMLAnchorElement | null {
  const isPlainLeftClick =
    event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  if (event.defaultPrevented || !isPlainLeftClick || !(event.target instanceof Element)) {
    return null;
  }
  const link = event.target.closest('a');
  if (
    link?.target !== '' ||
    link.hasAttribute('download') ||
    link.origin !== window.location.origin
  ) {
    return null;
  }
  return link;
}

function handleDocumentClick(event: MouseEvent): void {
  const link = findInAppLink(event);
  if (link !== null) {
    event.preventDefault();
    navigate(link.pathname);
  }
}

/** Calls the listener on every page change until the returned stop function is called. */
export function startRouter(listener: PathListener): () => void {
  pathListeners.add(listener);
  if (pathListeners.size === 1) {
    window.addEventListener('popstate', notifyPathChange);
    document.addEventListener('click', handleDocumentClick);
  }
  return () => {
    pathListeners.delete(listener);
    if (pathListeners.size === 0) {
      window.removeEventListener('popstate', notifyPathChange);
      document.removeEventListener('click', handleDocumentClick);
    }
  };
}
