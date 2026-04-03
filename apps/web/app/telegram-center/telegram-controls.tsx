"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  apiBaseUrl: string;
};

type ActionState = {
  kind: "idle" | "success" | "error";
  message: string;
};

const initialState: ActionState = {
  kind: "idle",
  message: "",
};

export function TelegramControls({ apiBaseUrl }: Props) {
  const [state, setState] = useState<ActionState>(initialState);
  const [isPreparing, setIsPreparing] = useState(false);

  const handlePrepare = async () => {
    setIsPreparing(true);
    setState(initialState);

    try {
      const webhookResponse = await fetch(`${apiBaseUrl}/api/telegram/webhook/sync`, {
        method: "POST",
      });

      const webhookPayload = (await webhookResponse.json().catch(() => null)) as
        | { message?: string; description?: string }
        | null;

      if (!webhookResponse.ok) {
        throw new Error(webhookPayload?.message || "Telegram bağlantısı hazırlanamadı.");
      }

      const commandsResponse = await fetch(`${apiBaseUrl}/api/telegram/commands/sync`, {
        method: "POST",
      });

      const commandsPayload = (await commandsResponse.json().catch(() => null)) as
        | { message?: string; description?: string }
        | null;

      if (!commandsResponse.ok) {
        throw new Error(commandsPayload?.message || "Telegram komutları hazırlanamadı.");
      }

      setState({
        kind: "success",
        message: "Telegram bağlantısı hazır. Şimdi Telegram’da bağlantıyı başlatıp /start yazabilirsin.",
      });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Telegram bağlantısı hazırlanamadı.",
      });
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <div className="flow-actions">
      <button className="solid-action" disabled={isPreparing} onClick={handlePrepare} type="button">
        {isPreparing ? "Hazırlanıyor..." : "Telegram bağlantısını hazırla"}
      </button>
      <Link className="ghost-action" href="/content-calendar">
        İçerik takvimine geç
      </Link>
      {state.message ? (
        <p
          className="muted"
          style={{
            color: state.kind === "error" ? "#c4543d" : "#45613b",
            margin: 0,
          }}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
