"use client";

import { useI18n } from "../i18n/locale-provider";

export function ConfirmResetDialog({ open, onCancel, onConfirm }: { open: boolean; onCancel(): void; onConfirm(): void }) {
  const { locale } = useI18n();
  if (!open) return null;

  return (
    <div aria-label={locale === "vi" ? "Xác nhận reset" : "Confirm reset"} role="dialog">
      <p>{locale === "vi" ? "Thao tác này xoá dữ liệu BetterMe cục bộ trên thiết bị này và tạo lại tracker mặc định." : "This clears local BetterMe data on this device and recreates the default tracker."}</p>
      <button onClick={onCancel} type="button">{locale === "vi" ? "Huỷ reset" : "Cancel reset"}</button>
      <button onClick={onConfirm} type="button">{locale === "vi" ? "Xác nhận reset" : "Confirm reset"}</button>
    </div>
  );
}
