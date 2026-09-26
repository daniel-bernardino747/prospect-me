'use client';

import { type MouseEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  buildGraph,
  chainDropTargets,
  clockOf,
  collapse,
  dateBr,
  defaultEntry,
  type Entry,
  exposureAt,
  headline,
  layout,
  liveLine,
  morning,
  type Piece,
  qualifier,
  type RaioData,
  whatIfHeadline,
} from './data';
import s from './raio.module.css';
import { type ChartMode, ZoneChart } from './ZoneChart';

export interface Initial {
  caso: string;
  t: string | null;
  alvo: string | null;
}

/** The sentence under the headline, per case: the contrast, from the brief's findings. */
const DECK: Record<string, ReactNode> = {
  stylelint: (
    <>
      O <code>keyv</code>, onde o ataque começou, ficou de fora: <code>^5.6.0</code> não aceita <code>6.0.0</code>.
    </>
  ),
  got: (
    <>
      O <code>keyv</code> ficou de fora aqui também: <code>^5.6.0</code> não aceita <code>6.0.0</code>. A porta foi o{' '}
      <code>cacheable-request</code>, dependência direta.
    </>
  ),
  eslint: (
    <>
      Mesma família de pacotes, faixas mais antigas. O ESLint só subiu para o <code>file-entry-cache</code> 11 na
      10.10.0 (4 set 2026), já com a faixa <code>11.1.5 || &gt;11.1.6 &lt;12</code>, que exclui a versão infectada.
    </>
  ),
};

const saltos = (k: number) => (k === 1 ? 'salto' : 'saltos');

function Sentence({ pieces }: { pieces: Piece[] }) {
  return (
    <>
      {pieces.map((p, i) =>
        p.t === 'lead' ? (
          <strong key={i} className={s.lead}>
            {p.v}
          </strong>
        ) : p.t === 'fig' ? (
          <span key={i} className={s.fig}>
            {p.v}
          </span>
        ) : p.t === 'code' ? (
          <code key={i} className={s.headCode}>
            {p.v}
          </code>
        ) : (
          <span key={i}>{p.v}</span>
        ),
      )}
    </>
  );
}

const href = (caso: string, t?: string, alvo?: string) => {
  const q = new URLSearchParams({ caso });
  if (t) q.set('t', t);
  if (alvo) q.set('alvo', alvo);
  return `?${q.toString()}`;
};

/** A plain link without JS; with JS, the same state changes in place and the URL follows. */
function StateLink({
  to,
  onGo,
  className,
  children,
  ...rest
}: {
  to: string;
  onGo: () => void;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onGo();
  };
  return (
    <a href={to} onClick={go} className={className} {...rest}>
      {children}
    </a>
  );
}

function GateGlyph({ state }: { state: 'open' | 'shut' | 'muted' }) {
  return (
    <svg viewBox="0 0 16 16" className={s.glyph} data-state={state} aria-hidden="true">
      <line x1="8" y1="15" x2="8" y2="1" className={s.glyphEdge} />
      {state === 'open' ? (
        <line x1="8" y1="11" x2="8" y2="1" className={s.glyphArm} />
      ) : (
        <line x1="2" y1="8" x2="14" y2="8" className={s.glyphArm} />
      )}
      <circle cx="8" cy={state === 'open' ? 11 : 8} r="1.6" className={s.glyphPivot} />
    </svg>
  );
}

export function Carta({ data, initial }: { data: RaioData; initial: Initial }) {
  const preset0 = data.presets.find((p) => p.id === initial.caso) ?? data.presets[0];
  const [caso, setCaso] = useState(preset0.id);
  const graphs = useMemo(() => new Map(data.presets.map((p) => [p.id, buildGraph(p)])), [data]);
  const g = graphs.get(caso)!;
  const entries = useMemo(() => morning(data, g), [data, g]);
  const [index, setIndex] = useState(() => {
    const e = morning(data, graphs.get(preset0.id)!);
    const i = e.findIndex((x) => x.id === initial.t);
    return i >= 0 ? i : defaultEntry(e);
  });
  const [target, setTarget] = useState<number | null>(() => {
    if (!initial.alvo) return null;
    const i = preset0.nodes.indexOf(initial.alvo);
    return i > 0 ? i : null;
  });
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [move, setMove] = useState<{ from: number; to: number } | null>(null);
  const [intro, setIntro] = useState(false);

  const entry = entries[Math.min(index, entries.length - 1)];
  const exposure = useMemo(() => exposureAt(data, g, entry.at), [data, g, entry]);
  const collapsed = useMemo(
    () => collapse(g, target !== null ? [target] : chainDropTargets(data, g)),
    [data, g, target],
  );
  const L = useMemo(() => layout(g, collapsed), [g, collapsed]);
  const hasMalicious = (pkg: string) => Boolean(data.malicious[pkg]);

  // The URL follows the state, so any instant can be shared.
  useEffect(() => {
    const url = href(caso, entry.id, target !== null ? g.preset.nodes[target] : undefined);
    if (window.location.search !== url) window.history.replaceState(null, '', url);
  }, [caso, entry.id, target, g]);

  const goEntry = (i: number) => {
    setMove({ from: index, to: i });
    setIndex(i);
  };
  const goPreset = (id: string) => {
    if (id === caso) return;
    const ng = graphs.get(id)!;
    setCaso(id);
    setIndex(defaultEntry(morning(data, ng)));
    setTarget(null);
    setPicked(null);
    setMove(null);
    setIntro(true);
  };
  const goTarget = (n: number | null) => {
    setTarget(n);
    setPicked(null);
    setMove(null);
  };

  const whatIf = target !== null;
  const mode: ChartMode = whatIf ? { kind: 'whatif', target } : { kind: 'chaindrop', exposure };
  const heading = whatIf ? whatIfHeadline(g, target, collapsed) : headline(data, g, entries, index, exposure);
  const qual = whatIf
    ? `hipótese, no grafo do ${g.preset.root.name} coletado em ${dateBr(data.fetchedAt)}`
    : qualifier(entries, index);
  const clock = entry.kind === 'removal' ? `~${clockOf(entry.at).slice(0, 5)}` : clockOf(entry.at);

  // Gates that hold: a forward single step onto a version its range refuses.
  const holding = new Set<number>();
  if (!whatIf && move && move.to === move.from + 1 && entry.kind === 'publish' && entry.verdict.kind === 'barred') {
    for (const e of collapsed.edges) if (g.names[g.preset.edges[e][1]] === entry.pkg) holding.add(e);
  }

  const headText = heading.map((p) => p.v).join('');
  const pathNames = collapsed.nodes.filter((n) => n > 0).map((n) => g.names[n]);
  const barredEdges = whatIf ? [] : collapsed.edges.filter((e) => exposure.edges[e] === 'barred');
  const desc = whatIf
    ? `Hipótese: caminhos de ${g.preset.root.name} até ${g.names[target]}: ${pathNames.join(', ')}.`
    : `${clock} UTC. Caminho: ${g.preset.root.name} → ${pathNames.join(' → ')}; ${
        exposure.reached.length ? `${exposure.reached.length} infectados alcançáveis` : 'nenhum infectado alcançável'
      }${barredEdges.length ? `; ${barredEdges.length} ${barredEdges.length === 1 ? 'aresta barrada' : 'arestas barradas'} pela faixa` : ''}.`;

  const tabSub = (id: string) => {
    const gg = graphs.get(id)!;
    const es = morning(data, gg);
    const last = exposureAt(data, gg, es.at(-1)!.at);
    if (last.reached.length === 0) return 'NENHUM CAMINHO';
    if (last.reached.length === 1) return `${last.nearest} ${saltos(last.nearest!).toUpperCase()}`;
    // "até": the count by the end of the morning, which the headline reaches only at the last publish.
    return `ATÉ ${last.reached.length} INFECTADOS`;
  };

  const selected = hover ?? picked;
  const live = whatIf ? `Hipótese: ${headText}` : liveLine(g, entry);

  return (
    <div className={s.sheet} data-live={move || intro || whatIf ? '' : undefined}>
      <header className={s.masthead}>
        <span className={s.mark}>Raio de explosão</span>
        <span className={s.stamp}>
          04·08·2026 <span className={s.clockDigits}>{clock}</span> UTC
        </span>
      </header>

      <div className={s.grid}>
        <div className={s.head}>
          <h1 key={headText} className={s.headline}>
            <Sentence pieces={heading} />
          </h1>
          <p className={s.qualifier}>{qual}</p>
        </div>

        <p className={s.deck}>
          {whatIf ? (
            <>
              Nenhum pacote aqui foi comprometido: é o grafo real do <code>{g.preset.root.name}</code> com{' '}
              <code>{g.names[target]}</code> no lugar do alvo. O mesmo vale para o próximo incidente.
            </>
          ) : (
            DECK[caso]
          )}
        </p>

        <nav className={s.tabs} aria-label="Casos">
          {data.presets.map((p) => (
            <StateLink
              key={p.id}
              to={href(p.id)}
              onGo={() => goPreset(p.id)}
              className={s.tab}
              aria-current={p.id === caso ? 'true' : undefined}
            >
              <span className={s.tabName}>
                <code>{p.root.name}</code>
                <span className={s.tabVersion}> {p.root.version}</span>
              </span>
              <span className={s.tabSub}>{tabSub(p.id)}</span>
            </StateLink>
          ))}
        </nav>

        <div className={s.chartCol}>
          <div className={s.sticky}>
            <ZoneChart
              key={caso}
              g={g}
              L={L}
              c={collapsed}
              mode={mode}
              hasMalicious={hasMalicious}
              selected={selected}
              holding={holding}
              stepKey={entry.id}
              intro={intro}
              title={headText}
              desc={desc}
              fetchedAt={dateBr(data.fetchedAt)}
              onPick={(n) => goTarget(n === target ? null : n)}
              onHover={setHover}
            />
            <div className={s.stepper} aria-disabled={whatIf || undefined}>
              {index > 0 && !whatIf ? (
                <StateLink to={href(caso, entries[index - 1].id)} onGo={() => goEntry(index - 1)} className={s.stepBtn}>
                  ◂ Anterior
                </StateLink>
              ) : (
                <span className={s.stepBtn} aria-disabled="true">
                  ◂ Anterior
                </span>
              )}
              <span className={s.stepClock}>
                <span className={s.clockDigits}>{clock}</span> <span className={s.utc}>UTC</span>
              </span>
              {index < entries.length - 1 && !whatIf ? (
                <StateLink
                  to={href(caso, entries[index + 1].id)}
                  onGo={() => goEntry(index + 1)}
                  className={`${s.stepBtn} ${s.stepNext}`}
                >
                  <span>
                    Próximo<span className={s.long}>{' '}evento</span> ▸
                  </span>
                </StateLink>
              ) : (
                <span className={`${s.stepBtn} ${s.stepNext}`} aria-disabled="true">
                  <span>
                    Próximo<span className={s.long}>{' '}evento</span> ▸
                  </span>
                </span>
              )}
            </div>
            <p className={s.live} aria-live="polite">
              {live}
            </p>
          </div>
        </div>

        <section className={s.logSection} aria-labelledby="manha">
          <h2 id="manha" className={s.label}>
            A manhã de 4 de agosto
          </h2>
          {whatIf && <p className={s.note}>O horário só vale para o ChainDrop.</p>}
          <ol className={s.log} data-disabled={whatIf || undefined}>
            {entries.map((e, i) => (
              <li key={e.id}>
                <LogRow
                  e={e}
                  current={i === index}
                  after={i > index}
                  disabled={whatIf}
                  to={href(caso, e.id)}
                  onGo={() => goEntry(i)}
                />
              </li>
            ))}
          </ol>
        </section>

        <Ledger
          data={data}
          g={g}
          collapsed={collapsed}
          L={L}
          exposure={exposure}
          at={entry.at}
          target={target}
          selected={selected}
          onSelect={(n) => setPicked(n === picked ? null : n)}
          onHover={setHover}
        />

        <WhatIf g={g} target={target} onTarget={goTarget} />
      </div>
    </div>
  );
}

function LogRow({
  e,
  current,
  after,
  disabled,
  to,
  onGo,
}: {
  e: Entry;
  current: boolean;
  after: boolean;
  disabled: boolean;
  to: string;
  onGo: () => void;
}) {
  let glyph: 'open' | 'shut' | 'muted' = 'muted';
  let name: ReactNode;
  let verdict: ReactNode;
  let time = clockOf(e.at);
  if (e.kind === 'start') {
    name = <span className={s.logProse}>nenhuma versão publicada</span>;
    verdict = <span className={s.vMuted}>antes do primeiro evento</span>;
  } else if (e.kind === 'removal') {
    time = `~${time.slice(0, 5)}`;
    name = <span className={s.logProse}>remoção começa (StepSecurity)</span>;
    verdict = <span className={s.vMuted}>grafo sem mudança</span>;
  } else {
    name = (
      <code className={s.logName}>
        {e.pkg}@<wbr />
        {e.version}
      </code>
    );
    if (e.verdict.kind === 'open') {
      glyph = 'open';
      verdict = (
        <span className={s.vOpen}>
          abre {e.verdict.hops} {saltos(e.verdict.hops)}
        </span>
      );
    } else if (e.verdict.kind === 'barred') {
      glyph = 'shut';
      verdict = (
        <span className={s.vMuted}>
          barrado · <code className={s.vRange}>{e.verdict.range}</code>
        </span>
      );
    } else {
      verdict = <span className={s.vMuted}>sem efeito</span>;
    }
  }
  const body = (
    <>
      <GateGlyph state={after ? 'muted' : glyph} />
      <span className={s.logTime}>{time}</span>
      <span className={s.logWhat}>{name}</span>
      <span className={s.logVerdict}>{verdict}</span>
    </>
  );
  const cls = `${s.logRow} ${e.kind === 'removal' ? s.logRemoval : ''}`;
  if (disabled) {
    return (
      <span className={cls} data-after={after || undefined} aria-disabled="true">
        {body}
      </span>
    );
  }
  return (
    <StateLink
      to={to}
      onGo={onGo}
      className={cls}
      data-after={after || undefined}
      aria-current={current ? 'step' : undefined}
    >
      {body}
    </StateLink>
  );
}

function Ledger({
  data,
  g,
  collapsed,
  L,
  exposure,
  at,
  target,
  selected,
  onSelect,
  onHover,
}: {
  at: string;
  data: RaioData;
  g: ReturnType<typeof buildGraph>;
  collapsed: ReturnType<typeof collapse>;
  L: ReturnType<typeof layout>;
  exposure: ReturnType<typeof exposureAt>;
  target: number | null;
  selected: number | null;
  onSelect: (n: number) => void;
  onHover: (n: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const whatIf = target !== null;
  const edges = g.preset.edges;
  const isBarredNode = (n: number) => {
    if (whatIf || !data.malicious[g.names[n]]) return false;
    const into = collapsed.edges.filter((e) => edges[e][1] === n);
    return into.length > 0 && into.every((e) => exposure.edges[e] === 'barred');
  };
  const doors = L.sectors.filter((sec) => sec.door >= 0);
  const barred = whatIf ? [] : collapsed.edges.filter((e) => exposure.edges[e] === 'barred');
  const osvLink = (id: string | null) =>
    id ? (
      <a className={s.osv} href={`https://osv.dev/vulnerability/${id}`} rel="noreferrer" target="_blank">
        {id} ↗
      </a>
    ) : null;

  const row = (n: number) => {
    const tree = L.treeEdge.get(n);
    const req = tree !== undefined ? edges[tree][2] : '';
    const st = tree !== undefined ? exposure.edges[tree] : 'none';
    const hit = exposure.resolved.get(n);
    let line: ReactNode;
    let spine = 'neutral';
    if (whatIf) {
      spine = 'open';
      line = n === target ? <span className={s.vOpen}>{req} · alvo hipotético</span> : <span>{req} · no caminho</span>;
    } else if (hit) {
      spine = 'open';
      line = (
        <span className={s.vOpen}>
          {req} · aceitava {hit.version} · publicada {clockOf(hit.publishedAt)} UTC
        </span>
      );
    } else if (st === 'not-yet') {
      line = <span>{req} · nenhuma versão maliciosa publicada ainda</span>;
    } else {
      line = <span>{req} · sem versão do ChainDrop</span>;
    }
    const version = hit ? hit.version : g.versions[n];
    return (
      <li key={n}>
        <button
          type="button"
          className={s.ledgerRow}
          data-spine={spine}
          aria-pressed={selected === n}
          onClick={() => onSelect(n)}
          onMouseEnter={() => onHover(n)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(n)}
          onBlur={() => onHover(null)}
        >
          <span className={s.hop}>{L.place.get(n)!.ring}</span>
          <span className={s.ledgerBody}>
            <code className={s.ledgerName}>
              {g.names[n]}@<wbr />
              {version}
            </code>
            <span className={s.ledgerLine}>{line}</span>
          </span>
        </button>
        {hit && <span className={s.ledgerLink}>{osvLink(hit.osv)}</span>}
      </li>
    );
  };

  const more = target !== null ? (collapsed.more.get(target) ?? 0) : 0;
  return (
    <section className={s.ledger} aria-labelledby="caminho">
      <h2 id="caminho" className={s.label}>
        Caminho
      </h2>
      {doors.length === 0 && <p className={s.note}>Nenhum pacote do ChainDrop no grafo deste caso.</p>}
      {doors.map((sec) => {
        const nodes = collapsed.nodes.filter((n) => n > 0 && g.door[n] === sec.door && !isBarredNode(n));
        if (nodes.length === 0) return null;
        return (
          <div key={sec.door} className={s.door}>
            <p className={s.doorName}>
              porta de entrada: <code>{g.names[sec.door]}</code>, dependência direta
            </p>
            <ol className={s.ledgerList}>{nodes.map(row)}</ol>
          </div>
        );
      })}
      {more > 0 && (
        <p className={s.note}>
          <button type="button" className={s.textBtn} onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
            + {more} caminhos para <code>{g.names[target!]}</code>
          </button>
          {expanded && ' (mais longos; o gráfico mostra os 5 mais curtos)'}
        </p>
      )}
      {barred.length > 0 && (
        <div className={s.door}>
          <h3 className={s.label}>Barrados pela faixa</h3>
          <ol className={s.ledgerList}>
            {barred.map((e) => {
              const [from, to, req] = edges[e];
              const out = (data.malicious[g.names[to]] ?? []).filter(
                (m) => Date.parse(m.publishedAt) <= Date.parse(at),
              );
              return (
                <li key={e}>
                  <button
                    type="button"
                    className={s.ledgerRow}
                    data-spine="barred"
                    aria-pressed={selected === to}
                    onClick={() => onSelect(to)}
                    onMouseEnter={() => onHover(to)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(to)}
                    onBlur={() => onHover(null)}
                  >
                    <span className={s.hop}>{L.place.get(to)!.ring}</span>
                    <span className={s.ledgerBody}>
                      <code className={s.ledgerName}>
                        {g.names[to]}@<wbr />
                        {g.versions[to]}
                      </code>
                      <span className={s.ledgerLine}>
                        <span>
                          vindo de <code>{g.names[from]}</code>: {req} · barrado: não aceita{' '}
                          {out.map((m) => m.version).join(', ')}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}

function WhatIf({
  g,
  target,
  onTarget,
}: {
  g: ReturnType<typeof buildGraph>;
  target: number | null;
  onTarget: (n: number | null) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const options = useMemo(
    () =>
      g.preset.nodes
        .map((node, n) => ({ n, node, name: g.names[n], depth: g.depth[n] }))
        .filter((o) => o.n > 0 && Number.isFinite(o.depth))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [g],
  );
  const q = query.trim().toLowerCase();
  const results = q
    ? [
        ...options.filter((o) => o.name.toLowerCase().startsWith(q)),
        ...options.filter((o) => !o.name.toLowerCase().startsWith(q) && o.name.toLowerCase().includes(q)),
      ].slice(0, 6)
    : [];
  const choose = (n: number) => {
    onTarget(n);
    setQuery('');
    setOpen(false);
  };

  return (
    <section className={s.whatif} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={s.label}>
        E se fosse outro pacote
      </h2>
      <p className={s.body}>
        Sem lista de maliciosos: escolha qualquer um dos {options.length} pacotes do grafo do{' '}
        <code>{g.preset.root.name}</code> e veja todos os caminhos até ele. Tocar num pacote do gráfico faz o mesmo.
      </p>
      <div className={s.combo}>
        <label htmlFor={`${id}-in`} className={s.srOnly}>
          Pacote do grafo
        </label>
        <input
          ref={input}
          id={`${id}-in`}
          className={s.comboInput}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${id}-o${results[active].n}` : undefined}
          placeholder="nome do pacote, ex.: keyv"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && results[active]) {
              e.preventDefault();
              choose(results[active].n);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
        {open && results.length > 0 && (
          <ul id={`${id}-list`} role="listbox" className={s.listbox}>
            {results.map((o, i) => (
              <li
                key={o.n}
                id={`${id}-o${o.n}`}
                role="option"
                aria-selected={i === active}
                className={s.option}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o.n);
                }}
              >
                <code>{o.node}</code>
                <span className={s.optionHop}>
                  {o.depth} {saltos(o.depth)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {open && q && results.length === 0 && (
          <p className={s.note}>Nenhum pacote com esse nome no grafo do {g.preset.root.name}.</p>
        )}
      </div>
      {target !== null && (
        <button type="button" className={s.textBtn} onClick={() => onTarget(null)}>
          Voltar ao ChainDrop
        </button>
      )}
    </section>
  );
}
