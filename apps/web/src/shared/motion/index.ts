/* ---------------------------------------------------------------- */
/* Tokens + variants                                                  */
/* ---------------------------------------------------------------- */

export {
  DURATION,
  EASE_OUT,
  EASE_OUT_FAST,
  EASE_IN_OUT,
  EASE_BACK,
  SPRING,
  STAGGER,
  reducedMotionAware,
} from "./tokens";

export {
  fade,
  fadeUp,
  fadeDown,
  fadeLeft,
  fadeRight,
  scaleIn,
  staggerParent,
  staggerItem,
  overlayBackdrop,
  modalContent,
  sheetContent,
  tapeRow,
  reorderRow,
  type StaggerOptions,
} from "./variants";

/* ---------------------------------------------------------------- */
/* Provider                                                          */
/* ---------------------------------------------------------------- */

export { AppMotionConfig } from "./motion-config";

/* ---------------------------------------------------------------- */
/* Components                                                        */
/* ---------------------------------------------------------------- */

export { FadeIn, type FadeInProps } from "./components/fade-in";
export { Reveal, type RevealProps, type RevealDirection } from "./components/reveal";
export {
  Stagger,
  StaggerItem,
  type StaggerProps,
  type StaggerItemProps,
} from "./components/stagger";
export {
  HoverGlow,
  type HoverGlowProps,
  type HoverGlowAccent,
} from "./components/hover-glow";
export {
  LiveFlash,
  type LiveFlashProps,
  type FlashTone as LiveFlashTone,
} from "./components/live-flash";
export {
  PulseDot,
  type PulseDotProps,
  type PulseDotAccent,
} from "./components/pulse-dot";
export { Tick, type TickProps, type TickDirection } from "./components/tick";
export {
  ModalTransition,
  BackdropTransition,
  type ModalTransitionProps,
  type ModalTransitionVariant,
  type BackdropTransitionProps,
} from "./components/modal-transition";
export { Shimmer, type ShimmerProps, type ShimmerVariant } from "./components/shimmer";

/* ---------------------------------------------------------------- */
/* Hooks                                                             */
/* ---------------------------------------------------------------- */

export {
  useFlashOnChange,
  type FlashTone,
  type UseFlashOnChangeOptions,
  type UseFlashOnChangeResult,
} from "./hooks/use-flash-on-change";
export {
  useMouseGlow,
  type UseMouseGlowOptions,
  type UseMouseGlowResult,
} from "./hooks/use-mouse-glow";
