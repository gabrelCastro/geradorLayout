# Layout Generator

API REST Spring Boot + Frontend React para gerenciamento e geração de registros a partir de layouts posicionais (CNAB, meios de pagamento, etc).

A geração de registros utiliza a biblioteca **uniVocity-parsers** (`FixedWidthWriter`) para montar os campos com o alinhamento e padding corretos.

Suporta **importação automática de layouts** a partir de PDFs usando **OpenAI GPT-4**.

---

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│   PostgreSQL    │
│  React + MUI    │     │  Spring Boot    │     │                 │
│   :3000         │     │   :8080         │     │   :5432         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Estrutura do Layout

```
Layout (ex: CNAB 240)
  └── Registro (ex: Header, Detalhe, Trailer)
        └── Campo (posição, tipo, preenchimento)
```

Um layout pode ter múltiplos tipos de registro, cada um com seus próprios campos.

---

## Pré-requisitos

### Com Docker (recomendado)

| Ferramenta      | Versão mínima |
|-----------------|---------------|
| Docker          | 20+           |
| Docker Compose  | 2.0+          |

### Sem Docker

| Ferramenta   | Versão mínima |
|-------------|---------------|
| Java        | 21            |
| Maven       | 3.8+          |
| PostgreSQL  | 14+           |
| Node.js     | 18+ (para o frontend) |

---

## Configuração

### Execução local

1. Copie o arquivo de configuração:

```bash
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

2. Crie o banco `layoutgenerator`:

```sql
CREATE DATABASE layoutgenerator;
```

3. Ajuste as credenciais em `application.properties`:
   - Usuário/senha do PostgreSQL
   - `openai.api-key` (opcional — para importação de PDFs)

### Docker Compose

Configure as credenciais diretamente no `docker-compose.yml` (veja `docker-compose.example.yml`).

As tabelas são criadas automaticamente pelo Hibernate (`ddl-auto=update`).

---

## Como rodar

### Opção 1: Docker Compose (recomendado)

1. Copie os arquivos de exemplo:

```bash
cp docker-compose.example.yml docker-compose.yml
```

2. Edite o `docker-compose.yml` com sua `OPENAI_API_KEY` (se for usar importação de PDFs)

3. Suba os serviços:

```bash
docker compose up --build
```

| Serviço   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:3000      |
| Backend   | http://localhost:8080      |
| PostgreSQL| localhost:5432             |

Para parar:

```bash
docker compose down
```

### Opção 2: Execução local

1. Configure o `application.properties` (veja seção Configuração acima)
2. Inicie o PostgreSQL (porta 5432)
3. Execute o backend:

```bash
mvn spring-boot:run
```

4. Execute o frontend (opcional):

```bash
cd frontend
npm install
npm run dev
```

O backend fica disponível em **http://localhost:8080** e o frontend em **http://localhost:5173** (modo dev).

---

## Frontend

O frontend oferece uma interface visual para todas as operações da API:

### Páginas

| Página      | Funcionalidade                                          |
|-------------|--------------------------------------------------------|
| **Layouts** | CRUD de layouts, registros e campos. Importação de PDFs |
| **Converter** | Geração e parsing de registros posicionais            |

### Funcionalidades

- Criar, editar e excluir layouts
- Adicionar múltiplos registros por layout (Header, Detalhe, Trailer)
- Configurar campos com tipo, preenchimento e valor default
- Testar geração de registros diretamente na interface
- Importar layouts a partir de PDFs (integração OpenAI)
- Converter JSON → registro posicional e vice-versa

---

## Endpoints

### CRUD de Layouts

| Método | Endpoint                          | Descrição                                |
|--------|-----------------------------------|------------------------------------------|
| POST   | `/api/layouts`                    | Criar novo layout                        |
| GET    | `/api/layouts`                    | Listar todos os layouts                  |
| GET    | `/api/layouts/{id}`               | Buscar layout por ID                     |
| GET    | `/api/layouts/nome/{nome}`        | Buscar layout por nome                   |
| PUT    | `/api/layouts/{id}`               | Atualizar layout                         |
| DELETE | `/api/layouts/{id}`               | Deletar layout                           |

### Geração e Parsing de Registros

| Método | Endpoint                          | Descrição                                |
|--------|-----------------------------------|------------------------------------------|
| POST   | `/api/layouts/gerar-registro`     | Gerar registro posicional                |
| POST   | `/api/layouts/parsear-registro`   | Parsear registro para JSON               |

### Importação via PDF (OpenAI)

| Método | Endpoint                          | Descrição                                |
|--------|-----------------------------------|------------------------------------------|
| POST   | `/api/layouts/importar-pdf`       | Extrair layout do PDF (preview)          |
| POST   | `/api/layouts/importar-pdf/salvar`| Extrair e salvar layout do PDF           |

---

## Exemplos de requisição

### 1. Criar layout com múltiplos registros

```http
POST /api/layouts
Content-Type: application/json

{
  "nome": "CNAB_240",
  "descricao": "Layout CNAB 240 caracteres",
  "registros": [
    {
      "nome": "HEADER_ARQUIVO",
      "descricao": "Header do arquivo",
      "codigo": "0",
      "campos": [
        {
          "nome": "codigo_banco",
          "posicaoInicial": 1,
          "posicaoFinal": 3,
          "tipo": "NUMERICO",
          "preenchimento": "ZERO_ESQUERDA",
          "obrigatorio": true
        },
        {
          "nome": "lote_servico",
          "posicaoInicial": 4,
          "posicaoFinal": 7,
          "tipo": "NUMERICO",
          "preenchimento": "ZERO_ESQUERDA",
          "obrigatorio": true,
          "valorDefault": "0000"
        },
        {
          "nome": "tipo_registro",
          "posicaoInicial": 8,
          "posicaoFinal": 8,
          "tipo": "NUMERICO",
          "preenchimento": "ZERO_ESQUERDA",
          "obrigatorio": true,
          "valorDefault": "0"
        },
        {
          "nome": "nome_empresa",
          "posicaoInicial": 9,
          "posicaoFinal": 38,
          "tipo": "ALFANUMERICO",
          "preenchimento": "ESPACO_DIREITA",
          "obrigatorio": true
        }
      ]
    },
    {
      "nome": "DETALHE",
      "descricao": "Registro de detalhe",
      "codigo": "3",
      "campos": [
        {
          "nome": "codigo_banco",
          "posicaoInicial": 1,
          "posicaoFinal": 3,
          "tipo": "NUMERICO",
          "preenchimento": "ZERO_ESQUERDA",
          "obrigatorio": true
        },
        {
          "nome": "valor",
          "posicaoInicial": 4,
          "posicaoFinal": 18,
          "tipo": "NUMERICO",
          "preenchimento": "ZERO_ESQUERDA",
          "obrigatorio": true
        }
      ]
    },
    {
      "nome": "TRAILER_ARQUIVO",
      "descricao": "Trailer do arquivo",
      "codigo": "9",
      "campos": [
        {
          "nome": "codigo_banco",
          "posicaoInicial": 1,
          "posicaoFinal": 3,
          "tipo": "NUMERICO",
          "preenchimento": "ZERO_ESQUERDA",
          "obrigatorio": true
        },
        {
          "nome": "qtd_registros",
          "posicaoInicial": 4,
          "posicaoFinal": 9,
          "tipo": "NUMERICO",
          "preenchimento": "ZERO_ESQUERDA",
          "obrigatorio": true
        }
      ]
    }
  ]
}
```

**Resposta (201 Created):** retorna o layout com `id` gerado.

---

### 2. Gerar registro especificando layout e tipo de registro

```http
POST /api/layouts/gerar-registro
Content-Type: application/json

{
  "nomeLayout": "CNAB_240",
  "nomeRegistro": "HEADER_ARQUIVO",
  "valores": {
    "codigo_banco": "341",
    "nome_empresa": "EMPRESA TESTE LTDA"
  }
}
```

**Resposta (200 OK):**

```json
{
  "registroGerado": "34100000EMPRESA TESTE LTDA            ",
  "campos": [
    { "nome": "codigo_banco",  "posicao": "1-3",  "valorOriginal": "341", "valorFormatado": "341"  },
    { "nome": "lote_servico",  "posicao": "4-7",  "valorOriginal": "0000", "valorFormatado": "0000" },
    { "nome": "tipo_registro", "posicao": "8-8",  "valorOriginal": "0",   "valorFormatado": "0"    },
    { "nome": "nome_empresa",  "posicao": "9-38", "valorOriginal": "EMPRESA TESTE LTDA", "valorFormatado": "EMPRESA TESTE LTDA            " }
  ],
  "tamanhoTotal": 38
}
```

---

### 3. Gerar registro por ID do registro

Se você já conhece o ID do registro no banco, pode usar diretamente:

```http
POST /api/layouts/gerar-registro
Content-Type: application/json

{
  "idRegistro": 1,
  "valores": {
    "codigo_banco": "341",
    "nome_empresa": "ACME Ltda"
  }
}
```

---

### 4. Parsear registro (converter de posicional para JSON)

```http
POST /api/layouts/parsear-registro
Content-Type: application/json

{
  "nomeLayout": "CNAB_240",
  "nomeRegistro": "HEADER_ARQUIVO",
  "registro": "34100000ACME Ltda                     "
}
```

**Resposta (200 OK):**

```json
{
  "valores": {
    "codigo_banco": "341",
    "lote_servico": "0000",
    "tipo_registro": "0",
    "nome_empresa": "ACME Ltda"
  }
}
```

O parsing remove automaticamente o padding:
- `ZERO_ESQUERDA`: remove zeros à esquerda (preserva "0" se for só zeros)
- `ESPACO_DIREITA`: remove espaços à direita
- `ESPACO_ESQUERDA`: remove espaços à esquerda

---

### 5. Importar layout de PDF (usando OpenAI)

**Preview (não salva):**

```http
POST /api/layouts/importar-pdf
Content-Type: multipart/form-data

arquivo: [arquivo.pdf]
nomeLayout: LAYOUT_SOFTWARE_EXPRESS
```

**Importar e salvar:**

```http
POST /api/layouts/importar-pdf/salvar
Content-Type: multipart/form-data

arquivo: [arquivo.pdf]
nomeLayout: LAYOUT_SOFTWARE_EXPRESS
```

O OpenAI analisa o PDF e extrai automaticamente:
- Tipos de registro (Header, Detalhe, Trailer, etc.)
- Campos com posições, tipos e preenchimentos
- Valores default quando mencionados na documentação

---

### 6. Erro — layout com múltiplos registros sem especificar qual

Se o layout tem mais de um registro, é obrigatório informar `nomeRegistro` ou `idRegistro`:

```http
POST /api/layouts/gerar-registro
Content-Type: application/json

{
  "nomeLayout": "CNAB_240",
  "valores": {
    "codigo_banco": "341"
  }
}
```

**Resposta (400 Bad Request):**

```json
{
  "titulo": "Erro de validação",
  "erro": "Layout possui múltiplos registros. É necessário especificar idRegistro ou nomeRegistro.",
  "status": 400
}
```

---

## Tipos de dado

| Tipo          | Aceita                        | Exemplo         |
|---------------|-------------------------------|-----------------|
| NUMERICO      | Apenas dígitos (0-9)          | `"341"`         |
| ALFANUMERICO  | Qualquer string               | `"EMPRESA ABC"` |
| DECIMAL       | Números decimais              | `"123.45"`      |

## Tipos de preenchimento

| Tipo            | Comportamento                                        | Exemplo (campo de 6 pos, valor "42") |
|-----------------|------------------------------------------------------|--------------------------------------|
| ZERO_ESQUERDA   | Preenche com `0` à esquerda (alinha à direita)       | `000042`                             |
| ESPACO_DIREITA  | Preenche com espaço à direita (alinha à esquerda)    | `42    `                             |
| ESPACO_ESQUERDA | Preenche com espaço à esquerda (alinha à direita)    | `    42`                             |

---

## Validações implementadas

- **Tamanho do campo:** valor maior que o permitido → 400
- **Tipo de dado:** letra em campo NUMERICO, string não-numérica em DECIMAL → 400
- **Campo obrigatório:** ausente ou vazio e sem `valorDefault` configurado → 400
- **Campo desconhecido:** chave no map `valores` que não existe no registro → 400
- **valorDefault:** validado contra tamanho e tipo na criação/atualização do layout → 400
- **DECIMAL negativo com ZERO_ESQUERDA:** preenchimento com zero à esquerda não aceita valores negativos → 400
- **Sobreposição de posições:** campos com posições que se sobrepõem ao criar/atualizar layout → 400
- **Posições válidas:** `posicaoInicial` deve ser ≤ `posicaoFinal` e ≥ 1 → 400
- **Nome único:** dois layouts com o mesmo nome → 400
- **Registro muito curto:** ao parsear, o registro deve ter pelo menos o tamanho esperado → 400

---

## Tecnologias

### Backend
- **Spring Boot 3.3.6**
- **PostgreSQL** (banco de dados)
- **uniVocity-parsers** (geração de arquivos posicionais)
- **MapStruct** (mapeamento DTO ↔ Entity)
- **PDFBox 3.0.1** (extração de texto de PDFs)
- **OpenAI Java SDK** (interpretação de layouts via GPT-4)

### Frontend
- **React 18** + **Vite**
- **Material UI (MUI)** (componentes visuais)
- **React Router** (navegação SPA)
- **Axios** (requisições HTTP)

### Infraestrutura
- **Docker** + **Docker Compose**
- **Nginx** (servidor do frontend em produção)
