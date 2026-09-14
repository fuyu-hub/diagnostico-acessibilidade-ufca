# Diagnóstico das Condições de Acessibilidade - UFCA

Repositório da aplicação web desenvolvida no âmbito do Projeto de Extensão Universitária **"Diagnóstico das condições de acessibilidade em estabelecimentos públicos de ensino da cidade de Juazeiro do Norte/CE"** (Código: PJ180-2026), vinculado à Universidade Federal do Cariri (UFCA).

## Sobre o Projeto

O projeto tem como objetivo central analisar as condições gerais de acessibilidade espacial e arquitetônica em instituições públicas de ensino no município de Juazeiro do Norte (CE), subsidiando gestores públicos e direções escolares com diagnósticos técnicos que orientem a eliminação de barreiras arquitetônicas e a implementação dos princípios do desenho universal.

A aplicação digital operacionaliza o levantamento de dados em vistorias *in loco*, permitindo a coleta estruturada de evidências técnicas, anotações de campo, registros fotográficos e o cômputo automatizado do Índice de Avaliação de Acessibilidade (IAA).

### Referencial Normativo e Legal

- **ABNT NBR 9050:2020**: Acessibilidade a edificações, mobiliário, espaços e equipamentos urbanos.
- **Lei Federal nº 10.098/2000**: Normas gerais e critérios básicos para a promoção da acessibilidade.
- **Constituição da República Federativa do Brasil (1988)**: Garantia dos direitos fundamentais à educação e ao livre deslocamento.

## Funcionalidades da Aplicação

- Roteiro estruturado de checklist com divisão por setores espaciais (acesso, circulação, sanitários, mobiliário, etc.);
- Perguntas de triagem contextual com encadeamento automático de itens não aplicáveis (N/A);
- Registro de conformidades, não conformidades, observações técnicas e registro fotográfico de apoio;
- Cálculo do Índice de Avaliação de Acessibilidade (IAA), discriminado por seção e índice consolidado;
- Interface responsiva orientada à utilização em campo por meio de dispositivos móveis, tablets ou computadores.

## Tecnologias Empregadas

- React
- Vite
- Tabler Icons
- CSS Modules e Vanilla CSS

## Instruções de Instalação e Execução

### Pré-requisitos
- Node.js (versão 18 ou superior)
- Gerenciador de pacotes npm

### Procedimento

1. Clonar o repositório:
```bash
git clone https://github.com/fuyu-hub/diagnostico-acessibilidade-ufca.git
cd diagnostico-acessibilidade-ufca
```

2. Instalar as dependências do projeto:
```bash
npm install
```

3. Iniciar o servidor local de desenvolvimento:
```bash
npm run dev
```

4. Compilar para distribuição em produção:
```bash
npm run build
```

## Dados Institucionais e Equipe

- **Instituição Proponente**: Universidade Federal do Cariri (UFCA)
- **Unidade Acadêmica**: Centro de Ciências e Tecnologia (CCT)
- **Instituição Co-Executora**: Universidade Regional do Cariri (URCA)
- **Edital**: Edital 03/2025/PROEX (Projetos Ampla Concorrência 2026)
- **Área do Conhecimento (CNPq)**: Engenharias / Direitos Humanos e Justiça

### Coordenação
- Profa. Antonia Fabiana Marques Almeida (Coordenadora)
- Prof. Marcos José Timbó Lima Gomes (Coordenador Adjunto)

### Equipe Discente (Voluntários)
- Samuel Sousa Santos
- Camilo Erdos Viana da Silva
- Danilo Ferreira da Silva
