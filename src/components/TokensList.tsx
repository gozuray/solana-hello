"use client";

import { WalletToken } from "../hooks/useWalletTokens";
import { Card, CardBody } from "./ui/Card";

export default function TokensList({
  tokens,
  onRefresh,
  loading,
  title = "Mis tokens",
}: {
  tokens: WalletToken[];
  onRefresh?: () => void;
  loading?: boolean;
  title?: string;
}) {
  return (
    <Card className="max-w-xl w-full">
      <CardBody>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {onRefresh && (
            <button
              className="border rounded px-3 py-1 text-sm"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? "Actualizando…" : "Refrescar"}
            </button>
          )}
        </div>

        {tokens.length === 0 ? (
          <p className="text-sm opacity-70">Sin tokens detectados.</p>
        ) : (
          <ul className="divide-y">
            {tokens.map((t, i) => (
              <li
                key={`${t.kind}-${t.mint?.toBase58() ?? "sol"}-${i}`}
                className="py-2 flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="font-medium">
                    {t.symbol}{" "}
                    {t.kind === "SPL" && (
                      <span className="opacity-50 text-xs">(SPL)</span>
                    )}
                  </div>
                  {t.kind === "SPL" && t.mint && (
                    <div className="text-xs opacity-70">
                      {t.mint.toBase58().slice(0, 8)}…
                      {t.mint.toBase58().slice(-6)}
                    </div>
                  )}
                </div>
                <div className="font-mono">
                  {t.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: t.decimals,
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
