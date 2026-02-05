package com.layoutgenerator.mapper;

import com.layoutgenerator.dto.CampoDTO;
import com.layoutgenerator.entity.Campo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper
public interface CampoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "registro", ignore = true)
    Campo toEntity(CampoDTO dto);

    List<Campo> toEntityList(List<CampoDTO> dtos);

    CampoDTO toDto(Campo entity);

    List<CampoDTO> toDtoList(List<Campo> entities);
}
