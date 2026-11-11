"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

import type { MovementInput } from "@/lib/world/types";

const INITIAL_INPUT: MovementInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false
};

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;

  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function isFocusedHudControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(target.closest("button, a, [role='button']"));
}

/**
 * Tracks physical key codes (`KeyW`, `KeyA`, `KeyS`, `KeyD`, `ShiftLeft`, `Space`, `KeyR`)
 * in a mutable ref so frame-by-frame 3D movement causes zero React re-renders
 * and remains immune to Vietnamese Telex/IME character composition.
 */
export function useKeyboardControls({
  onInteract,
  onCancel,
  onResetCamera
}: {
  onInteract: () => void;
  onCancel: () => void;
  onResetCamera: () => void;
}): MutableRefObject<MovementInput> {
  const inputRef = useRef<MovementInput>({ ...INITIAL_INPUT });
  const interactRef = useRef(onInteract);
  const cancelRef = useRef(onCancel);
  const resetCameraRef = useRef(onResetCamera);

  useEffect(() => {
    interactRef.current = onInteract;
    cancelRef.current = onCancel;
    resetCameraRef.current = onResetCamera;
  }, [onInteract, onCancel, onResetCamera]);

  useEffect(() => {
    const heldCodes = new Set<string>();

    function syncInput() {
      inputRef.current = {
        forward: heldCodes.has("KeyW") || heldCodes.has("ArrowUp"),
        backward: heldCodes.has("KeyS") || heldCodes.has("ArrowDown"),
        left: heldCodes.has("KeyA") || heldCodes.has("ArrowLeft"),
        right: heldCodes.has("KeyD") || heldCodes.has("ArrowRight"),
        sprint: heldCodes.has("ShiftLeft") || heldCodes.has("ShiftRight"),
        jump: heldCodes.has("Space")
      };
    }

    function clearAll() {
      heldCodes.clear();
      inputRef.current = { ...INITIAL_INPUT };
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableElement(event.target)) return;

      if (
        event.code === "ArrowUp" ||
        event.code === "ArrowDown" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight"
      ) {
        event.preventDefault();
      }

      if (event.code === "Space") {
        if (isFocusedHudControl(event.target)) return;
        event.preventDefault();
        heldCodes.add("Space");
        syncInput();
        return;
      }

      if (event.code === "KeyE" && !event.repeat) {
        event.preventDefault();
        interactRef.current();
        return;
      }

      if (event.code === "KeyR" && !event.repeat) {
        event.preventDefault();
        resetCameraRef.current();
        return;
      }

      if (event.code === "Escape" && !event.repeat) {
        event.preventDefault();
        cancelRef.current();
        return;
      }

      heldCodes.add(event.code);
      syncInput();
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (heldCodes.delete(event.code)) {
        syncInput();
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearAll();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearAll);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearAll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearAll();
    };
  }, []);

  return inputRef;
}
