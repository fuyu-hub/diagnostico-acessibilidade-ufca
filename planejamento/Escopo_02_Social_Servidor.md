# Documento de Arquitetura e Escopo Técnico
## Sistema de Vistorias de Acessibilidade — Módulo Social / Servidor (Fase 2)

**Projeto:** Diagnóstico Acessibilidade UFCA
**Prioridade:** baixa — implementar somente após o Módulo Local (Fase 1, ver `Escopo_01_Local.md`) estar estável.
**Dependência explícita:** este documento não define um segundo contrato de dados, um segundo motor de conflito, nem uma segunda camada de status. Tudo aqui reutiliza `esquema.js` e `conflito.js` da Fase 1. Se, ao implementar, algo aqui parecer exigir lógica de mesclagem nova, é sinal de que a Fase 1 não foi reaproveitada corretamente.

---

## 1. Visão Geral

Este módulo adiciona um backend leve, sem sistema de contas, permitindo que vistorias concluídas localmente sejam publicadas em um servidor central, compartilhadas por link, e editadas colaborativamente por múltiplos avaliadores. A ausência de autenticação é uma escolha deliberada de simplicidade — o que exige, em contrapartida, controles compensatórios explícitos (§4).

### 1.1. Relação com a Fase 1

* O `EnvelopeExportacao` e o schema `Vistoria` são os mesmos. O servidor valida o payload recebido contra o **mesmo** schema Zod (ou uma tradução dele para a linguagem do backend) — nunca confiando apenas na validação já feita no cliente.
* O motor de conflito (`resolverConflito`, §6.3 do documento local) é reaproveitado integralmente: a única mudança é a origem do dado "remoto", que passa a vir de uma resposta HTTP em vez de um arquivo importado.
* `revisao` (contador monotônico da Fase 1) é o campo usado para detecção de conflito de escrita no servidor — não `dataUltimaEdicao` (relógio de cliente não é confiável, ver documento local §2.2).

### 1.2. Regra de Elegibilidade

**Somente vistorias com `status: "concluida"` podem ser enviadas ao servidor.** Vistorias parciais (`rascunho`, `em_andamento`) não são aceitas — nem pelo cliente, que deve desabilitar a ação de envio para elas, nem pelo servidor, que deve rejeitar qualquer payload com `status` diferente de `concluida`. Isso evita poluir o banco de pesquisa com dados reconhecidamente incompletos e mantém a distinção clara entre rascunho de campo e registro publicado.

---

## 2. Modelo de Concorrência

### 2.1. Detecção de Conflito por `revisao`

Toda escrita (`POST` de criação ou `PUT`/`PATCH` de atualização) inclui a `revisao` que o cliente possui no momento do envio. O servidor:

1. Se não existir registro com aquele `vistoriaId`: cria, define `revisao` recebida, responde `201`.
2. Se existir e a `revisao` recebida for **igual** à `revisao` armazenada: aplica a atualização, incrementa `revisao`, responde `200`.
3. Se existir e a `revisao` recebida for **menor** que a armazenada: **rejeita com `409 Conflict`**, retornando a versão atual completa do servidor no corpo da resposta.

O cliente, ao receber `409`, invoca o mesmo `resolverConflito(local, remota, estrategia)` da Fase 1 — a interface de resolução já construída (modal, quatro estratégias, comparativo de `revisao`) é reaproveitada sem alteração.

### 2.2. Por que não usar `dataUltimaEdicao` como trava

Já registrado na Fase 1: relógios de dispositivos móveis em campo divergem. Um `PUT` com timestamp adiantado sobrescreveria silenciosamente uma edição mais recente de outro avaliador. `revisao` é monotônica por construção e imune a essa falha.

---

## 3. Rotas e Comportamento

### 3.1. `POST /vistorias`

* **Uso:** publicar uma vistoria concluída pela primeira vez, ou criar um novo registro isolado a partir do Modo Cópia (§5.2).
* **Validação:** schema completo + `status === "concluida"`.
* Resposta inclui o link de acesso (§4.2).

### 3.2. `GET /vistorias/:vistoriaId`

* Usado tanto pelo Modo Contribuição quanto pelo Modo Cópia para obter o estado atual antes de editar.
* Resposta é a `Vistoria` completa, no mesmo schema — o cliente a trata exatamente como trataria um item importado de arquivo, incluindo possível migração de versão (§8 do documento local) caso o servidor guarde uma versão de checklist mais antiga que a do cliente.

### 3.3. `PUT` / `PATCH /vistorias/:vistoriaId`

* **Modo Contribuição** (§5.1): atualiza o registro original. Sujeito ao controle de concorrência de §2.1.

### 3.4. `DELETE /vistorias/:vistoriaId`

* Necessário para viabilizar retratação de consentimento (§4.4) — ausente nos rascunhos originais dos escopos. Requer o token de edição (§4.1), não apenas o `vistoriaId`.

---

## 4. Segurança e Autorização (Endpoint Anônimo)

A ausência de contas de usuário não deve significar ausência de controle de acesso. Decisões obrigatórias antes da implementação:

### 4.1. Par de Tokens (Leitura / Edição)

Um `vistoriaId` sozinho não deve conceder poder de escrita. Ao criar a vistoria no servidor, gerar dois identificadores:

* **Token de leitura:** compartilhável livremente, usado no Modo Cópia — permite `GET`, nunca `PUT`/`DELETE`.
* **Token de edição:** conhecido apenas por quem criou ou recebeu explicitamente, necessário para `PUT`/`PATCH`/`DELETE` — usado no Modo Contribuição.

Isso resolve a lacuna dos escopos originais, em que qualquer portador do link de compartilhamento tinha poder de escrita e exclusão irrestritos.

### 4.2. Proteção do Endpoint Público

Por não haver autenticação de conta, o endpoint é superfície de abuso por padrão. Requisitos mínimos antes de ir ao ar:

* Validação de schema **no servidor**, independente da validação do cliente.
* Limite de tamanho de payload.
* *Rate limiting* por IP em todas as rotas de escrita.
* CORS restrito à origem da aplicação.
* Desafio anti-automação (ex.: Turnstile/hCaptcha) no envio inicial, para mitigar submissões em massa.

### 4.3. Consentimento

O campo `consentimento` (schema da Fase 1, §2.2) já registra `versaoTermo` e `dataAceite`. O servidor deve persistir esse bloco tal como recebido e nunca aceitar uma vistoria sem `consentimento.aceito === true`.

### 4.4. Retratação

Como os dados alimentam pesquisa acadêmica, deve existir caminho de remoção mediante solicitação, mesmo que operado manualmente no início (ex.: `DELETE` acionado por administrador a partir do token de edição, sem necessidade de interface pública dedicada na primeira versão). Ausência completa de retratação é um risco de conformidade que deve ser resolvido antes da publicação de dados reais.

---

## 5. Modos de Roteamento (Query Strings)

### 5.1. Modo Contribuição — `?vistoriaId=UUID&token=EDICAO&modo=contribuir`

1. `GET /vistorias/:vistoriaId` (com token de edição) recupera o estado atual.
2. Estado local é populado; se a `versaoChecklist` do servidor for anterior à do cliente, aplicar migração (§8 do documento local) antes de exibir.
3. Ao salvar, `PUT`/`PATCH` envia a `revisao` conhecida — sujeito ao controle de concorrência de §2.1, com resolução de conflito reaproveitada da Fase 1 em caso de `409`.

### 5.2. Modo Cópia — `?vistoriaId=UUID&token=LEITURA&modo=copia`

1. `GET /vistorias/:vistoriaId` (token de leitura basta) recupera os dados originais como gabarito.
2. O `vistoriaId` original é descartado; um novo é gerado localmente. `revisao` reinicia em `0`, `status` retorna a `em_andamento` (o gabarito copiado não implica que a nova vistoria já esteja concluída para o novo bloco/contexto).
3. Ao finalizar, `POST /vistorias` cria um registro novo e isolado — este fluxo é, na prática, a mesma lógica de "Criar Cópia" já implementada na resolução de conflitos da Fase 1 (§6.3 do documento local: novo ID, `revisao` zerada, dado local original intocado), aplicada aqui a uma origem remota em vez de um arquivo.

---

## 6. Sincronização e Estado Local

* Ao receber `200`/`201` de sucesso, o cliente atualiza `sincronizada: true` e `dataUltimaSincronizacao` no documento local — **não** apaga o registro do armazenamento local (correção da versão original do escopo, que expurgava o `localStorage` após envio bem-sucedido). O avaliador pode precisar consultar a vistoria em campo no mesmo dia, sem rede, mesmo após tê-la publicado.
* Falha de rede durante o envio deixa `sincronizada: false`; a interface deve oferecer reenvio manual e, idealmente, uma fila de pendências visível (vistorias `concluida` e ainda não `sincronizada`).

---

## 7. Fora do Escopo (Explícito)

* Autenticação de conta de usuário, permissões por papel, e painel administrativo — não previstos nesta fase.
* Notificações em tempo real de edição concorrente (ex.: *websockets* avisando que outro avaliador está editando). Mitigado, por ora, apenas pela detecção reativa via `revisao`/`409`.
* Interface pública de retratação de consentimento self-service — tratada manualmente até que haja demanda que justifique o investimento (§4.4).

---

## 8. Requisitos de Teste (Fixtures Mínimas)

1. `POST` com `status` diferente de `concluida` — deve ser rejeitado.
2. `PUT` com `revisao` desatualizada — deve retornar `409` com corpo contendo a versão atual do servidor.
3. Resolução de conflito no cliente a partir de um `409` real, para as quatro estratégias.
4. Acesso de escrita com token de leitura — deve ser rejeitado.
5. Payload malformado ou acima do limite de tamanho — rejeitado antes de qualquer gravação.
6. Fluxo completo do Modo Cópia, verificando `revisao` zerada e novo `vistoriaId` no registro criado.
7. `DELETE` com token de edição válido e com token inválido.
