# bot-whatsapp-ia-vs-jev — brief

Showcase em `/demo/bot-whatsapp-ia-vs-jev` (ADR-0002). É uma demo conceitual de Daniel Bernardino, sem cliente e sem empresa. Os dados vêm do repositório público [zap-bench](https://github.com/daniel-bernardino747/zap-bench): um bot de WhatsApp para uma **clínica odontológica fictícia**, construído cinco vezes (três LLMs, o Jev com templates e o Jev com um LLM que só reescreve a mensagem, ADR-0011 do zap-bench) e medido sobre as mesmas conversas. Toda afirmação é marcada **CONFIRMADO** (vista no zap-bench ou na fonte) ou **INFERIDO**.

## Pergunta e resposta da primeira tela

**Pergunta:** "Para o atendimento de WhatsApp de uma clínica, vale pôr um LLM (Claude, GPT) para conversar, ou um classificador que só escolhe entre opções (Jev) e responde por templates?"

**A resposta é gerada dos dados no build, não escrita à mão.** Base: a rodada da `validation`, com o paciente difícil (escreve errado, sem paciência). Modelo:

> Com um paciente que escreve errado e não tem paciência, o **{melhor LLM}** resolveu **{x}%** dos casos e o **Jev**, **{y}%**. Com a mesma camada de segurança nos dois, a diferença {cai para | sobe para | fica em} **{z} pontos**.

Se o Jev passar o melhor LLM, a frase se inverte. Os números entram arredondados, sempre com o n ao lado ("em 26 casos"). **INFERIDO** que essa é a notícia: a pergunta que o mercado faz é "LLM ou não", e a resposta honesta depende de quanto a camada de segurança (confirmação por código, filtro de fatos) fecha da distância.

Logo abaixo da frase vem a **matriz**: 5 cérebros × {sem guardrails, com guardrails} × {paciente padrão, paciente difícil}, com o acerto em cada célula. É a figura principal. Ela mostra duas coisas de uma vez: quanto cada cérebro piora com o paciente difícil, e quanto os guardrails recuperam.

## Usuário e momento

**Primário (INFERIDO):** quem vai construir ou contratar um bot de atendimento de WhatsApp para um pequeno negócio no Brasil (clínica, consultório, salão). Pode ser dev, fundador de SaaS ou agência de automação. Está decidindo entre "pôr um GPT/Claude com ferramentas" e algo mais determinístico, e já ouviu falar de bot que inventa preço ou que é manipulado. Lê no celular, a partir de um link em grupo de WhatsApp ou LinkedIn, e depois no desktop para abrir as conversas.

**Momento:** antes de escolher a arquitetura, ou depois do primeiro incidente ("o bot disse que parcelamos em 12x"). Quer saber, em dois minutos, quanto cada abordagem erra, **onde** erra, e quanto custa por conversa.

**Decisão que toma:** LLM, classificador ou os dois; e se a camada de segurança em código é obrigatória. A página não decide por ele: mostra onde cada um quebra.

**Secundário:** o visitante do portfólio de Daniel, que quer ver uma avaliação honesta e reproduzível.

## Dados

### 1. zap-bench, rodada da `validation`, via `npm run bench -- export`

- **Formato:** `data.json` validado pelo contrato `src/export/schema.ts` do zap-bench. Contém:
  - resumo por cérebro × modo × persona;
  - acerto por tarefa;
  - violações por tipo;
  - mensagens do bot por conversa, chamadas de função por execução, latência p50/p95 e custo por conversa;
  - uma transcrição por cenário × cérebro × modo × persona. **CONFIRMADO.**
- **Tamanho:** 75 KB com um cérebro e uma execução. Com quatro cérebros, cerca de 300 KB. **CONFIRMADO / INFERIDO.**
- **Buscar uma vez:** `scripts/bot-whatsapp-ia-vs-jev.ts` chama o export do zap-bench no diretório vizinho (`ZAPBENCH_REPO`, padrão `../zap-bench`, como o `CORPUS_REPO`) e grava o `data.json`. A página nunca chama API. **INFERIDO** que o padrão do corpus serve aqui.
- **Só `validation`:** prompts e regras do Jev foram ajustados olhando só o `dev` (ADR-0002 do zap-bench). O export recusa outra rodada. **CONFIRMADO.**
- **`synthetic`:** uma rodada com o cérebro falso ou com o paciente por regras sai marcada. A página mostra uma faixa "DADOS DE TESTE" e responde 404 em produção. **CONFIRMADO** no export; a trava da página é deste build.

### O que os dados não dão (e a página diz)

- Pacientes reais. O paciente é simulado por um modelo de fora da comparação, e o id dele aparece na página.
- Mais de uma clínica, ou outro segmento. A clínica é fictícia.
- Significância estatística. São 20 cenários de uma fala e 6 conversas, × 3 execuções × 2 personas. A página mostra o n e não usa casa decimal.
- Naturalidade do texto. O juiz ainda não existe, e a coluna aparece como "pendente".
- Custo do produto (mensalidade, WhatsApp). Isso é interno e não aparece (ADR-0005 do zap-bench).
- Versões futuras dos modelos. Cada rodada tem data e id de modelo.

## Escopo

### Uma página, phone-first; no desktop, em colunas

1. **Frase** gerada dos dados + **matriz** 4 × 2 × 2.
2. **Onde cada um erra:** acerto por tarefa (dúvidas, emergência, adversariais, datas, políticas, mídia, agendar, remarcar, cancelar, handoff).
3. **O que saiu errado para o paciente:** violações por tipo (fato sem lastro, ação dita e não feita, termo proibido) e ações feitas sem confirmação, geradas × enviadas. A diferença entre as duas é o que os guardrails barraram.
4. **Custo da conversa:** mensagens do bot, chamadas de função, latência e US$ por conversa.
5. **As conversas:** escolhe-se um cenário (`?cenario=`, `?persona=`, `?modo=`) e aparecem as respostas dos quatro lado a lado. Cada uma mostra as funções chamadas, a resposta barrada pelo guardrail riscada ao lado da que saiu, e a verificação que falhou. Renderizado no servidor, sem mandar todas as transcrições ao navegador.
6. **Método:**
   - clínica fictícia;
   - como o paciente difícil escreve;
   - ids de modelo, data da rodada e só `validation`;
   - regra de "todo fato sai de uma função";
   - link para o repositório.

### Estados

- **`synthetic: true`:** faixa "DADOS DE TESTE: cérebro falso, sem IA" no topo e em cada seção; 404 em produção.
- **Cérebro que não rodou** (sem chave): a coluna aparece com "não rodou nesta rodada", sem zero.
- **Juiz pendente:** a coluna de naturalidade some, e o método explica por quê.
- **Sem JavaScript:** tudo renderiza no servidor; a troca de cenário é por link.

### Cortado

- Demo ao vivo (ADR-0001 do zap-bench).
- Naturalidade, até o juiz existir.
- Conta de produto e mensalidade.
- Comparação com bots comerciais prontos.

## Riscos

- **Parecer publicidade de um lado.** A frase se inverte conforme os dados, sem nota geral. O custo de construção de cada cérebro (linhas de código, templates do Jev) aparece no método.
- **n pequeno lido como verdade geral.** Mostrar o n em toda figura. Nenhuma casa decimal.
- **Modelos mudam.** Data e id de modelo no topo, não só no rodapé.
- **Marca.** Nomes de modelo e da TypeSafe aparecem como dado, sem logo nem cor de marca.
- **Transcrição com texto ofensivo** (cenário adversarial em que um cérebro repete a ofensa). Mostrar mesmo assim, porque é o resultado, mas com a verificação que falhou ao lado.
