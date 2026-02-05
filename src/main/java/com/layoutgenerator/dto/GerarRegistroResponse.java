package com.layoutgenerator.dto;

import java.util.List;

public record GerarRegistroResponse(
        String registroGerado,
        List<CampoInfoResponse> campos,
        int tamanhoTotal
) {}
