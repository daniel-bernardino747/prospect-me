# prospect-me

Prospecção direta: investigar uma empresa, construir algo para ela e só então abordar quem decide. Repo público; os dossiês nunca entram no git. Ver `docs/adr/0001-an-approach-leads-with-something-built-for-them.md`; o `labs` também serve demos de portfólio (`docs/adr/0002-labs-also-serves-portfolio-showcases.md`).

## Estrutura

- `recon/` — CLI (TypeScript + Vitest) e dossiês. Nunca é deployado. `recon/dossiers/` e `recon/legacy/` são gitignored: guardam contato de terceiros.
- `labs/` — app Next.js único em `labs.teamdbsolutions.com`, serviço próprio no Railway. Só ele vai para um builder. Um artefato existe só se está em `src/artifacts/index.ts`, e o caminho carrega o tipo (ADR-0002):
  - **prospect** em `/<slug>`, por `src/app/[slug]/page.tsx`, que aplica as regras do ADR-0001 (404 fora do registro, encerrado após `expiresAt`, banner, `noindex`), com o `labsSlug` e o `expiresAt` do brief.
  - **showcase** em `/demo/<slug>`, por `src/app/demo/[slug]/page.tsx`: demo de portfólio sem empresa, sem fim, indexado e no sitemap; `PRODUCT.md` e `DESIGN.md` próprios na pasta do artefato.
  - **home** em `/`, por `src/app/page.tsx`: lista só os showcases (`listShowcases`) e aponta para `www.teamdbsolutions.com`. Prospect nunca entra nela.
  - O serviço do Railway está em `.railway/railway.ts` (build, start, `watchPatterns`, domínio, `PORT` e `HOSTNAME=::`) e é a única config do serviço. Mudança lá: `railway config plan`, depois `apply`, com o CLI global (≥ 5.42.1). A devDependency `railway` é só o SDK que o `railway.ts` importa: `npx railway` roda o SDK, não o CLI, e falha.
  - O `data.json` de um artefato é lido uma vez e fica em memória (`load.ts`): depois de regerar os dados, reinicie o `labs dev`, senão a página continua servindo a versão anterior.

## Corpus

Vem do repo privado `career` pelo contrato `npm run corpus:json` (ADRs 0011 e 0013 do `personal-website`), nunca parseando o markdown aqui. `CORPUS_REPO` no `.env` aponta o checkout; o padrão é o diretório irmão `../career`.

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
