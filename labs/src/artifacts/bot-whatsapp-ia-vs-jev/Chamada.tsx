import {
  type BotData,
  checkLabel,
  guiches,
  MODE_LABEL,
  neighbors,
  PERSONA_LABEL,
  type Query,
  queryString,
  ranModes,
  ranPersonas,
  tickets,
  transcriptFor,
  type Turn,
} from './data';
import s from './painel.module.css';

function Switch<T extends string>({ label, options, current, href }: { label: string; options: [T, string][]; current: T; href: (v: T) => string }) {
  return (
    <div className={s.switch} role="group" aria-label={label}>
      <span className={s.switchLabel}>{label}</span>
      {options.map(([value, text]) => (
        <a key={value} href={href(value)} className={s.switchOption} aria-current={value === current ? 'true' : undefined}>
          {text}
        </a>
      ))}
    </div>
  );
}

function Line({ t }: { t: Turn }) {
  if (t.role === 'funcao') {
    const [call, outcome] = t.text.split(' → ');
    return (
      <li className={`${s.call} ${t.ok ? s.callOk : s.callFail}`}>
        <span className={s.callDot} aria-hidden="true" />
        <code>{call}</code>
        <span className={s.callOutcome}>{t.ok ? 'ok' : outcome}</span>
      </li>
    );
  }
  if (t.role === 'recepcao') {
    return (
      <li className={s.reception}>
        <span className={s.lineWho}>Recepção assumiu</span>
        {t.text}
      </li>
    );
  }
  if (t.role === 'paciente') {
    return (
      <li className={s.patient}>
        <span className={s.lineWho}>Paciente</span>
        {t.text}
      </li>
    );
  }
  if (t.discarded) {
    return (
      <li className={s.botBarred}>
        <span className={s.lineWho}>Descartada: a recepção já tinha assumido</span>
        <del>{t.text}</del>
      </li>
    );
  }
  if (t.original !== undefined) {
    return (
      <li className={s.botBarred}>
        <span className={s.lineWho}>Barrada pelo guardrail</span>
        <del>{t.original}</del>
        <span className={s.botSent}>
          <span className={s.lineWho}>Saiu no lugar</span>
          {t.text}
        </span>
      </li>
    );
  }
  return (
    <li className={s.bot}>
      <span className={s.lineWho}>Atendente</span>
      {t.text}
    </li>
  );
}

/** The signature: one ticket called, every window answering the same patient side by side. */
export function Chamada({ data, q }: { data: BotData; q: Query }) {
  const { prev, next, current } = neighbors(data, q.scenario);
  const list = tickets(data);
  const windows = guiches(data);
  const task = data.tasks.find((t) => t.id === current.tarefa);

  return (
    <section id="chamada" className={s.chamada} aria-labelledby="chamada-titulo">
      <h2 id="chamada-titulo" className={s.h2}>
        As conversas, senha por senha
      </h2>
      <p className={s.lede}>
        Chame uma senha e leia o que cada atendente respondeu ao mesmo paciente: as funções que chamou, o que foi barrado e a
        verificação que falhou.
      </p>

      <div className={s.caller}>
        <div className={s.callerLed} key={`${current.id}-${q.persona}-${q.mode}`} aria-live="polite">
          <span className={s.callerLedLabel}>Senha</span>
          <span className={s.callerLedCode}>{current.code}</span>
          <span className={s.callerLedLabel}>{windows.length === 1 ? 'guichê 1' : `guichês 1 a ${windows.length}`}</span>
        </div>

        <div className={s.dispenser}>
          <div className={s.slot} aria-hidden="true" />
          <article className={s.ticket} key={current.id}>
            <p className={s.ticketQueue}>
              Fila {task?.label ?? current.tarefa} · {current.kind === 'conversa' ? 'conversa' : 'uma mensagem'}
            </p>
            <p className={s.ticketCode}>{current.code}</p>
            <p className={s.ticketText}>{current.title}</p>
            <p className={s.ticketFoot}>
              {PERSONA_LABEL[q.persona]} · {MODE_LABEL[q.mode]}
            </p>
          </article>
        </div>

        <nav className={s.controls} aria-label="Chamar senha">
          <a className={s.callButton} href={queryString({ ...q, scenario: next.id })}>
            Chamar próxima senha <span>{next.code}</span>
          </a>
          <a className={s.backButton} href={queryString({ ...q, scenario: prev.id })}>
            Senha anterior ({prev.code})
          </a>
          <Switch
            label="Paciente"
            options={ranPersonas(data).map((p) => [p, p === 'padrao' ? 'Padrão' : 'Difícil'])}
            current={q.persona}
            href={(p) => queryString({ ...q, persona: p })}
          />
          <Switch label="Modo" options={ranModes(data).map((m) => [m, MODE_LABEL[m]])} current={q.mode} href={(m) => queryString({ ...q, mode: m })} />
          <details className={s.ticketIndex}>
            <summary>Todas as senhas ({list.length})</summary>
            <ol>
              {list.map((t) => (
                <li key={t.id}>
                  <a href={queryString({ ...q, scenario: t.id })} aria-current={t.id === current.id ? 'true' : undefined}>
                    <span>{t.code}</span> {t.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </nav>
      </div>

      <div className={s.windows} style={{ '--cols': windows.length } as React.CSSProperties}>
        {windows.map((w) => {
          const t = transcriptFor(data, q, w.id);
          return (
            <article key={w.id} className={s.windowCol} aria-label={`Guichê ${w.number}, ${w.label}`}>
              <header className={s.windowHead}>
                <span className={s.windowPlate}>Guichê {w.number}</span>
                <strong>{w.label}</strong>
                {t && <span className={t.passed ? s.statusOk : s.statusFail}>{t.passed ? 'Resolveu' : 'Falhou'}</span>}
              </header>
              {t ? (
                <>
                  <ol className={s.conversation}>
                    {t.turns.map((turn, i) => (
                      <Line key={i} t={turn} />
                    ))}
                  </ol>
                  {t.failedChecks.length > 0 && (
                    <ul className={s.failed} aria-label="Verificações que falharam">
                      {t.failedChecks.map((c) => (
                        <li key={c.id}>
                          <strong>{checkLabel(c.id)}</strong>
                          {c.detail && <span>{c.detail}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className={s.notRunWall}>Não rodou nesta rodada.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
