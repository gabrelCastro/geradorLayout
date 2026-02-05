package com.layoutgenerator.dto;

public record ParseRegistroRequest(
        Long idLayout,
        String nomeLayout,
        Long idRegistro,
        String nomeRegistro,
        String registro
) {}
