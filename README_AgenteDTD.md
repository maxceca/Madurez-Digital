# Agente DTD — Diagnóstico de Madurez Digital
## Concentración Innovación y Transformación Digital
**Socio Formador: Rizes (rizes.com.mx) | Prof. Alan Cerón C. | Tec de Monterrey**

---

## Archivos del repositorio

```
agente_dtd_sheets.html          → El agente (abrir en Claude.ai o GitHub Pages)
AgenteDMD_GoogleAppsScript.js   → Backend para Google Sheets (configurar 1 vez)
README_AgenteDTD.md             → Este archivo
```

---

## Configuración en 3 pasos

### Paso 1 — Instalar el Apps Script (5 min, solo el profesor una vez)

1. Ve a [https://script.google.com](https://script.google.com) → **Nuevo proyecto**
2. Borra el código que aparece por defecto
3. Copia y pega el contenido completo de `AgenteDMD_GoogleAppsScript.js`
4. Guarda el proyecto (Ctrl+S) → ponle el nombre: `AgenteDTD_Rizes`
5. Click en **Implementar** → **Nueva implementación**
6. Configura así:
   - **Tipo**: Aplicación web
   - **Descripción**: Agente DTD Rizes
   - **Ejecutar como**: Yo
   - **Quién tiene acceso**: **Cualquier persona (incluidos usuarios anónimos)**
7. Click en **Implementar** → Autoriza los permisos cuando se pida
8. **Copia la URL** que aparece (empieza con `https://script.google.com/macros/s/...`)

### Paso 2 — Configurar la URL en el agente HTML (2 min)

Abre `agente_dtd_sheets.html` en cualquier editor de texto. Busca esta línea:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/TU_URL_AQUI/exec';
```

Reemplaza `TU_URL_AQUI` con tu URL real. Guarda el archivo.

### Paso 3 — Subir a GitHub y usar (1 min)

1. Sube los archivos a tu repositorio de GitHub
2. Activa **GitHub Pages** en Settings → Pages → Branch: main
3. El agente estará disponible en:
   `https://[tu-usuario].github.io/[tu-repo]/agente_dtd_sheets.html`
4. Comparte esa URL con los alumnos

> **Nota importante:** Para que el agente de IA funcione, los alumnos deben abrirlo dentro de **claude.ai** (no directamente desde GitHub Pages). GitHub Pages es solo para hospedar el archivo. El flujo correcto: el alumno entra a claude.ai → crea un nuevo artifact → pega el contenido del HTML, o se comparte como artifact publicado.

---

## ¿Qué datos guarda en Google Sheets?

El Apps Script crea automáticamente un Google Sheet llamado **`DTD_DiagnosticoRizes`** con 3 hojas:

### Hoja "Sesiones"
Cada vez que un alumno inicia sesión se registra:
- Timestamp, Nombre, Rol, Equipo, Módulo, Etapa, Session_ID

### Hoja "Scores"
Cada vez que un alumno guarda un score de dimensión EGADE:
- Timestamp, Session_ID, Nombre, Rol, Dimensión, Score (%), Nivel, **Evidencia/Notas**, Etapa, Módulo

### Hoja "Dashboard"
Vista consolidada automática por equipo:
- Nombre | Rol | Etapa | Estrategia | Liderazgo | Cultura | Personas | Innovación | Competencias | Resiliencia | Aceleradores | **Índice Global** | Nivel

Cada fila se colorea automáticamente según el nivel de madurez:
- 🔴 Nivel 1 Inicial (0-19%)
- 🟠 Nivel 2 Emergente (20-39%)
- 🔵 Nivel 3 Definido (40-59%)
- 🟢 Nivel 4 Gestionado (60-79%)
- 🟣 Nivel 5 Optimizado (80-100%)

---

## Comportamiento sin conexión a Sheets

Si el alumno no tiene conexión o la URL no está configurada, **el agente sigue funcionando**:
- Los scores se guardan en `localStorage` del navegador
- No se pierde ningún dato dentro de la misma sesión y dispositivo
- El agente muestra un aviso de "guardado localmente"

---

## Cómo ve el profesor los datos en tiempo real

1. Abre el Google Sheet `DTD_DiagnosticoRizes` en tu Google Drive
2. La hoja **Dashboard** se actualiza automáticamente cada vez que un equipo guarda un score
3. Para ver el detalle por equipo: hoja **Scores** → filtrar por `Nombre` o `Session_ID`
4. Para exportar a Excel: Archivo → Descargar → Microsoft Excel (.xlsx)

También puedes consultar los datos vía URL (solo lectura):
```
https://script.google.com/macros/s/[TU_URL]/exec?action=get_dashboard
https://script.google.com/macros/s/[TU_URL]/exec?action=get_all_scores
```

---

## Funcionalidades del agente

- 🤖 **IA conversacional** adaptada al rol del alumno (Codificador, Tester, Documentador, Pitch/Multimedia)
- 🏢 **Contextualizado con Rizes** — el agente conoce el sector MICE, los clientes del SF y las hipótesis de madurez
- 📊 **Instrumento EGADE completo** — guía las 8 dimensiones con preguntas específicas para Rizes
- 💾 **Persistencia dual** — Google Sheets (principal) + localStorage (respaldo automático)
- 🔄 **Chips contextuales** — acciones rápidas que cambian según la etapa del Reto
- 📈 **Índice compuesto en tiempo real** — calcula automáticamente el nivel de madurez al ir capturando dimensiones
- ✅ **Validación de evidencia** — el agente no acepta scores sin evidencia específica del SF

---

## Créditos

**Prof. Alan Cerón C.** — Tecnológico de Monterrey, Escuela de Negocios
Concentración en Innovación y Transformación Digital — Módulo 4
Socio Formador: Rizes (rizes.com.mx) — Semestre 2026

