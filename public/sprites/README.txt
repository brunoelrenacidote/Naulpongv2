SPRITES PARA NAULPONG
======================

Por defecto el juego dibuja sprites pixel-art "a mano" en código (placeholders).
Si dejás un archivo PNG con uno de los nombres de abajo, el juego usa el PNG
en lugar del placeholder. Si lo borrás, vuelve al placeholder.

UBICACIÓN: este mismo directorio (`/public/sprites/`).

NOMBRES DE ARCHIVO (case-sensitive):

  hijo-fiesta-idle.png    ← cara normal (default)
  hijo-fiesta-blink.png   ← parpadeo (cada ~6 segundos por 2 cuadros)
  hijo-fiesta-happy.png   ← celebración (cuando él mete gol o gana)
  hijo-fiesta-sad.png     ← decepción (cuando le hacen gol o pierde)

  clavel-idle.png
  clavel-blink.png
  clavel-happy.png
  clavel-sad.png

FORMATO:
- PNG con fondo transparente
- Pixel-art a baja resolución
- Tamaño base recomendado: 16 ancho x 18 alto (chico, queda crocante)
- Si querés más detalle: 32x36 o 64x72 también funcionan
  (el juego escala automáticamente, manteniendo `image-rendering: pixelated`)

CONSEJOS:
- "blink" = lo mismo que idle pero con los ojos cerrados (1-2 px de diferencia)
- "happy" = sonrisa, ojos abiertos, un poco más de color
- "sad" = boca abajo, una lagrimita o gesto roto

Si solo te bancas hacer 1 pose, hacé `idle` y los demás caen al placeholder
del código (que también es pixel-art pero más simple).
