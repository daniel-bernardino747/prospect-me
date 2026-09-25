# prospect-me

Prospecção direta: investigar uma empresa, construir algo para ela e só então abordar quem decide. Repo público; os dossiês nunca entram no git. Ver `docs/adr/0001-an-approach-leads-with-something-built-for-them.md`.

## Estrutura

- `recon/` — CLI (TypeScript + Vitest) e dossiês. Nunca é deployado. `recon/dossiers/` e `recon/legacy/` são gitignored: guardam contato de terceiros.
- `labs/` — app Next.js único em `labs.teamdbsolutions.com/<slug>`, serviço próprio no Railway. Só ele vai para um builder. Toda requisição passa por `src/app/[slug]/page.tsx`, que aplica as regras do ADR (404 fora do registro, encerrado após `expiresAt`, banner); um artefato existe só se está em `src/artifacts/index.ts`, com o `labsSlug` e o `expiresAt` do brief.
  - O serviço do Railway está em `.railway/railway.ts` (build, start, domínio, `PORT` e `HOSTNAME=::`). Mudança lá: `railway config plan`, depois `apply`.
  - O `data.json` de um artefato é lido uma vez e fica em memória (`load.ts`): depois de regerar os dados, reinicie o `labs dev`, senão a página continua servindo a versão anterior.

## Corpus

Vem do `personal-website` pelo contrato `npm run corpus:json` (ADR-0011 de lá), nunca parseando o markdown aqui. `CORPUS_REPO` no `.env` aponta o checkout; o padrão é o diretório irmão.

## Comandos

```bash
npm test                              # todos os workspaces
npm run recon -- validate <slug>      # schema + referências + ids do Corpus
npm run recon -- recheck <slug>       # re-executa os achados perecíveis
npm run recon -- render <slug>        # dossiers/<slug>.md a partir do JSON
npm run labs -- dev                   # labs em localhost:3000
```

## Skills

### Prospect-me

Empresa-alvo → âncora → contato, portas de entrada e problemas em paralelo → 3 soluções → crítico → Daniel escolhe o que construir. Depois do artefato no ar: re-check e e-mail. Todo achado CONFIRMADO ou INFERIDO; nada inferido entra no e-mail. See `.claude/skills/prospect-me/SKILL.md`.
