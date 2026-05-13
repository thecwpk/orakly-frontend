/** Trailing debounce with stable cancel for effect cleanups. */
export function debounceAsyncFn<A extends unknown[]>(
  fn: (...args: A) => void | Promise<void>,
  ms: number,
): ((...args: A) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const wrapped = (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void fn(...args);
    }, ms);
  };

  wrapped.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  return wrapped;
}
