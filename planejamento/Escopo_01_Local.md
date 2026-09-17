# Documento de Arquitetura e Escopo Técnico
## Sistema de Vistorias de Acessibilidade — Módulo Local (Fase 1)

> [!NOTE]
> **Status da Implementação: CONCLUÍDO ✅**
> Todos os requisitos de arquitetura local (IndexedDB particionado via `idb-keyval`, contrato canônico Zod, motor puro de conflitos, exportação/importação com barreira de validação, cálculo de completude de status, salvaguarda de cota e suíte de testes unitários com Vitest) foram implementados e validados.
> 
> **Pendência Futura de Manutenção:** Limpeza e remoção da camada transitória de conversão e migração de cache legado (`localStorage`) em versões posteriores do aplicativo, após consolidação completa e validação de longo prazo pelos usuários com vistorias antigas salvas.

**Projeto:** Diagnóstico Acessibilidade UFCA
**Escopo deste documento:** tudo o que funciona sem servidor — modelo de dados, persistência local, backup, importação, resolução de conflitos e cálculo de resultado.
**Fora do escopo:** autenticação, endpoints HTTP, sincronização em nuvem e compartilhamento entre avaliadores por link (ver documento de escopo social, Fase 2). Acessibilidade da própria interface (contraste, navegação por teclado, leitor de tela) será tratada em documento à parte.

---

## 1. Visão Geral

O sistema é uma aplicação React/Vite, offline-first, que permite a um avaliador conduzir vistorias de acessibilidade física em blocos da UFCA sem depender de conectividade, autenticação ou backend. Cada vistoria é um documento autocontido, versionado e portável, capaz de ser exportado, transferido e reimportado em outro dispositivo sem perda de integridade.

O módulo local é deliberadamente completo por si só: um avaliador pode operar exclusivamente com backup manual via arquivo `.json`, sem nunca depender da Fase 2, se a infraestrutura de servidor não estiver disponível ou não for prioridade no momento.

### 1.1. Princípios Norteadores

* **Offline-first real**, não apenas "salva localmente": a aplicação deve funcionar por completo sem rede, incluindo o carregamento inicial (PWA com pré-cache do *app shell*).
* **Dado nunca se perde silenciosamente.** Toda operação destrutiva (exclusão, sobrescrita em conflito, estouro de cota) precisa de confirmação explícita ou de um caminho de recuperação.
* **Um único contrato de dados**, usado por validação de importação, cálculo de resultado e, futuramente, pelo envio ao servidor. O formato não deve divergir por fase.
* **Fonte única da verdade para o checklist.** O sistema deve manter apenas um artefato de definição de critérios (ver §9.4); qualquer segundo arquivo é derivado, nunca duplicado manualmente.

---

## 2. Modelo de Dados

### 2.1. Ciclo de Vida da Vistoria

Cada vistoria transita pelos seguintes estados, registrados no campo `status`:

| Estado | Significado |
|---|---|
| `rascunho` | Triagem iniciada, ainda incompleta. |
| `em_andamento` | Triagem concluída; checklist sendo preenchido. |
| `concluida` | Todos os itens aplicáveis do checklist foram respondidos (`conforme`, `nao_conforme` ou `nao_aplica` — nenhum `null` restante entre os itens aplicáveis). |
| `arquivada` | Removida da listagem ativa por decisão do usuário — **não utilizado na Fase 1** (ver §2.4, decisão de exclusão definitiva). Mantido no enum para permitir revisão futura sem migração de schema. |

Regras:

* Vistorias em `rascunho` ou `em_andamento` **podem** gerar um resultado, mas o resultado é explicitamente marcado como **parcial** (ver §7.2). Isso permite ao avaliador consultar um panorama do progresso em campo sem forçar o preenchimento total antes de ver qualquer número.
* Apenas vistorias `concluida` são elegíveis para envio ao servidor na Fase 2 — regra que pertence ao documento social, mas que já deve ser respeitada pelo cálculo de status aqui, já que o status é o critério de elegibilidade.

### 2.2. Contrato de Dados (Schema Canônico)

Formato único, validado via **Zod**, centralizado em `src/dados/esquema.js`. Este schema é a fonte de verdade para: validação de importação, validação antes de gravação local, e (futuramente) validação antes de envio ao servidor.

```javascript
// src/dados/esquema.js
import { z } from "zod";

export const RespostaCriterio = z.object({
  resposta: z.enum(["conforme", "nao_conforme", "nao_aplica"]).nullable(),
  observacao: z.string().default(""),
});

export const Consentimento = z.object({
  aceito: z.boolean(),
  versaoTermo: z.string(),
  dataAceite: z.string().datetime().nullable(),
});

export const Triagem = z.object({
  nivelEnsino: z.enum(["infantil", "fundamental", "medio", "superior", "nao_aplicavel"]),
  respostas: z.record(z.string(), z.boolean()),
  // Ex.: { "possuiEscada": true, "possuiEstacionamento": false, "possuiBanheiroAdaptado": true }
  // Usado para determinar dinamicamente quais critérios do checklist são aplicáveis.
});

export const Vistoria = z.object({
  vistoriaId: z.string().uuid(),
  versaoChecklist: z.string(),
  versaoClassificacao: z.string(),
  status: z.enum(["rascunho", "em_andamento", "concluida", "arquivada"]),
  revisao: z.number().int().nonnegative(),
  // Contador monotônico, incrementado a cada gravação. Usado como critério
  // primário de desempate em conflitos — não depende do relógio do dispositivo.
  dataCriacao: z.string().datetime(),
  dataUltimaEdicao: z.string().datetime(),
  sincronizada: z.boolean().default(false),
  dataUltimaSincronizacao: z.string().datetime().nullable().default(null),
  consentimento: Consentimento,
  blocoAvaliado: z.string().min(1),
  triagem: Triagem,
  dadosVistoria: z.record(z.string(), RespostaCriterio),
  resultadoSnapshot: z
    .object({
      calculadoEm: z.string().datetime(),
      versaoClassificacao: z.string(),
      parcial: z.boolean(),
      percentualConformidade: z.number().min(0).max(100),
      itensRespondidos: z.number().int(),
      itensAplicaveis: z.number().int(),
    })
    .nullable()
    .default(null),
  // Registro auditável do último cálculo exibido ao avaliador. Não é a fonte
  // de verdade (o resultado é sempre recalculado a partir de dadosVistoria);
  // serve para defender metodologicamente o que foi mostrado em campo caso a
  // tabela de classificação mude de versão depois.
});

// Envelope de exportação/importação — ver §5.1
export const EnvelopeExportacao = z.object({
  formato: z.literal("vistoria-ufca"),
  versaoFormato: z.number().int(),
  exportadoEm: z.string().datetime(),
  versaoApp: z.string(),
  vistorias: z.array(Vistoria).min(1),
});
```

Notas de design:

* **Resposta quaternária** (`conforme` / `nao_conforme` / `nao_aplica` / `null`) em vez de booleana. Auditoria de acessibilidade real precisa distinguir "não conforme" de "não se aplica" (ex.: bloco sem escada não pode ser penalizado por ausência de corrimão) e de "ainda não avaliado". Colapsar os quatro estados em `true`/`false` invalida o cálculo de conformidade.
* **`triagem.respostas` é um mapa aberto**, não uma lista fixa de campos, porque `SeletorNivelEnsino.jsx` e a lógica de triagem evoluem; travar campos nominais no schema forçaria migração a cada novo critério de triagem.
* **`versaoChecklist` e `versaoClassificacao` são independentes.** Mudar o peso de um critério (`classificacao.js`) não deve reescrever silenciosamente a nota de vistorias antigas — ver §7.
* **`sincronizada` e `dataUltimaSincronizacao` já existem na Fase 1**, mesmo sem servidor. Campo que nasce inerte não custa nada; campo que nasce depois exige migração.
* **`consentimento` como objeto**, não booleano solto — para uso em pesquisa acadêmica é necessário registrar qual versão do termo foi aceita e quando, não apenas que foi aceita.

### 2.3. Fonte Única do Checklist

O projeto não deve manter `checklist.json` e `checklist.js` como duas fontes independentes do mesmo conteúdo. Decisão: **`checklist.json` é o dado; `checklist.js` (se necessário) apenas importa, tipa e expõe funções auxiliares de consulta** (ex.: `criteriosAplicaveis(triagem)`). Nenhum critério deve ser editado em `checklist.js` diretamente.

### 2.4. Exclusão

Decisão adotada: **exclusão definitiva**, sem lixeira ou soft-delete. `ModalExcluirVistoria.jsx` deve, portanto:

* Exigir confirmação explícita com o nome do bloco escrito ou repetido na modal (não apenas um "Confirmar" genérico), dado o caráter irreversível.
* Sugerir — sem obrigar — exportação do arquivo antes de confirmar a exclusão, como última rede de segurança.
* Remover o registro tanto do índice (§3.2) quanto do documento completo, na mesma transação.

---

## 3. Arquitetura de Persistência

### 3.1. IndexedDB via `idb-keyval`

Decisão adotada: **IndexedDB**, não `localStorage`. Justificativa:

* `localStorage` tem limite prático de ~5 MB e é síncrono — uma escrita grande trava a *thread* principal durante o preenchimento em campo.
* `QuotaExceededError` em `localStorage` interrompe a operação no meio, sem espaço de manobra. IndexedDB tem limites ordens de magnitude maiores e falha de forma assíncrona e tratável.
* Mesmo sem mídia no escopo atual (§9.1), a coleção de vistorias cresce ao longo do semestre; IndexedDB acomoda esse crescimento sem exigir migração de storage no meio do projeto.

Toda a persistência é encapsulada atrás de uma interface própria, para que a escolha de IndexedDB não vaze para os componentes:

```javascript
// src/dados/repositorio.js
// Contrato estável — a troca de motor de armazenamento no futuro não deve
// exigir alteração em nenhum componente de UI.

export async function listarIndice() { /* → array leve, ver §3.2 */ }
export async function obterVistoria(vistoriaId) { /* → Vistoria completa */ }
export async function salvarVistoria(vistoria) { /* grava documento + atualiza índice */ }
export async function excluirVistoria(vistoriaId) { /* remove documento + índice */ }
export async function estimarUsoArmazenamento() { /* → { usadoMB, cotaMB } via navigator.storage.estimate() */ }
```

### 3.2. Índice Separado dos Documentos

Para evitar que cada tecla digitada reserialize a coleção inteira, os dados são particionados em duas categorias de chave:

* **Índice** (`ufca:indice:v1`): array leve, uma entrada por vistoria, contendo apenas o necessário para listar e ordenar — `{ vistoriaId, blocoAvaliado, status, revisao, dataUltimaEdicao, progresso }`. É o que `CartaoVistoria.jsx` e a tela de listagem consultam; nunca carrega o documento completo.
* **Documento** (`ufca:vistoria:{uuid}`): a `Vistoria` completa, lida apenas ao abrir uma vistoria específica.

Toda gravação (`salvarVistoria`) atualiza as duas estruturas na mesma transação IndexedDB, para que índice e documento nunca fiquem inconsistentes entre si.

### 3.3. Consistência entre Abas

Duas abas abertas na mesma vistoria podem gerar perda silenciosa (a última a gravar apaga a alteração da outra). Mitigação: escutar o evento `storage` (ou usar `BroadcastChannel`) para detectar alteração externa à chave da vistoria aberta; ao detectar, notificar o usuário e oferecer recarregar o estado em vez de sobrescrever.

### 3.4. Tratamento de Estouro de Cota

Mesmo com IndexedDB, cota pode se esgotar (especialmente em dispositivos com pouco armazenamento livre). O sistema deve:

1. Monitorar `estimarUsoArmazenamento()` periodicamente e alertar (toast informativo) ao ultrapassar ~80% da cota reportada.
2. Capturar falhas de escrita por cota esgotada, bloquear novas gravações automáticas, e oferecer exportação imediata como via de escape antes de perder o progresso.

---

## 4. Funções Core

Estado gerenciado centralmente via `VistoriaContext.jsx`, que delega toda leitura/escrita a `repositorio.js` — o contexto não acessa IndexedDB diretamente.

### `iniciarNovaVistoria(blocoAvaliado, triagemInicial)`

* **Propósito:** criar um novo registro na coleção. Não limpa nem afeta as demais vistorias já armazenadas.
* **Ações:**
  * Gera `vistoriaId` (UUID v4).
  * Inicializa `revisao: 0`, `status: "rascunho"`, `dataCriacao`/`dataUltimaEdicao` no momento atual.
  * Grava o novo documento via `repositorio.salvarVistoria()` e retorna o `vistoriaId` para navegação.

### `atualizarVistoria(vistoriaId, alteracoesParciais)`

* **Propósito:** único ponto de escrita incremental durante o preenchimento (substitui a antiga `sincronizarCacheLocal`, que sugeria erroneamente sincronização de rede).
* **Ações:**
  * Aplica *debounce* (recomendado: 400–600ms) sobre chamadas sucessivas de input.
  * Incrementa `revisao` e atualiza `dataUltimaEdicao` a cada gravação efetiva.
  * Recalcula `status` (`rascunho` → `em_andamento` → `concluida`) a partir do preenchimento atual (ver §7.1).
  * Grava via `repositorio.salvarVistoria()`.
* **Garantia adicional:** o autosave deve também ser disparado nos eventos `pagehide` e `visibilitychange` (estado `hidden`), não apenas pelo debounce — navegadores mobile podem suspender ou encerrar a aba em segundo plano antes do debounce disparar.

### `excluirVistoria(vistoriaId)`

* Ver regras de confirmação em §2.4. Remove documento e entrada de índice na mesma transação.

### `calcularResultado(vistoria)`

* **Propósito:** derivar o resultado a partir de `dadosVistoria` e `triagem` — nunca persistido como fonte de verdade, apenas como `resultadoSnapshot` auditável (§2.2, §7).
* Detalhado em §7.

### `exportarVistoria(vistoriaId)` / `exportarTodasVistorias()`

* **Propósito:** gerar arquivo `.json` autocontido, único ponto de saída de dados.
* Ambas produzem o mesmo `EnvelopeExportacao` (§5.1); a exportação individual é apenas um envelope com um elemento no array `vistorias`. Um único caminho de código para os dois casos.
* Em dispositivos que suportam `navigator.share` com arquivos, oferecer compartilhamento nativo (WhatsApp, e-mail, Drive) como opção primária; download tradicional (`<a download>`) como *fallback* — especialmente relevante em iOS, onde o download direto é uma experiência ruim.
* Nome de arquivo sugerido: `vistoria_{blocoSlugificado}_{AAAA-MM-DD}_{id-curto}.json` para exportação individual; `vistorias_ufca_{AAAA-MM-DD}_{quantidade}.json` para lote.

### `importarArquivo(arquivo)`

* Detalhado em §6.

### `migrarVistoria(vistoriaBruta)`

* Detalhado em §8.

---

## 5. Backup e Exportação

### 5.1. Envelope de Exportação

Exportar a `Vistoria` crua, sem envelope, limita a evolução do formato e impede lote homogêneo. Todo arquivo gerado pelo sistema é um `EnvelopeExportacao`:

```json
{
  "formato": "vistoria-ufca",
  "versaoFormato": 1,
  "exportadoEm": "2026-09-16T12:00:00Z",
  "versaoApp": "0.4.2",
  "vistorias": [ { "...": "objeto Vistoria completo" } ]
}
```

* `versaoFormato` versiona o envelope em si, independente de `versaoChecklist` (que versiona o conteúdo do checklist). Permitem evoluir em ritmos diferentes.
* A importação deve continuar aceitando arquivos legados (uma `Vistoria` solta, sem envelope) por retrocompatibilidade, tratando-os como um envelope implícito de um elemento.

---

## 6. Importação e Validação de Barreira

### 6.1. Regras de Validação

Ao receber um arquivo `.json` (seleção nativa ou *drag-and-drop* — sendo a seleção nativa o caminho principal em mobile, já que arrastar é essencialmente um recurso de desktop):

1. **Verificação de tamanho** antes de qualquer *parse*, para não travar a aba com um arquivo anormalmente grande.
2. **Integridade estrutural:** deve ser JSON válido (`JSON.parse` sem erro).
3. **Validação de envelope e schema:** o conteúdo é validado contra `EnvelopeExportacao` (ou `Vistoria` legada) via Zod — validação de biblioteca, não checagens manuais de chave a chave.
4. **Migração prévia à validação final:** se `versaoChecklist` for anterior à atual, aplicar `migracoes.js` (§8) antes de validar contra o schema corrente.
5. **Bloqueio e feedback:** falha em qualquer etapa aborta a importação por completo, o estado local permanece intocado, e um toast de erro específico é exibido (arquivo corrompido, versão incompatível sem migração disponível, ou arquivo excede tamanho aceito).

### 6.2. Importação em Lote e Conflitos Múltiplos

Um envelope pode conter várias vistorias, algumas colidindo com IDs já existentes e outras não. A importação deve ser tratada como uma operação **transacional**:

1. Validar o envelope inteiro antes de gravar qualquer item.
2. Classificar cada vistoria do lote em "sem conflito" ou "em conflito" (§6.3).
3. Gravar de imediato as sem conflito.
4. Para as em conflito, apresentar a Interface de Resolução (§6.3) uma a uma, com indicador de progresso ("conflito 2 de 5"), oferecendo:
   * resolução individual;
   * opção "aplicar esta escolha às demais colisões deste lote";
   * "cancelar restantes", que interrompe o processamento das colisões pendentes sem desfazer o que já foi resolvido.
5. Ao final, um toast resume o resultado: quantas importadas diretamente, quantas resolvidas por sobrescrita/cópia/mesclagem, quantas canceladas.

### 6.3. Motor de Resolução de Conflitos

Disparado sempre que o `vistoriaId` do item importado já existe localmente. Este motor é **compartilhado** com a Fase 2 (que o dispara a partir de uma resposta HTTP 409, não de um arquivo) — implementado como função pura, independente da origem do dado:

```javascript
// src/dados/conflito.js
// resolverConflito não sabe se "remota" veio de um arquivo importado ou de uma
// resposta de servidor — apenas resolve duas versões da mesma vistoria.
export function resolverConflito(local, remota, estrategia) {
  // estrategia: "sobrescrever" | "copia" | "mesclar" | "cancelar"
}
```

Estratégias:

1. **Sobrescrever:** o registro local é totalmente substituído pelo importado.
2. **Criar Cópia:** os dados importados são gravados com um **novo** `vistoriaId`, `revisao` reiniciada em `0`, e o registro local original permanece intocado. `blocoAvaliado` recebe sufixo `" - Cópia"` (numerado — `" - Cópia (2)"`, `" - Cópia (3)"` — para evitar concatenação repetida em cópias sucessivas).
3. **Mesclar (deep merge):** união do objeto `dadosVistoria` local e importado, campo a campo. **Critério de desempate: `revisao` mais alta vence**; `dataUltimaEdicao` é usada apenas como critério secundário de exibição ao usuário na modal de conflito, nunca como decisão automática — relógios de dispositivos móveis divergem em campo e não são confiáveis como fonte de verdade temporal (ver §2.2). Após o merge: `vistoriaId` local é mantido, `revisao` passa a ser `max(revisaoLocal, revisaoImportada) + 1`, `dataUltimaEdicao` é atualizada para o momento da mesclagem.
4. **Cancelar:** nenhuma alteração; aplica-se apenas ao item em questão dentro do lote (ver §6.2).

### 6.4. Interface de Resolução (UI/UX)

* **Modal de Importação:** seleção nativa como ação primária; *drag-and-drop* como conveniência adicional em telas maiores.
* **Modal de Conflito:** exibe identificação do bloco em conflito, comparativo `revisao` (primário) e `dataUltimaEdicao` (informativo) entre versão local e importada, e as quatro ações de §6.3 como botões explícitos. Bloqueia interação com o restante da aplicação enquanto aberta.
* **Toasts:** confirmação (sucesso) e alerta (erro/cancelamento) ao final de qualquer operação de exportação, importação ou resolução de lote.

---

## 7. Cálculo de Resultado e Classificação

### 7.1. Regra de Completude

Uma vistoria é `concluida` quando todo critério **aplicável** (determinado por `criteriosAplicaveis(triagem)`, a partir das respostas de `Triagem.jsx`) possui `resposta` diferente de `null`. Critérios marcados `nao_aplica` contam como respondidos para efeito de completude, mas são excluídos do denominador de conformidade.

### 7.2. Resultado Parcial vs. Completo

* Vistorias em `rascunho` ou `em_andamento` **podem gerar resultado**, mas o `resultadoSnapshot.parcial` é `true` e a interface (`Resultado.jsx`, `ResumoBloco.jsx`) deve exibir aviso visual inequívoco de que o percentual reflete apenas os itens respondidos até o momento — não é aceitável apresentar um número "definitivo" para uma vistoria incompleta.
* Vistorias `concluida` geram `resultadoSnapshot.parcial: false`. **Esta é a única categoria elegível para envio ao servidor na Fase 2** — regra que pertence ao documento social, mas que depende diretamente do `status` calculado aqui.

### 7.3. Fonte de Verdade e Auditabilidade

O resultado nunca é lido de `resultadoSnapshot` para fins de exibição corrente — é sempre recalculado a partir de `dadosVistoria` e da tabela de classificação vigente (`classificacao.js`, versão `versaoClassificacao` atual do app). O `resultadoSnapshot` persistido serve apenas como **registro auditável**: o que foi mostrado ao avaliador, com qual versão da tabela de classificação, e em que momento — relevante porque o dado alimenta pesquisa acadêmica, e a defensabilidade metodológica exige saber se um resultado antigo foi calculado com pesos que já mudaram.

Ao mudar `versaoClassificacao`, vistorias antigas **não são recalculadas retroativamente** por padrão; o snapshot antigo permanece como histórico, e a interface pode oferecer, separadamente, "recalcular com a tabela atual" como ação explícita do usuário.

---

## 8. Retrocompatibilidade e Migrações

* **Isolamento de chaves:** os prefixos `ufca:indice:v{n}` e `ufca:vistoria:{uuid}` devem permanecer estáveis entre deploys. Uma mudança estrutural no índice (não no documento) incrementa `{n}` e exige rotina de migração do índice, não apenas do documento.
* **Migrações versionadas por `versaoChecklist`:**

```javascript
// src/dados/migracoes.js
// Cada função migra de uma versão para a imediatamente seguinte;
// aplicadas em cadeia até alcançar a versão corrente.
export const migracoes = {
  "1.0": (vistoria) => ({ ...vistoria /* transformação para 1.1 */ }),
};
```

  Isso substitui a estratégia de encadeamento opcional espalhado (`dadosVistoria?.novaPergunta`) por normalização única no ponto de entrada (abertura ou importação) — o resto do código passa a assumir sempre o formato corrente, sem defensividade repetida.

---

## 9. Fora do Escopo (Explícito)

* **Mídia:** envio e processamento de fotografias permanecem fora do escopo atual, por decisão de performance e simplicidade de infraestrutura. Caso entre em fase futura, IndexedDB (já adotado) acomoda essa necessidade sem nova migração de motor de armazenamento — `localStorage` não acomodaria.
* **Autenticação e contas de usuário:** não há gestão de contas nesta fase; barreira de entrada para nova vistoria é nula.
* **PWA — pré-cache do *app shell*:** mencionado como requisito de "offline-first" nos §1 e §4, mas a configuração completa de *service worker* (`vite-plugin-pwa`, estratégia de cache das imagens técnicas de `public/imagens`) deve ser detalhada em ficha técnica própria, por ser uma preocupação de build/infra distinta da lógica de dados aqui descrita.

---

## 10. Requisitos de Teste (Fixtures Mínimas)

Para que a validação e o motor de conflito sejam confiáveis, a suíte de testes deve cobrir, no mínimo:

1. JSON estruturalmente inválido (erro de sintaxe).
2. JSON válido, mas sem chaves obrigatórias do schema.
3. Vistoria de `versaoChecklist` anterior, com e sem migração disponível.
4. Arquivo excedendo o limite de tamanho aceito.
5. Envelope com lote misto: itens sem conflito, itens em conflito, item inválido isolado dentro de um lote majoritariamente válido.
6. Colisão de `vistoriaId` testando as quatro estratégias de resolução (§6.3), incluindo o caso de `revisao` empatada.
7. Vistoria `rascunho` gerando resultado parcial corretamente sinalizado.
8. Simulação de `QuotaExceededError` durante autosave.
