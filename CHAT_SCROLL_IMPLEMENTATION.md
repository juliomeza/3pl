# Chat Scroll Implementation - Tracking Document

## Objetivo Principal
Implementar un chat assistant con scroll INTERNO únicamente, sin que aparezca la barra de scroll externa de la página cuando el contenido del chat crece.

## Requisitos Específicos
- ✅ Layout lado a lado: Data View (izquierda) + Chat (derecha)
- ✅ Barra redimensionable entre paneles (50/50 inicial, ajustable 20%-80%)
- ✅ Responsive: En móviles solo mostrar chat
- ✅ Auto-scroll en chat cuando llegan nuevos mensajes
- ✅ Scrollbar personalizada estilo ChatGPT (sutil, gris claro, hover más oscuro)
- ❌ **PROBLEMA PRINCIPAL**: Evitar scroll externo de la página completa

## Estructura Actual
```
employee/layout.tsx
├── SidebarProvider
├── Sidebar (fijo)
├── div.flex-1.flex.flex-col
    ├── header (sticky, fijo)
    ├── main (aquí está el problema del overflow)
        └── div (padding container)
            └── page.tsx content
```

## Intentos Realizados

### Intento 1: Dimensiones básicas del contenedor
**Cambio**: `h-[calc(100vh-12rem)]` → `h-[calc(100vh-8rem)]`
**Resultado**: ❌ Scroll externo persiste
**Problema**: Cálculo de altura incorrecto

### Intento 2: Overflow management en layout
**Cambios**:
- Layout main: `overflow-y-auto` → `overflow-hidden` (solo en assistant)
- Conditional padding en assistant page
**Resultado**: ✅ Elimina scroll externo inicial, ❌ pero reaparece con contenido

### Intento 3: Contenedor principal del chat
**Cambios**:
- `h-[calc(100vh-8rem)]` → `h-screen` → `h-full`
- Agregado `overflow-hidden` en múltiples niveles
**Resultado**: ❌ Scroll externo sigue apareciendo

### Intento 4: Alturas máximas específicas
**Cambios**:
- `max-h-screen` en contenedor principal
- `maxHeight: 'calc(100vh - 200px)'` en CardContent
- `overflow-hidden` en Cards
**Resultado**: ❌ Scroll externo persiste cuando chat crece

## Análisis del Problema

### Causas Identificadas
1. **Layout inheritance**: El main del layout tiene dimensiones que permiten crecimiento
2. **Padding conflicts**: El padding del layout + padding del componente puede causar overflow
3. **Height calculations**: Los cálculos de altura no consideran todos los elementos fijos (header, sidebar)
4. **Flex behavior**: Los contenedores flex pueden expandirse más allá del viewport

### Elementos Fijos a Considerar
- Sidebar: ~240px (cuando expandido)
- Header: ~64px (estimado)
- Padding del layout: `p-4 md:p-8` = 16px/32px cada lado
- Gap entre elementos: 16px

### Intento 5: Altura absoluta precisa (Estrategia A)
**Cambios**:
- Contenedor principal: `height: 'calc(100vh - 128px)'` (altura fija)
- Header del chat: altura fija `h-10`
- Contenedor de paneles: `height: 'calc(100% - 56px)'`
- Eliminado `flex-1` en favor de dimensiones específicas
- Cards con `h-full` y `overflow-hidden`
**Resultado**: ✅ Scroll interno funciona perfecto, ❌ pero pequeño espacio extra causa scroll externo
**Análisis**: Muy cerca del objetivo, solo necesita ajuste fino de dimensiones

### Intento 6: Ajuste fino de dimensiones
**Cambios**:
- Contenedor principal: `calc(100vh - 128px)` → `calc(100vh - 144px)` (reducido 16px)
- Mantener todas las demás dimensiones iguales
**Objetivo**: Eliminar el pequeño espacio que causa scroll externo
**Resultado**: 🔄 Probando...

## Estado Actual
🔄 **Intento 6** - Reduciendo altura del contenedor principal para eliminar scroll externo
Estrategia: Ajuste fino de 16px menos en la altura total

---
*Documento creado: 2025-07-28*
*Última actualización: 2025-07-28*
