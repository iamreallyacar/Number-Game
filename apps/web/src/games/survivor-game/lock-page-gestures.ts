/**
 * Stops the page from scrolling, bouncing, or zooming while a run is played, so a thumb that
 * drags on the arena never moves the page. Returns a function that gives the page back.
 */
export function lockPageGestures(playArea: HTMLElement): () => void {
  const root = document.documentElement;
  const previousOverflow = root.style.overflow;
  const previousOverscroll = root.style.overscrollBehavior;
  root.style.overflow = 'hidden';
  root.style.overscrollBehavior = 'none';

  const stopDefault = (event: Event): void => {
    event.preventDefault();
  };
  // touch-action covers most browsers. These listeners cover the ones that still scroll or pinch,
  // and they must not be passive or preventDefault is ignored.
  playArea.addEventListener('touchmove', stopDefault, { passive: false });
  document.addEventListener('gesturestart', stopDefault);
  document.addEventListener('gesturechange', stopDefault);

  return () => {
    root.style.overflow = previousOverflow;
    root.style.overscrollBehavior = previousOverscroll;
    playArea.removeEventListener('touchmove', stopDefault);
    document.removeEventListener('gesturestart', stopDefault);
    document.removeEventListener('gesturechange', stopDefault);
  };
}
