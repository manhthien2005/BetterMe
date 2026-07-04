"use client";

export function ConfirmResetDialog({ open, onCancel, onConfirm }: { open: boolean; onCancel(): void; onConfirm(): void }) {
  if (!open) return null;

  return (
    <div aria-label="Confirm reset" role="dialog">
      <p>This clears local BetterMe data on this device and recreates the default tracker.</p>
      <button onClick={onCancel} type="button">Cancel reset</button>
      <button onClick={onConfirm} type="button">Confirm reset</button>
    </div>
  );
}
