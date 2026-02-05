package com.layoutgenerator.dto;

import java.util.Map;

public record GerarRegistroRequest(
        Long idLayout,
        String nomeLayout,
        Map<String, String> valores
) {}
