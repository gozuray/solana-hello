"use client";
import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

export function useSplBalance(publicKey: PublicKey | null, mint: PublicKey) {
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const ata = await getAssociatedTokenAddress(mint, publicKey);
      const accountInfo = await getAccount(connection, ata);
      setBalance(Number(accountInfo.amount));
    } catch (err) {
      setBalance(0); // si no existe cuenta asociada
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, mint]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refresh: fetchBalance };
}
