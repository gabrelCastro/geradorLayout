package com.layoutgenerator.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.layoutgenerator.dto.LayoutDTO;
import com.layoutgenerator.exception.ValidationException;
import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.ChatCompletion;
import com.openai.models.ChatCompletionCreateParams;
import com.openai.models.ChatCompletionMessageParam;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OpenAiService {

    private final OpenAIClient client;
    private final ObjectMapper objectMapper;

    @Value("${openai.model:gpt-4o}")
    private String model;

    public OpenAiService(@Value("${openai.api-key:}") String apiKey, ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        if (apiKey != null && !apiKey.isBlank()) {
            this.client = OpenAIOkHttpClient.builder()
                    .apiKey(apiKey)
                    .build();
        } else {
            this.client = null;
        }
    }

    public LayoutDTO extrairLayoutDoPdf(String textoPdf, String nomeLayout) {
        if (client == null) {
            throw new ValidationException("API key do OpenAI não configurada. Configure a propriedade 'openai.api-key'.");
        }

        String systemPrompt = """
                Você é um especialista em extrair definições de layouts de arquivos posicionais (fixed-width) a partir de documentação técnica.

                Analise o texto do PDF fornecido e extraia a estrutura do layout no formato JSON especificado.

                IMPORTANTE:
                - Identifique os diferentes tipos de registro (Header, Detalhe, Trailer, etc.)
                - Para cada registro, extraia todos os campos com suas posições (inicial e final, 1-based)
                - Identifique o tipo de dado: NUMERICO (apenas dígitos), DECIMAL (números com casas decimais), ALFANUMERICO (texto)
                - Identifique o tipo de preenchimento: ZERO_ESQUERDA (zeros à esquerda), ESPACO_DIREITA (espaços à direita), ESPACO_ESQUERDA (espaços à esquerda)
                - Se houver valores default mencionados, inclua-os
                - Marque campos como obrigatórios quando indicado na documentação

                Responda APENAS com o JSON válido, sem markdown, sem explicações adicionais.

                Formato esperado:
                {
                  "nome": "NOME_DO_LAYOUT",
                  "descricao": "Descrição do layout",
                  "registros": [
                    {
                      "nome": "HEADER",
                      "descricao": "Registro de cabeçalho",
                      "codigo": "0",
                      "campos": [
                        {
                          "nome": "TIPO_REGISTRO",
                          "posicaoInicial": 1,
                          "posicaoFinal": 1,
                          "tipo": "NUMERICO",
                          "preenchimento": "ZERO_ESQUERDA",
                          "obrigatorio": true,
                          "valorDefault": "0"
                        }
                      ]
                    }
                  ]
                }
                """;

        String userPrompt = "Nome do layout: " + nomeLayout + "\n\nTexto extraído do PDF:\n\n" + textoPdf;

        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
                .model(model)
                .messages(List.of(
                        ChatCompletionMessageParam.ofChatCompletionSystemMessageParam(
                                com.openai.models.ChatCompletionSystemMessageParam.builder()
                                        .role(com.openai.models.ChatCompletionSystemMessageParam.Role.SYSTEM)
                                        .content(com.openai.models.ChatCompletionSystemMessageParam.Content.ofTextContent(systemPrompt))
                                        .build()
                        ),
                        ChatCompletionMessageParam.ofChatCompletionUserMessageParam(
                                com.openai.models.ChatCompletionUserMessageParam.builder()
                                        .role(com.openai.models.ChatCompletionUserMessageParam.Role.USER)
                                        .content(com.openai.models.ChatCompletionUserMessageParam.Content.ofTextContent(userPrompt))
                                        .build()
                        )
                ))
                .temperature(0.1)
                .build();

        ChatCompletion completion = client.chat().completions().create(params);

        String resposta = completion.choices().get(0).message().content().orElse("");

        // Remove possíveis marcadores de código markdown
        resposta = resposta.trim();
        if (resposta.startsWith("```json")) {
            resposta = resposta.substring(7);
        }
        if (resposta.startsWith("```")) {
            resposta = resposta.substring(3);
        }
        if (resposta.endsWith("```")) {
            resposta = resposta.substring(0, resposta.length() - 3);
        }
        resposta = resposta.trim();

        try {
            return objectMapper.readValue(resposta, LayoutDTO.class);
        } catch (JsonProcessingException e) {
            throw new ValidationException("Erro ao parsear resposta da OpenAI: " + e.getMessage() + "\nResposta: " + resposta);
        }
    }
}
