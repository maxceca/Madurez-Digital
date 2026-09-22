/**
 * ═══════════════════════════════════════════════════════════════
 * AGENTE DTD — Google Apps Script Backend
 * Concentración Innovación y Transformación Digital
 * Socio Formador: Rizes (rizes.com.mx)
 * Prof. Alan Cerón C. · Tecnológico de Monterrey
 * ═══════════════════════════════════════════════════════════════
 *
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Ve a https://script.google.com → Nuevo proyecto
 * 2. Pega este código completo
 * 3. Menú: Extensiones → Apps Script → guardar
 * 4. Click en "Implementar" → "Nueva implementación"
 *    - Tipo: Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier persona (anónimo)
 * 5. Autoriza los permisos cuando se pida
 * 6. Copia la URL de la implementación → pégala en el agente HTML
 * 7. En el Sheet creado automáticamente, comparte con los alumnos
 *    en modo "Solo ver" para que puedan ver el dashboard.
 *
 * ESTRUCTURA DEL SHEET:
 * Hoja "Sesiones"   → registro de cada sesión iniciada
 * Hoja "Scores"     → scores por dimensión por equipo
 * Hoja "Dashboard"  → resumen calculado automáticamente
 * ═══════════════════════════════════════════════════════════════
 */

const SHEET_NAME = 'DTD_DiagnosticoRizes';

// ── Obtener o crear el Spreadsheet ───────────────────────────
function getOrCreateSheet() {
  const files = DriveApp.getFilesByName(SHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  const ss = SpreadsheetApp.create(SHEET_NAME);
  initSheets(ss);
  return ss;
}

// ── Inicializar hojas con headers ─────────────────────────────
function initSheets(ss) {
  // Hoja Sesiones
  let sh = ss.getSheetByName('Sesiones') || ss.insertSheet('Sesiones');
  sh.getRange(1,1,1,8).setValues([[
    'Timestamp','Nombre','Rol','Empresa_SF','Sector','Módulo','Etapa','Session_ID'
  ]]);
  sh.getRange(1,1,1,8).setFontWeight('bold').setBackground('#0D1B3E').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);

  // Hoja Scores
  let sc = ss.getSheetByName('Scores') || ss.insertSheet('Scores');
  sc.getRange(1,1,1,13).setValues([[
    'Timestamp','Session_ID','Nombre','Rol','Dimensión','Score_Pct',
    'Nivel','Notas_Evidencia','Socio_Formador','Etapa_Reto',
    'Módulo','Validado','Fecha_Validación'
  ]]);
  sc.getRange(1,1,1,13).setFontWeight('bold').setBackground('#0D1B3E').setFontColor('#FFFFFF');
  sc.setFrozenRows(1);

  // Hoja Dashboard (calculada con fórmulas)
  let db = ss.getSheetByName('Dashboard') || ss.insertSheet('Dashboard');
  db.getRange('A1').setValue('DASHBOARD — Diagnóstico de Madurez Digital · Rizes');
  db.getRange('A1').setFontSize(14).setFontWeight('bold').setBackground('#0D1B3E').setFontColor('#C9993A');
  db.getRange('A1:M1').merge();

  const dimHeaders = [
    ['Equipo/Nombre','Rol','Etapa','Estrategia','Liderazgo','Cultura Digital',
     'Personas y Org.','Innovación','Competencias','Resiliencia','Aceleradores',
     'Índice Global','Nivel']
  ];
  db.getRange(2,1,1,13).setValues(dimHeaders);
  db.getRange(2,1,1,13).setFontWeight('bold').setBackground('#162847').setFontColor('#FFFFFF');
  db.setFrozenRows(2);

  // Borrar hoja default "Hoja 1" si existe
  const defaultSheet = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (defaultSheet) ss.deleteSheet(defaultSheet);
}

// ── ENTRADA PRINCIPAL: manejar requests HTTP ──────────────────
function doPost(e) {
  const cors = ContentService.createTextOutput();
  cors.setMimeType(ContentService.MimeType.JSON);

  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;
    if (action === 'register_session') {
      result = registerSession(data);
    } else if (action === 'save_score') {
      result = saveScore(data);
    } else if (action === 'get_session_scores') {
      result = getSessionScores(data.session_id);
    } else {
      result = { error: 'Acción no reconocida: ' + action };
    }

    cors.setContent(JSON.stringify({ success: true, ...result }));
  } catch (err) {
    cors.setContent(JSON.stringify({ success: false, error: err.message }));
  }
  return cors;
}

function doGet(e) {
  const action   = e.parameter.action || 'ping';
  const callback = e.parameter.callback || '';  // JSONP callback
  let result;

  if (action === 'ping') {
    result = { success: true, status: 'ok', sheet: SHEET_NAME, timestamp: new Date().toISOString() };
  } else if (action === 'get_dashboard') {
    result = { success: true, ...getDashboardData() };
  } else if (action === 'get_all_scores') {
    result = { success: true, ...getAllScores() };
  } else if (action === 'verify_score') {
    result = { success: true, ...verifyScore(e.parameter.session_id, e.parameter.dim) };
  } else {
    result = { success: false, error: 'Acción GET no reconocida' };
  }

  const json = JSON.stringify(result);

  // Si viene con callback → JSONP (resuelve CORS desde dominios externos)
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // Sin callback → JSON normal
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Verificar que un score llegó correctamente ────────────────
function verifyScore(sessionId, dimName) {
  if (!sessionId || !dimName) return { found: false };
  const ss   = getOrCreateSheet();
  const sc   = ss.getSheetByName('Scores');
  const data = sc.getDataRange().getValues();
  const headers = data[0];
  const sidIdx  = headers.indexOf('Session_ID');
  const dimIdx  = headers.indexOf('Dimensión');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][sidIdx]) === String(sessionId) &&
        String(data[i][dimIdx]).toLowerCase().includes(dimName.toLowerCase().substring(0,6))) {
      return { found: true };
    }
  }
  return { found: false };
}

// ── Registrar nueva sesión ────────────────────────────────────
function registerSession(data) {
  const ss = getOrCreateSheet();
  const sh = ss.getSheetByName('Sesiones');
  const sessionId = 'SES_' + Date.now() + '_' + Math.random().toString(36).substr(2,6).toUpperCase();

  sh.appendRow([
    new Date().toISOString(),
    data.nombre || 'Sin nombre',
    data.rol || 'Sin rol',
    data.empresa || 'Rizes',
    data.sector || 'Eventos corporativos',
    data.modulo || 4,
    data.etapa !== undefined ? data.etapa : 1,
    sessionId
  ]);

  return { session_id: sessionId, message: 'Sesión registrada correctamente' };
}

// ── Guardar score de una dimensión ───────────────────────────
function saveScore(data) {
  const ss = getOrCreateSheet();
  const sc = ss.getSheetByName('Scores');

  const niveles = [
    { min:0,  max:19,  nombre:'Nivel 1 — Inicial' },
    { min:20, max:39,  nombre:'Nivel 2 — Emergente' },
    { min:40, max:59,  nombre:'Nivel 3 — Definido' },
    { min:60, max:79,  nombre:'Nivel 4 — Gestionado' },
    { min:80, max:100, nombre:'Nivel 5 — Optimizado' },
  ];

  const score = parseInt(data.score) || 0;
  const nivel = niveles.find(n => score >= n.min && score <= n.max) || niveles[0];

  sc.appendRow([
    new Date().toISOString(),
    data.session_id || '',
    data.nombre || '',
    data.rol || '',
    data.dimension || '',
    score,
    nivel.nombre,
    data.notas || '',
    data.empresa || 'Rizes',
    data.etapa !== undefined ? data.etapa : 1,
    data.modulo || 4,
    false,
    ''
  ]);

  // Actualizar Dashboard
  updateDashboard(ss, data.session_id, data.nombre, data.rol, data.etapa);

  return {
    message: 'Score guardado',
    dimension: data.dimension,
    score,
    nivel: nivel.nombre
  };
}

// ── Obtener scores de una sesión específica ───────────────────
function getSessionScores(sessionId) {
  const ss = getOrCreateSheet();
  const sc = ss.getSheetByName('Scores');
  const data = sc.getDataRange().getValues();
  const headers = data[0];

  const sidIdx  = headers.indexOf('Session_ID');
  const dimIdx  = headers.indexOf('Dimensión');
  const scoIdx  = headers.indexOf('Score_Pct');
  const nivIdx  = headers.indexOf('Nivel');
  const notIdx  = headers.indexOf('Notas_Evidencia');

  const scores = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][sidIdx] === sessionId) {
      scores[data[i][dimIdx]] = {
        score: data[i][scoIdx],
        nivel: data[i][nivIdx],
        notas: data[i][notIdx]
      };
    }
  }
  return { session_id: sessionId, scores };
}

// ── Obtener todos los scores para el dashboard del profesor ───
function getAllScores() {
  const ss = getOrCreateSheet();
  const sc = ss.getSheetByName('Scores');
  const data = sc.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return { scores: rows, total: rows.length };
}

// ── Datos para el dashboard ───────────────────────────────────
function getDashboardData() {
  const ss = getOrCreateSheet();
  const sc = ss.getSheetByName('Scores');
  const data = sc.getDataRange().getValues();
  if (data.length < 2) return { teams: [], total: 0 };

  const headers = data[0];
  const sidIdx   = headers.indexOf('Session_ID');
  const nomIdx   = headers.indexOf('Nombre');
  const rolIdx   = headers.indexOf('Rol');
  const dimIdx   = headers.indexOf('Dimensión');
  const scoIdx   = headers.indexOf('Score_Pct');
  const etaIdx   = headers.indexOf('Etapa_Reto');

  const teams = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sid = row[sidIdx];
    if (!sid) continue;
    if (!teams[sid]) {
      teams[sid] = {
        session_id: sid,
        nombre: row[nomIdx],
        rol: row[rolIdx],
        etapa: row[etaIdx],
        scores: {}
      };
    }
    teams[sid].scores[row[dimIdx]] = row[scoIdx];
  }

  const DIMS = ['estrategia','liderazgo','cultura','personas','innovacion','competencias','resiliencia','aceleradores'];
  const result = Object.values(teams).map(t => {
    const vals = DIMS.map(d => t.scores[d] || null).filter(v => v !== null);
    const avg = vals.length ? Math.round(vals.reduce((a,b) => a+b, 0) / vals.length) : null;
    return { ...t, indice_global: avg, dims_completadas: vals.length };
  });

  return { teams: result, total: result.length };
}

// ── Actualizar la hoja Dashboard ──────────────────────────────
function updateDashboard(ss, sessionId, nombre, rol, etapa) {
  const db   = ss.getSheetByName('Dashboard');
  const sc   = ss.getSheetByName('Scores');
  const data = sc.getDataRange().getValues();
  const headers = data[0];

  const sidIdx = headers.indexOf('Session_ID');
  const dimIdx = headers.indexOf('Dimensión');
  const scoIdx = headers.indexOf('Score_Pct');

  const DIMS = ['estrategia','liderazgo','cultura','personas','innovacion','competencias','resiliencia','aceleradores'];
  const dimScores = {};
  DIMS.forEach(d => dimScores[d] = null);

  for (let i = 1; i < data.length; i++) {
    if (data[i][sidIdx] === sessionId) {
      const dim = (data[i][dimIdx] || '').toLowerCase().replace(/\s+/g,'').replace(/\./g,'');
      const matchedDim = DIMS.find(d => dim.includes(d.replace(/\./g,'')));
      if (matchedDim) dimScores[matchedDim] = data[i][scoIdx];
    }
  }

  const vals   = Object.values(dimScores).filter(v => v !== null);
  const avg    = vals.length ? Math.round(vals.reduce((a,b) => a+b, 0) / vals.length) : null;
  const nivel  = avg !== null ? getNivel(avg) : '—';

  // Buscar si ya existe la fila de esta sesión en el dashboard
  const dbData = db.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 2; i < dbData.length; i++) {
    if (dbData[i][0] === nombre && dbData[i][1] === rol) { rowIdx = i + 1; break; }
  }

  const newRow = [
    nombre, rol, etapa !== undefined ? 'Etapa ' + etapa : '—',
    ...DIMS.map(d => dimScores[d] !== null ? dimScores[d] + '%' : '—'),
    avg !== null ? avg + '%' : '—',
    nivel
  ];

  if (rowIdx > 0) {
    db.getRange(rowIdx, 1, 1, newRow.length).setValues([newRow]);
  } else {
    db.appendRow(newRow);
  }

  // Colorear la fila según nivel
  const lastRow = rowIdx > 0 ? rowIdx : db.getLastRow();
  colorRowByNivel(db, lastRow, avg);
}

function getNivel(score) {
  if (score < 20) return 'Nivel 1 — Inicial';
  if (score < 40) return 'Nivel 2 — Emergente';
  if (score < 60) return 'Nivel 3 — Definido';
  if (score < 80) return 'Nivel 4 — Gestionado';
  return 'Nivel 5 — Optimizado';
}

function colorRowByNivel(sh, rowNum, score) {
  const colors = { null:'#F5F5F5', 0:'#FDECEA', 20:'#FFF3E0', 40:'#E3F2FD', 60:'#E8F5E9', 80:'#F3E5F5' };
  let bg = colors[null];
  if (score !== null) {
    if (score >= 80) bg = colors[80];
    else if (score >= 60) bg = colors[60];
    else if (score >= 40) bg = colors[40];
    else if (score >= 20) bg = colors[20];
    else bg = colors[0];
  }
  sh.getRange(rowNum, 1, 1, 13).setBackground(bg);
}
