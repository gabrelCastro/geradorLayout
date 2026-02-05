package com.layoutgenerator.mapper;

import com.layoutgenerator.dto.LayoutDTO;
import com.layoutgenerator.entity.Layout;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(uses = RegistroMapper.class)
public interface LayoutMapper {

    @Mapping(target = "id", ignore = true)
    Layout toEntity(LayoutDTO dto);

    LayoutDTO toDto(Layout entity);

    @Mapping(target = "id", ignore = true)
    void updateEntity(LayoutDTO dto, @MappingTarget Layout entity);
}
