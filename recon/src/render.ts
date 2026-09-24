import type { Dossier, Finding } from './dossier/schema.ts';

/**
 * The readable dossier. Agents never write this file; it is rendered from the
 * JSON, which is the state (ADR-0001).
 */

const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function findingLine(f: Finding): string {
  let perishable = '';
  if (f.perishable) {
    const recheck = f.lastRecheck
      ? `re-check ${f.lastRecheck.at.slice(0, 16)} ${f.lastRecheck.held ? 'ok' : 'FALHOU'}`
      : 'sem re-check';
    perishable = ` · perecível · ${recheck}`;
  }
  return (
    `- **${f.status}** \`${f.id}\` — ${f.claim}  \n` +
    `  _${f.evidence}_ · [fonte](${f.sourceUrl}) · ${f.observedAt.slice(0, 16)}${perishable}`
  );
}

export function renderDossier(d: Dossier): string {
  const out: string[] = [];
  const push = (...lines: string[]) => out.push(...lines);

  push(`# Dossiê — ${d.company}`, '');
  const anchor = `${d.anchor.kind === 'cnpj' ? 'CNPJ ' : ''}${d.anchor.value}`;
  push(`Âncora: **${anchor}** · ${d.anchor.primaryDomain} · fase **${d.phase}**`, '');

  if (d.approach) {
    const a = d.approach;
    const contact = d.contacts.find((c) => c.id === a.contactId);
    push('## Assunto', '', `**${a.subject}**`, '', ...a.alternateSubjects.map((s) => `- ${s}`), '');
    push('## Corpo', '');
    if (contact) push(`Para **${contact.name}** (${contact.role}) · abre com: ${a.opensWith}`, '');
    push('```', a.body, '```', '');
  }

  if (d.brief) {
    const brief = d.brief;
    const s = d.solutions.find((x) => x.id === brief.solutionId);
    push('## Brief de construção', '');
    push(`**${s?.title ?? brief.solutionId}** → \`labs.teamdbsolutions.com/${brief.labsSlug}\``, '');
    push(
      `Escolhida ${brief.chosenAt.slice(0, 10)} · ${brief.estimateHours}h · expira ${brief.expiresAt.slice(0, 10)}`,
      '',
    );
    push(...brief.doneCriteria.map((c) => `- [ ] ${c}`), '');
  }

  if (d.solutions.length > 0) {
    push('## Soluções', '');
    for (const s of [...d.solutions].sort((a, b) => a.rank - b.rank)) {
      push(`### ${s.rank}. ${s.title}`, '', s.whatItDoes, '');
      push(`Problemas: ${s.problemIds.join(', ')} · impacto ${s.impact}/5 · ${s.estimateHours}h  `);
      push(`Dados públicos: ${s.publicData.join('; ')}  `);
      if (s.precedentAccomplishmentIds.length) {
        push(`Precedente no Corpus: ${s.precedentAccomplishmentIds.join(', ')}`);
      }
      if (s.critique) {
        const c = s.critique;
        const scores =
          `dor ${c.scores.realPain} · específica ${c.scores.specific} · ` +
          `plausível ${c.scores.plausible} · fora do óbvio ${c.scores.nonObvious}`;
        push(
          '',
          `**Crítica (${c.asRegister}, tentativa ${c.attempt}): ${c.verdict.toUpperCase()}** — ${scores}${c.isHygiene ? ' · higiene' : ''}`,
          `- Clicaria: ${c.wouldClick}`,
          `- Ignoraria: ${c.wouldIgnore}`,
        );
      }
      push('');
    }
    if (d.beyondCeiling.length) {
      push('**Além do teto (para a conversa):**', '');
      push(...d.beyondCeiling.map((b) => `- ${b.title} (${b.estimateHours}h) — ${b.why}`), '');
    }
  }

  if (d.problems.length > 0) {
    push('## Problemas', '');
    for (const p of d.problems) {
      let line = `- \`${p.id}\` [${p.stage} · ${p.lens}] ${p.statement}  \n  Impacto: ${p.revenueImpact}`;
      if (p.felt) line += ` · sentido pelo cliente: ${p.felt}`;
      line += `  \n  Evidência: ${p.findingIds.join(', ')}`;
      if (p.competitor) line += `  \n  ${p.competitor.name} faz melhor: ${p.competitor.doesBetter}`;
      push(line);
    }
    push('');
  }

  push('## Portas de entrada', '');
  if (d.doors.length === 0) push('Nenhuma.');
  for (const door of d.doors) {
    push(
      door.kind === 'pull-request'
        ? `- \`${door.id}\` PR em ${door.repo} — ${door.problemReached}`
        : `- \`${door.id}\` Desafio: ${door.scope} ↔ ${door.accomplishmentIds.join(', ')}`,
    );
  }
  push('');

  push('## Contatos', '');
  if (d.contacts.length === 0) push('Nenhum.');
  else push('| Nome | Papel | Registro | Decisor | Canais |', '|---|---|---|---|---|');
  for (const c of d.contacts) {
    const channels = c.channels
      .map((ch) => {
        const status = d.findings.find((f) => f.id === ch.findingId)?.status ?? '?';
        return `${ch.kind}: ${ch.value} (${status})`;
      })
      .join('<br>');
    push(`| ${cell(c.name)} | ${cell(c.role)} | ${c.register} | ${c.isDecider ? 'sim' : ''} | ${channels} |`);
  }
  push('');

  push('## Achados', '', ...d.findings.map(findingLine), '');

  if (d.traps.length) {
    push('## Armadilhas', '');
    push(...d.traps.map((t) => `- **${t.surface}** pertence a ${t.belongsTo} — ${t.howRuledOut}`), '');
  }

  const perishable = d.findings.filter((f) => f.perishable);
  if (perishable.length) {
    push('## Re-verificação', '', `\`npm run recon -- recheck ${d.slug}\` imediatamente antes de enviar.`, '');
    push(...perishable.map((f) => `- \`${f.id}\` — ${f.claim}`), '');
  }

  return out.join('\n');
}
