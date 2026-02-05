package com.layoutgenerator.dto;

import java.util.List;

public record LayoutDTO(
        String nome,
        String descricao,
        List<CampoDTO> campos
) {}
