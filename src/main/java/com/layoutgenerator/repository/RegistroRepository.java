package com.layoutgenerator.repository;

import com.layoutgenerator.entity.Registro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RegistroRepository extends JpaRepository<Registro, Long> {

    Optional<Registro> findByLayoutIdAndNome(Long layoutId, String nome);

    Optional<Registro> findByLayoutIdAndCodigo(Long layoutId, String codigo);

    Optional<Registro> findByLayoutNomeAndNome(String layoutNome, String registroNome);

    boolean existsByLayoutIdAndNome(Long layoutId, String nome);
}
