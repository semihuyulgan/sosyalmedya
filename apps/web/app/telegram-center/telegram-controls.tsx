"use client";

import { useMemo, useState } from "react";

type Props = {
  apiBaseUrl: string;
  businessId: string;
  defaultChatId: string;
  defaultChatTitle: string;
};

type ActionState = {
  kind: "idle" | "success" | "error";
  message: string;
};

const initialState: ActionState = {
  kind: "idle",
  message: "",
};

export function TelegramControls({ apiBaseUrl, businessId, defaultChatId, defaultChatTitle }: Props) {
  const [chatId, setChatId] = useState(defaultChatId);
  const [chatTitle, setChatTitle] = useState(defaultChatTitle);
  const [saveState, setSaveState] = useState<ActionState>(initialState);
  const [syncState, setSyncState] = useState<ActionState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isSaveDisabled = useMemo(() => isSaving || !chatId.trim(), [chatId, isSaving]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveState(initialState);

    try {
      const response = await fetch(`${apiBaseUrl}/api/businesses/${businessId}/telegram-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatId.trim(),
          chatTitle: chatTitle.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message || "Telegram link could not be saved.");
      }

      setSaveState({
        kind: "success",
        message: "Telegram baglantisi kaydedildi. Sayfayi yenileyince guncel durum gorunur.",
      });
    } catch (error) {
      setSaveState({
        kind: "error",
        message: error instanceof Error ? error.message : "Telegram link could not be saved.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncState(initialState);

    try {
      const response = await fetch(`${apiBaseUrl}/api/telegram/webhook/sync`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as { message?: string; description?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message || "Telegram webhook could not be synced.");
      }

      setSyncState({
        kind: "success",
        message: payload?.description || "Telegram webhook senkronize edildi.",
      });
    } catch (error) {
      setSyncState({
        kind: "error",
        message: error instanceof Error ? error.message : "Telegram webhook could not be synced.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div className="form-grid">
        <label>
          <span>Chat ID</span>
          <input onChange={(event) => setChatId(event.target.value)} placeholder="-100..." value={chatId} />
        </label>
        <label>
          <span>Chat title</span>
          <input
            onChange={(event) => setChatTitle(event.target.value)}
            placeholder="Luna Bistro Owners"
            value={chatTitle}
          />
        </label>
      </div>

      <div className="span-2" style={{ display: "grid", gap: 12 }}>
        <button className="primary-submit" disabled={isSaveDisabled} onClick={handleSave} type="button">
          {isSaving ? "Kaydediliyor..." : "Save Telegram Link"}
        </button>
        {saveState.message ? (
          <p className="muted" style={{ color: saveState.kind === "error" ? "#ffb86b" : undefined }}>
            {saveState.message}
          </p>
        ) : null}
      </div>

      <div className="span-2" style={{ display: "grid", gap: 12 }}>
        <button className="primary-submit" disabled={isSyncing} onClick={handleSync} type="button">
          {isSyncing ? "Senkronize ediliyor..." : "Sync Telegram Webhook"}
        </button>
        {syncState.message ? (
          <p className="muted" style={{ color: syncState.kind === "error" ? "#ffb86b" : undefined }}>
            {syncState.message}
          </p>
        ) : null}
      </div>
    </>
  );
}
