// Polyfill global Iterator to prevent WebKit/Safari ReferenceError in pdfjs-dist
if (typeof (globalThis as any).Iterator === 'undefined') {
  (globalThis as any).Iterator = function () {};
  (globalThis as any).Iterator.prototype = {};
}

import * as pdfjsLib from 'pdfjs-dist';
import { TOCItem, SearchMatch } from '../types';

// Set up the PDF.js worker using Vite's URL import
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export class PDFService {
  static async loadDocument(source: string | ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
    const loadingTask = pdfjsLib.getDocument(
      typeof source === 'string'
        ? {
            url: source,
            cMapUrl: '/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: '/standard_fonts/',
          }
        : {
            data: source,
            cMapUrl: '/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: '/standard_fonts/',
          }
    );

    return await loadingTask.promise;
  }

  static async getTableOfContents(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<TOCItem[]> {
    try {
      const outline = await pdfDoc.getOutline();
      if (outline && outline.length > 0) {
        const toc = await this.parseOutlineItems(pdfDoc, outline, 1);
        if (toc.length > 0) {
          return toc;
        }
      }
    } catch (e) {
      console.warn('Failed to extract embedded outline, falling back to auto-generation:', e);
    }

    return await this.autoGenerateTOC(pdfDoc);
  }

  private static async parseOutlineItems(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    items: any[],
    level: number
  ): Promise<TOCItem[]> {
    const result: TOCItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let pageNum = 1;

      try {
        let dest = item.dest;
        if (typeof dest === 'string') {
          dest = await pdfDoc.getDestination(dest);
        }
        if (Array.isArray(dest) && dest[0]) {
          const pageRef = dest[0];
          pageNum = (await pdfDoc.getPageIndex(pageRef)) + 1;
        } else if (typeof dest === 'number') {
          pageNum = dest + 1;
        }
      } catch (err) {
        console.warn('Could not resolve destination for outline item:', item.title, err);
      }

      const tocItem: TOCItem = {
        id: `outline_${level}_${i}_${pageNum}`,
        title: item.title || `ページ ${pageNum}`,
        pageNumber: pageNum,
        level: Math.min(level, 3),
        source: 'outline',
      };

      if (item.items && item.items.length > 0) {
        tocItem.children = await this.parseOutlineItems(pdfDoc, item.items, level + 1);
      }

      result.push(tocItem);
    }

    return result;
  }

  static async autoGenerateTOC(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<TOCItem[]> {
    const numPages = pdfDoc.numPages;
    const candidates: Array<{ title: string; pageNumber: number; fontSize: number; level: number; order: number }> = [];

    const chapterRegex = /^(?:第\s*[0-90-9〇一二三四五六七八九十百千万]+\s*[章節部篇回条]|Chapter\s+\d+|Part\s+[IVX0-9]+)\s*[:：\s]?(.*)$/i;
    const sectionNumRegex = /^(\d+(\.\d+){1,2})\s+([\p{L}\p{N}].*)$/u;
    const commonHeadingRegex = /^(?:はじめに|おわりに|序論|本論|結論|まとめ|概要|目次|付録|参考文献|謝辞|著者紹介|Introduction|Summary|Conclusion|Abstract|Overview|Appendix|References)\b/i;

    const maxPagesToScan = Math.min(numPages, 100);
    const fontSizeHistogram: Record<number, number> = {};

    for (let pageNum = 1; pageNum <= maxPagesToScan; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const lines: Array<{ text: string; fontSize: number; y: number }> = [];

        let currentLineText = '';
        let currentLineFontSize = 0;
        let lastY: number | null = null;

        for (const item of textContent.items as any[]) {
          const str = (item.str || '').trim();
          if (!str) continue;

          const fontSize = Math.round(Math.abs(item.transform?.[3] || item.height || 12));
          fontSizeHistogram[fontSize] = (fontSizeHistogram[fontSize] || 0) + str.length;

          const y = Math.round(item.transform?.[5] || 0);

          if (lastY === null || Math.abs(y - lastY) < 3) {
            currentLineText += (currentLineText ? ' ' : '') + str;
            currentLineFontSize = Math.max(currentLineFontSize, fontSize);
          } else {
            if (currentLineText.trim()) {
              lines.push({
                text: currentLineText.trim(),
                fontSize: currentLineFontSize,
                y: lastY,
              });
            }
            currentLineText = str;
            currentLineFontSize = fontSize;
          }
          lastY = y;
        }

        if (currentLineText.trim() && lastY !== null) {
          lines.push({
            text: currentLineText.trim(),
            fontSize: currentLineFontSize,
            y: lastY,
          });
        }

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const text = line.text;

          if (text.length < 2 || text.length > 90 || /^\d+$/.test(text)) {
            continue;
          }

          if (chapterRegex.test(text)) {
            candidates.push({
              title: text,
              pageNumber: pageNum,
              fontSize: line.fontSize,
              level: 1,
              order: candidates.length,
            });
            continue;
          }

          if (sectionNumRegex.test(text)) {
            const dots = (text.match(/\./g) || []).length;
            candidates.push({
              title: text,
              pageNumber: pageNum,
              fontSize: line.fontSize,
              level: Math.min(dots + 1, 3),
              order: candidates.length,
            });
            continue;
          }

          if (commonHeadingRegex.test(text)) {
            candidates.push({
              title: text,
              pageNumber: pageNum,
              fontSize: line.fontSize,
              level: 1,
              order: candidates.length,
            });
            continue;
          }
        }
      } catch (err) {
        console.warn(`Error scanning page ${pageNum} for TOC:`, err);
      }
    }

    let dominantBodyFontSize = 12;
    let maxCount = 0;
    for (const [size, count] of Object.entries(fontSizeHistogram)) {
      if (count > maxCount) {
        maxCount = count;
        dominantBodyFontSize = Number(size);
      }
    }

    const seenTitles = new Set<string>();
    const filtered: Array<{ title: string; pageNumber: number; fontSize: number; level: number; order: number }> = [];

    for (const item of candidates) {
      const key = `${item.pageNumber}_${item.title.toLowerCase()}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        filtered.push(item);
      }
    }

    if (filtered.length === 0) {
      const step = numPages > 20 ? 5 : numPages > 10 ? 2 : 1;
      for (let p = 1; p <= numPages; p += step) {
        filtered.push({
          title: `ページ ${p}`,
          pageNumber: p,
          fontSize: dominantBodyFontSize,
          level: 1,
          order: filtered.length,
        });
      }
    }

    return filtered.map((item, idx) => ({
      id: `auto_toc_${idx}_p${item.pageNumber}`,
      title: item.title,
      pageNumber: item.pageNumber,
      level: item.level,
      source: 'auto-generated',
    }));
  }

  static async renderPage(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.0,
    rotation: number = 0
  ): Promise<{ width: number; height: number }> {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale, rotation });
    const outputScale = window.devicePixelRatio || 1;

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Failed to get 2d context');

    ctx.save();
    ctx.scale(outputScale, outputScale);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    ctx.restore();

    return { width: viewport.width, height: viewport.height };
  }

  static async generateThumbnail(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    targetWidth: number = 140
  ): Promise<string> {
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const originalViewport = page.getViewport({ scale: 1.0 });
      const scale = targetWidth / originalViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      console.warn(`Failed to generate thumbnail for page ${pageNumber}`, e);
      return '';
    }
  }

  static async searchDocument(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    query: string
  ): Promise<SearchMatch[]> {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.toLowerCase().trim();
    const results: SearchMatch[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const fullPageText = (textContent.items as any[]).map((item) => item.str || '').join(' ');

        let matchIdx = 0;
        let pos = fullPageText.toLowerCase().indexOf(cleanQuery);

        while (pos !== -1 && matchIdx < 10) {
          const start = Math.max(0, pos - 25);
          const end = Math.min(fullPageText.length, pos + cleanQuery.length + 35);
          const snippet =
            '...' + fullPageText.slice(start, end).replace(/\s+/g, ' ') + '...';

          results.push({
            pageNumber: pageNum,
            matchIndex: matchIdx,
            textSnippet: snippet,
          });

          matchIdx++;
          pos = fullPageText.toLowerCase().indexOf(cleanQuery, pos + cleanQuery.length);
        }
      } catch (err) {
        console.warn(`Search error on page ${pageNum}:`, err);
      }
    }

    return results;
  }
}
