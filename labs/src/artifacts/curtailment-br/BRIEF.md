# curtailment-br — brief de pesquisa

Showcase em `/demo/curtailment-br`. Demo conceitual de Daniel Bernardino, sem empresa e sem cliente. Pesquisa feita em 2026-09-25; todo número abaixo saiu de requisição feita hoje, e cada achado está marcado **CONFIRMADO** (com a URL) ou **INFERIDO**.

Pergunta do showcase: **onde e quanta energia eólica e solar foi jogada fora no Brasil, e por quê?** Mapa em que cada usina pulsa conforme o corte, com replay de meia em meia hora.

---

## Pergunta e resposta da primeira tela

**Caso padrão: domingo, 16 de agosto de 2026.** Foi o dia com mais corte entre 01/08 e 24/09/2026, o intervalo baixado para este brief (CONFIRMADO, cálculo sobre `restricao_coff_eolica_usi` + `restricao_coff_fotovoltaica`, ago e set/2026).

Texto da primeira tela, antes de qualquer rolagem:

> **Domingo, 16 de agosto de 2026: eólicas e solares deixaram de gerar 400 GWh por ordem do ONS, quase o mesmo tanto que geraram (401 GWh).**
> Às 10h30, 87% do que podiam produzir estava cortado. E 82% do corte do dia foi por sobra de energia no sistema, não por falta de linha.

Números por trás da frase, todos CONFIRMADOS pelos arquivos do ONS de ago/2026:

| Medida (16/08/2026, todo o SIN) | Valor |
|---|---|
| Energia cortada (soma de `val_geracaonaorealizadaapurada` ÷ 2) | 399,9 GWh |
| Energia gerada (`val_geracao` ÷ 2) | 400,6 GWh |
| Geração de referência (o que poderiam gerar) | 817,0 GWh |
| Eólica: corte / % da referência | 292,3 GWh / 44,7% |
| Solar: corte / % da referência | 107,6 GWh / 66,0% |
| Pico do corte: patamar das 10h30 | 40.740 MWmed cortados de 46.686 MWmed possíveis (87%) |
| Razão ENE (energética, "Controle de frequência do SIN") | 330,0 GWh (82,5%) |
| Razão CNF (confiabilidade) / REL (indisponibilidade externa) | 49,6 / 20,3 GWh |
| Subsistema Nordeste | 319,1 GWh (80% do corte) |
| Pontos com corte > 0 no dia | 232 de 234 |

A curva do dia (CONFIRMADO, soma nacional por patamar): cerca de 4,7 GW cortados à meia-noite, 5,1 GW às 6h, 16,8 GW às 7h, 29,1 GW às 8h, 39,8 GW ao meio-dia, 30,2 GW às 15h, 9,4 GW às 17h e 4,7 GW às 18h. É esta a animação que o replay mostra: o corte nasce com o sol e o mapa inteiro se acende entre 8h e 15h.

Por que domingo, 16/08, e não o dia mais recente: é o pior dia do intervalo e cabe numa frase. A semana mais recente completa (14 a 20/09/2026) também foi a pior semana do intervalo, com 1.722,7 GWh cortados (33,9% da referência) (CONFIRMADO). Ela é a segunda opção se o Daniel preferir abrir no dado mais fresco.

Contexto externo que confirma a escala (não entra na página como número nosso):
- O ONS acionou o plano emergencial de redução de geração por excesso de energia no domingo 23/08/2026, pela segunda vez em 2026. A primeira foi em 07/06 (CONFIRMADO, https://www.acessa.com/economia/2026/08/amp/337816-ons-suspende-geracao-excedente-de-energia-pela-segunda-vez-no-ano.html).
- O Plano da Operação Energética 2026-2030 projeta picos de corte de até 40 GW, concentrados entre 7h e 15h e mais fortes aos domingos. É o que o dado de 16/08 mostra (INFERIDO a partir do resumo da busca, que cita XP e movimentoeconomico.com.br; não abri o PEN).
- A Volt Robotics conta 51 dias com corte acima de 60% da geração disponível entre jan e ago/2026. No mesmo período, a média cortada foi 3.853 MWmed, 18,3% acima de 2025 (CONFIRMADO, https://www.pv-magazine-brasil.com/2026/09/16/curtailment-cortes-criticos-de-solar-e-eolica-ocorrem-em-1-a-cada-5-dias-no-brasil/).
- A razão energética foi 67% do corte em 2026 (canalsolar/epowerbay, via busca). Nosso cálculo de ago–set/2026 dá 68,2% (CONFIRMADO o nosso; o deles, INFERIDO via resumo de busca).

---

## Usuário e momento

**Usuário primário: repórter ou editor de economia e energia, numa segunda-feira de manhã, depois de um fim de semana de cortes.** Ele viu no grupo do setor que "o ONS cortou de novo" e tem até o meio da manhã para decidir a pauta.

- **O que abre:** o link da demo, no celular, a caminho da redação ou já na reunião de pauta.
- **O que decide:** qual matéria escrever. Se o corte foi **sobra de energia no país** (razão ENE, "controle de frequência do SIN"), a pauta é demanda baixa, armazenamento e expansão sem consumo. Se foi **linha que não aguentou** (REL/CNF, com a linha nomeada no `dsc_restricao`, como a "LT 500 kV Açu III / Jaguaruana II"), a pauta é transmissão, com lugar e nome. Ele sai também com o lugar para citar (RN, conjunto Caju, subestação Açu III) e um número atribuível ao ONS.
- **Por que isto e não o Curtômetro:** ele não quer saber quanto vale em R$ nem abrir relatório de pleito. Quer ver o dia acontecer e ter uma frase certa para o lide.

Leitor secundário, não modelado: quem visita o portfólio do Daniel e deve entender em 5 segundos que ali há dado público real, mapa e tempo trabalhando juntos.

---

## Dados

### 1. ONS: restrição por constrained-off, eólicas e fotovoltaicas (fonte principal)

| | Eólica | Solar |
|---|---|---|
| Dataset agregado (a unidade do mapa) | https://dados.ons.org.br/dataset/restricao_coff_eolica_usi | https://dados.ons.org.br/dataset/restricao_coff_fotovoltaica |
| Dataset por usina (só para ligar conjunto → usinas → coordenadas) | https://dados.ons.org.br/dataset/restricao_coff_eolica_detail | https://dados.ons.org.br/dataset/restricao_coff_fotovoltaica_detail |

- **Responde hoje:** sim. A API CKAN `https://dados.ons.org.br/api/3/action/package_show?id=<dataset>` devolveu `success: true` para os quatro datasets. `metadata_modified` de todos é 2026-09-25 (CONFIRMADO).
- **Arquivos:** um por mês, em S3 público (`https://ons-aws-prod-opendata.s3.amazonaws.com/dataset/restricao_coff_eolica_tm/RESTRICAO_COFF_EOLICA_AAAA_MM.parquet`, e o mesmo com `_fotovoltaica_tm/…FOTOVOLTAICA…`), em CSV (`;`), XLSX e Parquet. Sem autenticação e sem chave. `HEAD` respondeu 200 com `Accept-Ranges: bytes` (CONFIRMADO). Nenhum limite de taxa declarado (INFERIDO: é S3 do programa AWS Open Data, https://registry.opendata.aws/ons-opendata-portal/).
- **Atualização:** "Diariamente, às 12h e 19h" (campo "Schedule de Atualização" do dataset, CONFIRMADO). Hoje (25/09) o arquivo de setembro já vai até 2026-09-24 23:30 (CONFIRMADO).
- **Tamanhos, ago/2026:** agregado eólico Parquet 4,4 MB / CSV 46,8 MB; agregado solar Parquet 1,4 MB / CSV 21,1 MB; detalhe eólico Parquet 12,8 MB / CSV 244 MB; detalhe solar Parquet 5,4 MB / CSV 128 MB (CONFIRMADO, campo `size` da API e `Content-Length`).
- **Granularidade:** um registro por usina ou conjunto por meia hora (`din_instante`, 48 patamares por dia). Ago/2026: 153 ids eólicos × 1.488 patamares = 227.664 linhas, sem duplicatas. Solar: 83 ids (CONFIRMADO).
- **Colunas usadas** (dicionário: https://ons-aws-prod-opendata.s3.amazonaws.com/dataset/restricao_coff_eolica_detail_tm/DicionarioDados_RestricaoContrainedoff_UsiEolicas_DetalhamentoPorUsina.json; o JSON com esse nome descreve as colunas do dataset agregado, CONFIRMADO):
  - `id_ons`, `nom_usina`, `ceg` ("-" para conjuntos), `id_estado`, `id_subsistema`, `nom_pontoconexao`
  - `val_geracao` (MWmed verificado), `val_geracaoreferencia` (o que poderia gerar), `val_geracaonaorealizadaapurada` (**GNRa**, o corte: referência menos verificada, só nos patamares com limitação)
  - `cod_razaorestricao`: ENE energética, CNF confiabilidade, REL indisponibilidade externa (elétrica), PAR parecer de acesso
  - `dsc_restricao`: texto do motivo, "disponível a partir de setembro/2025". Tem 103 valores distintos em ago–set/2026. É ele que nomeia a linha de transmissão (CONFIRMADO).
- **O detalhe por usina** (`*_detail`) tem outras colunas: `val_geracaoestimada`, `val_geracaoverificada`, `flg_geracaorestrita`, `id_ons_conjuntousina` e o CEG de cada usina, mas **não tem GNRa nem razão**. Serve só para descobrir quais usinas (com CEG) formam cada conjunto (CONFIRMADO).
- **Ressalvas que a página precisa dizer:**
  - O GNRa é uma **estimativa** do ONS, calculada pela geração de referência (RO-AO.BR.13).
  - "Os dados disponibilizados fazem parte de um processo de consistência recorrente e, portanto, podem ser atualizados após a sua publicação" (texto do dataset, CONFIRMADO).
  - Cobre só usinas Tipo I, II-B e II-C, despachadas centralmente. **Não inclui geração distribuída** (telhados) (CONFIRMADO pela descrição do dataset).
  - Fuso de `din_instante`: não consta no dicionário. INFERIDO: horário de Brasília, porque o corte solar começa às 6h–7h e zera às 17h.

**Licença, CONFIRMADA na API:**
- `license_id: "cc-by"`, `license_title: "Creative Commons Atribuição"`, `license_url: http://www.opendefinition.org/licenses/cc-by`.
- Aviso legal do dataset: *"Ao acessar este site e/ou utilizar as informações provenientes dele, será considerado que você aceitou os termos e condições da LICENÇA CC-BY, que permite que os reutilizadores distribuam, modifiquem, adaptem e desenvolvam o material sobre os dados, desde que seja dado o crédito apropriado ao criador (ONS) e que informe quais alterações foram feitas. Os dados são fornecidos 'como estão' e apenas para fins informativos; e este conjunto de dados pode ter sua disponibilidade interrompida a qualquer momento e por qualquer motivo."* Link da licença citado no aviso: http://opendefinition.org/od/2.1/pt-br.
- **Obrigação na página:** crédito "Fonte: ONS, Dados Abertos (CC-BY)" e uma frase sobre o que foi alterado: "agregamos por dia e por ponto; convertemos MWmed de meia hora em MWh; posicionamos cada conjunto no centro das suas usinas".

### 2. ANEEL SIGA: coordenadas das usinas

- **URL:** https://dadosabertos.aneel.gov.br/dataset/siga-sistema-de-informacoes-de-geracao-da-aneel. Recurso usado: `siga-empreendimentos-geracao-diario.csv`, 8,4 MB, atualizado 2026-09-25 10:40 (CONFIRMADO).
- **Formato:** CSV `;`, vírgula decimal. A resposta sai em UTF-8, apesar dos acentos quebrados no terminal Windows. Colunas úteis: `IdeNucleoCEG`, `CodCEG`, `NomEmpreendimento`, `SigTipoGeracao` (EOL, UFV), `NumCoordNEmpreendimento` (lat), `NumCoordEEmpreendimento` (lon), `MdaPotenciaOutorgadaKw` (CONFIRMADO).
- **Chave de junção:** o CEG do ONS (`EOL.CV.MA.033682-3.01`) e o da ANEEL (`…-6.1`) diferem no sufixo. Juntar pelo núcleo de 6 dígitos, `split_part(split_part(ceg,'.',4),'-',1) = IdeNucleoCEG`. Resultado: **1.055 de 1.055 usinas eólicas e 560 de 560 solares com coordenada. Os 236 ids do dataset agregado (153 eólicos + 83 solares) ficam todos posicionados**: conjunto no centroide das usinas-membro, usina avulsa direto pelo CEG (CONFIRMADO, junção feita hoje).
- **Licença:** `license_id: "odc-odbl"`, "Open Data Commons Open Database License (ODbL)", http://www.opendefinition.org/licenses/odc-odbl (CONFIRMADO na API da ANEEL). **Consequência:** a tabela `id_ons → lat/lon` que vai no `data.json` é uma base derivada. Como o repo é público e o JSON chega ao navegador, ela precisa ser oferecida sob ODbL, com atribuição à ANEEL. A página (um "Produced Work") precisa de aviso do tipo "Contém dados do SIGA/ANEEL, sob ODbL". INFERIDO: é a leitura padrão da ODbL; a ODbL não exige que a página inteira mude de licença.

### 3. Contornos dos estados (fundo do mapa, sem tiles)

- **Escolha: Natural Earth, admin-1** (`ne_10m_admin_1_states_provinces`, em https://github.com/nvkelso/natural-earth-vector, 40,7 MB completo; recortar só os estados BR usados). Termos: *"All versions of Natural Earth raster + vector map data found on this website are in the public domain."* (CONFIRMADO, https://www.naturalearthdata.com/about/terms-of-use/).
- **Alternativa testada:** API de malhas do IBGE, `https://servicodados.ibge.gov.br/api/v3/malhas/regioes/2?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=UF`, respondeu 200 com 34 KB para o Nordeste por UF (CONFIRMADO). A documentação da API não traz termo de licença explícito e a página de termos do IBGE deu 403 hoje. Por isso fica como segunda opção (INFERIDO: dado público federal, uso livre com citação, mas não confirmado).
- **Sem tiles:** nenhuma dependência de OSM, Mapbox ou MapTiler, nem das licenças e cotas deles. O fundo é um SVG com os contornos já projetados na hora de gerar os dados.

### Como buscar uma vez (script `fetch` de uso único, fora do runtime)

1. Via CKAN, pegar a lista de recursos de `restricao_coff_eolica_usi` e `restricao_coff_fotovoltaica` e baixar os **Parquet** de 2026-08 e 2026-09 (cerca de 12 MB no total). Guardar em diretório temporário, nunca no repo.
2. Baixar os Parquet `*_detail` dos mesmos meses (cerca de 30 MB), só para montar o mapa conjunto → CEGs.
3. Baixar o CSV do SIGA (8,4 MB), juntar pelo núcleo do CEG e calcular o centroide de cada `id_ons`, com 3 casas decimais.
4. Agregar para `data.json`:
   - `pontos[]`: `id`, nome, fonte (eol/fv), UF, subestação, lat/lon.
   - `dias{AAAA-MM-DD}`: por ponto, 48 inteiros de corte em MW e 48 códigos de razão (0 nenhuma, 1 ENE, 2 CNF, 3 REL).
   - Totais diários nacionais: cortado, gerado, referência e divisão por razão.
   - `restricoes{}`: os textos de `dsc_restricao` por dia e ponto, deduplicados.
5. Projetar os contornos (d3-geo no script, não no navegador) e gravar os `path` SVG prontos.

Ferramenta: o teste de hoje usou DuckDB em Python sobre os Parquet. Para manter o repo em TypeScript, usar `hyparquet` (leitor de Parquet em JS puro) num script de uso único. INFERIDO: não testei o `hyparquet` com estes arquivos. Se falhar, o CSV `;` em streaming também serve, só que baixando cerca de 400 MB.

**Tamanho medido:** os 55 dias (01/08 a 24/09/2026) × 236 pontos × 48 patamares, com razão, somam 3,0 MB de JSON (0,45 MB com gzip). Um dia sozinho tem 58 KB (11 KB com gzip) (CONFIRMADO, serializado hoje). O `data.json` inteiro fica no servidor (`load.ts` lê uma vez) e **o cliente recebe só o dia escolhido** (`?dia=2026-08-16`), mais a faixa de totais diários.

---

## Referências

1. **Curtômetro / gridCurt, da BrazilGrid**: https://curtometro.brazilgrid.com/ (CONFIRMADO, HTML e bundle JS lidos hoje). É o concorrente direto e é profundo:
   - Contador "ao vivo" do acumulado desde set/2023, que é estimativa pelo ritmo médio de 30 dias ("Não é medição semi-horária ao vivo").
   - "Prévia do dia" pela previsão D-1 do ONS menos a geração realizada (endpoint `/api/curtometro/hoje-ao-vivo` respondeu com 48 patamares para 2026-09-25).
   - Valoração em R$ pelo PLD, ranking "GARGALOS QUE MAIS CORTAM" a partir dos decks DESSEM, divisão ENE × elétrica por mês, vertimento turbinável das hidrelétricas à parte.
   - Relatórios por conjunto para pleito de ressarcimento (Lei 15.269/2025, REN 1.030/2022), exportação CSV com hash, risco D+7, pt/en/es.
   - O mapa fica em outro produto (gridMap, https://bigsin.brazilgrid.com/: "usinas, subestações, linhas de transmissão, margens de escoamento…").

   *O que faz bem:* rigor de método, procedência, separação energética × elétrica, R$.
   *Onde esta demo é diferente:* o Curtômetro é ferramenta de trabalho para agentes do setor (quanto, quanto vale, como pleitear), densa e em várias telas. **Esta demo conta um dia só, no espaço e no tempo:** o mapa em que se vê o corte nascer com o sol e se espalhar pelo Nordeste, meia hora a meia hora, com cada ponto colorido por *por quê* (sobra de energia × linha nomeada). Uma pergunta, uma tela, para quem não é do setor. Sem R$, sem contador acumulado, sem previsão, sem pleito. A demo não copia a identidade visual da BrazilGrid.
2. **Curtailment Tracker, da Volt Robotics**: https://voltrobotics.com.br/curtailment/ (existência CONFIRMADA via busca e pv magazine). Painel pago para geradores, comercializadoras e fundos, com filtros por usina, tipo de corte, local, agente e período. *Faz bem:* recorte por agente e série longa (73,4 milhões de MWh desde out/2021). *Diferença:* é fechado e analítico; a demo é aberta e narrativa.
3. **Relatórios diários de curtailment do CAISO**: https://www.caiso.com/library/daily-wind-solar-real-time-dispatch-curtailment-reports (CONFIRMADO via busca). PDF diário por hora e por tipo de corte, em MWh e MW. *Faz bem:* um dia como unidade de leitura, que é a mesma escolha desta demo. *Diferença:* sem espaço (nada de mapa) e sem interação.
4. **"Visualizing California Renewables Curtailments", Energy Institute at Haas** (15/06/2026): https://energyathaas.wordpress.com/2026/06/15/visualizing-california-renewables-curtailments/ (CONFIRMADO, lido hoje). Compara barras, ridgeline, sobreposição ano a ano, cycle plot e heatmap hora × mês, e conclui que cycle plot e heatmap mostram melhor a sazonalidade. *O que a demo pega daí:* a faixa de dias do seletor vira um heatmap compacto dia × hora, e o padrão "7h–15h, domingos" aparece sem legenda.
5. **Electricity Maps**: https://app.electricitymaps.com/ (INFERIDO; não abri hoje). Referência de mapa vivo de rede com escala de cor única e legível no celular. *Diferença:* ele mostra zonas; a demo mostra pontos (usinas e conjuntos) e o corte, não a matriz.

---

## Escopo de 16h (telas, estados, cortes)

### Uma página, `/demo/curtailment-br`

**Primeira dobra, no celular e no desktop:**
- A frase-resposta do dia e os três números: cortado, gerado, % no pico.
- O mapa, em SVG com contornos Natural Earth, recortado no Nordeste + norte de MG. É onde estão 85%+ do corte (INFERIDO a partir das UFs de 16/08: RN 126,9, BA 94,9, PI 47,2, MG 45,1, CE 24,2 GWh…).
  - 236 pontos. Raio proporcional à referência do ponto no patamar, preenchimento proporcional ao corte. A cor diz a razão: **ENE numa cor ("sobrou energia"), CNF/REL em outra ("a rede não aguentou")**.
  - Chip "fora do mapa": RS 23,7 · SP 5,8 · GO 2,7 · SC 0,7 GWh, para que o total bata com a frase.
- Controles de replay presos embaixo no celular: play/pause, *scrubber* de 48 patamares com o relógio (00h00…23h30) e a curva nacional do dia (área cortada sobre a área possível) no fundo do scrubber.

**Abaixo da dobra:**
1. **"Por quê"**: barra ENE × CNF × REL do dia e as 3 a 5 restrições nomeadas que mais cortaram (`dsc_restricao`), cada uma com os pontos que ela afetou (tocar destaca no mapa). Em 16/08: "Controle de frequência do SIN" 330,0 GWh; "LT 500 kV Açu III / Jaguaruana II" 38,5 GWh; "Desligamento da LT 525 kV Povo Novo / Marmeleiro C2" 16,8 GWh, que zerou o Conj. Santa Vitória do Palmar (RS), 100% cortado no dia (CONFIRMADO).
2. **Ponto tocado**: nome, UF, subestação, fonte, curva de 48 patamares (possível × gerado) e a restrição do patamar.
3. **Seletor de dia**: faixa de 55 dias (01/08 a 24/09/2026), heatmap dia × hora, que troca `?dia=`. Os piores dias ficam visíveis de relance (16/08, 20/09, 01/08, 19/09, 23/08).
4. **Método e fontes**: definição de GNRa, "estimativa do ONS, sujeita a revisão", "não inclui geração distribuída", créditos CC-BY (ONS) e ODbL (ANEEL), Natural Earth, data da coleta e o banner "demo conceitual".

**Estados:**
- *Carregando*: nenhum, porque é SSR com o dia embutido.
- *Parado no pico*: estado inicial em 10h30, não em 00h00. A primeira imagem já é o mapa aceso; o play volta a 00h00.
- *Tocando*: 48 quadros em cerca de 12 s.
- *`prefers-reduced-motion`*: sem pulso e sem autoplay. O scrubber continua funcionando.
- *Dia inválido em `?dia=`*: cai no padrão.
- *Ponto sem corte no patamar*: contorno vazio.
- *Dia sem dado*: não existe dentro do intervalo, mas o seletor mostra só os 55 dias.

**Técnica:**
- Next.js 16, CSS modules. O mapa é SVG com `<circle>`. Com 236 pontos, canvas não é necessário (INFERIDO; trocar por canvas só se o pulso travar num Android médio).
- Sem biblioteca de mapa no cliente: a projeção e os `path` saem prontos do script.
- Única dependência de runtime considerada: nenhuma. O `d3-geo` fica só no script de busca.

**Orçamento aproximado:**

| Etapa | Horas |
|---|---|
| Script de busca e agregação, com testes do agregado batendo nos totais acima | 4 |
| Mapa SVG + replay + scrubber | 4 |
| Painel "por quê" + ponto tocado | 3 |
| Seletor de dias | 2 |
| Texto, método, créditos, responsivo, reduced-motion, QA | 3 |

**Cortado:**
- Valor em R$/PLD.
- Contador ao vivo, previsão e D+7.
- Série além de ago–set/2026 (um ano custaria cerca de 20 MB de JSON no servidor e não muda a pergunta).
- Usina a usina dentro do conjunto (o GNRa só existe por conjunto).
- Linhas de transmissão desenhadas: não há geometria aberta e verificada hoje, então a linha aparece **nomeada**, não traçada.
- Vertimento das hidrelétricas, geração distribuída, comparação com outros países, pt/en, exportação CSV.

---

## Riscos

1. **O Curtômetro já é muito completo.** Se a demo parecer "um Curtômetro mais simples", ela perde. Mitigação: nada de contador, R$ ou ranking. A página é o dia animado no mapa, mais a divisão "sobrou energia × linha nomeada".
2. **Os números mudam.** O ONS reconsolida os dados ("podem ser atualizados após a sua publicação"). A página diz "dados baixados em 2026-09-25" e congela esse retrato. Não promete ser o número atual.
3. **Números extremos pedem cuidado com a frase.** 40,7 GW cortados às 10h30 e eólica a 837 MW de 29,1 GW possíveis no mesmo patamar parecem implausíveis. São consistentes com os "até 40 GW nos picos" do PEN 2026-2030 (INFERIDO via busca). Mesmo assim, a página diz "corte estimado pelo ONS", nunca "desperdício medido".
4. **ODbL do SIGA:** a tabela de coordenadas derivada precisa sair sob ODbL, com atribuição. Se o Daniel não quiser ODbL no repo, a alternativa é posicionar pela subestação (`nom_pontoconexao`), mas não há fonte aberta verificada de coordenadas de subestação. Hoje, ODbL é o caminho.
5. **Fuso de `din_instante` não documentado.** INFERIDO: Brasília. Conferir com o PDF do dicionário antes de escrever "às 10h30".
6. **`hyparquet` não testado** com estes Parquet. Plano B é o CSV em streaming.
7. **Posição do conjunto = centroide das usinas.** Conjuntos espalhados (dezenas de km) viram um ponto só. A página diz isso no método.
8. **Enquadramento no Nordeste deixa cerca de 8% do corte do dia fora do mapa** (RS, SP, GO, SC). O chip "fora do mapa" resolve; não pode sumir.
9. **Tom:** o tema convida a manchete ("jogou fora uma Itaipu"). Pela regra da página, sem hype. A frase compara o dado com ele mesmo (cortado × gerado), sem equivalências de cidade ou casa, que exigiriam outra fonte.

---

## Achados (CONFIRMADO / INFERIDO)

| # | Achado | Status | Fonte / como |
|---|---|---|---|
| 1 | API CKAN do ONS responde; os 4 datasets estão com `metadata_modified` em 2026-09-25 | CONFIRMADO | https://dados.ons.org.br/api/3/action/package_show?id=restricao_coff_eolica_usi (e os outros 3) |
| 2 | Licença ONS: CC-BY, com aviso legal que exige crédito e indicação das alterações | CONFIRMADO | campo `license_*` e "Aviso Legal" da mesma API |
| 3 | Arquivos mensais em Parquet/CSV/XLSX no S3, sem autenticação; atualização às 12h e 19h | CONFIRMADO | `HEAD` 200 em …/RESTRICAO_COFF_EOLICA_DETAIL_2026_08.parquet; extras do dataset |
| 4 | Setembro/2026 publicado até 24/09 23:30 | CONFIRMADO | `max(din_instante)` do Parquet de 2026-09 |
| 5 | GNRa, razão (ENE/CNF/REL) e `dsc_restricao` existem só no dataset agregado; o detalhe por usina não tem GNRa | CONFIRMADO | esquema dos dois Parquet de 2026-08 |
| 6 | CEG ONS ↔ ANEEL SIGA: 100% de junção pelo núcleo de 6 dígitos; 236/236 pontos com coordenada | CONFIRMADO | junção feita hoje |
| 7 | Licença SIGA/ANEEL: ODbL | CONFIRMADO | https://dadosabertos.aneel.gov.br/api/3/action/package_show?id=siga-sistema-de-informacoes-de-geracao-da-aneel |
| 8 | Natural Earth é domínio público | CONFIRMADO | https://www.naturalearthdata.com/about/terms-of-use/ |
| 9 | Malha do IBGE responde (34 KB, Nordeste por UF), mas sem licença explícita encontrada | CONFIRMADO (resposta) / INFERIDO (licença) | servicodados.ibge.gov.br/api/v3/malhas/… ; página de termos deu 403 |
| 10 | 16/08/2026: 399,9 GWh cortados × 400,6 GWh gerados; 817,0 GWh de referência | CONFIRMADO | agregado eólico+solar 2026-08 |
| 11 | 16/08/2026 10h30: 40.740 MWmed cortados de 46.686 possíveis (87%) | CONFIRMADO | idem |
| 12 | 16/08/2026: 82,5% do corte por razão ENE ("Controle de frequência do SIN") | CONFIRMADO | idem, `cod_razaorestricao`/`dsc_restricao` |
| 13 | 16/08 é o pior dia entre 01/08 e 24/09/2026; depois vêm 20/09 (336,6), 01/08 (334,9), 19/09 (330,5) e 23/08 (325,8 GWh) | CONFIRMADO | agregado 2026-08 + 2026-09 |
| 14 | Semana de 14 a 20/09/2026: 1.722,7 GWh cortados (33,9%), a pior semana do intervalo | CONFIRMADO | idem |
| 15 | Ago/2026: eólica 4.022 GWh + solar 1.595 GWh cortados | CONFIRMADO | idem |
| 16 | ENE = 68,2% do corte em ago–set/2026, coerente com os "67% em 2026" da imprensa | CONFIRMADO (nosso) / INFERIDO (imprensa, via resumo de busca) | idem; canalsolar.com.br |
| 17 | Top de 16/08: Conj. Santa Vitória do Palmar (RS) 12,0 GWh, 100% cortado, por desligamento da LT 525 kV Povo Novo / Marmeleiro C2; Conj. Caju (RN, Açu III) 9,0 GWh, 75% | CONFIRMADO | idem |
| 18 | Tamanho: 55 dias = 3,0 MB JSON (0,45 MB gzip); 1 dia = 58 KB (11 KB gzip) | CONFIRMADO | serialização feita hoje |
| 19 | Plano emergencial do ONS por excesso de energia em 23/08/2026, o 2º do ano (o 1º foi em 07/06) | CONFIRMADO | acessa.com (link acima) |
| 20 | 51 dias com corte > 60% entre jan e ago/2026; média de 3.853 MWmed | CONFIRMADO | pv-magazine-brasil.com (link acima) |
| 21 | PEN 2026-2030 projeta picos de até 40 GW, das 7h às 15h, mais fortes aos domingos | INFERIDO | resumo de busca; documento não aberto |
| 22 | O Curtômetro tem contador estimado, prévia D-1, R$/PLD, ranking de gargalos, relatório de pleito; o mapa fica no gridMap | CONFIRMADO | HTML, bundle e `/api/curtometro/hoje-ao-vivo` de curtometro.brazilgrid.com; bigsin.brazilgrid.com |
| 23 | `din_instante` está em horário de Brasília | INFERIDO | forma da curva solar; não documentado no dicionário JSON |
| 24 | `hyparquet` lê estes Parquet | INFERIDO | não testado |
| 25 | Não há limite de taxa no S3 do ONS | INFERIDO | programa AWS Open Data; nada declarado |
