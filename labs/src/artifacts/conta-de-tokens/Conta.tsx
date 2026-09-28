'use client';

import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { Board, Lock, rowId } from './Board';
import {
  type Answer,
  answer,
  bands,
  board,
  type ContaDeTokens,
  dateLabel,
  flapWidth,
  OUTPUT_MAX,
  OUTPUT_MIN,
  OUTPUT_STEP,
  providerLabel,
  ratioTag,
  referenceOptions,
  type Scenario,
  scenarioQuery,
  SHARE_KEYS,
  sharePct,
  shareSearch,
  shareText,
  usd,
  VOLUME_KEYS,
  VOLUME_LABEL,
} from './data';
import { Fader } from './Fader';
import { prefersReducedMotion } from './flap';
import { FlapFigure } from './FlapFigure';
import { MarketChart } from './MarketChart';
import { ShareLinks } from './ShareLinks';
import s from './conta.module.css';

interface Props {
  data: ContaDeTokens;
  initial: Scenario;
}

function Note({ n, onBand = false }: { n: 1 | 2; onBand?: boolean }) {
  const mark = n === 1 ? '¹' : '²';
  // Inside a plate (itself a button) the marker cannot be a link; the sentence above carries the link.
  if (onBand) {
    return (
      <sup className={`${s.note} ${s.noteBand}`} aria-hidden="true">
        {mark}
      </sup>
    );
  }
  return (
    <a href="#fontes" className={s.note} aria-label={n === 1 ? 'Fonte dos preços' : 'Fonte da participação'}>
      <sup>{mark}</sup>
    </a>
  );
}

function Sentence({ a }: { a: Answer }) {
  return (
    <h1 className={s.answer}>
      {a.segments.map((seg, i) =>
        'text' in seg ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <span key={i} className={s.figGroup}>
            <span className={`${s.fig} ${seg.mark === 'ref' ? s.figRef : seg.mark === 'leader' ? s.figLeader : ''}`}>{seg.fig}</span>
            {seg.note ? <Note n={seg.note} /> : null}
          </span>
        ),
      )}
    </h1>
  );
}

/** Scrolls to a board row and outlines it for a moment. */
function goToRow(key: string) {
  const row = document.getElementById(rowId(key));
  if (!row) return;
  const reduced = prefersReducedMotion();
  row.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  row.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  if (reduced) return;
  row.classList.remove(s.pulse);
  void row.offsetWidth;
  row.classList.add(s.pulse);
  setTimeout(() => row.classList.remove(s.pulse), 700);
}

export function Conta({ data, initial }: Props) {
  const [sc, setSc] = useState<Scenario>(initial);
  const [showAll, setShowAll] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      history.replaceState(history.state, '', `${location.pathname}${scenarioQuery(sc)}${location.hash}`);
    } catch {
      /* the URL is a convenience */
    }
  }, [sc]);

  const set = (patch: Partial<Scenario>) => setSc((cur) => ({ ...cur, ...patch }));
  const setCache = (cache: number) => set({ cache });

  const a = useMemo(() => answer(data, sc), [data, sc]);
  const b = useMemo(() => board(data, sc, showAll), [data, sc, showAll]);
  const bs = useMemo(() => bands(data, a.ref.provider), [data, a.ref.provider]);
  const refs = useMemo(() => {
    const groups = new Map<string, typeof opts>();
    const opts = referenceOptions(data).sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'));
    for (const m of opts) {
      const label = providerLabel(data, m.provider);
      groups.set(label, [...(groups.get(label) ?? []), m]);
    }
    return [...groups.entries()].sort(([x], [y]) => x.localeCompare(y, 'pt-BR'));
  }, [data]);

  const plateWidth = flapWidth([a.refBill.total, a.leaderBill.total], 6);
  const boardWidth = flapWidth(b.paid.map((r) => r.bill?.total ?? 0), 3);
  const tag = a.ref.id === a.leader.model.id ? null : ratioTag(a.refBill.total, a.leaderBill.total);
  const pricesDate = dateLabel(data.sources.catalog.fetchedAt);
  const shared = useMemo(() => shareText(data, sc), [data, sc]);

  return (
    <>
      <div className={s.wrap}>
        <div className={s.lede}>
          <p className={s.kicker}>Cenário ilustrativo · preços e participação do OpenRouter (só o tráfego que passa por ele)</p>
          <Sentence a={a} />
        </div>
      </div>

      <section className={s.band} aria-label="As duas cotações">
        <div className={`${s.wrap} ${s.plates}`}>
          <button type="button" className={`${s.plate} ${s.plateRef}`} onClick={() => goToRow(a.ref.id as string)}>
            <span className={s.plateLabel}>
              Seu modelo de referência · <span className={s.plateName}>{a.ref.name}</span>
            </span>
            <span className={s.plateRow}>
              <span className={s.plateCur}>US$</span>
              <FlapFigure value={usd(a.refBill.total)} width={plateWidth} size="lg" surface="band" label={`US$ ${usd(a.refBill.total)} por mês`} settleOnce />
              <span className={s.plateUnit}>
                {a.refBill.frozen ? null : '/mês'}
                <Note n={1} onBand />
              </span>
            </span>
            {a.refBill.frozen ? (
              <span className={s.plateFrozen}>
                <Lock onBand /> Este modelo não tem preço de cache no catálogo: o cache não muda esta fatura.
              </span>
            ) : null}
          </button>
          <span className={s.plateRule} aria-hidden="true" />
          <button type="button" className={`${s.plate} ${s.plateLead}`} onClick={() => goToRow(a.leader.model.id as string)}>
            <span className={s.plateLabel}>
              Mais usado na semana · <span className={s.plateName}>{a.leader.model.name}</span>
            </span>
            <span className={s.plateRow}>
              <span className={s.plateCur}>US$</span>
              <FlapFigure
                value={usd(a.leaderBill.total)}
                width={plateWidth}
                size="lg"
                surface="band"
                label={`US$ ${usd(a.leaderBill.total)} por mês`}
                settleOnce
              />
              <span className={s.plateUnit}>
                /mês
                <Note n={1} onBand />
              </span>
              {tag ? <span className={s.plateTag}>{tag}</span> : null}
            </span>
          </button>
        </div>
      </section>

      <div className={s.wrap}>
        <Fader variant="full" value={sc.cache} onChange={setCache} />
        <noscript>
          <p className={s.muted}>Sem JavaScript, a página mostra o caso padrão.</p>
        </noscript>

        <details className={s.stamp}>
          <summary className={s.stampSummary}>
            <span className={s.stampText}>
              Cenário ilustrativo · {VOLUME_LABEL[sc.volume]} tokens/mês · {sc.output}% saída · ref. {a.ref.name}
            </span>
            <span className={s.stampAction}>Alterar</span>
          </summary>
          <div className={s.drawer}>
            <fieldset className={s.field}>
              <legend className={s.fieldLabel}>Tokens por mês</legend>
              <div className={s.keys}>
                {VOLUME_KEYS.map((v) => (
                  <label key={v} className={`${s.key} ${sc.volume === v ? s.keyOn : ''}`}>
                    <input type="radio" name="volume" value={v} checked={sc.volume === v} onChange={() => set({ volume: v })} />
                    <span>{VOLUME_LABEL[v]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className={s.field}>
              <span className={s.fieldLabel} id="saida-label">
                Saída
              </span>
              <div className={s.stepper} role="group" aria-labelledby="saida-label">
                <button
                  type="button"
                  className={s.stepBtn}
                  aria-label="Menos saída"
                  disabled={sc.output <= OUTPUT_MIN}
                  onClick={() => set({ output: Math.max(OUTPUT_MIN, sc.output - OUTPUT_STEP) })}
                >
                  −
                </button>
                <output className={s.stepVal} aria-live="polite">
                  {sc.output}%
                </output>
                <button
                  type="button"
                  className={s.stepBtn}
                  aria-label="Mais saída"
                  disabled={sc.output >= OUTPUT_MAX}
                  onClick={() => set({ output: Math.min(OUTPUT_MAX, sc.output + OUTPUT_STEP) })}
                >
                  +
                </button>
              </div>
            </div>
            <div className={s.field}>
              <label className={s.fieldLabel} htmlFor="ref-model">
                Modelo de referência
              </label>
              <select id="ref-model" className={s.select} value={sc.ref} onChange={(e) => set({ ref: e.currentTarget.value })}>
                {refs.map(([label, models]) => (
                  <optgroup key={label} label={label}>
                    {models.map((m) => (
                      <option key={m.id} value={m.id as string}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <p className={s.muted}>Nada do que você escolhe aqui sai do navegador.</p>
          </div>
        </details>

        <ShareLinks search={shareSearch(sc)} keys={SHARE_KEYS} text={shared.short} title={shared.title} />
      </div>

      <div className={`${s.wrap} ${s.market}`}>
        <section className={s.chartCol} aria-labelledby="mercado">
          <div className={s.chartSticky}>
            <h2 id="mercado" className={s.h2}>
              Onde o mercado gasta
            </h2>
            <p className={s.dek}>Participação semanal nos tokens do OpenRouter, por fornecedor, nas últimas {data.weeks.length} semanas.</p>
            <MarketChart data={data} bands={bs} />
            <p className={s.attrib}>Source: OpenRouter (openrouter.ai/rankings), as of {data.sources.rankings.asOf}.</p>
            <p className={s.warn}>
              Tokens de fornecedores diferentes não são diretamente comparáveis: cada um conta com seu próprio tokenizador (aviso da própria
              fonte).
            </p>
            <p className={s.warn}>Só aparece o tráfego que passa pelo OpenRouter; quem chama a Anthropic ou a OpenAI direto não entra.</p>
            <p className={s.warn}>
              <span className={s.data}>{sharePct(data.freeShare)}</span> dos tokens da última semana vieram de variantes gratuitas (<span className={s.data}>:free</span>
              ), que inflam a participação de quem as oferece.
            </p>
          </div>
        </section>

        <section className={s.boardCol} aria-labelledby="fatura">
          <Board
            board={b}
            width={boardWidth}
            showAll={showAll}
            onShowAll={() => setShowAll(true)}
            pricesDate={pricesDate}
            header={
              <div className={s.boardHead}>
                <h2 id="fatura" className={s.h2}>
                  Sua fatura em cada modelo
                </h2>
                <Fader variant="compact" value={sc.cache} onChange={setCache} />
              </div>
            }
          />
        </section>
      </div>
    </>
  );
}

/** If the interactive part fails, the server-rendered default case stays readable. */
export class ContaBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
