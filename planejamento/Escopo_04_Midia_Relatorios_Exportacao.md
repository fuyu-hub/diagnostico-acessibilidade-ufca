# Documento de Arquitetura e Escopo Técnico
## Mídia, Relatórios e Exportação Documental (Fase 4)

**Projeto:** Diagnóstico Acessibilidade UFCA  
**Escopo deste documento:** pipeline completo de captura, compressão e manipulação de evidências fotográficas no checklist, serialização em backups locais (.json), geração client-side de laudos técnicos em PDF e exportação de planilhas executivas em Excel (.xlsx) com fotos integradas.  
**Dependência:** módulo local consolidado ([Escopo 1](Escopo_01_Local.md)).

---

## 1. Visão Geral e Justificativa Metodológica

Em auditorias de acessibilidade física espacial baseadas na **NBR 9050:2020**, a evidência visual é o pilar comprobatório mais relevante para fundamentar termos de ajustamento de conduta, reformas prediais e projetos de extensão acadêmica. Um laudo técnico sem registro fotográfico das não-conformidades possui baixo valor prático para os gestores da infraestrutura universitária e escolar.

No entanto, o uso de fotografias em uma aplicação web progressiva (*offline-first*) impõe desafios técnicos severos:
* Câmeras de smartphones modernos produzem arquivos entre **4 MB e 15 MB** (12 MP a 50 MP).
* Salvar 20 a 50 fotos brutas em uma vistoria consumiria centenas de megabytes, estourando rapidamente os limites do IndexedDB, inviabilizando backups em arquivo JSON e congelando a *thread* principal na montagem de relatórios.

Este documento estabelece a engenharia para **comprimir fotografias no exato momento do upload no navegador**, embuti-las de forma ultra-leve no arquivo de backup canônico e disponibilizá-las diretamente nos botões de relatório em **PDF oficial** e **Planilha Excel (.xlsx)**.

---

## 2. Pipeline de Processamento e Compressão de Imagens

### 2.1. Processamento Client-Side via Canvas

Toda imagem capturada pela câmera do dispositivo ou selecionada da galeria deve passar por uma rotina pura de conversão em memória antes de ser gravada no estado ou no IndexedDB:

```
[Arquivo Bruto (4-15 MB)] 
       │
       ▼
[Decodificação em Memória (ImageBitmap / HTMLImageElement)]
       │
       ▼
[Redimensionamento Proporcional (Downscale max 1280px / 1600px)]
       │
       ▼
[Compressão em Formato WebP (Qualidade: 0.75)] ──(fallback)──> [JPEG (0.75)]
       │
       ▼
[String Base64 Compacta Data URL (80 KB a 130 KB)]
```

### 2.2. Parâmetros Canônicos de Otimização

* **Dimensão Máxima:** 1280px no lado mais longo (largura ou altura). Para detalhes de desnível ou corrimão, 1280px fornece nitidez equivalente a ~1.5 MP, perfeita para impressão A4 e tela.
* **Formato de Saída:** `image/webp` (suportado por >97% dos navegadores globais, incluindo Chrome, Edge, Safari iOS 14+ e Firefox). Fallback automático para `image/jpeg` caso `toDataURL('image/webp')` retorne PNG não comprimido.
* **Fator de Qualidade:** `0.75` (ótimo balanço entre ausência de artefatos visuais e peso mínimo).
* **Taxa de Compressão Esperada:** Redução média de **95% a 98%** do tamanho original do arquivo.
* **Orientação EXIF:** Normalização automática de orientação através de desenho no canvas para evitar fotos invertidas vindas de câmeras de celular.

---

## 3. Modelo de Dados e Serialização no Backup

### 3.1. Armazenamento no Contrato Canônico (Zod)

O campo `foto` do objeto `RespostaCriterio` em `src/dados/esquema.js` armazena a string Base64 em formato Data URL:

```javascript
export const RespostaCriterio = z.object({
  resposta: z.enum(['conforme', 'nao_conforme', 'nao_aplica']).nullable(),
  observacao: z.string().default(''),
  foto: z.string().nullable().optional(), // 'data:image/webp;base64,UklGRt4...'
});
```

### 3.2. Vantagens do Formato Embutido no Backup (.json)

* **Portabilidade em Arquivo Único:** Ao exportar o backup da vistoria pelo Painel ou Ajustes, todas as fotografias viajam de forma transparente dentro do próprio arquivo `.json`.
* **Sem Dependência de Pastas Externas:** Elimina a necessidade de criar arquivos ZIP secundários ou lidar com descompactação de pastas no celular do usuário.
* **Compatibilidade com a Barreira de 15 MB:** 
  * 1 vistoria típica: ~30 KB de texto.
  * 25 fotos em WebP de ~100 KB = ~2,5 MB no JSON.
  * O arquivo final permanece muito abaixo do limite de segurança de 15 MB estabelecido na Fase 1.

---

## 4. Geração de Relatório Técnico em PDF

O botão **"Relatório em PDF"** no painel da vistoria (`DashboardVistoria.jsx`) deixará o status *"Em breve"* e passará a gerar o laudo técnico completo via biblioteca `jspdf` com `jspdf-autotable`.

### 4.1. Estrutura do Documento PDF

1. **Capa Institucional:**
   * Brasão / Identificação do projeto de extensão UFCA.
   * Dados do estabelecimento (nome da escola/bloco, endereço, pavimentos, alunos, data e horário).
   * Equipe de avaliadores responsáveis.
2. **Sumário Executivo e Indicadores:**
   * Índice de Avaliação de Acessibilidade (IAA) consolidado (0,0 a 10,0).
   * Rótulo de classificação (Crítico, Insuficiente, Adequado, Excelente).
   * Quadro quantitativo: total de exigências ativas, conformes, não conformes e não aplicáveis.
   * Gráfico visual ou tabela percentual de conformidade por seção normativa.
3. **Quadro de Inconformidades e Evidências Fotográficas:**
   * Listagem detalhada dos itens com resposta `Não Conforme`.
   * Enunciado oficial e critério técnico da NBR 9050 infringido.
   * Observação de campo registrada pelo avaliador.
   * **Evidência Fotográfica:** Inserção da foto comprimida ao lado ou logo abaixo da observação com borda sutil e legenda de identificação técnica.
4. **Apêndice com Checklist Completo:**
   * Tabela condensada com todas as perguntas avaliadas para fins de auditoria integral.
5. **Rodapé e Numeração:**
   * Paginação no formato "Página X de Y", timestamp de emissão e versão do aplicativo.

---

## 5. Geração de Planilha Executiva (Excel .xlsx)

O botão **"Planilha (Excel)"** em `DashboardVistoria.jsx` utilizará a biblioteca client-side `exceljs` para montar o relatório tabular.

### 5.1. Recursos da Planilha Gerada

* **Aba 1 — Resumo Executivo:** Metadados da instituição avaliada, equipe de vistoria, data, contagens de conformidade e nota final do IAA.
* **Aba 2 — Diagnóstico Completo:**
  * Colunas: `ID`, `Seção`, `Subgrupo`, `Critério NBR 9050`, `Resposta`, `Observações de Campo`, `Evidência Fotográfica`.
  * Formatação condicional: células com "Conforme" em verde suave, "Não Conforme" em vermelho suave e "Não se Aplica" em amarelo/cinza.
* **Imagens Ancoradas nas Células:**
  * Através da API `worksheet.addImage()`, cada foto em WebP/PNG é inserida como miniatura redimensionada e ancorada à célula da linha correspondente.
  * Altura da linha auto-ajustada para exibir a miniatura de forma limpa, permitindo ao engenheiro/arquiteto expandir a foto no Excel do computador.

---

## 6. Interface do Usuário (UI/UX)

### 6.1. Tela do Item de Checklist (`ItemChecklist.jsx`)
* **Botão de Adição de Foto:**
  * Mobile: Aciona a câmera traseira do celular diretamente (`capture="environment"`).
  * Desktop: Abre seletor de arquivos de imagem (PNG, JPG, WEBP).
* **Miniatura de Pré-visualização:**
  * Exibição imediata da foto processada com efeito de carregamento visual durante a compressão no canvas (~100ms).
  * Botão de zoom (modal com tela cheia para inspeção em campo).
  * Botão de exclusão com confirmação rápida.

### 6.2. Tela da Vistoria (`DashboardVistoria.jsx`)
* Ativação dos botões na seção *Exportar e Relatórios*:
  * **Relatório em PDF:** Gera e baixa o arquivo `laudo_acessibilidade_{bloco}_{data}.pdf`.
  * **Planilha (Excel):** Gera e baixa o arquivo `diagnostico_acessibilidade_{bloco}_{data}.xlsx`.
* Indicador de progresso em modal durante a compilação de PDFs ou planilhas pesadas.

---

## 7. Roteiro e Fases de Implementação

| Fase | Entregáveis | Impacto |
|---|---|---|
| **Fase 4.1 — Compressor WebP e UI** | Módulo `src/utilitarios/imagem.js` e preview com miniatura em `ItemChecklist.jsx` | Permite anexar e compactar fotos de verdade no checklist |
| **Fase 4.2 — Emissão de Laudo PDF** | Integração com `jspdf` / `jspdf-autotable` e geração do PDF formatado com fotos em `DashboardVistoria.jsx` | Relatório oficial pronto para impressão e envio |
| **Fase 4.3 — Planilha Excel com Fotos** | Integração com `exceljs` e geração de `.xlsx` estruturado com imagens embutidas | Exportação para análise técnica em planilhas |
| **Fase 4.4 — Testes e Validação** | Testes automatizados de compressão e integridade de fotos no backup JSON | Garantia de robustez e estabilidade |

---

## 8. Fora do Escopo desta Fase

* Reconhecimento óptico de caracteres (OCR) em fotos de placas de sinalização.
* Sincronização em nuvem e upload em bucket S3 (pertence ao escopo da Fase 2 - Social/Servidor).
