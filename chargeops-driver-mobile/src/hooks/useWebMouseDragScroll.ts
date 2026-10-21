import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export interface WebMouseDragScrollOptions {
  /**
   * Multiplier for scroll distance relative to mouse movement.
   * Default: 1.0 (1:1 tracking)
   */
  dragMultiplier?: number;
  /**
   * Minimum movement in pixels before a mouse click is considered a drag gesture.
   * Default: 5
   */
  dragThreshold?: number;
  /**
   * Whether to convert vertical mouse wheel scroll to horizontal scroll when hovering this container.
   * Default: true
   */
  enableWheel?: boolean;
  /**
   * Whether to enable smooth momentum scrolling upon flick/release.
   * Default: true
   */
  enableMomentum?: boolean;
  /**
   * Disable mouse drag-to-scroll.
   * Default: false
   */
  disabled?: boolean;
}

/**
 * Resolves the underlying scrollable HTML element on React Native Web.
 */
function resolveScrollableNode(instance: any): HTMLElement | null {
  if (!instance) return null;
  if (typeof instance.getScrollableNode === 'function') {
    try {
      const node = instance.getScrollableNode();
      if (node instanceof HTMLElement) return node;
    } catch {
      // ignore
    }
  }
  if (typeof instance.getNativeScrollRef === 'function') {
    try {
      const node = instance.getNativeScrollRef();
      if (node instanceof HTMLElement) return node;
    } catch {
      // ignore
    }
  }
  if (instance instanceof HTMLElement) {
    return instance;
  }
  if (instance && instance._scrollNodeRef instanceof HTMLElement) {
    return instance._scrollNodeRef;
  }
  return null;
}

/**
 * Hook enabling natural mouse drag-to-scroll (touch-like swiping with mouse)
 * on React Native Web horizontal ScrollView and FlatList components on desktop browsers.
 *
 * Features:
 * - Only active on Web (`Platform.OS === 'web'`); zero-cost on iOS/Android.
 * - Leaves touch devices & F12 touch simulation (`pointerType === 'touch'`) 100% untouched.
 * - Suppresses accidental `onPress` / `click` on children when dragging.
 * - Pointer capture ensures smooth dragging even if the mouse leaves the scroll area.
 * - Visual feedback with `cursor: grab` and `cursor: grabbing`.
 * - Optional vertical wheel to horizontal scroll conversion.
 * - Inertial momentum glide on flick release.
 */
export function useWebMouseDragScroll<T = any>(
  externalRef?: React.Ref<T> | null,
  options: WebMouseDragScrollOptions = {}
): React.RefObject<T | null> {
  const localRef = useRef<T | null>(null);
  const targetRef = (externalRef && typeof externalRef === 'object' && 'current' in externalRef)
    ? (externalRef as React.RefObject<T | null>)
    : localRef;

  const currentNodeRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const {
    dragMultiplier = 1.0,
    dragThreshold = 5,
    enableWheel = true,
    enableMomentum = true,
    disabled = false,
  } = options;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || disabled) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      currentNodeRef.current = null;
      return;
    }

    const node = resolveScrollableNode(targetRef.current);

    if (node === currentNodeRef.current) {
      return;
    }

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!node) {
      currentNodeRef.current = null;
      return;
    }

    currentNodeRef.current = node;

    // --- State variables ---
    let isPointerDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasDragged = false;
    let wasDragged = false;
    let resetWasDraggedTimer: any = null;
    let activePointerId: number | null = null;

    // Velocity tracking for momentum
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let momentumFrameId: number | null = null;

    // Save initial cursor
    const originalCursor = node.style.cursor;
    node.style.cursor = 'grab';

    const stopMomentum = () => {
      if (momentumFrameId !== null) {
        cancelAnimationFrame(momentumFrameId);
        momentumFrameId = null;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      // Only handle mouse left-click (pointerType === 'mouse', button === 0)
      if (e.pointerType !== 'mouse' || e.button !== 0) {
        return;
      }

      stopMomentum();

      isPointerDown = true;
      hasDragged = false;
      startX = e.clientX;
      startScrollLeft = node.scrollLeft;
      activePointerId = e.pointerId;

      lastX = e.clientX;
      lastTime = performance.now();
      velocity = 0;

      try {
        node.setPointerCapture(e.pointerId);
      } catch {
        // pointer capture fallback
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      if (e.pointerType !== 'mouse') return;

      const dx = e.clientX - startX;

      if (!hasDragged && Math.abs(dx) > dragThreshold) {
        hasDragged = true;
        wasDragged = true;
        if (resetWasDraggedTimer) {
          clearTimeout(resetWasDraggedTimer);
          resetWasDraggedTimer = null;
        }
        node.style.cursor = 'grabbing';
        node.style.userSelect = 'none';
        node.style.webkitUserSelect = 'none';
      }

      if (hasDragged) {
        e.preventDefault();
        node.scrollLeft = startScrollLeft - dx * dragMultiplier;

        // Track velocity
        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 10) {
          velocity = (e.clientX - lastX) / dt;
          lastX = e.clientX;
          lastTime = now;
        }
      }
    };

    const endDrag = (e?: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;

      node.style.cursor = 'grab';
      node.style.removeProperty('user-select');
      node.style.removeProperty('-webkit-user-select');

      if (activePointerId !== null) {
        try {
          if (node.hasPointerCapture(activePointerId)) {
            node.releasePointerCapture(activePointerId);
          }
        } catch {
          // ignore
        }
        activePointerId = null;
      }

      if (hasDragged) {
        wasDragged = true;
        resetWasDraggedTimer = setTimeout(() => {
          wasDragged = false;
        }, 150);

        // Apply momentum glide if user released with speed
        if (enableMomentum && Math.abs(velocity) > 0.2) {
          let currentVelocity = velocity * 14 * dragMultiplier;
          const glide = () => {
            if (Math.abs(currentVelocity) < 0.3) {
              stopMomentum();
              return;
            }
            node.scrollLeft -= currentVelocity;
            currentVelocity *= 0.92; // decay friction
            momentumFrameId = requestAnimationFrame(glide);
          };
          momentumFrameId = requestAnimationFrame(glide);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        endDrag(e);
      }
    };

    const onPointerCancel = () => {
      endDrag();
    };

    // Crucial: Intercept click event in the CAPTURE phase so children Pressable do not trigger on drag
    const onClickCapture = (e: MouseEvent) => {
      if (wasDragged) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        wasDragged = false;
        if (resetWasDraggedTimer) {
          clearTimeout(resetWasDraggedTimer);
          resetWasDraggedTimer = null;
        }
      }
    };

    // Vertical wheel to horizontal scroll conversion
    const onWheel = (e: WheelEvent) => {
      if (!enableWheel) return;
      // When scrolling vertical wheel without shift or horizontal wheel
      if (Math.abs(e.deltaY) > 0 && Math.abs(e.deltaX) === 0) {
        if (node.scrollWidth > node.clientWidth) {
          e.preventDefault();
          stopMomentum();
          node.scrollLeft += e.deltaY;
        }
      }
    };

    node.addEventListener('pointerdown', onPointerDown, true);
    node.addEventListener('pointermove', onPointerMove, true);
    node.addEventListener('pointerup', onPointerUp, true);
    node.addEventListener('pointercancel', onPointerCancel, true);
    node.addEventListener('click', onClickCapture, true);
    node.addEventListener('wheel', onWheel, { passive: false });

    cleanupRef.current = () => {
      stopMomentum();
      if (resetWasDraggedTimer) {
        clearTimeout(resetWasDraggedTimer);
      }
      node.style.cursor = originalCursor;
      node.removeEventListener('pointerdown', onPointerDown, true);
      node.removeEventListener('pointermove', onPointerMove, true);
      node.removeEventListener('pointerup', onPointerUp, true);
      node.removeEventListener('pointercancel', onPointerCancel, true);
      node.removeEventListener('click', onClickCapture, true);
      node.removeEventListener('wheel', onWheel);
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      currentNodeRef.current = null;
    };
  });

  return targetRef;
}
