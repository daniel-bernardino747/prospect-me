/**
 * The call's result as a Word file on Techifide's own template fields, built in
 * the browser. Loaded only when someone asks for it, so the page never carries
 * the library otherwise.
 */
import type { AdView, Dimension } from './data';
import { briefRows, fromLabel, profileRows, SCALE, type Worksheet } from './worksheet';

export async function downloadDocx(ad: AdView, sheet: Worksheet, dimensions: readonly Dimension[]): Promise<void> {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx');

  const rule = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
  const borders = { top: rule, bottom: rule, left: rule, right: rule, insideHorizontal: rule, insideVertical: rule };
  const cell = (children: InstanceType<typeof Paragraph>[], width: number, head = false) =>
    new TableCell({
      children,
      width: { size: width, type: WidthType.PERCENTAGE },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      ...(head ? { shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EDEDED' } } : {}),
    });
  const text = (t: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}) =>
    new Paragraph({ children: [new TextRun({ text: t, ...opts })] });
  const muted = (t: string) => new Paragraph({ children: [new TextRun({ text: t, italics: true, color: '666666', size: 18 })] });

  const brief = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: briefRows(ad, sheet).map(
      (row) =>
        new TableRow({
          children: [
            cell([text(row.field, { bold: true })], 34, true),
            cell(
              row.values.length
                ? row.values.flatMap((v) => [text(v.text), muted(`from ${v.from}`)])
                : [muted('To confirm')],
              66,
            ),
          ],
        }),
    ),
  });

  const profile = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          cell([text('Dimension', { bold: true })], 34, true),
          cell([text('Level (1–5)', { bold: true })], 16, true),
          cell([text('Notes', { bold: true })], 50, true),
        ],
      }),
      ...profileRows(ad, sheet, dimensions).map(
        (row) =>
          new TableRow({
            children: [
              cell([text(row.name, { bold: true }), muted(row.description)], 34),
              cell(
                row.level === null
                  ? [muted('To confirm')]
                  : [
                      new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: String(row.level), bold: true, size: 28 })] }),
                      muted(`from ${fromLabel(row.source)}`),
                    ],
                16,
              ),
              cell([text(row.note || '')], 50),
            ],
          }),
      ),
    ],
  });

  const doc = new Document({
    creator: 'Daniel Bernardino (independent prototype)',
    title: `${ad.title}: vacancy brief and Role Fit Profile`,
    styles: { default: { document: { run: { font: 'Calibri', size: 21 } } } },
    sections: [
      {
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(ad.title)] }),
          muted(`Vacancy brief on the Techi-job-offer template. Ad: ${ad.url}`),
          new Paragraph({ text: '' }),
          brief,
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            children: [new TextRun('Role Fit Profile')],
          }),
          muted(`The level each dimension of the role calls for: 1 = ${SCALE.low.toLowerCase()}, 5 = ${SCALE.high.toLowerCase()}.`),
          new Paragraph({ text: '' }),
          profile,
          new Paragraph({ text: '' }),
          muted('Prepared in an independent prototype by Daniel Bernardino, from public data and the intake call. Not affiliated with or produced by Techifide; nothing was sent anywhere.'),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ad.key}-vacancy-brief-and-role-fit.docx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
