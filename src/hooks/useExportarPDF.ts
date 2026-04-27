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

      const historialProducto = historial.filter(tx => {
        try {
          const val = JSON.parse(tx.value);
          return val.id === data.id;
        } catch { return false; }
      });

      const histOrden = [...historialProducto].reverse();

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W   = 210;
      const H   = 297;
      const M   = 12;
      const CW  = W - M * 2;
      let y     = 0;

      // ── Constantes de layout ──────────────────────────────────
      const PAD  = 2.5;  // padding interior celda
      const LH   = 3.5;  // line height
      const BASE = 7.5;  // font size base

      const C = {
        negro:     [20,  20,  20]  as [number,number,number],
        grisOsc:   [55,  55,  55]  as [number,number,number],
        gris:      [100, 100, 100] as [number,number,number],
        grisL:     [155, 155, 155] as [number,number,number],
        grisLL:    [220, 220, 220] as [number,number,number],
        fondoFila: [247, 247, 247] as [number,number,number],
        azul:      [30,  64,  175] as [number,number,number],
        verde:     [6,   95,  70]  as [number,number,number],
        verdeL:    [209, 250, 229] as [number,number,number],
        rojo:      [153, 27,  27]  as [number,number,number],
        rojoL:     [254, 226, 226] as [number,number,number],
        blanco:    [255, 255, 255] as [number,number,number],
      };

      // ══════════════════════════════════════════════════════════
      // MOTOR DE CELDAS AUTO-AJUSTABLES
      // Principio: medir PRIMERO, dibujar DESPUÉS
      // ══════════════════════════════════════════════════════════

      /**
       * Mide cuántas líneas ocupa un texto en un ancho dado.
       * jsPDF usa esta medición para hacer el wrap correcto.
       */
      function medirLineas(
        text: string,
        cellW: number,
        fontSize: number,
        font: 'helvetica' | 'courier' = 'helvetica'
      ): string[] {
        doc.setFontSize(fontSize);
        doc.setFont(font, 'normal');
        return doc.splitTextToSize(text, cellW - PAD * 2);
      }

      /**
       * Dibuja una celda con texto completamente auto-ajustado.
       * El texto NUNCA se desborda: splitTextToSize garantiza el wrap.
       */
      function drawCell(
        text: string,
        cx: number, cy: number, cw: number, ch: number,
        opts: {
          fontSize?: number;
          bold?:     boolean;
          font?:     'helvetica' | 'courier';
          color?:    [number,number,number];
          bg?:       [number,number,number];
          align?:    'left' | 'center' | 'right';
          valign?:   'top' | 'middle' | 'bottom';
        } = {}
      ) {
        const fs     = opts.fontSize ?? BASE;
        const font   = opts.font     ?? 'helvetica';
        const weight = opts.bold     ? 'bold' : 'normal';
        const color  = opts.color    ?? C.negro;
        const align  = opts.align    ?? 'left';
        const valign = opts.valign   ?? 'middle';

        if (opts.bg) {
          doc.setFillColor(...opts.bg);
          doc.rect(cx, cy, cw, ch, 'F');
        }

        doc.setFontSize(fs);
        doc.setFont(font, weight);
        doc.setTextColor(...color);

        const lines  = doc.splitTextToSize(text, cw - PAD * 2);
        const textH  = lines.length * LH;

        // Alineación vertical inteligente
        let textY: number;
        if      (valign === 'top')    textY = cy + PAD + fs * 0.35;
        else if (valign === 'bottom') textY = cy + ch - textH + fs * 0.35;
        else                          textY = cy + (ch - textH) / 2 + fs * 0.35;

        // Alineación horizontal
        let textX: number;
        if      (align === 'right')  textX = cx + cw - PAD;
        else if (align === 'center') textX = cx + cw / 2;
        else                         textX = cx + PAD;

        doc.text(lines, textX, textY, { align });
      }

      /**
       * FUNCIÓN PRINCIPAL: Dibuja una fila entera con altura auto-calculada.
       *
       * Algoritmo:
       * 1. Para cada celda, mide cuántas líneas necesita su texto
       * 2. Calcula la altura máxima entre TODAS las celdas
       * 3. Pinta el fondo de la fila completa con esa altura
       * 4. Dibuja cada celda con la misma altura → nunca hay desborde
       *
       * Retorna la altura de la fila para que el caller actualice `y`.
       */
      function drawRow(
        cells: {
          text:      string;
          w:         number;
          fontSize?: number;
          bold?:     boolean;
          font?:     'helvetica' | 'courier';
          color?:    [number,number,number];
          align?:    'left' | 'center' | 'right';
          valign?:   'top' | 'middle' | 'bottom';
        }[],
        rowY:  number,
        bg:    [number,number,number],
        minH = 8
      ): number {
        // PASO 1: Medir todas las celdas
        const heights = cells.map(cell => {
          const lines = medirLineas(
            cell.text,
            cell.w,
            cell.fontSize ?? BASE,
            cell.font ?? 'helvetica'
          );
          return lines.length * LH + PAD * 2;
        });

        // PASO 2: Altura de fila = máximo entre todas las celdas
        const rowH = Math.max(...heights, minH);

        // PASO 3: Fondo de fila
        doc.setFillColor(...bg);
        doc.rect(M, rowY, CW, rowH, 'F');

        // PASO 4: Dibujar celdas
        let cx = M;
        cells.forEach(cell => {
          drawCell(cell.text, cx, rowY, cell.w, rowH, {
            fontSize: cell.fontSize ?? BASE,
            bold:     cell.bold,
            font:     cell.font,
            color:    cell.color  ?? C.negro,
            align:    cell.align  ?? 'left',
            valign:   cell.valign ?? 'middle',
          });
          cx += cell.w;
        });

        // Línea divisora inferior
        doc.setDrawColor(...C.grisLL);
        doc.setLineWidth(0.15);
        doc.line(M, rowY + rowH, M + CW, rowY + rowH);

        return rowH;
      }

      // ══════════════════════════════════════════════════════════
      // HELPERS DE PÁGINA Y ESTRUCTURA
      // ══════════════════════════════════════════════════════════

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

      function tituloSeccion(num: string, titulo: string) {
        checkPage(16);
        y += 6;
        doc.setFontSize(BASE + 2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.negro);
        doc.text(`${num}.  ${titulo}`, M, y);
        y += 3;
        doc.setDrawColor(...C.negro);
        doc.setLineWidth(0.4);
        doc.line(M, y, M + CW, y);
        y += 5;
      }

      /**
       * Header de tabla también usa auto-ajuste de altura.
       */
      function headerTabla(cols: { t: string; w: number; al?: 'left' | 'center' | 'right' }[]) {
        checkPage(12);
        const heights = cols.map(c => {
          const lines = medirLineas(c.t, c.w, BASE - 0.5);
          return Math.max(lines.length * LH + PAD * 2, 8);
        });
        const hH = Math.max(...heights, 8);

        let hx = M;
        cols.forEach(c => {
          doc.setFillColor(...C.grisOsc);
          doc.rect(hx, y, c.w, hH, 'F');
          drawCell(c.t, hx, y, c.w, hH, {
            fontSize: BASE - 0.5,
            bold:     true,
            color:    C.blanco,
            align:    c.al ?? 'left',
            valign:   'middle',
          });
          hx += c.w;
        });
        y += hH;
      }

      function lineaH(py: number) {
        doc.setDrawColor(...C.grisLL);
        doc.setLineWidth(0.15);
        doc.line(M, py, M + CW, py);
      }

      // ══════════════════════════════════════════════════════════
      // INICIO DEL DOCUMENTO
      // ══════════════════════════════════════════════════════════
      headerPagina();
      y = 14;

      doc.setFontSize(15);
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
      y += 22;

      // ══════════════════════════════════════════════════════════
      // SECCIÓN 1: Identificación
      // ══════════════════════════════════════════════════════════
      tituloSeccion('1', 'Identificación del Dispositivo');

      const COL3 = CW / 3;
      const LW   = COL3 * 0.38;
      const VW   = COL3 * 0.62;

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
        // Medir altura necesaria para esta fila (todas las celdas)
        const alts: number[] = [];
        for (let c = 0; c < 3; c++) {
          alts.push(
            medirLineas(fila[c * 2],     LW, BASE - 1).length * LH + PAD * 2,
            medirLineas(fila[c * 2 + 1], VW, BASE    ).length * LH + PAD * 2
          );
        }
        const rowH = Math.max(...alts, 8);
        checkPage(rowH + 1);

        const bg: [number,number,number] = fi % 2 === 0 ? C.fondoFila : C.blanco;
        doc.setFillColor(...bg);
        doc.rect(M, y, CW, rowH, 'F');

        for (let c = 0; c < 3; c++) {
          const x = M + c * COL3;
          drawCell(fila[c * 2],     x,      y, LW, rowH, { fontSize: BASE - 1, color: C.gris,  valign: 'middle' });
          drawCell(fila[c * 2 + 1], x + LW, y, VW, rowH, { fontSize: BASE,     color: C.negro, valign: 'middle', bold: true });
        }
        lineaH(y + rowH);
        y += rowH;
      });
      y += 5;

      // ══════════════════════════════════════════════════════════
      // SECCIÓN 2: Verificación de integridad blockchain
      // ══════════════════════════════════════════════════════════
      tituloSeccion('2', 'Verificación de Integridad Blockchain');

      checkPage(50);

      const evTotal  = data.eventos.length;
      const txTotal  = historialProducto.length;
      const coincide = evTotal === txTotal;
      const elims    = historialProducto.filter(h => h.isDelete).length;

      // Bloques numéricos
      const BROW = 22;
      const BW   = CW / 3;

      [
        {
          label: 'Eventos declarados en el sistema',
          valor: String(evTotal),
          sub:   'Etapas registradas en la cadena de importación',
          bg:    C.fondoFila as [number,number,number],
          c:     C.negro     as [number,number,number],
        },
        {
          label: 'Transacciones en Hyperledger Fabric',
          valor: String(txTotal),
          sub:   coincide
            ? 'Coincide con los eventos'
            : `Diferencia de ${Math.abs(txTotal - evTotal)}`,
          bg:    (coincide ? C.verdeL : C.rojoL) as [number,number,number],
          c:     (coincide ? C.verde  : C.rojo)  as [number,number,number],
        },
        {
          label: 'Registros eliminados en ledger',
          valor: String(elims),
          sub:   elims === 0 ? 'Ningún registro fue eliminado' : `${elims} eliminación(es) detectada(s)`,
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
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...b.c);
        doc.text(b.valor, bx + 4, y + 14);
        doc.setFontSize(BASE - 1);
        doc.setFont('helvetica', 'normal');
        doc.text(b.sub, bx + 4, y + 20);
      });
      y += BROW + 6;

      // Tabla de hashes
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
        'Cada hash es único e irrepetible. Cualquier alteración produciría un hash diferente, detectable por cualquier nodo.',
        M, y + 4
      );
      y += 9;

      const HC = {
        num:   CW * 0.03,
        etapa: CW * 0.17,
        hash:  CW * 0.50,
        ts:    CW * 0.30,
      };

      headerTabla([
        { t: '#',          w: HC.num,   al: 'center' },
        { t: 'ETAPA',      w: HC.etapa              },
        { t: 'HASH SHA-256 (Transaction ID — Hyperledger Fabric)', w: HC.hash },
        { t: 'CONFIRMADO', w: HC.ts,    al: 'center' },
      ]);

      histOrden.forEach((tx, idx) => {
        let etapaLabel = '—';
        try {
          const val = JSON.parse(tx.value);
          etapaLabel = ESTADO_LABELS[val.estado] ?? val.estado ?? '—';
        } catch {}

        const bg: [number,number,number] = idx % 2 === 0 ? C.fondoFila : C.blanco;

        // drawRow mide y ajusta automáticamente — el hash largo se parte en líneas
        checkPage(10);
        const rowH = drawRow([
          { text: String(idx + 1),                          w: HC.num,   align: 'center', color: C.gris,                                 bold: true,  fontSize: BASE      },
          { text: etapaLabel,                               w: HC.etapa,                  color: C.negro,                                bold: true,  fontSize: BASE      },
          { text: tx.txId,                                  w: HC.hash,                   color: C.azul,  font: 'courier',               fontSize: BASE - 1.2              },
          { text: `${fmtFecha(tx.timestamp)}\n${fmtHora(tx.timestamp)}`, w: HC.ts, align: 'center', color: C.negro,                     fontSize: BASE - 0.5              },
        ], y, bg, 10);

        // checkPage(rowH);
        y += rowH;
      });

      if (histOrden.length === 0) {
        const rowH = drawRow([
          { text: 'No se encontraron transacciones en el ledger para este producto.', w: CW, align: 'center', color: C.grisL },
        ], y, C.fondoFila, 10);
        y += rowH;
      }

      y += 5;

      // Sello de verificación
      checkPage(22);
      const selloOk = coincide && elims === 0;
      doc.setFillColor(...(selloOk ? C.verdeL : C.rojoL));
      doc.roundedRect(M, y, CW, 14, 2, 2, 'F');
      doc.setDrawColor(...(selloOk ? C.verde : C.rojo));
      doc.setLineWidth(0.4);
      doc.roundedRect(M, y, CW, 14, 2, 2, 'S');
      doc.setFontSize(BASE + 1.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(selloOk ? C.verde : C.rojo));
      doc.text(
        selloOk
          ? 'INTEGRIDAD VERIFICADA — Historial inmutable en la blockchain'
          : 'ADVERTENCIA — Se detectaron inconsistencias en la blockchain',
        W / 2, y + 6.5, { align: 'center' }
      );
      doc.setFontSize(BASE - 0.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${txTotal} transacción(es) en Hyperledger Fabric · Ningún dato puede ser alterado retroactivamente`,
        W / 2, y + 11.5, { align: 'center' }
      );
      y += 18;

      // Declaración final
      checkPage(18);
      doc.setFontSize(BASE - 0.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...C.gris);
      const decl =
        `Este reporte certifica que el dispositivo ${data.marca} ${data.modelo} con IMEI/Serial ` +
        `${data.imeiSerial} ha completado ${evTotal} etapa(s) de trazabilidad en su cadena de importación. ` +
        `Cada etapa fue registrada como una transacción en Hyperledger Fabric, identificada por un hash SHA-256 ` +
        `único. La inmutabilidad del ledger garantiza que cualquier intento de modificación produciría un hash ` +
        `distinto, detectable por cualquier participante de la red. Generado el ${fmt(new Date().toISOString())}.`;
      const dLines = doc.splitTextToSize(decl, CW);
      doc.text(dLines, M, y);
      y += dLines.length * LH + 6;

      // ══════════════════════════════════════════════════════════
      // SECCIÓN 3: Historial completo
      // ══════════════════════════════════════════════════════════
      tituloSeccion('3', 'Historial Completo de Trazabilidad con Registro Blockchain');

      doc.setFontSize(BASE - 1);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...C.gris);
      doc.text(
        'Cada etapa muestra los datos declarados por el actor y su confirmación criptográfica en Hyperledger Fabric.',
        M, y
      );
      y += 7;

      // Anchos tabla historial — distribuidos para que quepan todos los campos
      const HL = {
        num:    CW * 0.03,
        etapa:  CW * 0.15,
        datos:  CW * 0.32,
        decl:   CW * 0.10,
        ledger: CW * 0.10,
        txid:   CW * 0.30,
      };

      headerTabla([
        { t: '#',                   w: HL.num,    al: 'center' },
        { t: 'ETAPA',               w: HL.etapa              },
        { t: 'DATOS DEL EVENTO',    w: HL.datos              },
        { t: 'FECHA DECLARADA',     w: HL.decl,   al: 'center' },
        { t: 'LEDGER',              w: HL.ledger, al: 'center' },
        { t: 'TRANSACTION ID (Hash SHA-256)', w: HL.txid     },
      ]);

      data.eventos.forEach((ev, idx) => {
        const tx    = histOrden[idx];
        const label = ESTADO_LABELS[ev.tipo] ?? ev.tipo;

        // Datos del evento como texto multilínea
        const datosArr: string[] = [];
        if (ev.puntoControl)             datosArr.push(`Punto: ${ev.puntoControl}`);
        if (ev.coordenadas)              datosArr.push(`Coords: ${ev.coordenadas[0].toFixed(3)}, ${ev.coordenadas[1].toFixed(3)}`);
        if (ev.contenedor)               datosArr.push(`Cont: ${ev.contenedor}`);
        if (ev.tipoTransporte)           datosArr.push(`Transp: ${ev.tipoTransporte}`);
        if (ev.blAwb)                    datosArr.push(`BL/AWB: ${ev.blAwb}`);
        if (ev.integridad !== undefined)  datosArr.push(`Integ: ${ev.integridad ? 'OK' : 'Obs ✗'}`);
        if (ev.descripcionIntegridad)    datosArr.push(`Obs: ${ev.descripcionIntegridad}`);
        if (ev.documentoTransito)        datosArr.push(`Doc: ${ev.documentoTransito}`);
        if (ev.dim)                      datosArr.push(`DIM: ${ev.dim}`);
        if (ev.dam)                      datosArr.push(`DAM: ${ev.dam}`);
        if (ev.valorCIF)                 datosArr.push(`CIF: $${ev.valorCIF.toLocaleString()}`);
        if (ev.totalPagado)              datosArr.push(`Adu: $${ev.totalPagado.toLocaleString()}`);
        if (ev.arancel)                  datosArr.push(`Aran: ${ev.arancel}%`);
        if (ev.iva)                      datosArr.push(`IVA: ${ev.iva}%`);
        if (ev.ice)                      datosArr.push(`ICE: ${ev.ice}%`);
        if (ev.comerciante)              datosArr.push(`Com: ${ev.comerciante}`);
        if (ev.responsable)              datosArr.push(`Resp: ${ev.responsable}`);
        if (ev.deposito)                 datosArr.push(`Dep: ${ev.deposito}`);
        if (ev.tienda)                   datosArr.push(`Tienda: ${ev.tienda}`);
        if (ev.cliente)                  datosArr.push(`Cliente: ${ev.cliente}`);
        if (ev.fechaCompra)              datosArr.push(`Compra: ${fmtFecha(ev.fechaCompra)}`);
        const datosText = datosArr.join('\n') || '—';

        const bg: [number,number,number] = idx % 2 === 0 ? C.fondoFila : C.blanco;

        // drawRow calcula automáticamente la altura máxima entre TODAS las celdas
        // El txId largo se parte en líneas dentro de su columna — sin desborde
        checkPage(10);
        const rowH = drawRow([
          { text: String(idx + 1),
            w: HL.num,    align: 'center', color: C.gris,                         bold: true,  fontSize: BASE      },
          { text: label,
            w: HL.etapa,                   color: C.negro,                        bold: true,  fontSize: BASE      },
          { text: datosText,
            w: HL.datos,                   color: C.gris,                                      fontSize: BASE      },
          { text: `${fmtFecha(ev.fecha)}\n${fmtHora(ev.fecha)}`,
            w: HL.decl,   align: 'center', color: C.negro,                                     fontSize: BASE - 0.5 },
          { text: tx ? `${fmtFecha(tx.timestamp)}\n${fmtHora(tx.timestamp)}` : 'Sin TX',
            w: HL.ledger, align: 'center', color: tx ? C.verde : C.grisL,                      fontSize: BASE - 0.5 },
          { text: tx ? tx.txId : '—',
            w: HL.txid,                    color: C.azul,  font: 'courier',       fontSize: BASE - 1.5              },
        ], y, bg, 10);

        y += rowH;
      });

      y += 6;
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