# Documento de Arquitetura e Escopo Técnico
## Sistema de Vistorias de Acessibilidade — Módulo de Acessibilidade da Interface (Fase 3)

**Projeto:** Diagnóstico Acessibilidade UFCA
**Escopo deste documento:** acessibilidade de uso da própria interface — contraste, navegação por teclado/teclado virtual, leitor de tela, motor cognitivo e casos de uso específicos para PCR e usuários comuns em contexto de campo.
**Fora do escopo:** modelo de dados, persistência local, backup, sincronização em servidor (cobertos nos documentos de Fase 1 e Fase 2). Regras de negócio do checklist de vistoria física também permanecem nos escopos anteriores.
**Dependência explícita:** este documento pressupõe a Fase 1 estável. Qualquer componente citado aqui (ex.: `CheclistItem.jsx`, `ModalConflito.jsx`, `Resultado.jsx`) já existe ou será criado nas fases anteriores; esta fase apenas define os requisitos de uso acessível desses componentes, não os reinventa.

---

## 1. Visão Geral

O sistema realiza vistorias de acessibilidade física em campo. É, portanto, estruturalmente provável que seus próprios operadores incluam pessoas com restrição de mobilidade (PCR), deficiência visual parcial, baixa literacia digital, uso prolongado em ambientes com luminosidade intensa (campo aberto, sol direto) e operação com uma só mão (dispositivo segurado enquanto se desloca em cadeira de rodas ou muleta).

A ironia de um sistema de diagnóstico de acessibilidade que seja ele próprio inacessível é um risco real de projeto — este documento define como evitá-la de forma sistemática, não por correções pontuais de última hora.

### 1.1. Princípios Norteadores

* **Acessibilidade é uma dimensão de qualidade, não uma fase tardia.** Cada componente novo deve nascer acessível; não haverá "sprint de acessibilidade" no final.
* **O contexto de campo determina o nível de exigência.** Dispositivo móvel, sol direto, uma mão livre, plataforma instável (cadeira de rodas em piso irregular): o sistema deve ser usável nessas condições, não apenas em mesa e Wi-Fi.
* **Conformidade com WCAG 2.2 AA é o piso, não o teto.** Requisitos específicos de campo e de PCR podem exigir critérios além do AA padrão.
* **Não dividir usuários em "comuns" e "especiais".** Soluções que beneficiam PCR (alvo de contraste alto, toque amplo, leitor de tela) beneficiam também qualquer usuário em condição de estresse sensorial ou motor temporário.

---

## 2. Perfis de Uso e Cenários Críticos

Antes de listar requisitos técnicos, é necessário nomear os cenários reais que os motivam. Cada requisito posterior deve ser rastreável a ao menos um cenário desta seção.

### 2.1. Perfis de Usuário

| ID | Perfil | Dispositivo Típico | Condição de Uso |
|---|---|---|---|
| P1 | Avaliador sem restrição | Smartphone Android/iOS | Em campo, luz solar, uma mão livre |
| P2 | Avaliador com mobilidade reduzida (cadeira de rodas) | Smartphone fixado em suporte ou segurado com uma mão | Plataforma instável, foco de atenção dividido |
| P3 | Avaliador com baixa visão (não usuário de leitor de tela) | Smartphone com zoom do SO ativado (até 200%) | Precisa de alto contraste, texto ampliado sem quebra de layout |
| P4 | Avaliador cego ou com visão muito reduzida (usuário de leitor de tela) | TalkBack (Android) / VoiceOver (iOS) | Navegação linear; sem referência visual de posição |
| P5 | Avaliador com tremor ou mobilidade fina reduzida | Smartphone com teclado alternativo ou switch | Alvos de toque grandes, sem gestos de precisão |
| P6 | Avaliador com baixa literacia digital | Qualquer | Baixo domínio de metáforas de UI; textos curtos e instruções em linguagem simples |
| P7 | Coordenador de pesquisa (revisor dos resultados) | Desktop ou tablet | Acesso ao resultado exportado; pode usar teclado físico |

### 2.2. Cenários Críticos

| ID | Cenário | Perfis Afetados |
|---|---|---|
| C1 | Preencher checklist com o smartphone ao sol, sem apoio | P1, P2, P3 |
| C2 | Operar todo o fluxo com uma mão (outra ocupa muleta ou aro da cadeira) | P2, P5 |
| C3 | Navegar do início ao fim usando TalkBack ou VoiceOver sem referência visual | P4 |
| C4 | Recuperar uma vistoria salva após reinicialização do aplicativo | P1–P6 |
| C5 | Resolver conflito de importação sem perder contexto de qual versão é qual | P1, P7 |
| C6 | Exportar e compartilhar uma vistoria em campo, sem desktop | P1–P5 |
| C7 | Ler e compreender o resultado percentual e a classificação obtida | P1–P6 |
| C8 | Preencher o termo de consentimento e compreender suas implicações | P4, P6 |
| C9 | Usar a aplicação com zoom do SO em 150–200% sem quebra horizontal de layout | P3 |
| C10 | Ativar a aplicação após longo período sem uso (cold start) em campo | P1–P5 |

---

## 3. Requisitos de Contraste e Apresentação Visual

### 3.1. Metas de Contraste

| Elemento | Requisito Mínimo | Requisito Recomendado (campo/sol) |
|---|---|---|
| Texto de corpo (≥16px regular ou ≥14px bold) | 4,5:1 (AA) | 7:1 (AAA) — luz solar degrada percepção em ~30% |
| Texto grande (≥24px regular ou ≥18px bold) | 3:1 (AA) | 4,5:1 |
| Ícones e gráficos informativos | 3:1 contra fundo (AA) | 4,5:1 |
| Estado de foco de teclado (anel/outline) | 3:1 contra fundo adjacente | 4,5:1, mínimo 2px de espessura |
| Texto sobre fundos de gradiente | Verificar nas duas extremidades e no ponto médio | — |

O tema padrão deve ser desenvolvido já mirando o requisito recomendado de campo, não o mínimo AA, para compensar as perdas de percepção em ambiente externo luminoso.

### 3.2. Modo de Alto Contraste

* Detectar `prefers-contrast: more` (CSS Media Query Level 5) e aplicar paleta de alto contraste sem requerer ação do usuário.
* O modo de alto contraste deve ser também selecionável manualmente (botão ou toggle nas configurações) para usuários cujo SO não emite essa preferência mas que a desejam.
* No modo de alto contraste: eliminar sombras decorativas, gradientes suaves e fundos semi-transparentes que reduzem nitidez de bordas.

### 3.3. Tamanho de Texto e Zoom

* O layout deve permanecer funcional (sem overflow horizontal, sem sobreposição de elementos) com o tamanho de texto do SO configurado até 200% (`font-size` base do documento: `1rem` sem redefinição em `px`).
* Evitar o uso de unidades de fonte fixas (`px`) em componentes de interface; usar `rem`/`em` em todos os textos e ícones de texto.
* Testar explicitamente os cenários C9 e P3 com zoom de SO em 150% e 200%.

### 3.4. Modo Escuro / Claro

* Detectar `prefers-color-scheme` e responder com tema correspondente.
* As razões de contraste em §3.1 devem ser verificadas **em ambos os temas** — temas escuros com texto cinza-claro frequentemente falham em contraste se não revisados especificamente.
* Botão de alternância manual de tema disponível nas configurações.

---

## 4. Navegação por Teclado e Teclado Virtual

### 4.1. Teclado Físico (Desktop e Tablet com Teclado)

* Todos os fluxos navegáveis por mouse devem ser navegáveis apenas por teclado (`Tab`, `Shift+Tab`, `Enter`, `Space`, setas direcionais onde aplicável — ex.: grupo de radio buttons do checklist).
* A ordem de foco deve seguir a ordem visual/lógica — não depender de `tabindex` positivos para reordenar artificialmente.
* Nenhum foco deve ser preso em um componente sem rota de saída por teclado (`focus trap` apenas em modais, com liberação pelo `Escape`).
* Modais (`ModalExcluirVistoria`, `ModalConflito`, `ModalConsentimento`) devem implementar corretamente `focus trap`: ao abrir, focar o primeiro elemento interativo interno; ao fechar, devolver o foco ao elemento que abriu o modal.

### 4.2. Teclado Virtual (Mobile — Cenários C1, C2)

* Formulários longos (ex.: checklist) não devem exibir comportamentos de salto de viewport inesperados ao abrir o teclado virtual. Estratégia recomendada: usar `position: fixed` com cautela e testar em dispositivos físicos (não apenas simuladores).
* Campo de observação (`observacao`) de cada critério deve ter `inputmode="text"` e `autocomplete="off"` (evitar sugestões irrelevantes em campo técnico).
* O campo de texto de confirmação de exclusão (§2.4 do Escopo 1) deve ter `autocorrect="off"` e `autocapitalize="none"` para evitar que o auto-completar do SO interfira na digitação exata do nome do bloco.
* Ao abrir um campo de texto em scroll view, garantir que o campo fique visível acima do teclado virtual (`scrollIntoView` com `block: "nearest"`).

### 4.3. Operação com Uma Mão (Cenários C2, P2, P5)

* Alvos de toque mínimos: 44×44 CSS px (WCAG 2.2, SC 2.5.8) em todos os elementos interativos — botões, checkboxes, radio buttons do checklist, ícones de ação nos `CartaoVistoria`.
* Ações destrutivas (exclusão, cancelar importação) não devem estar posicionadas adjacentes a ações construtivas (salvar, confirmar) — espaçamento mínimo de 8px entre alvos de toque críticos ou separação visual inequívoca.
* Considerar posicionamento de ações primárias na zona de alcance de polegar (parte inferior da tela) em layouts mobile-first, especialmente para `CheclistItem` e navegação entre seções do checklist.
* O gesto de deslize (*swipe*) pode ser uma alternativa de navegação entre seções, mas nunca deve ser o **único** caminho — sempre haver botão equivalente visível.

---

## 5. Suporte a Leitor de Tela

### 5.1. Requisitos Gerais

* Todo conteúdo informativo deve ter equivalente textual acessível: ícones sem rótulo visível recebem `aria-label`; imagens informativas recebem `alt` descritivo; imagens decorativas recebem `alt=""`.
* A linguagem do documento deve ser declarada (`<html lang="pt-BR">`); trechos em outro idioma (ex.: termos técnicos em inglês em notas internas) recebem `lang` inline.
* Nenhuma informação deve ser transmitida **apenas** por cor (ex.: status da vistoria identificado só por cor de badge — deve haver também texto ou ícone com label).

### 5.2. Semântica Estrutural

| Elemento | Requisito Semântico |
|---|---|
| Checklist de critérios | `<fieldset>` + `<legend>` por seção; cada item como `<label>` associado a `<input type="radio">` ou grupo equivalente |
| Status da vistoria (badge) | Texto legível por SR, não apenas `aria-hidden`; usar `aria-label` se o texto for abreviado |
| Progresso de preenchimento | `role="progressbar"` com `aria-valuenow`, `aria-valuemin`, `aria-valuemax` e `aria-label` descritivo |
| Toast / notificações | `role="status"` (informativo) ou `role="alert"` (erro crítico); `aria-live="polite"` para status, `aria-live="assertive"` para alertas de erro |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apontando para o título da modal |
| Cartão de vistoria | Região com `aria-label` que inclua nome do bloco e status atual |
| Resultado percentual | Lido como texto completo: "Conformidade: 73 por cento — Nível intermediário", não apenas "73%" |

### 5.3. Fluxo com Leitor de Tela (Cenário C3)

Mapeamento completo dos anúncios esperados para o fluxo principal — **este mapeamento deve ser validado manualmente com TalkBack e VoiceOver antes de cada release**:

1. **Tela inicial:** SR anuncia: título da aplicação, instrução de início, botão "Nova Vistoria" e lista de vistorias existentes com status.
2. **Nova vistoria / Triagem:** cada pergunta de triagem anunciada com rótulo e estado atual; ao responder, SR confirma a seleção.
3. **Checklist:** seção anunciada por `<legend>`; cada critério lido com a pergunta completa e o estado atual da resposta (`não respondido`, `conforme`, `não conforme`, `não se aplica`); campo de observação anunciado como opcional.
4. **Modal de exclusão:** SR anuncia título da modal, instrução de digitação do nome, campo de texto com `aria-label`, botões de ação com seus nomes e consequências.
5. **Resultado:** SR lê percentual e classificação como texto contínuo; aviso de resultado parcial lido de forma destacada (`role="alert"`).
6. **Importação / Conflito:** progresso do lote anunciado ("conflito 2 de 5"); opções de resolução com descrições de consequência, não apenas rótulos curtos ("Sobrescrever — substitui a versão local pela importada").

### 5.4. Gestos de Leitor de Tela (Mobile)

* Evitar conflito entre gestos nativos de TalkBack/VoiceOver e gestos customizados da aplicação. Se houver gestos de swipe para navegação entre seções (§4.3), garantir que a versão com SR ativado use controles alternativos (botões de seta) sem depender do gesto.
* Não interceptar eventos de toque de forma que impeça o modo de exploração (toque para ouvir) do TalkBack.

---

## 6. Acessibilidade Cognitiva e Linguagem

### 6.1. Linguagem Simples

* Toda instrução de interface e mensagem de erro deve ser escrita em linguagem acessível: frases curtas, voz ativa, sem jargão técnico não explicado.
* Critério de verificação: texto testado em ferramenta de legibilidade e revisado por pessoa com perfil P6 antes de lançamento.
* Erros de validação devem dizer **o que aconteceu** e **o que o usuário deve fazer** — nunca apenas um código ou um termo técnico.

  **Exemplos:**
  | Mensagem atual (inadequada) | Mensagem acessível |
  |---|---|
  | "Schema validation failed" | "Arquivo inválido. Verifique se o arquivo exportado está completo e tente novamente." |
  | "QuotaExceededError" | "Armazenamento quase cheio. Exporte suas vistorias antes de continuar." |
  | "409 Conflict" | "Outra versão desta vistoria foi salva enquanto você trabalhava. Escolha qual versão manter." |

### 6.2. Prevenção de Erros (WCAG 3.3)

* Toda ação irreversível (exclusão definitiva, sobrescrever em conflito) exige confirmação explícita com descrição clara da consequência antes da execução — não apenas botão "Confirmar" genérico.
* Formulários com múltiplas etapas (triagem → checklist → resultado) devem permitir retroceder sem perder o que foi preenchido nas etapas anteriores.
* A aplicação **não deve impor limites de tempo** para nenhuma ação. Se uma sessão de SO encerrar o app, o autosave (§4.4 do Escopo 1) garante que o estado não seja perdido — mas o usuário não deve ser pressionado por um cronômetro artificial.

### 6.3. Consistência e Previsibilidade

* Padrões de interação consistentes em toda a aplicação: o mesmo gesto / tecla / componente sempre faz a mesma coisa. Não usar modais em alguns contextos e drawers em outros para ações da mesma categoria.
* Ícones reutilizados com o mesmo significado: um ícone que significa "excluir" em `CartaoVistoria` não pode significar "arquivar" em outro contexto.
* Feedback imediato: toda ação do usuário com efeito observável (salvar, exportar, deletar item) deve produzir feedback visual **e** auditivo/tátil (vibração — `navigator.vibrate` se disponível) em até 400ms.

### 6.4. Redução de Carga Cognitiva em Campo

* Exibir apenas o necessário para a etapa atual: no checklist, não mostrar seções futuras não desbloqueadas se isso gerar poluição visual.
* Indicador de progresso sempre visível durante o preenchimento do checklist — não escondê-lo em scroll.
* Ao retornar a uma vistoria interrompida (cenário C10), exibir de forma proeminente o ponto de continuação ("Você estava na seção X, critério Y").

---

## 7. Suporte a Tecnologias Assistivas e Preferências do SO

### 7.1. Preferências Declaradas pelo SO

| Preferência CSS / API | Comportamento Esperado |
|---|---|
| `prefers-reduced-motion` | Desativar ou reduzir substancialmente animações e transições; spinner de loading substitui por texto "Carregando…" |
| `prefers-color-scheme: dark` | Aplicar tema escuro com contrastes verificados (§3.4) |
| `prefers-contrast: more` | Aplicar paleta de alto contraste (§3.2) |
| `prefers-reduced-data` | Evitar carregamento de assets decorativos não críticos (imagens de ilustração, fontes extras) |
| `font-size` do SO aumentado | Layout funcional sem overflow horizontal até 200% (§3.3) |

### 7.2. Switch Access e Teclados Alternativos (Perfil P5)

* A aplicação deve ser utilizável com Switch Access (Android) e varredura automática (iOS), que dependem de foco de teclado correto — confirmando que os requisitos de §4.1 cobrem também esse caso.
* Não usar `outline: none` em elementos focalizados sem substituição visível equivalente. Esta é a principal causa de inacessibilidade para usuários de Switch Access e teclado físico.

### 7.3. Zoom e Reflow (Cenário C9)

* Ao nível de zoom de 400% (requisito WCAG 2.2, SC 1.4.10 — Reflow), o conteúdo deve ser apresentado em coluna única sem scroll horizontal, exceto para elementos que por sua natureza exigem layout bidimensional (ex.: tabelas de dados comparativos no conflito de revisão).
* Testar `ModalConflito` especificamente — tabelas comparativas de `revisao` e `dataUltimaEdicao` são candidatas a quebra de layout em zoom alto; avaliar reformulação em lista vertical para mobile.

---

## 8. Componentes Prioritários e Requisitos Específicos

Esta seção detalha os requisitos de acessibilidade por componente existente ou planejado, em ordem de impacto de uso.

### 8.1. `CheclistItem.jsx` — Alta Criticidade

* Cada item é um grupo de 3–4 opções de resposta (conforme / não conforme / não se aplica / não respondido). Implementar como `<fieldset>` + `<legend>` com o texto do critério, e as opções como `<input type="radio">` com `<label>` associado.
* O `<legend>` deve conter o texto completo do critério — não um número ou código abreviado.
* Tamanho de alvo de toque mínimo: 44×44px por opção de resposta.
* Campo de observação (`<textarea>`): `aria-label` descritivo e vinculado ao critério correspondente (ex.: "Observação para o critério: Largura mínima da rampa"); não apenas `placeholder`.
* Estado de resposta atual deve ser anunciado pelo SR ao retornar ao item.

### 8.2. `CartaoVistoria.jsx` — Alta Criticidade

* O card inteiro pode ser tocado para abrir — se implementado como elemento clicável não-button/link, adicionar `role="button"` e `tabindex="0"` com handler de `keydown` para Enter e Space.
* Status da vistoria (ex.: "Em andamento") não pode ser comunicado apenas pela cor do badge — incluir texto legível ou `aria-label`.
* Ações secundárias (exportar, excluir) no card: garantir que seus `aria-label` incluam o contexto do bloco ("Excluir vistoria do Bloco A", não apenas "Excluir").

### 8.3. `ModalExcluirVistoria.jsx` — Alta Criticidade

* Implementar `focus trap` completo (§4.1).
* Campo de confirmação por digitação: `aria-label` que instrua o que digitar; `aria-describedby` apontando para o aviso de irreversibilidade.
* Botão de exclusão deve ser desabilitado (`disabled` + `aria-disabled`) até que o nome seja digitado corretamente — com `aria-live="polite"` anunciando quando a condição for atendida.

### 8.4. `ModalConflito.jsx` — Média Criticidade

* Ao abrir, SR anuncia o contexto completo: bloco em conflito, revisão local vs. importada.
* As quatro opções de resolução devem ter descrições completas de consequência como `aria-describedby`, não apenas rótulos curtos.
* Indicador de progresso de lote ("conflito 2 de 5"): `aria-live="polite"` a cada transição.
* Tabela comparativa: `<table>` semântica com `<th>` e `scope` correto; ou, para mobile/zoom, reformular como lista de pares chave-valor.

### 8.5. `Resultado.jsx` / `ResumoBloco.jsx` — Alta Criticidade

* O percentual deve ser lido pelo SR como texto descritivo completo, não como um número solto.
* Aviso de resultado parcial deve usar `role="alert"` para garantir anúncio imediato pelo SR ao ser exibido.
* Gráfico ou barra de progresso visual deve ter equivalente textual completo (não apenas `aria-label` com o número — também a classificação e o que ela significa).
* A classificação de nível (ex.: "Nível básico", "Nível intermediário") deve ser explicada inline ou por link de glossário — não assumir que o usuário sabe o que cada nível implica.

### 8.6. `SeletorNivelEnsino.jsx` — Média Criticidade

* Se implementado como grupo de botões ou cards selecionáveis, usar `role="radiogroup"` + `role="radio"` com `aria-checked` para que o SR comunique a seleção como seria em radio button nativo.
* A opção selecionada deve ser visualmente inequívoca **e** anunciada pelo SR sem necessidade de re-explorar o grupo.

### 8.7. Termos de Consentimento (`ModalConsentimento` ou tela equivalente) — Alta Criticidade

* Texto do termo deve estar em linguagem simples (§6.1), com comprimento razoável — não um bloco de texto legal inacessível.
* Se o texto for longo, usar scroll interno com `tabindex="0"` para que o SR possa navegar o conteúdo sem perder o contexto da modal.
* O checkbox ou botão de aceite deve ser rotulado de forma que o SR leia a ação completa ("Aceito os termos de uso e consentimento de participação na pesquisa").
* `versaoTermo` deve ser exibida visivelmente (ex.: "Versão 1.2 — setembro de 2026").

### 8.8. Toasts e Notificações — Média Criticidade

* `role="status"` para mensagens informativas de sucesso (ex.: "Vistoria salva"); `role="alert"` para erros.
* Tempo de exibição mínimo: 5 segundos para mensagens curtas; mensagens longas ou que exijam ação do usuário não devem desaparecer automaticamente.
* Toasts não devem ser o **único** canal de feedback para operações críticas — complementar com estado visual persistente quando necessário (ex.: badge "Não sincronizada" no card, além do toast de falha de envio).
* Botão de fechar no toast com `aria-label="Fechar notificação"`.

---

## 9. Acessibilidade do PWA e Contexto Offline

### 9.1. Tela de Instalação e Prompt de PWA

* O prompt de instalação do PWA (A2HS — Add to Home Screen) não deve interferir no fluxo principal na primeira vez em que o app é aberto. Exibir apenas após uma interação significativa do usuário (ex.: após a primeira vistoria salva).
* A tela de "sem conexão" (quando o service worker não consegue carregar o recurso pedido) deve ser acessível: texto descritivo, instrução de o que fazer, botão de retry com label claro.

### 9.2. Feedback de Estado de Conectividade

* Indicador discreto mas perceptível de estado offline/online — não apenas ausência de funcionalidade (o usuário precisa saber por que o envio ao servidor está desabilitado, não apenas que está).
* Em modo offline, desabilitar visualmente e semanticamente (`disabled` + `aria-disabled` + tooltip/descrição) os controles de sincronização — sem removê-los do DOM, para não confundir o SR.

---

## 10. Testes de Acessibilidade

### 10.1. Testes Automatizados

Ferramentas recomendadas (não exclusivas):

* **axe-core** integrado à suíte de testes existente (via `@axe-core/react` ou `jest-axe`) — detecta automaticamente violações de WCAG para os componentes da lista do §8.
* **Lighthouse** (CI ou pré-commit hook) com auditoria de acessibilidade — score mínimo aceitável: 90.
* **eslint-plugin-jsx-a11y** — linting estático de acessibilidade JSX (ex.: `alt` faltando, `aria-label` ausente, `onClick` sem handler de teclado).

### 10.2. Testes Manuais Obrigatórios

Os testes automatizados detectam cerca de 30–40% das falhas de acessibilidade; o restante exige verificação humana. Testes manuais mínimos antes de cada release relevante:

| Teste | Ferramenta | Perfil | Cenário |
|---|---|---|---|
| Navegação completa por teclado físico (Tab order, focus trap em modais) | Teclado, sem mouse | P7 | Todos os fluxos |
| Leitor de tela — fluxo completo no Android | TalkBack (Android) | P4 | C3 |
| Leitor de tela — fluxo completo no iOS | VoiceOver (iOS) | P4 | C3 |
| Contraste em ambiente externo simulado (tela com brilho máximo) | Dispositivo físico, luz intensa | P1, P3 | C1 |
| Zoom SO 200% — sem overflow horizontal | Configurações do SO | P3 | C9 |
| Reflow 400% — scroll apenas vertical | DevTools zoom ou SO | P3 | C9 |
| Operação com uma mão — todos os alvos de toque acessíveis | Dispositivo físico | P2, P5 | C2 |
| `prefers-reduced-motion` ativado — ausência de animações abruptas | DevTools ou SO | P5 | — |
| Linguagem simples — compreensão por usuário não técnico | Teste com usuário real | P6 | C7, C8 |

### 10.3. Matriz de Conformidade Mínima

| Critério WCAG 2.2 | Nível | Componentes Críticos |
|---|---|---|
| 1.1.1 Conteúdo não textual | A | Ícones, badges de status, gráfico de resultado |
| 1.3.1 Informação e Relacionamentos | A | Checklist (`fieldset`/`legend`), tabela de conflito |
| 1.3.3 Características Sensoriais | A | Status não comunicado apenas por cor |
| 1.4.1 Uso de Cor | A | Todos os badges e indicadores de estado |
| 1.4.3 Contraste (Mínimo) | AA | Todos os textos |
| 1.4.4 Redimensionar Texto | AA | Layout com zoom SO 200% |
| 1.4.10 Reflow | AA | Layout com zoom 400% |
| 1.4.11 Contraste de Componentes | AA | Bordas de inputs, ícones informativos |
| 1.4.12 Espaçamento de Texto | AA | Sem overflow ao aumentar espaçamento |
| 1.4.13 Conteúdo em Hover/Focus | AA | Tooltips de descrição de classificação |
| 2.1.1 Teclado | A | Todos os fluxos |
| 2.1.2 Sem Armadilha de Teclado | A | Modais com focus trap correto |
| 2.4.3 Ordem do Foco | A | Tab order lógico |
| 2.4.7 Foco Visível | AA | Anel de foco visível em todos os elementos |
| 2.4.11 Foco Não Obscurecido (Mínimo) | AA | Sticky headers não cobrem elemento focado |
| 2.5.3 Rótulo no Nome | A | Botões com `aria-label` coerente com texto visível |
| 2.5.8 Tamanho Mínimo do Alvo | AA | 44×44px em todos os controles interativos |
| 3.1.1 Idioma da Página | A | `<html lang="pt-BR">` |
| 3.2.1 Em Foco | A | Foco não muda contexto inesperadamente |
| 3.3.1 Identificação do Erro | A | Mensagens de erro específicas e localizadas |
| 3.3.2 Rótulos ou Instruções | A | Todos os campos com label visível |
| 4.1.2 Nome, Função, Valor | A | Todos os componentes customizados com ARIA correto |
| 4.1.3 Mensagens de Status | AA | `role="status"` / `role="alert"` em toasts |

---

## 11. Fora do Escopo (Explícito)

* **Conteúdo do checklist de vistoria física**: os critérios de acessibilidade avaliados (rampa, corrimão, etc.) pertencem aos escopos 1 e 2; este escopo trata apenas de como a interface que exibe esses critérios é ela mesma acessível.
* **Língua de Sinais (LIBRAS)**: não previsto nesta fase. A adição de vídeos em LIBRAS para instruções e termos de consentimento é recomendada para versões futuras, especialmente dado o contexto de pesquisa acadêmica inclusiva.
* **Tradução multilíngue**: a aplicação é em português do Brasil; suporte a outros idiomas não está no escopo.
* **Customização avançada de perfil de acessibilidade por usuário**: preferências são lidas do SO (`prefers-*`) ou via configuração global única — não há perfis de usuário por conta (alinhado com a ausência de autenticação da Fase 1 e 2).

---

## 12. Fases de Implementação Sugeridas

Este documento define *o quê*, não *quando*. Para facilitar a priorização, os requisitos são agrupados por impacto e esforço estimado:

### Fase 3A — Fundação (impacto alto, esforço baixo a médio)

* `<html lang="pt-BR">` e `<meta charset>` corretos.
* Contraste mínimo AA verificado em todo o tema (ferramentas automatizadas).
* Substituição de `px` por `rem` em fontes e tamanhos críticos.
* `alt` e `aria-label` básicos em todos os ícones e imagens.
* `role="status"` / `role="alert"` nos toasts existentes.
* `outline` de foco visível — remover qualquer `outline: none` sem substituto.
* `eslint-plugin-jsx-a11y` instalado e sem erros novos.

### Fase 3B — Semântica e Teclado (impacto alto, esforço médio)

* Refatoração de `CheclistItem.jsx` para `<fieldset>` + `<legend>` + `<input type="radio">`.
* `focus trap` em todas as modais.
* Tab order auditado e corrigido em todos os fluxos.
* Alvos de toque ≥44×44px em componentes críticos.
* Mensagens de erro reescritas em linguagem simples.
* `axe-core` integrado na suíte de testes (zero violações críticas).

### Fase 3C — Leitor de Tela e Casos Avançados (impacto médio-alto, esforço alto)

* Teste manual completo com TalkBack e VoiceOver.
* Mapeamento de anúncios do §5.3 validado e corrigido.
* Reflow a 400% sem scroll horizontal (exceto tabelas necessárias).
* `prefers-reduced-motion` implementado.
* Revisão de linguagem simples com usuário real de perfil P6.
* Indicador de progresso de retorno a vistoria interrompida (C10).

### Fase 3D — Refinamento e Auditoria (impacto médio, esforço baixo a médio)

* Lighthouse CI com score ≥90 de acessibilidade em pipeline.
* Teste de contraste em dispositivo físico com brilho máximo e luz solar.
* Alto contraste manual (toggle de configurações).
* Vibração de feedback tátil (`navigator.vibrate`) em ações confirmadas.
* Documentação interna de padrões de acessibilidade para novos componentes.

---

## 13. Requisitos de Documentação Interna

* **Guia de componentes acessíveis**: documento interno (ex.: `docs/acessibilidade-componentes.md`) listando os padrões ARIA adotados para cada tipo de componente — evita que novos colaboradores introduzam regressões por desconhecimento.
* **Checklist de revisão de acessibilidade por PR**: lista mínima de verificações antes de aprovar um PR que afete componentes de interface (ex.: "Novo componente tem `aria-label`? Tab order verificado? Contraste verificado?").
* **Registro de decisões de acessibilidade** (ADR): decisões não óbvias (ex.: por que `radiogroup` em vez de `listbox` no checklist; por que `role="alert"` apenas em erros e não em sucessos) devem ser registradas para não serem revertidas sem intenção.
