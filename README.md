# NauLPong 🏓⚡

Pong online 1v1 con poderes — hecho con Next.js 14 + Cloudflare Workers (Durable Objects), deployable a Vercel + Cloudflare.

## Personajes

🟢 **El wey que va por su hijo a las fiestas** — el bueno, cara de cansancio paterno
🔴 **El Clavel** — el malo, mirada sospechosa

Cada partida asigna aleatoriamente uno a cada lado.

## Modos

- ⚡ **Partida Rápida** — entrás a una cola global, te emparejamos con un rival.
- 🎮 **Crear Sala** — generás un código de 4 letras y se lo pasás a un amigo.
- 🔑 **Unirse con Código** — entrás a una sala existente.

## Los 8 poderes

| Emoji | Nombre | Efecto |
| ----- | ------ | ------ |
| 🐢 | Slow Mo | La pelota se ralentiza por 4 segundos |
| 📏 | Paddle XL | Tu paleta crece al doble por 5 segundos |
| 🔪 | Paddle Mini | La paleta del rival se achica a la mitad por 5 segundos |
| 🚀 | Turbo Ball | La pelota acelera +50% hasta el próximo gol |
| 🛡️ | Escudo | Bloquea automáticamente el próximo gol en tu contra |
| ❄️ | Congelar | La paleta del rival se congela por 2 segundos |
| 🌀 | Curva | La pelota se mueve en zig-zag por 5 segundos |
| 🔄 | Invertir | Los controles del rival se invierten por 4 segundos |

## Reglas

- Primer jugador en llegar a **7 puntos** gana.
- Los orbes de poder aparecen aleatoriamente en la cancha. Cuando la pelota toca un orbe, el último jugador que la tocó se queda con el efecto.
- El servidor (Cloudflare Worker + Durable Objects) corre la simulación a 30Hz — **server-authoritative, anti-trampa**.

## Arquitectura

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind. Renderizado en HTML5 Canvas con scaling pixelado.
- **Backend realtime**: Cloudflare Worker con dos Durable Objects:
  - `GameRoom`: una instancia por código de sala, mantiene el game state y broadcastea a 30Hz.
  - `LobbyRoom`: una única instancia global `global` con cola FIFO de matchmaking.
- **Cliente**: usa la librería `partysocket` que abre un WebSocket a `wss://<host>/parties/<party>/<roomId>`. Esa URL pattern la resuelve el Worker enrutando al Durable Object correcto.
- **Compartido**: `src/lib/game-types.ts` y `src/lib/game-logic.ts` los importan tanto cliente como servidor.

```
src/
  app/
    page.tsx                 # Landing
    play/[code]/page.tsx     # Página de partida
    about/page.tsx
    layout.tsx
    globals.css              # CRT, neon, fuentes pixel
  components/
    HomeActions.tsx          # 3 botones del menú + matchmaking client
    GameClient.tsx           # WebSocket client + UI de partida
    GameCanvas.tsx           # Render del campo en Canvas
  lib/
    game-types.ts            # Tipos compartidos client/server
    game-logic.ts            # Tick / física / power-ups
    party-host.ts            # Resuelve la URL del Worker
    sounds.ts                # SFX chiptune con Web Audio API
worker/
  index.ts                   # Router del Worker (CORS + dispatch a DOs)
  game-room.ts               # Durable Object: GameRoom (partida)
  lobby-room.ts              # Durable Object: LobbyRoom (matchmaking)
wrangler.toml
```

## Desarrollo

Necesitás Node 20+.

```bash
npm install
# Corre Next.js (web) y Wrangler (worker) juntos:
npm run dev:all
```

- Web: http://localhost:3000
- Worker: http://localhost:1999

Variables de entorno (opcional para desarrollo):

```env
NEXT_PUBLIC_PARTYKIT_HOST=127.0.0.1:1999
```

(El nombre `NEXT_PUBLIC_PARTYKIT_HOST` quedó del setup original; ahora apunta al Worker de Cloudflare en producción.)

## Deploy

### Cloudflare Workers (servidor)

```bash
npx wrangler login   # primera vez, abre el navegador
npm run deploy:worker
```

Te imprime tu host, algo como `naulpong.<tu-subdominio>.workers.dev`. Si es la primera vez también te pide elegir un subdominio (puede ser tu cuenta).

### Vercel (frontend)

1. Conectá este repo a Vercel.
2. En **Settings → Environment Variables**, agregá:
   - `NEXT_PUBLIC_PARTYKIT_HOST` = el host del Worker (sin `https://`, ej. `naulpong.tu-subdominio.workers.dev`)
3. Deploy.

## Sprites

Mirá `public/sprites/README.txt` para los specs y nombres de archivo. Por ahora los personajes usan emojis como placeholder.

## Controles

- **Teclado**: `↑/↓` o `W/S`
- **Mobile**: tocá la mitad superior o inferior de la pantalla
