package com.layoutgenerator.dto;

import com.layoutgenerator.entity.TipoDado;
import com.layoutgenerator.entity.TipoPreenchimento;

public record CampoDTO(
        String nome,
        int posicaoInicial,
        int posicaoFinal,
        TipoDado tipo,
        TipoPreenchimento preenchimento,
        boolean obrigatorio,
        String valorDefault
) {}
