package com.layoutgenerator.controller;

import com.layoutgenerator.dto.*;
import com.layoutgenerator.entity.Layout;
import com.layoutgenerator.service.LayoutService;
import com.layoutgenerator.service.OpenAiService;
import com.layoutgenerator.service.PdfExtractorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/layouts")
public class LayoutController {

    private final LayoutService layoutService;
    private final PdfExtractorService pdfExtractorService;
    private final OpenAiService openAiService;

    public LayoutController(LayoutService layoutService,
                            PdfExtractorService pdfExtractorService,
                            OpenAiService openAiService) {
        this.layoutService = layoutService;
        this.pdfExtractorService = pdfExtractorService;
        this.openAiService = openAiService;
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

    // --- Parsear registro posicional (inverso: layout → JSON) ---

    @PostMapping("/parsear-registro")
    public ResponseEntity<ParseRegistroResponse> parsearRegistro(@RequestBody ParseRegistroRequest request) {
        return ResponseEntity.ok(layoutService.parsearRegistro(request));
    }

    // --- Importar layout a partir de PDF (usando OpenAI) ---

    @PostMapping(value = "/importar-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LayoutDTO> extrairLayoutDoPdf(
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam("nomeLayout") String nomeLayout) {
        String textoPdf = pdfExtractorService.extrairTexto(arquivo);
        LayoutDTO layoutExtraido = openAiService.extrairLayoutDoPdf(textoPdf, nomeLayout);
        return ResponseEntity.ok(layoutExtraido);
    }

    @PostMapping(value = "/importar-pdf/salvar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Layout> importarLayoutDoPdf(
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam("nomeLayout") String nomeLayout) {
        String textoPdf = pdfExtractorService.extrairTexto(arquivo);
        LayoutDTO layoutExtraido = openAiService.extrairLayoutDoPdf(textoPdf, nomeLayout);
        Layout layout = layoutService.criar(layoutExtraido);
        return ResponseEntity.status(HttpStatus.CREATED).body(layout);
    }
}
