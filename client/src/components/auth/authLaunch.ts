export const AUTH_LAUNCH_MS = 700;

export const canAnimateAuthLaunch = () =>
  window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)').matches;
