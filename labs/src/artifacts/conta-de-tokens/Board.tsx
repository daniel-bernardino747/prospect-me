'use client';

import { Fragment, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { type Bill, type Board as BoardData, perMillion, perMillionShort, type Row, sharePct, usd } from './data';
import { prefersReducedMotion } from './flap';
import { FlapFigure } from './FlapFigure';
import s from './conta.module.css';

interface Props {
  board: BoardData;
  width: number;
  showAll: boolean;
  onShowAll: () => void;
  pricesDate: string;
  /** The section header row: h2 plus the compact fader. */
  header: ReactNode;
}

const REORDER_WAIT = 140;
const rowKey = (r: Row) => (r.model.kind === 'paid' && r.model.id ? r.model.id : r.model.key);
export const rowId = (key: string) => `modelo-${key.replace(/[^a-z0-9]+/gi, '-')}`;

function Lock({ onBand = false }: { onBand?: boolean }) {
  return (
    <svg className={`${s.lock} ${onBand ? s.lockBand : ''}`} width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
      <path d="M3.25 6.25V4.5a2.75 2.75 0 0 1 5.5 0v1.75" fill="none" strokeWidth="1.5" />
      <rect x="1.25" y="6.25" width="9.5" height="6.75" fill="none" strokeWidth="1.5" />
    </svg>
  );
}
export { Lock };

function Share({ v }: { v: number | null }) {
  return (
    <span className={s.share}>
      <span className={s.shareTrack} aria-hidden="true">
        <span className={s.shareFill} style={{ width: `${Math.min(100, ((v ?? 0) / 0.15) * 100)}%` }} />
      </span>
      <span className={s.data}>{sharePct(v)}</span>
    </span>
  );
}

function prices(r: Row): string {
  const p = r.model.prices;
  if (!p) return '—';
  return `${perMillion(p.input)} · ${p.cacheRead === null ? '—' : perMillion(p.cacheRead)} · ${perMillion(p.output)}`;
}

/**
 * The phone's price line: each price labelled and kept whole, rounded to two
 * significant digits; the exact values stay in the row's detail.
 */
function PriceLine({ r }: { r: Row }) {
  const p = r.model.prices;
  if (!p) return null;
  const pairs: [string, string][] = [
    ['ent', perMillionShort(p.input)],
    ['cache', p.cacheRead === null ? '—' : perMillionShort(p.cacheRead)],
    ['saída', perMillionShort(p.output)],
  ];
  return (
    <span className={s.rowPrices}>
      {pairs.map(([k, v]) => (
        <span key={k} className={s.rowPair}>
          <span className={s.rowPairKey}>{k}</span> {v}
        </span>
      ))}
    </span>
  );
}

function billLabel(b: Bill | null) {
  return b ? `US$ ${usd(b.total)} por mês` : 'sem fatura';
}

/**
 * "Sua fatura em cada modelo": paid models ascending by bill, re-sorted live
 * (FLIP, after the fader rests 140ms); free variants and unpriced rows apart.
 */
export function Board({ board, width, showAll, onShowAll, pricesDate, header }: Props) {
  const target = board.paid.map(rowKey).join('|');
  const [order, setOrder] = useState(target);
  const [open, setOpen] = useState<string | null>(null);
  const tbody = useRef<HTMLTableSectionElement>(null);
  const before = useRef<Map<string, number>>(new Map());

  // Wait for the lever to rest, then measure and commit the new order.
  useEffect(() => {
    if (order === target) return;
    const t = setTimeout(() => {
      const m = new Map<string, number>();
      tbody.current?.querySelectorAll<HTMLElement>('[data-key]').forEach((el) => m.set(el.dataset.key!, el.getBoundingClientRect().top));
      before.current = m;
      setOrder(target);
    }, REORDER_WAIT);
    return () => clearTimeout(t);
  }, [order, target]);

  useLayoutEffect(() => {
    const prev = before.current;
    if (!prev.size || !tbody.current) return;
    before.current = new Map();
    if (prefersReducedMotion()) return;
    tbody.current.querySelectorAll<HTMLElement>('[data-key]').forEach((el) => {
      const was = prev.get(el.dataset.key!);
      if (was === undefined) return;
      const dy = was - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) return;
      // Rows moving up pass over rows moving down.
      el.style.zIndex = dy > 0 ? '2' : '1';
      const a = el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], {
        duration: 320,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      });
      a.finished.then(() => (el.style.zIndex = '')).catch(() => undefined);
    });
  }, [order]);

  // Rows in the committed order; bills are always the current ones.
  const byKey = new Map(board.paid.map((r) => [rowKey(r), r]));
  const committed = order.split('|').filter((k) => byKey.has(k));
  const paid = [...committed.map((k) => byKey.get(k)!), ...board.paid.filter((r) => !committed.includes(rowKey(r)))];

  const shown = board.paid.length + board.free.length + board.tail.length;

  const renderRow = (r: Row, group: 'paid' | 'free' | 'tail') => {
    const key = rowKey(r);
    const isOpen = open === key;
    const frozen = group === 'paid' && r.bill?.frozen;
    const cls = [s.row, r.isRef ? s.rowRef : '', r.isLeader ? s.rowLead : '', frozen ? s.rowFrozen : ''].join(' ');
    const note =
      group === 'free'
        ? 'gratuito, com limites'
        : r.model.kind === 'stealth'
          ? 'sem preço: modelo não identificado'
          : r.model.kind === 'unpriced'
            ? 'fora do catálogo de preços'
            : frozen
              ? 'sem preço de cache'
              : null;
    const detailId = `${rowId(key)}-detalhe`;
    return (
      <Fragment key={key}>
        <tr id={rowId(key)} data-key={group === 'paid' ? key : undefined} className={cls}>
          <th scope="row" className={s.cName}>
            <button
              type="button"
              className={s.rowBtn}
              aria-expanded={isOpen}
              aria-controls={isOpen ? detailId : undefined}
              onClick={() => setOpen(isOpen ? null : key)}
            >
              <span className={s.rowName}>
                {r.model.name}
                {r.isRef ? <span className={s.rowTag}> · sua referência</span> : null}
                {r.isLeader ? <span className={s.rowTag}> · mais usado</span> : null}
              </span>
              <span className={s.rowProv}>{r.model.provider}</span>
              <span className={s.rowMeta}>
                <span className={s.rowPair}>
                  {r.model.provider} · {sharePct(r.model.share)}
                </span>
                {note ? <span className={s.rowNote}>{note}</span> : null}
              </span>
              <PriceLine r={r} />
            </button>
          </th>
          <td className={s.cShare}>
            <Share v={r.model.share} />
          </td>
          <td className={`${s.cPrices} ${s.data}`}>
            {prices(r)}
            {note && group === 'paid' ? <span className={s.rowNoteWide}>{note}</span> : null}
          </td>
          <td className={s.cBill}>
            <span className={s.billWrap}>
              {frozen ? <Lock /> : null}
              {group === 'free' ? (
                <FlapFigure value="0" width={width} size="sm" surface="sheet" label="US$ 0, gratuito no OpenRouter, com limites" />
              ) : r.bill ? (
                <FlapFigure value={usd(r.bill.total)} width={width} size="sm" surface="sheet" label={billLabel(r.bill)} />
              ) : (
                <FlapFigure value="—" width={width} size="sm" surface="sheet" label="sem fatura" />
              )}
            </span>
          </td>
        </tr>
        {isOpen ? (
          <tr className={s.detailRow} id={detailId}>
            <td colSpan={4}>
              <div className={s.detail}>
                {r.bill && group === 'paid' ? (
                  <p className={s.data}>
                    Entrada sem cache: US$ {usd(r.bill.uncached)} · Entrada do cache: {frozen ? '— (sem preço de cache)' : `US$ ${usd(r.bill.cached)}`} ·
                    Saída: US$ {usd(r.bill.output)}
                  </p>
                ) : (
                  <p className={s.data}>{note ?? 'Sem fatura.'}</p>
                )}
                <p className={s.data}>
                  {r.model.prices ? `Preço (US$/milhão): ${prices(r)} · ` : ''}Preço: catálogo OpenRouter, {pricesDate}
                  {r.model.share !== null ? ` · Participação: ${sharePct(r.model.share)} dos tokens da semana` : ''}
                </p>
              </div>
            </td>
          </tr>
        ) : null}
      </Fragment>
    );
  };

  return (
    <div className={s.board}>
      {header}
      <table className={s.table}>
        <caption className={s.srOnly}>Fatura mensal estimada por modelo para o cenário escolhido</caption>
        <thead>
          <tr>
            <th scope="col" className={s.cName}>
              Modelo
              <span className={s.headHint}>fornecedor · part. semana · preços em US$/milhão</span>
            </th>
            <th scope="col" className={s.cShare}>
              Part. semana
            </th>
            <th scope="col" className={s.cPrices}>
              US$/milhão entrada · cache · saída
            </th>
            <th scope="col" className={s.cBill}>
              Fatura/mês
            </th>
          </tr>
        </thead>
        <tbody ref={tbody}>{paid.map((r) => renderRow(r, 'paid'))}</tbody>
        {board.free.length ? (
          <tbody className={s.groupFree}>
            <tr>
              <th scope="rowgroup" colSpan={4} className={s.groupHead}>
                Gratuitos no OpenRouter, com limites
              </th>
            </tr>
            {board.free.map((r) => renderRow(r, 'free'))}
          </tbody>
        ) : null}
        {board.tail.length ? (
          <tbody>
            <tr>
              <th scope="rowgroup" colSpan={4} className={s.groupHead}>
                Sem preço no catálogo
              </th>
            </tr>
            {board.tail.map((r) => renderRow(r, 'tail'))}
          </tbody>
        ) : null}
      </table>
      {!showAll && shown < board.total ? (
        <button type="button" className={s.more} onClick={onShowAll}>
          Ver todos os {board.total} modelos
        </button>
      ) : null}
    </div>
  );
}

