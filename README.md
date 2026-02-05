# Layout Generator

API REST Spring Boot para gerenciamento e geração de registros a partir de layouts posicionais (CNAB, meios de pagamento, etc).

A geração de registros utiliza a biblioteca **uniVocity-parsers** (`FixedWidthWriter`) para montar os campos com o alinhamento e padding corretos por campo.

---

## Pré-requisitos

| Ferramenta   | Versão mínima |
|-------------|---------------|
| Java        | 17            |
| Maven       | 3.8+          |
| PostgreSQL  | 14+           |

---

## Configuração do banco de dados

1. Crie o banco `layoutgenerator`:

```sql
CREATE DATABASE layoutgenerator;
```

2. Ajuste usuário e senha em `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/layoutgenerator
spring.datasource.username=postgres
spring.datasource.password=postgres
```

As tabelas são criadas automaticamente pelo Hibernate (`ddl-auto=update`).

---

## Como rodar

```bash
mvn spring-boot:run
```

A aplicação fica disponível em **http://localhost:8080/api**.

---

## Endpoints

| Método | Endpoint                          | Descrição                                |
|--------|-----------------------------------|------------------------------------------|
| POST   | `/api/layouts`                    | Criar novo layout                        |
| GET    | `/api/layouts`                    | Listar todos os layouts                  |
| GET    | `/api/layouts/{id}`               | Buscar layout por ID                     |
| GET    | `/api/layouts/nome/{nome}`        | Buscar layout por nome                   |
| PUT    | `/api/layouts/{id}`               | Atualizar layout                         |
| DELETE | `/api/layouts/{id}`               | Deletar layout                           |
| POST   | `/api/layouts/gerar-registro`     | Gerar registro posicional a partir de um layout |

---

## Exemplos de requisição

### 1. Criar layout (CNAB240 Header de Arquivo)

```http
POST /api/layouts
Content-Type: application/json

{
  "nome": "CNAB240_HeaderArquivo",
  "descricao": "Header de arquivo CNAB 240",
  "campos": [
    {
      "nome": "codigoBanco",
      "posicaoInicial": 1,
      "posicaoFinal": 3,
      "tipo": "NUMERICO",
      "preenchimento": "ZERO_ESQUERDA",
      "obrigatorio": true
    },
    {
      "nome": "loteServico",
      "posicaoInicial": 4,
      "posicaoFinal": 7,
      "tipo": "NUMERICO",
      "preenchimento": "ZERO_ESQUERDA",
      "obrigatorio": true
    },
    {
      "nome": "tipoRegistro",
      "posicaoInicial": 8,
      "posicaoFinal": 8,
      "tipo": "NUMERICO",
      "preenchimento": "ZERO_ESQUERDA",
      "obrigatorio": true
    },
    {
      "nome": "nomeEmpresa",
      "posicaoInicial": 9,
      "posicaoFinal": 38,
      "tipo": "ALFANUMERICO",
      "preenchimento": "ESPACO_DIREITA",
      "obrigatorio": true
    }
  ]
}
```

**Resposta (201 Created):** retorna o layout com `id` gerado.

---

### 2. Gerar registro

```http
POST /api/layouts/gerar-registro
Content-Type: application/json

{
  "nomeLayout": "CNAB240_HeaderArquivo",
  "valores": {
    "codigoBanco": "341",
    "loteServico": "1",
    "tipoRegistro": "0",
    "nomeEmpresa": "EMPRESA TESTE LTDA"
  }
}
```

**Resposta (200 OK):**

```json
{
  "registroGerado": "34100010EMPRESA TESTE LTDA            ",
  "campos": [
    {
      "nome": "codigoBanco",
      "posicao": "1-3",
      "valorOriginal": "341",
      "valorFormatado": "341"
    },
    {
      "nome": "loteServico",
      "posicao": "4-7",
      "valorOriginal": "1",
      "valorFormatado": "0001"
    },
    {
      "nome": "tipoRegistro",
      "posicao": "8-8",
      "valorOriginal": "0",
      "valorFormatado": "0"
    },
    {
      "nome": "nomeEmpresa",
      "posicao": "9-38",
      "valorOriginal": "EMPRESA TESTE LTDA",
      "valorFormatado": "EMPRESA TESTE LTDA            "
    }
  ],
  "tamanhoTotal": 38
}
```

---

### 3. Exemplo de erro — campo obrigatório ausente

```http
POST /api/layouts/gerar-registro
Content-Type: application/json

{
  "nomeLayout": "CNAB240_HeaderArquivo",
  "valores": {
    "codigoBanco": "341"
  }
}
```

**Resposta (400 Bad Request):**

```json
{
  "titulo": "Erro de validação",
  "erro": "Campo obrigatório não fornecido ou vazio: 'loteServico'.",
  "status": 400,
  "timestamp": "2026-02-04T10:00:00.000"
}
```

---

### 4. Exemplo de erro — valor excede tamanho

```http
POST /api/layouts/gerar-registro
Content-Type: application/json

{
  "nomeLayout": "CNAB240_HeaderArquivo",
  "valores": {
    "codigoBanco": "1234",
    "loteServico": "1",
    "tipoRegistro": "0",
    "nomeEmpresa": "TESTE"
  }
}
```

**Resposta (400 Bad Request):**

```json
{
  "titulo": "Erro de validação",
  "erro": "Campo 'codigoBanco': valor excede o tamanho máximo permitido. Máximo: 3 caractere(s), fornecido: 4 caractere(s). Valor: '1234'.",
  "status": 400,
  "timestamp": "..."
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

## Validações implementadas

- **Tamanho do campo:** valor maior que o permitido → 400
- **Tipo de dado:** letra em campo NUMERICO → 400
- **Campo obrigatório:** ausente ou vazio → 400
- **Sobreposição de posições:** campos com posições que se sobrepõem ao criar/atualizar layout → 400
- **Posições válidas:** `posicaoInicial` deve ser ≤ `posicaoFinal` e ≥ 1 → 400
- **Nome único:** dois layouts com o mesmo nome → 400
