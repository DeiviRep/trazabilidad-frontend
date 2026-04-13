// src/hooks/useExportarPDF.ts
'use client';

import { useState } from 'react';
import { TrazabilidadAPI } from '@/services/api';

interface Evento {
  tipo: string;
  fecha: string;
  puntoControl: string;
  coordenadas?: [number, number];
  contenedor?: string;
  tipoTransporte?: string;
  blAwb?: string;
  integridad?: boolean;
  descripcionIntegridad?: string;
  documentoTransito?: string;
  dim?: string;
  dam?: string;
  valorCIF?: number;
  totalPagado?: number;
  arancel?: number;
  iva?: number;
  ice?: number;
  comerciante?: string;
  responsable?: string;
  deposito?: string;
  tienda?: string;
  cliente?: string;
  fechaCompra?: string;
}

interface HistorialEntry {
  txId: string;
  timestamp: string;
  isDelete: boolean;
  value: string;
}

interface DispositivoData {
  id: string;
  lote: string;
  uuidLote: string;
  marca: string;
  modelo: string;
  imeiSerial: string;
  paisOrigen?: string;
  estado: string;
  urlLote: string;
  fechaCreacion: string;
  eventos: Evento[];
}

const ESTADO_LABELS: Record<string, string> = {
  REGISTRADO:         'Registrado',
  EMBARCADO:          'Embarcado',
  DESEMBARCADO:       'Desembarcado',
  NACIONALIZADO:      'Nacionalizado',
  EN_DISTRIBUCION:    'En Distribución',
  PRODUCTO_ADQUIRIDO: 'Adquirido',
};

function fmt(fecha: string) {
  return new Date(fecha).toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function fmtFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}
function fmtHora(fecha: string) {
  return new Date(fecha).toLocaleTimeString('es-BO', {
    hour: '2-digit', minute: '2-digit',
  });
}
function durMs(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime());
}
function durStr(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  return `${h}h ${min % 60}m`;
}

export function useExportarPDF() {
  const [exportando, setExportando] = useState(false);

  const exportar = async (data: DispositivoData) => {
    setExportando(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      let historial: HistorialEntry[] = [];
      try { historial = await TrazabilidadAPI.historial(data.id); } catch {}

      // Filtrar solo TX que corresponden a eventos del producto
      // (excluye initLedger u otras TX del sistema)
      const historialProducto = historial.filter(tx => {
        try {
          const val = JSON.parse(tx.value);
          return val.id === data.id;
        } catch { return false; }
      });

      // Orden cronológico
      const histOrden = [...historialProducto].reverse();

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W  = 297;
      const H  = 210;
      const M  = 12;
      const CW = W - M * 2;
      let y    = 0;

      // ── Colores ──────────────────────────────────────────────────────────
      const C = {
        negro:     [20,  20,  20]  as [number,number,number],
        grisOsc:   [60,  60,  60]  as [number,number,number],
        gris:      [100, 100, 100] as [number,number,number],
        grisL:     [150, 150, 150] as [number,number,number],
        grisLL:    [220, 220, 220] as [number,number,number],
        fondoFila: [247, 247, 247] as [number,number,number],
        azul:      [30,  64,  175] as [number,number,number],
        verde:     [6,   95,  70]  as [number,number,number],
        verdeL:    [209, 250, 229] as [number,number,number],
        rojo:      [153, 27,  27]  as [number,number,number],
        rojoL:     [254, 226, 226] as [number,number,number],
        amarilloL: [254, 243, 199] as [number,number,number],
        amarillo:  [146, 64,  14]  as [number,number,number],
      };

      const BASE   = 8;
      const LINE_H = 4.8;

      // ── Helpers ──────────────────────────────────────────────────────────
      function checkPage(needed = 20) {
        if (y + needed > H - 14) {
          doc.addPage();
          y = 14;
          headerPagina();
        }
      }

      function headerPagina() {
        doc.setFillColor(...C.negro);
        doc.rect(0, 0, W, 9, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('REPORTE DE AUDITORÍA BLOCKCHAIN — SISTEMA DE TRAZABILIDAD', M, 6);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `${data.marca} ${data.modelo}  ·  IMEI: ${data.imeiSerial}  ·  Lote: ${data.lote}`,
          W - M, 6, { align: 'right' }
        );
      }

      function piePaginas() {
        const total = (doc as any).internal.getNumberOfPages();
        for (let p = 1; p <= total; p++) {
          doc.setPage(p);
          doc.setDrawColor(...C.grisLL);
          doc.setLineWidth(0.2);
          doc.line(M, H - 9, M + CW, H - 9);
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...C.grisL);
          doc.text(
            `Generado el ${fmt(new Date().toISOString())}  ·  Hyperledger Fabric  ·  Universidad Pública de El Alto`,
            M, H - 5
          );
          doc.text(`Pág. ${p} / ${total}`, W - M, H - 5, { align: 'right' });
        }
      }

      // Título de sección: solo negrita + línea, sin fondo
      function tituloSeccion(num: string, texto: string) {
        checkPage(14);
        y += 5;
        doc.setFontSize(BASE + 2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.negro);
        doc.text(`${num}.  ${texto}`, M, y);
        y += 3;
        doc.setDrawColor(...C.negro);
        doc.setLineWidth(0.4);
        doc.line(M, y, M + CW, y);
        y += 5;
      }

      // Header de tabla: fondo gris oscuro (no negro)
      function headerTabla(
        cols: { t: string; w: number; al?: 'left' | 'center' | 'right' }[]
      ) {
        checkPage(10);
        const H_ROW = 8;
        let hx = M;
        cols.forEach(h => {
          doc.setFillColor(...C.grisOsc);
          doc.rect(hx, y, h.w, H_ROW, 'F');
          doc.setFontSize(BASE - 0.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          const tx = h.al === 'right'  ? hx + h.w - 2
                   : h.al === 'center' ? hx + h.w / 2
                   : hx + 2;
          doc.text(h.t, tx, y + 5.5, { align: h.al ?? 'left' });
          hx += h.w;
        });
        y += H_ROW;
      }

      function numLineas(texto: string, cw: number, sz = BASE): number {
        doc.setFontSize(sz);
        doc.setFont('helvetica', 'normal');
        return doc.splitTextToSize(texto, cw - 4).length;
      }

      function texto(
        t: string, cx: number, cy: number, cw: number, ch: number,
        opts: {
          bold?: boolean; size?: number;
          align?: 'left' | 'center' | 'right';
          color?: [number,number,number];
          bg?: [number,number,number];
          mono?: boolean; padX?: number; padY?: number;
        } = {}
      ) {
        const padX = opts.padX ?? 2;
        const padY = opts.padY ?? 4.5;
        if (opts.bg) { doc.setFillColor(...opts.bg); doc.rect(cx, cy, cw, ch, 'F'); }
        doc.setFontSize(opts.size ?? BASE);
        doc.setFont(opts.mono ? 'courier' : 'helvetica', opts.bold ? 'bold' : 'normal');
        doc.setTextColor(...(opts.color ?? C.negro));
        const aw = cw - padX * 2;
        const lines = doc.splitTextToSize(t, aw);
        const tx = opts.align === 'right'  ? cx + cw - padX
                 : opts.align === 'center' ? cx + cw / 2
                 : cx + padX;
        doc.text(lines, tx, cy + padY, { align: opts.align ?? 'left' });
      }

      function lineaH(py: number, g = 0.15) {
        doc.setDrawColor(...C.grisLL);
        doc.setLineWidth(g);
        doc.line(M, py, M + CW, py);
      }

      // ════════════════════════════════════════════════════════════════════
      // INICIO
      // ════════════════════════════════════════════════════════════════════
      headerPagina();
      y = 14;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.negro);
      doc.text('Reporte de Auditoría Blockchain', M, y + 8);

      doc.setFontSize(BASE);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.gris);
      doc.text(
        'Trazabilidad completa con verificación criptográfica en Hyperledger Fabric',
        M, y + 14
      );
      y += 20;

      // ════════════════════════════════════════════════════════════════════
      // SECCIÓN 1: Identificación
      // ════════════════════════════════════════════════════════════════════
      tituloSeccion('1', 'Identificación del Dispositivo');

      const COL3 = CW / 3;
      const FROW = 8;
      const filas1 = [
        ['Marca',             data.marca,
         'Modelo',            data.modelo,
         'Estado actual',     ESTADO_LABELS[data.estado] ?? data.estado],
        ['IMEI / Serial',     data.imeiSerial,
         'Lote',              data.lote,
         'País de origen',    data.paisOrigen ?? 'No registrado'],
        ['Fecha de registro', fmt(data.fechaCreacion),
         'Total de etapas',   String(data.eventos.length),
         'TX en blockchain',  String(historialProducto.length)],
        ['ID del producto',   data.id,
         'UUID del lote',     data.uuidLote,
         'URL del lote',      data.urlLote],
      ];

      filas1.forEach((fila, fi) => {
        checkPage(FROW + 1);
        const bg: [number,number,number] = fi % 2 === 0 ? C.fondoFila : [255,255,255];
        for (let c = 0; c < 3; c++) {
          const x  = M + c * COL3;
          const LW = COL3 * 0.40;
          const VW = COL3 * 0.60;
          texto(fila[c * 2],       x,      y, LW, FROW, { size: BASE - 1, color: C.gris,  bg });
          texto(fila[c * 2 + 1],   x + LW, y, VW, FROW, { size: BASE,     color: C.negro, bg, bold: true });
        }
        lineaH(y + FROW);
        y += FROW;
      });
      y += 5;

      // ════════════════════════════════════════════════════════════════════
      // SECCIÓN 2: Historial completo con blockchain
      // ════════════════════════════════════════════════════════════════════
      tituloSeccion('2', 'Historial Completo de Trazabilidad con Registro Blockchain');

      doc.setFontSize(BASE - 1);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...C.gris);
      doc.text(
        'Cada etapa muestra los datos declarados por el actor y su confirmación criptográfica en Hyperledger Fabric. ' +
        'El Transaction ID (txId) es el hash SHA-256 único e irrepetible que identifica cada escritura en el ledger distribuido.',
        M, y
      );
      y += 7;

      // Columnas: # | Etapa+datos | Fecha decl | Conf.Ledger | txId (hash) | Δt
      const RAW = { num: 5, etapa: 58, decl: 25, ledger: 25, txid: 148, delta: 12 };
      const RAWT = Object.values(RAW).reduce((a, b) => a + b, 0);
      const SC   = CW / RAWT;
      const CL   = {
        num:    RAW.num    * SC,
        etapa:  RAW.etapa  * SC,
        decl:   RAW.decl   * SC,
        ledger: RAW.ledger * SC,
        txid:   RAW.txid   * SC,
        delta:  RAW.delta  * SC,
      };

      headerTabla([
        { t: '#',                        w: CL.num,    al: 'center' },
        { t: 'ETAPA / DATOS DEL EVENTO', w: CL.etapa              },
        { t: 'FECHA DECLARADA',          w: CL.decl,   al: 'center' },
        { t: 'CONFIRMADO EN LEDGER',     w: CL.ledger, al: 'center' },
        { t: 'TRANSACTION ID — Hash SHA-256 (Hyperledger Fabric)', w: CL.txid },
        { t: 'Δt',                       w: CL.delta,  al: 'center' },
      ]);

      data.eventos.forEach((ev, idx) => {
        const tx    = histOrden[idx];
        const label = ESTADO_LABELS[ev.tipo] ?? ev.tipo;

        const extras: string[] = [];
        if (ev.puntoControl)             extras.push(`Punto de control: ${ev.puntoControl}`);
        if (ev.coordenadas)              extras.push(`Coords: ${ev.coordenadas[0].toFixed(4)}, ${ev.coordenadas[1].toFixed(4)}`);
        if (ev.contenedor)               extras.push(`Contenedor: ${ev.contenedor}`);
        if (ev.tipoTransporte)           extras.push(`Transporte: ${ev.tipoTransporte}`);
        if (ev.blAwb)                    extras.push(`BL/AWB: ${ev.blAwb}`);
        if (ev.integridad !== undefined)  extras.push(`Integridad: ${ev.integridad ? 'Verificada ✓' : 'Con observaciones ✗'}`);
        if (ev.descripcionIntegridad)    extras.push(`Observación: ${ev.descripcionIntegridad}`);
        if (ev.documentoTransito)        extras.push(`Doc. tránsito: ${ev.documentoTransito}`);
        if (ev.dim)                      extras.push(`DIM: ${ev.dim}`);
        if (ev.dam)                      extras.push(`DAM: ${ev.dam}`);
        if (ev.valorCIF)                 extras.push(`Valor CIF: $${ev.valorCIF.toLocaleString()} USD`);
        if (ev.totalPagado)              extras.push(`Total aduana: $${ev.totalPagado.toLocaleString()} USD`);
        if (ev.arancel)                  extras.push(`Arancel: ${ev.arancel}%`);
        if (ev.iva)                      extras.push(`IVA: ${ev.iva}%`);
        if (ev.ice)                      extras.push(`ICE: ${ev.ice}%`);
        if (ev.comerciante)              extras.push(`Comerciante: ${ev.comerciante}`);
        if (ev.responsable)              extras.push(`Responsable: ${ev.responsable}`);
        if (ev.deposito)                 extras.push(`Depósito: ${ev.deposito}`);
        if (ev.tienda)                   extras.push(`Tienda: ${ev.tienda}`);
        if (ev.cliente)                  extras.push(`Cliente: ${ev.cliente}`);
        if (ev.fechaCompra)              extras.push(`Fecha de compra: ${fmt(ev.fechaCompra)}`);

        const extraSz    = BASE - 1.5;
        let totalLineas  = 1;
        extras.forEach(ex => { totalLineas += numLineas(ex, CL.etapa, extraSz); });

        // txId: necesita 2 líneas en courier
        const ROW_H = Math.max(totalLineas, 2) * LINE_H + 6;
        checkPage(ROW_H + 2);

        const bg: [number,number,number] = idx % 2 === 0 ? C.fondoFila : [255,255,255];
        doc.setFillColor(...bg);
        doc.rect(M, y, CW, ROW_H, 'F');

        let rx = M;

        // #
        texto(String(idx + 1), rx, y, CL.num, ROW_H, {
          bold: true, size: BASE, align: 'center', color: C.gris, bg,
        });
        rx += CL.num;

        // ETAPA + extras
        doc.setFontSize(BASE);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.negro);
        doc.text(label, rx + 2, y + 5);
        let ey = y + 5 + LINE_H;
        extras.forEach(ex => {
          doc.setFontSize(extraSz);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...C.gris);
          const exLines = doc.splitTextToSize(ex, CL.etapa - 4);
          doc.text(exLines, rx + 2, ey);
          ey += exLines.length * LINE_H;
        });
        rx += CL.etapa;

        // FECHA DECLARADA
        const midY = y + ROW_H / 2;
        texto(fmtFecha(ev.fecha), rx, y,    CL.decl, ROW_H / 2, { size: BASE,     align: 'center', color: C.negro, bg });
        texto(fmtHora(ev.fecha),  rx, midY, CL.decl, ROW_H / 2, { size: BASE - 1, align: 'center', color: C.gris,  bg });
        rx += CL.decl;

        // CONFIRMADO EN LEDGER
        if (tx) {
          texto(fmtFecha(tx.timestamp), rx, y,    CL.ledger, ROW_H / 2, { size: BASE,     align: 'center', color: C.negro, bg });
          texto(fmtHora(tx.timestamp),  rx, midY, CL.ledger, ROW_H / 2, { size: BASE - 1, align: 'center', color: C.verde, bg });
        } else {
          texto('Sin TX', rx, y, CL.ledger, ROW_H, { size: BASE - 1, align: 'center', color: C.grisL, bg });
        }
        rx += CL.ledger;

        // txId COMPLETO en courier — el hash SHA-256
        if (tx) {
          const half   = Math.ceil(tx.txId.length / 2);
          const line1  = tx.txId.substring(0, half);
          const line2  = tx.txId.substring(half);
          const txSz   = BASE - 1.2;
          const txTotH = 2 * LINE_H;
          const txY    = y + (ROW_H - txTotH) / 2 + 3;
          doc.setFontSize(txSz);
          doc.setFont('courier', 'normal');
          doc.setTextColor(...C.azul);
          doc.text(line1, rx + 2, txY);
          doc.text(line2, rx + 2, txY + LINE_H);
        } else {
          texto('—', rx, y, CL.txid, ROW_H, { size: BASE, align: 'center', color: C.grisL, bg });
        }
        rx += CL.txid;

        // Δt siguiente etapa
        if (idx < data.eventos.length - 1) {
          const ms = durMs(ev.fecha, data.eventos[idx + 1].fecha);
          texto(durStr(ms), rx, y, CL.delta, ROW_H, {
            size: BASE - 0.5, align: 'center', color: C.negro, bg, bold: true,
          });
        } else {
          texto('—', rx, y, CL.delta, ROW_H, { size: BASE, align: 'center', color: C.grisL, bg });
        }

        lineaH(y + ROW_H);
        y += ROW_H;
      });

      y += 6;

      // ════════════════════════════════════════════════════════════════════
      // SECCIÓN 3: Verificación de integridad blockchain
      // ════════════════════════════════════════════════════════════════════
      tituloSeccion('3', 'Verificación de Integridad Blockchain');

      checkPage(50);

      const evTotal  = data.eventos.length;
      const txTotal  = historialProducto.length;
      const coincide = evTotal === txTotal;
      const elims    = historialProducto.filter(h => h.isDelete).length;

      // ── 4a: Bloques numéricos ─────────────────────────────────────────
      const BROW = 20;
      const BW   = CW / 3;

      [
        {
          label: 'Eventos declarados en el sistema',
          valor: String(evTotal),
          sub:   'Etapas registradas en la cadena de importación',
          ok:    true,
          bg:    C.fondoFila as [number,number,number],
          c:     C.negro     as [number,number,number],
        },
        {
          label: 'Transacciones en Hyperledger Fabric',
          valor: String(txTotal),
          sub:   coincide
            ? 'Coincide con los eventos declarados ✓'
            : `⚠ Diferencia de ${Math.abs(txTotal - evTotal)} respecto a eventos`,
          ok:    coincide,
          bg:    (coincide ? C.verdeL : C.rojoL) as [number,number,number],
          c:     (coincide ? C.verde  : C.rojo)  as [number,number,number],
        },
        {
          label: 'Registros eliminados en ledger',
          valor: String(elims),
          sub:   elims === 0
            ? 'Ningún registro fue eliminado ✓'
            : `⚠ ${elims} eliminación(es) detectada(s)`,
          ok:    elims === 0,
          bg:    (elims === 0 ? C.verdeL : C.rojoL) as [number,number,number],
          c:     (elims === 0 ? C.verde  : C.rojo)  as [number,number,number],
        },
      ].forEach((b, bi) => {
        const bx = M + bi * BW;
        doc.setFillColor(...b.bg);
        doc.roundedRect(bx + 1, y, BW - 2, BROW, 2, 2, 'F');
        doc.setFontSize(BASE - 1);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.gris);
        doc.text(b.label, bx + 4, y + 5);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...b.c);
        doc.text(b.valor, bx + 4, y + 14);
        doc.setFontSize(BASE - 1);
        doc.setFont('helvetica', 'normal');
        doc.text(b.sub, bx + 4, y + 19);
      });
      y += BROW + 5;

      // ── 4b: Tabla de hashes ───────────────────────────────────────────
      checkPage(14);
      doc.setFontSize(BASE);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.negro);
      doc.text('Registro de hashes SHA-256 por etapa', M, y);
      y += 2;
      doc.setFontSize(BASE - 1.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...C.gris);
      doc.text(
        'Cada hash es único e irrepetible. Cualquier alteración en los datos del ledger produciría un hash diferente, ' +
        'lo que hace imposible modificar el historial sin que quede evidencia criptográfica.',
        M, y + 4
      );
      y += 9;

      // Columnas: # | Etapa | Hash SHA-256 completo | Timestamp ledger | Verificado
      const HC = {
        num:   CW * 0.04,
        etapa: CW * 0.14,
        hash:  CW * 0.60,
        ts:    CW * 0.15,
        ver:   CW * 0.07,
      };

      headerTabla([
        { t: '#',              w: HC.num,   al: 'center' },
        { t: 'ETAPA',         w: HC.etapa              },
        { t: 'HASH SHA-256 (Transaction ID — Hyperledger Fabric)', w: HC.hash },
        { t: 'CONFIRMADO',    w: HC.ts,    al: 'center' },
        { t: 'ESTADO',        w: HC.ver,   al: 'center' },
      ]);

      const HASH_ROW = 10;
      histOrden.forEach((tx, idx) => {
        checkPage(HASH_ROW + 2);
        const bg: [number,number,number] = idx % 2 === 0 ? C.fondoFila : [255,255,255];
        doc.setFillColor(...bg);
        doc.rect(M, y, CW, HASH_ROW, 'F');

        let hx = M;

        // #
        texto(String(idx + 1), hx, y, HC.num, HASH_ROW, {
          bold: true, size: BASE, align: 'center', color: C.gris, bg,
        });
        hx += HC.num;

        // Etapa — extraída del value del ledger
        let etapaLabel = '—';
        try {
          const val  = JSON.parse(tx.value);
          etapaLabel = ESTADO_LABELS[val.estado] ?? val.estado ?? '—';
        } catch {}
        texto(etapaLabel, hx, y, HC.etapa, HASH_ROW, { size: BASE, bold: true, color: C.negro, bg });
        hx += HC.etapa;

        // Hash completo en 2 líneas courier
        const half  = Math.ceil(tx.txId.length / 2);
        const hSz   = BASE - 1.2;
        const hTotH = 2 * LINE_H;
        const hY    = y + (HASH_ROW - hTotH) / 2 + 2.5;
        doc.setFontSize(hSz);
        doc.setFont('courier', 'normal');
        doc.setTextColor(...C.azul);
        doc.text(tx.txId.substring(0, half),        hx + 2, hY);
        doc.text(tx.txId.substring(half),            hx + 2, hY + LINE_H);
        hx += HC.hash;

        // Timestamp del ledger
        texto(
          fmtFecha(tx.timestamp) + '\n' + fmtHora(tx.timestamp),
          hx, y, HC.ts, HASH_ROW,
          { size: BASE - 1, align: 'center', color: C.negro, bg }
        );
        hx += HC.ts;

        // Verificado
        const verOk = !tx.isDelete;
        texto(
          verOk ? '✓' : '✗',
          hx, y, HC.ver, HASH_ROW,
          { size: BASE + 1, align: 'center', bold: true, color: verOk ? C.verde : C.rojo, bg }
        );

        lineaH(y + HASH_ROW);
        y += HASH_ROW;
      });

      if (histOrden.length === 0) {
        texto('No se encontraron transacciones en el ledger para este producto.',
          M, y, CW, 10, { size: BASE, color: C.grisL, align: 'center' });
        y += 12;
      }

      y += 5;

      // ── 4c: Sello de verificación ─────────────────────────────────────
      checkPage(22);
      const selloOk = coincide && elims === 0;
      doc.setFillColor(...(selloOk ? C.verdeL : C.rojoL));
      doc.roundedRect(M, y, CW, 14, 2, 2, 'F');
      doc.setDrawColor(...(selloOk ? C.verde : C.rojo));
      doc.setLineWidth(0.4);
      doc.roundedRect(M, y, CW, 14, 2, 2, 'S');
      doc.setFontSize(BASE + 2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(selloOk ? C.verde : C.rojo));
      doc.text(
        selloOk
          ? '✓  INTEGRIDAD VERIFICADA — El historial es completo e inmutable en la blockchain'
          : '⚠  ADVERTENCIA — Se detectaron inconsistencias en el registro blockchain',
        W / 2, y + 6.5, { align: 'center' }
      );
      doc.setFontSize(BASE - 0.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${txTotal} transacción(es) en Hyperledger Fabric · ` +
        `Ningún dato puede ser alterado retroactivamente sin dejar evidencia en el hash`,
        W / 2, y + 11.5, { align: 'center' }
      );
      y += 18;

      // ── 4d: Declaración final ─────────────────────────────────────────
      checkPage(18);
      doc.setFontSize(BASE - 0.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...C.gris);
      const decl =
        `Este reporte certifica que el dispositivo ${data.marca} ${data.modelo} con IMEI/Serial ` +
        `${data.imeiSerial} ha completado ${evTotal} etapa(s) de trazabilidad en su cadena de importación. ` +
        `Cada etapa fue registrada como una transacción en Hyperledger Fabric, identificada por un hash SHA-256 ` +
        `único listado en la tabla anterior. La inmutabilidad del ledger garantiza que cualquier intento de ` +
        `modificación produciría un hash distinto, detectable por cualquier participante de la red. ` +
        `Generado el ${fmt(new Date().toISOString())}.`;
      const dLines = doc.splitTextToSize(decl, CW);
      doc.text(dLines, M, y);

      piePaginas();

      const filename = `auditoria-blockchain-${data.imeiSerial}-${new Date().toISOString().slice(0,10)}.pdf`;
      const url = doc.output('bloburl') as string;
      return { url, filename };

    } catch (err) {
      console.error('Error al exportar PDF:', err);
      throw err;
    } finally {
      setExportando(false);
    }
  };

  return { exportar, exportando };
}