package com.layoutgenerator.controller;

import com.layoutgenerator.dto.GerarRegistroRequest;
import com.layoutgenerator.dto.GerarRegistroResponse;
import com.layoutgenerator.dto.LayoutDTO;
import com.layoutgenerator.entity.Layout;
import com.layoutgenerator.service.LayoutService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/layouts")
public class LayoutController {

    private final LayoutService layoutService;

    public LayoutController(LayoutService layoutService) {
        this.layoutService = layoutService;
    }

    // --- Criar layout ---

    @PostMapping
    public ResponseEntity<Layout> criar(@RequestBody LayoutDTO dto) {
        Layout layout = layoutService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(layout);
    }

    // --- Listar todos ---

    @GetMapping
    public ResponseEntity<List<Layout>> listarTodos() {
        return ResponseEntity.ok(layoutService.listarTodos());
    }

    // --- Buscar por ID ---

    @GetMapping("/{id}")
    public ResponseEntity<Layout> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(layoutService.buscarPorId(id));
    }

    // --- Buscar por nome ---

    @GetMapping("/nome/{nome}")
    public ResponseEntity<Layout> buscarPorNome(@PathVariable String nome) {
        return ResponseEntity.ok(layoutService.buscarPorNome(nome));
    }

    // --- Atualizar ---

    @PutMapping("/{id}")
    public ResponseEntity<Layout> atualizar(@PathVariable Long id, @RequestBody LayoutDTO dto) {
        return ResponseEntity.ok(layoutService.atualizar(id, dto));
    }

    // --- Deletar ---

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        layoutService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    // --- Gerar registro posicional ---

    @PostMapping("/gerar-registro")
    public ResponseEntity<GerarRegistroResponse> gerarRegistro(@RequestBody GerarRegistroRequest request) {
        return ResponseEntity.ok(layoutService.gerarRegistro(request));
    }
}
