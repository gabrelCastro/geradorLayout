package com.layoutgenerator.repository;

import com.layoutgenerator.entity.Layout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LayoutRepository extends JpaRepository<Layout, Long> {

    Optional<Layout> findByNome(String nome);

    boolean existsByNome(String nome);
}
