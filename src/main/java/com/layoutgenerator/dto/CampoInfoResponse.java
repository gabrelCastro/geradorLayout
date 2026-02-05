package com.layoutgenerator.dto;

public record CampoInfoResponse(
        String nome,
        String posicao,
        String valorOriginal,
        String valorFormatado
) {}
