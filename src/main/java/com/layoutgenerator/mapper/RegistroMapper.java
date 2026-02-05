package com.layoutgenerator.mapper;

import com.layoutgenerator.dto.RegistroDTO;
import com.layoutgenerator.entity.Registro;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(uses = CampoMapper.class)
public interface RegistroMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "layout", ignore = true)
    Registro toEntity(RegistroDTO dto);

    List<Registro> toEntityList(List<RegistroDTO> dtos);

    RegistroDTO toDto(Registro entity);

    List<RegistroDTO> toDtoList(List<Registro> entities);
}
