# Solana Wallet & Tokens dApp (Next.js + Tailwind)

App minimalista para **conectar una wallet**, **listar SOL + tokens SPL**, y **enviar** tanto SOL como cualquier token SPL en **Devnet**. Construida con Next.js (App Router), TypeScript y Tailwind.

> **Estado actual**: devnet-ready ✅ — incluye UX con estados (Validando → Firmando → Enviando → Confirmada) y enlace a explorer.

---

## ✨ Funcionalidades

* Conexión a **Devnet** y a Phantom (Wallet Adapter).
* **Lista unificada** de activos: SOL + todos los **SPL tokens** del owner (vía `getParsedTokenAccountsByOwner`).
* **Envío único**: selecciona un activo (SOL o SPL) y envíalo a cualquier address (crea el **ATA del destinatario** si no existe).
* **Balances**: SOL (con polling cada 10s) y SPL (refresco manual) en formato humano.
* **UI fullscreen** sin scroll global con **Tailwind** + cards "glass".
* Fix de **SSR/hydration** para `WalletMultiButton`.
* **Estados de transacción** detallados con feedback visual.
* **Enlaces directos** a Solscan para explorar transacciones.

---

## 🧰 Tech Stack

* **Next.js 15** (App Router) + **TypeScript**
* **Tailwind CSS** con diseño fullscreen
* **@solana/web3.js**
* **Solana Wallet Adapter**: `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@solana/wallet-adapter-phantom`
* **@solana/spl-token** (SPL tokens)

> Opcional futuro: Radix UI / shadcn/ui para Select personalizado y toasts.

---

## ✅ Requisitos

* **Node.js ≥ 18**
* **Phantom** instalado y en **Devnet**
* **Solana CLI** + **spl-token CLI** (opcional, para crear/mint de tokens de prueba)

---

## 🚀 Inicio rápido

```bash
# 1) Clonar e instalar
npm install

# 2) Entorno (opcional si no usas RPC propio)
# .env.local
# RPC_URL=https://api.devnet.solana.com

# 3) Dev server
npm run dev
```

Visita `http://localhost:3000`.

---

## 🔧 Configuración de red (Devnet/Mainnet)

* Por defecto el provider usa `clusterApiUrl("devnet")`.
* Si quieres usar un **RPC propio** (Helius, QuickNode, Ankr), añade `RPC_URL` en `.env.local` y ajusta el `SolanaProvider` para leer de `process.env.NEXT_PUBLIC_RPC_URL` o `process.env.RPC_URL`.
* Para **mainnet-beta**, cambia el endpoint (y **no uses** faucets).

---

## 🗂️ Estructura relevante

```
src/
├─ app/
│  ├─ layout.tsx                # Envuelve con <SolanaProvider /> + estética base
│  ├─ page.tsx                  # Home: botón de wallet + tokens list + send card
│  └─ globals.css               # Estilos globales con diseño fullscreen
├─ components/
│  ├─ TokensList.tsx            # Lista de SOL + SPL tokens
│  ├─ SendAnyTokenCard.tsx      # Formulario único para enviar SOL o SPL
│  └─ ui/
│     └─ Card.tsx               # Primitivo de Card (glass)
├─ hooks/
│  ├─ useSolBalance.ts          # Balance SOL con polling cada 10s
│  ├─ useSplBalance.ts          # Balance de un SPL por mint
│  └─ useWalletTokens.ts        # Lista unificada (SOL + SPL)
└─ providers/
   └─ solana-provider.tsx       # ConnectionProvider + WalletProvider + Modal
```

---

## 🧩 Cómo funciona

### Providers

* `providers/solana-provider.tsx`:

  * `ConnectionProvider` → `clusterApiUrl("devnet")` (o tu RPC)
  * `WalletProvider` → `PhantomWalletAdapter` (`autoConnect`)
  * `WalletModalProvider` → estilos de Wallet Adapter UI

### SSR/Hydration fix

* `WalletMultiButton` se importa **dinámico** con `{ ssr: false }` en `page.tsx` para evitar hydration mismatch.

### Hooks

* `useSolBalance(publicKey)`: lee balance de SOL, con **polling** cada 10s (solo cuando la pestaña está visible).
* `useSplBalance(publicKey, mint)`: obtiene balance de un token SPL (ATA del owner) y expone `refresh()`.
* `useWalletTokens(owner)`: agrega SOL + escanea todas las cuentas SPL del owner (token program) y forma la lista final.

### Envío de tokens

* `SendAnyTokenCard`:

  * Si es **SOL**: `SystemProgram.transfer`.
  * Si es **SPL**: calcula ATAs `from` y `to`. Si **no existe ATA** del destinatario, añade `createAssociatedTokenAccountInstruction`. Luego `createTransferInstruction`.
  * Flujo UX: `Validando → Preparando → Firmando → Enviando → Confirmada` + link a Solscan (devnet).

### UI/UX Mejorada

* **Diseño fullscreen**: sin scroll global, altura 100vh con overflow controlado.
* **Cards glass**: efecto cristal con backdrop-blur y bordes sutiles.
* **Estados visuales**: indicadores claros para cada fase de la transacción.
* **Responsive**: adapta el layout en móviles y desktop.

---

## 🧪 Probar con tu propio token SPL (Devnet)

> Opcional — útil para ver un token custom en la lista y poder enviarlo.

```bash
# Crear mint (token) en Devnet
spl-token create-token
# Copia el Address (mint)

# Crear la cuenta asociada (ATA) de tu wallet para ese mint
spl-token create-account <MINT>

# Mintear tokens a tu wallet (ej. 1000 unidades humanas)
spl-token mint <MINT> 1000
```

* Si Phantom **no** muestra el token custom, igual aparecerá en la **lista** de la dApp.
* En `page.tsx` puedes mapear mints conocidos a símbolos legibles (`KNOWN`).

---

## 👁️ Personalización de UI (Tailwind-only)

* **Diseño fullscreen** configurado en `globals.css` con `overflow: hidden` en html/body.
* **Card glass** en `components/ui/Card.tsx` con efectos de cristal.
* **Colores principales**: violeta para botones primarios, fondo oscuro con variables CSS.
* Botón principal recomendado:

  ```tsx
  className="w-full rounded-xl px-4 py-2 font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition"
  ```
* Inputs/Select recomendados:

  ```tsx
  className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10 focus:ring-2 focus:ring-violet-600"
  ```
* **Variables CSS** en `:root` para temas claro/oscuro automáticos.

---

## 🧭 Scripts

* `npm run dev` — arranca en desarrollo
* `npm run build` — build de producción
* `npm run start` — sirve `.next`
* `npm run lint` — lint (si está configurado por create-next-app)

---

## 🔒 Seguridad

* Nunca subas **semillas** o `id.json` → `.gitignore` ya incluye `**/id.json` y `.env*`.
* Devnet ≠ Mainnet. No reutilices llaves reales.
* Si cambias a `mainnet-beta`, usa un RPC fiable y revisa **comisiones** y **fondos**.
* **Polling inteligente**: solo actualiza balances cuando la pestaña está visible.

---

## 🐞 Troubleshooting

* **Hydration error (WalletMultiButton)**: importa dinámico con `{ ssr:false }`.
* **"You have tried to read publicKey…"**: falta envolver con `<WalletProvider>` → revisa `layout.tsx` y `SolanaProvider`.
* **Balance no cambia**: confirma que Phantom está en **Devnet**, usa faucet/minteo y pulsa **Refrescar**.
* **Rate limit/timeout**: cambia de RPC o aumenta intervalo de polling (actualmente 10s).
* **Dirección inválida**: valida base58 del destino; el formulario ya muestra error amigable.
* **UI no responsive**: verifica que `globals.css` esté importado correctamente.

---

## 🆕 Cambios Recientes

### v1.1.0
* **Polling optimizado**: cambio de 5s a 10s para reducir carga en RPC.
* **Diseño fullscreen**: eliminado scroll global, altura fija 100vh.
* **UI mejorada**: cards con efecto glass, mejor responsive design.
* **Estados visuales**: feedback más claro en transacciones.
* **Performance**: polling solo cuando la pestaña está visible.

---

## 📄 Licencia

MIT — úsalo y modifícalo libremente.

---

## 🙌 Agradecimientos

* [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
* Comunidad Solana por ejemplos y documentación.

---

## 📌 Roadmap sugerido

* Agregar **Radix Select** / **shadcn/ui** para un select custom y toasts.
* Suscripción **WebSocket** (`onAccountChange`) para balances en tiempo real sin polling.
* Soporte multi-wallet (Solflare, …) y estado global de sesión.
* **Historial de transacciones** con paginación.
* **Modo mainnet** con configuración de seguridad adicional.
* Mini-proyecto 2: **Mint de NFT** básico (Metaplex) y visualización.
