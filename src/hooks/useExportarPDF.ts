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
function duracion(a: string, b: string): string {
  const ms = new Date(b).getTime() - new Date(a).getTime();
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

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W  = 297;
      const H  = 210;
      const M  = 12;
      const CW = W - M * 2;
      let y    = 0;

      // ── Colores ──────────────────────────────────────────────────────────
      const C = {
        negro:  [20,  20,  20]  as [number,number,number],
        gris:   [90,  90,  90]  as [number,number,number],
        grisL:  [150, 150, 150] as [number,number,number],
        grisLL: [218, 218, 218] as [number,number,number],
        fondo:  [246, 246, 246] as [number,number,number],
        azul:   [30,  64,  175] as [number,number,number],
        verde:  [6,   95,  70]  as [number,number,number],
        verdeL: [209, 250, 229] as [number,number,number],
        rojo:   [153, 27,  27]  as [number,number,number],
        rojoL:  [254, 226, 226] as [number,number,number],
      };

      const BASE   = 8;   // tamaño base de fuente en puntos  (≈11pt visual)
      const LINE_H = 5;   // interlineado en mm por línea de texto

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
        doc.text(`${data.marca} ${data.modelo}  ·  IMEI: ${data.imeiSerial}  ·  Lote: ${data.lote}`, W - M, 6, { align: 'right' });
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
          doc.text(`Generado el ${fmt(new Date().toISOString())}  ·  Hyperledger Fabric  ·  Universidad Pública de El Alto`, M, H - 5.5);
          doc.text(`Pág. ${p} / ${total}`, W - M, H - 5.5, { align: 'right' });
        }
      }

      function tituloSeccion(num: string, texto: string) {
        checkPage(14);
        y += 3;
        doc.setFillColor(...C.negro);
        doc.rect(M, y, CW, 8, 'F');
        doc.setFontSize(BASE + 1);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${num}.  ${texto.toUpperCase()}`, M + 3, y + 5.5);
        y += 11;
      }

      // Dibuja una celda con texto ajustado automáticamente
      // Retorna la altura real usada
      function celda(
        texto: string,
        cx: number, cy: number, cw: number, ch: number,
        opts: {
          bold?: boolean;
          size?: number;
          align?: 'left' | 'center' | 'right';
          color?: [number,number,number];
          bg?: [number,number,number];
          mono?: boolean;
          padX?: number;
          padY?: number;
        } = {}
      ) {
        const padX = opts.padX ?? 2;
        const padY = opts.padY ?? 4;
        if (opts.bg) {
          doc.setFillColor(...opts.bg);
          doc.rect(cx, cy, cw, ch, 'F');
        }
        const sz = opts.size ?? BASE;
        doc.setFontSize(sz);
        doc.setFont(opts.mono ? 'courier' : 'helvetica', opts.bold ? 'bold' : 'normal');
        doc.setTextColor(...(opts.color ?? C.negro));
        const availW = cw - padX * 2;
        const lines  = doc.splitTextToSize(texto, availW);
        const textX  = opts.align === 'right'  ? cx + cw - padX
                     : opts.align === 'center' ? cx + cw / 2
                     : cx + padX;
        doc.text(lines, textX, cy + padY, { align: opts.align ?? 'left' });
      }

      // Calcula cuántas líneas ocupa un texto en un ancho dado
      function numLineas(texto: string, cw: number, sz = BASE): number {
        doc.setFontSize(sz);
        doc.setFont('helvetica', 'normal');
        return doc.splitTextToSize(texto, cw - 4).length;
      }

      // ════════════════════════════════════════════════════════════════════
      // INICIO
      // ════════════════════════════════════════════════════════════════════
      headerPagina();
      y = 14;

      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.negro);
      doc.text('Reporte de Auditoría Blockchain', M, y + 8);
      doc.setFontSize(BASE);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.gris);
      doc.text('Trazabilidad completa con verificación criptográfica en Hyperledger Fabric', M, y + 14);
      y += 20;

      // ════════════════════════════════════════════════════════════════════
      // SECCIÓN 1: Identificación
      // ════════════════════════════════════════════════════════════════════
      tituloSeccion('1', 'Identificación del dispositivo');

      const COL3 = CW / 3;
      const FROW = 8;
      const filas1 = [
        ['Marca',           data.marca,              'Modelo',          data.modelo,             'Estado actual',    ESTADO_LABELS[data.estado] ?? data.estado],
        ['IMEI / Serial',   data.imeiSerial,         'Lote',            data.lote,               'País de origen',   data.paisOrigen ?? 'No registrado'],
        ['Fecha de registro', fmt(data.fechaCreacion),'Total eventos',  String(data.eventos.length), 'TX en blockchain', String(historial.length)],
        ['ID del producto', data.id,                 'UUID del lote',   data.uuidLote,           'URL del lote',     data.urlLote],
      ];

      filas1.forEach((fila, fi) => {
        checkPage(FROW + 1);
        const bg: [number,number,number] = fi % 2 === 0 ? C.fondo : [255,255,255];
        for (let c = 0; c < 3; c++) {
          const x    = M + c * COL3;
          const LW   = COL3 * 0.40;
          const VW   = COL3 * 0.60;
          celda(fila[c * 2],       x,      y, LW, FROW, { size: BASE - 1, color: C.gris,  bg });
          celda(fila[c * 2 + 1],   x + LW, y, VW, FROW, { size: BASE,     color: C.negro, bg, bold: true });
        }
        doc.setDrawColor(...C.grisLL);
        doc.setLineWidth(0.1);
        doc.line(M, y + FROW, M + CW, y + FROW);
        y += FROW;
      });
      y += 5;

      // ════════════════════════════════════════════════════════════════════
      // SECCIÓN 2: Historial completo con blockchain
      // ════════════════════════════════════════════════════════════════════
      tituloSeccion('2', 'Historial completo de trazabilidad con registro blockchain');

      doc.setFontSize(BASE - 1);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...C.gris);
      doc.text(
        'Cada etapa muestra los datos declarados por el actor correspondiente y su confirmación criptográfica en el ledger de Hyperledger Fabric.',
        M, y
      );
      y += 6;

      // historial en orden cronológico
      const histOrden = [...historial].reverse();

      // ── Anchos de columna ──────────────────────────────────────────────
      // #(6) | Etapa+datos(60) | Fecha decl(26) | Conf.Ledger(26) | txId(98) | Δt(21)
      const RAW = { num: 6, etapa: 60, decl: 26, ledger: 26, txid: 98, delta: 21 };
      const RAWT = RAW.num + RAW.etapa + RAW.decl + RAW.ledger + RAW.txid + RAW.delta; // 237
      const SC   = CW / RAWT;
      const CL   = {
        num:    RAW.num    * SC,
        etapa:  RAW.etapa  * SC,
        decl:   RAW.decl   * SC,
        ledger: RAW.ledger * SC,
        txid:   RAW.txid   * SC,
        delta:  RAW.delta  * SC,
      };

      // Header de tabla
      checkPage(12);
      const HROW = 9;
      [
        { t: '#',                         w: CL.num,    al: 'center' as const },
        { t: 'ETAPA / DATOS DEL EVENTO',  w: CL.etapa,  al: 'left'   as const },
        { t: 'FECHA DECLARADA',           w: CL.decl,   al: 'center' as const },
        { t: 'CONFIRMADO EN LEDGER',      w: CL.ledger, al: 'center' as const },
        { t: 'TRANSACTION ID (txId)',      w: CL.txid,   al: 'left'   as const },
        { t: 'Δt ETAPA SIGUIENTE',        w: CL.delta,  al: 'center' as const },
      ].reduce((hx, h) => {
        celda(h.t, hx, y, h.w, HROW, {
          bold: true, size: BASE - 0.5,
          color: [255,255,255], bg: C.negro,
          align: h.al,
        });
        return hx + h.w;
      }, M);
      y += HROW;

      // ── Filas de eventos ───────────────────────────────────────────────
      data.eventos.forEach((ev, idx) => {
        const tx    = histOrden[idx];
        const label = ESTADO_LABELS[ev.tipo] ?? ev.tipo;

        // Construir líneas de extras para la columna "Etapa"
        const extras: string[] = [];
        if (ev.puntoControl)           extras.push(`Punto de control: ${ev.puntoControl}`);
        if (ev.coordenadas)            extras.push(`Coordenadas: ${ev.coordenadas[0].toFixed(4)}, ${ev.coordenadas[1].toFixed(4)}`);
        if (ev.contenedor)             extras.push(`Contenedor: ${ev.contenedor}`);
        if (ev.tipoTransporte)         extras.push(`Tipo de transporte: ${ev.tipoTransporte}`);
        if (ev.blAwb)                  extras.push(`BL/AWB: ${ev.blAwb}`);
        if (ev.integridad !== undefined) extras.push(`Integridad: ${ev.integridad ? 'Verificada ✓' : 'Con observaciones ✗'}`);
        if (ev.descripcionIntegridad)  extras.push(`Observación: ${ev.descripcionIntegridad}`);
        if (ev.documentoTransito)      extras.push(`Doc. tránsito: ${ev.documentoTransito}`);
        if (ev.dim)                    extras.push(`DIM: ${ev.dim}`);
        if (ev.dam)                    extras.push(`DAM: ${ev.dam}`);
        if (ev.valorCIF)               extras.push(`Valor CIF: $${ev.valorCIF.toLocaleString()} USD`);
        if (ev.totalPagado)            extras.push(`Total aduana: $${ev.totalPagado.toLocaleString()} USD`);
        if (ev.arancel)                extras.push(`Arancel: ${ev.arancel}%`);
        if (ev.iva)                    extras.push(`IVA: ${ev.iva}%`);
        if (ev.ice)                    extras.push(`ICE: ${ev.ice}%`);
        if (ev.comerciante)            extras.push(`Comerciante: ${ev.comerciante}`);
        if (ev.responsable)            extras.push(`Responsable: ${ev.responsable}`);
        if (ev.deposito)               extras.push(`Depósito: ${ev.deposito}`);
        if (ev.tienda)                 extras.push(`Tienda: ${ev.tienda}`);
        if (ev.cliente)                extras.push(`Cliente: ${ev.cliente}`);
        if (ev.fechaCompra)            extras.push(`Fecha de compra: ${fmt(ev.fechaCompra)}`);

        // Calcular cuántas líneas físicas ocupa cada extra dentro del ancho de la columna
        const extraSz   = BASE - 1.5;
        let totalLineas = 1; // el label principal
        extras.forEach(ex => {
          totalLineas += numLineas(ex, CL.etapa, extraSz);
        });

        // txId: 2 líneas fijas
        const txLines = 2;

        // Altura de fila = máximo entre (etapa lines, txId lines, mínimo 2 líneas de fecha)
        const ROW_H = Math.max(totalLineas, txLines, 2) * LINE_H + 5;

        checkPage(ROW_H + 2);

        const bg: [number,number,number] = idx % 2 === 0 ? C.fondo : [255,255,255];
        let rx = M;

        // Fondo completo de la fila
        doc.setFillColor(...bg);
        doc.rect(rx, y, CW, ROW_H, 'F');

        // # ────────────────────────────────────────────────────────────────
        celda(String(idx + 1), rx, y, CL.num, ROW_H, {
          bold: true, size: BASE, align: 'center', color: C.gris, bg,
        });
        rx += CL.num;

        // ETAPA + extras ───────────────────────────────────────────────────
        // Label en negrita
        doc.setFontSize(BASE);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.negro);
        doc.text(label, rx + 2, y + 4.5);

        // Extras en normal
        let ey = y + 4.5 + LINE_H;
        extras.forEach(ex => {
          doc.setFontSize(extraSz);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...C.gris);
          const exLines = doc.splitTextToSize(ex, CL.etapa - 4);
          doc.text(exLines, rx + 2, ey);
          ey += exLines.length * LINE_H;
        });
        rx += CL.etapa;

        // FECHA DECLARADA ──────────────────────────────────────────────────
        const midY = y + ROW_H / 2;
        celda(fmtFecha(ev.fecha), rx, y,    CL.decl, ROW_H / 2, { size: BASE, align: 'center', color: C.negro, bg });
        celda(fmtHora(ev.fecha),  rx, midY, CL.decl, ROW_H / 2, { size: BASE, align: 'center', color: C.gris,  bg });
        rx += CL.decl;

        // CONFIRMADO EN LEDGER ─────────────────────────────────────────────
        if (tx) {
          celda(fmtFecha(tx.timestamp), rx, y,    CL.ledger, ROW_H / 2, { size: BASE, align: 'center', color: C.negro,  bg });
          celda(fmtHora(tx.timestamp),  rx, midY, CL.ledger, ROW_H / 2, { size: BASE, align: 'center', color: C.verde,  bg });
        } else {
          celda('—', rx, y, CL.ledger, ROW_H, { size: BASE, align: 'center', color: C.grisL, bg });
        }
        rx += CL.ledger;

        // TRANSACTION ID ───────────────────────────────────────────────────
        if (tx) {
          const half  = Math.ceil(tx.txId.length / 2);
          const line1 = tx.txId.substring(0, half);
          const line2 = tx.txId.substring(half);
          const txSz  = BASE - 1;
          doc.setFontSize(txSz);
          doc.setFont('courier', 'normal');
          doc.setTextColor(...C.azul);
          // Centrar verticalmente las dos líneas
          const txTotalH = 2 * LINE_H;
          const txStartY = y + (ROW_H - txTotalH) / 2 + 3;
          doc.text(line1, rx + 2, txStartY);
          doc.text(line2, rx + 2, txStartY + LINE_H);
        } else {
          celda('Sin registro', rx, y, CL.txid, ROW_H, { size: BASE, align: 'center', color: C.grisL, bg });
        }
        rx += CL.txid;

        // Δt SIGUIENTE ETAPA ───────────────────────────────────────────────
        if (idx < data.eventos.length - 1) {
          celda(
            duracion(ev.fecha, data.eventos[idx + 1].fecha),
            rx, y, CL.delta, ROW_H,
            { size: BASE, align: 'center', color: C.negro, bg, bold: true }
          );
        } else {
          celda('—', rx, y, CL.delta, ROW_H, { size: BASE, align: 'center', color: C.grisL, bg });
        }

        // Línea separadora inferior
        doc.setDrawColor(...C.grisLL);
        doc.setLineWidth(0.1);
        doc.line(M, y + ROW_H, M + CW, y + ROW_H);

        y += ROW_H;
      });

      y += 6;

      // ════════════════════════════════════════════════════════════════════
      // SECCIÓN 3: Análisis de tiempos
      // ════════════════════════════════════════════════════════════════════
      tituloSeccion('3', 'Análisis de tiempos por tramo');

      // Columnas: Tramo | Inicio declarado | Fin declarado | Duración | Δt TX ledger
      const TR = { tramo: 72, desde: 44, hasta: 44, dur: 30, ldt: 44 };
      const TRT = TR.tramo + TR.desde + TR.hasta + TR.dur + TR.ldt;
      const TS  = CW / TRT;
      const TC  = {
        tramo: TR.tramo * TS, desde: TR.desde * TS,
        hasta: TR.hasta * TS, dur:   TR.dur   * TS, ldt: TR.ldt * TS,
      };

      checkPage(12);
      const TH = 8;

      [
        { t: 'TRAMO',                          w: TC.tramo, al: 'left'   as const },
        { t: 'INICIO (declarado)',              w: TC.desde, al: 'center' as const },
        { t: 'FIN (declarado)',                 w: TC.hasta, al: 'center' as const },
        { t: 'DURACIÓN DECLARADA',             w: TC.dur,   al: 'center' as const },
        { t: 'Δt CONFIRMACIÓN LEDGER',         w: TC.ldt,   al: 'center' as const },
      ].reduce((tx, h) => {
        celda(h.t, tx, y, h.w, TH, { bold: true, size: BASE - 0.5, color: [255,255,255], bg: C.negro, align: h.al });
        return tx + h.w;
      }, M);
      y += TH;

      data.eventos.forEach((ev, idx) => {
        if (idx === data.eventos.length - 1) return;
        const sig  = data.eventos[idx + 1];
        const txA  = histOrden[idx];
        const txB  = histOrden[idx + 1];
        const ldt  = txA && txB ? duracion(txA.timestamp, txB.timestamp) : '—';
        const bg: [number,number,number] = idx % 2 === 0 ? C.fondo : [255,255,255];
        const tramo = `${ESTADO_LABELS[ev.tipo] ?? ev.tipo}  →  ${ESTADO_LABELS[sig.tipo] ?? sig.tipo}`;

        checkPage(TH + 1);
        let tcx = M;
        celda(tramo,                              tcx, y, TC.tramo, TH, { size: BASE, color: C.negro, bg }); tcx += TC.tramo;
        celda(fmt(ev.fecha),                      tcx, y, TC.desde, TH, { size: BASE - 0.5, color: C.gris, bg, align: 'center' }); tcx += TC.desde;
        celda(fmt(sig.fecha),                     tcx, y, TC.hasta, TH, { size: BASE - 0.5, color: C.gris, bg, align: 'center' }); tcx += TC.hasta;
        celda(duracion(ev.fecha, sig.fecha),      tcx, y, TC.dur,   TH, { size: BASE, bold: true, color: C.negro, bg, align: 'center' }); tcx += TC.dur;
        celda(ldt,                                tcx, y, TC.ldt,   TH, { size: BASE, bold: true, color: C.verde, bg, align: 'center' });

        doc.setDrawColor(...C.grisLL);
        doc.setLineWidth(0.1);
        doc.line(M, y + TH, M + CW, y + TH);
        y += TH;
      });

      // Fila total
      if (data.eventos.length >= 2) {
        checkPage(TH + 2);
        const durTotal = duracion(data.eventos[0].fecha, data.eventos[data.eventos.length - 1].fecha);
        let tcx = M;
        celda('DURACIÓN TOTAL DEL RECORRIDO', tcx, y, TC.tramo + TC.desde + TC.hasta, TH,
          { bold: true, size: BASE, color: [255,255,255], bg: C.negro, align: 'right', padX: 4 });
        tcx += TC.tramo + TC.desde + TC.hasta;
        celda(durTotal, tcx, y, TC.dur + TC.ldt, TH,
          { bold: true, size: 10, color: [255,255,255], bg: C.negro, align: 'center' });
        y += TH;
      }
      y += 6;

      // ════════════════════════════════════════════════════════════════════
      // SECCIÓN 4: Verificación de integridad
      // ════════════════════════════════════════════════════════════════════
      tituloSeccion('4', 'Verificación de integridad blockchain');

      checkPage(45);

      const evTotal  = data.eventos.length;
      const txTotal  = historial.length;
      const coincide = evTotal === txTotal;
      const elims    = historial.filter(h => h.isDelete).length;

      // 3 bloques
      const BROW = 20;
      const BW   = CW / 3;

      const bloques = [
        {
          label: 'Eventos declarados',
          valor: String(evTotal),
          sub:   'Etapas registradas en el sistema',
          ok:    true,
          bg:    C.fondo as [number,number,number],
        },
        {
          label: 'Transacciones en ledger',
          valor: String(txTotal),
          sub:   coincide ? 'Coincide con eventos ✓' : '⚠ No coincide con eventos',
          ok:    coincide,
          bg:    (coincide ? C.verdeL : C.rojoL) as [number,number,number],
        },
        {
          label: 'Eliminaciones detectadas',
          valor: String(elims),
          sub:   elims === 0 ? 'Sin eliminaciones ✓' : `⚠ ${elims} eliminación(es)`,
          ok:    elims === 0,
          bg:    (elims === 0 ? C.verdeL : C.rojoL) as [number,number,number],
        },
      ];

      bloques.forEach((b, bi) => {
        const bx = M + bi * BW;
        doc.setFillColor(...b.bg);
        doc.roundedRect(bx + 1, y, BW - 2, BROW, 2, 2, 'F');

        doc.setFontSize(BASE - 0.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.gris);
        doc.text(b.label, bx + 4, y + 5);

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(b.ok ? C.verde : C.rojo));
        doc.text(b.valor, bx + 4, y + 14);

        doc.setFontSize(BASE - 0.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...(b.ok ? C.verde : C.rojo));
        doc.text(b.sub, bx + 4, y + 19);
      });
      y += BROW + 5;

      // Sello
      checkPage(18);
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
          ? '✓  INTEGRIDAD VERIFICADA — Historial completo e inmutable en blockchain'
          : '⚠  ADVERTENCIA — Inconsistencias detectadas en el registro blockchain',
        W / 2, y + 6.5, { align: 'center' }
      );
      doc.setFontSize(BASE - 0.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${txTotal} transacción(es) en Hyperledger Fabric · Ningún dato puede alterarse retroactivamente sin evidencia criptográfica`,
        W / 2, y + 11.5, { align: 'center' }
      );
      y += 18;

      // Declaración final
      checkPage(18);
      doc.setFontSize(BASE - 0.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...C.gris);
      const decl = `Este reporte certifica que el dispositivo ${data.marca} ${data.modelo} con IMEI/Serial ${data.imeiSerial} ha completado ${evTotal} etapa(s) de trazabilidad, cada una respaldada por una transacción inmutable en Hyperledger Fabric. Los Transaction IDs permiten verificar individualmente cada registro en el ledger distribuido. Generado el ${fmt(new Date().toISOString())}.`;
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