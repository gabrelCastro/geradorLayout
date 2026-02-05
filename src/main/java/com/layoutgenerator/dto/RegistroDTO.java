package com.layoutgenerator.dto;

import java.util.List;

public record RegistroDTO(
        String nome,
        String descricao,
        String codigo,
        List<CampoDTO> campos
) {}
