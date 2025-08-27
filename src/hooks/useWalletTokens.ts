"use client";
import { useCallback, useEffect, useState } from "react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export type WalletToken = {
  kind: "SOL" | "SPL";
  mint: PublicKey | null;      // null para SOL
  symbol: string;              // "SOL" o alias si lo conoces; si no, mint corto
  decimals: number;            // 9 para SOL; SPL viene del token account
  amountRaw: bigint;           // entero en unidades mínimas
  amount: number;              // cantidad humana (decimales aplicados)
  ata?: PublicKey;             // solo SPL
  mintStr?: string;            // solo SPL (conveniencia)
};

export function useWalletTokens(
  owner: PublicKey | null,
  known?: Record<string, { symbol?: string }>
) {
  const { connection } = useConnection();
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!owner) {
      setTokens([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list: WalletToken[] = [];

      // 1) SOL
      const lamports = await connection.getBalance(owner, { commitment: "processed" });
      list.push({
        kind: "SOL",
        mint: null,
        symbol: "SOL",
        decimals: 9,
        amountRaw: BigInt(lamports),
        amount: lamports / LAMPORTS_PER_SOL,
      });

      // 2) SPL tokens del usuario
      const parsed = await connection.getParsedTokenAccountsByOwner(owner, {
        programId: TOKEN_PROGRAM_ID,
      });

      for (const { pubkey, account } of parsed.value) {
        const info: any = account.data.parsed.info;
        const mintStr: string = info.mint;
        const decimals: number = info.tokenAmount.decimals;
        const rawStr: string = info.tokenAmount.amount; // entero string
        const raw = BigInt(rawStr);
        const ui = Number(raw) / Math.pow(10, decimals);

        // etiqueta: usa alias si lo conoces, si no mint corto
        const alias = known?.[mintStr]?.symbol;
        const shortMint = `${mintStr.slice(0, 6)}…${mintStr.slice(-6)}`;

        list.push({
          kind: "SPL",
          mint: new PublicKey(mintStr),
          mintStr,
          symbol: alias ?? shortMint,
          decimals,
          amountRaw: raw,
          amount: ui,
          ata: pubkey,
        });
      }

      // Opcional: ordenar por saldo descendente
      list.sort((a, b) => b.amount - a.amount);

      setTokens(list);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar tokens");
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [connection, owner, known]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tokens, loading, error, refresh };
}
