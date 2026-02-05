package com.layoutgenerator.service;

import com.layoutgenerator.dto.*;
import com.layoutgenerator.entity.Campo;
import com.layoutgenerator.entity.Layout;
import com.layoutgenerator.entity.TipoDado;
import com.layoutgenerator.entity.TipoPreenchimento;
import com.layoutgenerator.exception.NotFoundException;
import com.layoutgenerator.exception.ValidationException;
import com.layoutgenerator.repository.LayoutRepository;
import com.univocity.parsers.fixed.FieldAlignment;
import com.univocity.parsers.fixed.FixedWidthFields;
import com.univocity.parsers.fixed.FixedWidthWriter;
import com.univocity.parsers.fixed.FixedWidthWriterSettings;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LayoutService {

    private final LayoutRepository layoutRepository;

    public LayoutService(LayoutRepository layoutRepository) {
        this.layoutRepository = layoutRepository;
    }

    // -------------------------------------------------------------------------
    // CRUD
    // -------------------------------------------------------------------------

    @Transactional
    public Layout criar(LayoutDTO dto) {
        validarLayoutDTO(dto);

        if (layoutRepository.existsByNome(dto.nome())) {
            throw new ValidationException("Layout com nome '" + dto.nome() + "' já existe.");
        }

        Layout layout = new Layout();
        layout.setNome(dto.nome());
        layout.setDescricao(dto.descricao());

        List<Campo> campos = dto.campos().stream()
                .map(this::toEntity)
                .collect(Collectors.toList());

        validarCampos(campos);
        campos.forEach(c -> c.setLayout(layout));
        layout.setCampos(campos);

        return layoutRepository.save(layout);
    }

    @Transactional(readOnly = true)
    public List<Layout> listarTodos() {
        return layoutRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Layout buscarPorId(Long id) {
        return layoutRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Layout com ID " + id + " não encontrado."));
    }

    @Transactional(readOnly = true)
    public Layout buscarPorNome(String nome) {
        return layoutRepository.findByNome(nome)
                .orElseThrow(() -> new NotFoundException("Layout com nome '" + nome + "' não encontrado."));
    }

    @Transactional
    public Layout atualizar(Long id, LayoutDTO dto) {
        validarLayoutDTO(dto);

        Layout layout = layoutRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Layout com ID " + id + " não encontrado."));

        // nome único excluindo o próprio registro
        layoutRepository.findByNome(dto.nome()).ifPresent(existente -> {
            if (!existente.getId().equals(id)) {
                throw new ValidationException("Layout com nome '" + dto.nome() + "' já existe.");
            }
        });

        List<Campo> novos = dto.campos().stream()
                .map(this::toEntity)
                .collect(Collectors.toList());

        validarCampos(novos);

        layout.setNome(dto.nome());
        layout.setDescricao(dto.descricao());
        layout.getCampos().clear();
        novos.forEach(c -> c.setLayout(layout));
        layout.getCampos().addAll(novos);

        return layoutRepository.save(layout);
    }

    @Transactional
    public void deletar(Long id) {
        if (!layoutRepository.existsById(id)) {
            throw new NotFoundException("Layout com ID " + id + " não encontrado.");
        }
        layoutRepository.deleteById(id);
    }

    // -------------------------------------------------------------------------
    // Geração de Registro (funcionalidade principal)
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public GerarRegistroResponse gerarRegistro(GerarRegistroRequest request) {
        validarRequest(request);

        Layout layout    = resolverLayout(request);
        Map<String, String> valores = request.valores() != null ? request.valores() : Collections.emptyMap();

        List<Campo> campos = layout.getCampos().stream()
                .sorted(Comparator.comparingInt(Campo::getPosicaoInicial))
                .collect(Collectors.toList());

        // --- validações ---
        validarCamposDesconhecidos(campos, valores);
        Map<String, String> valoresEfetivos = aplicarDefaults(campos, valores);
        validarCamposObrigatorios(campos, valoresEfetivos);

        // --- formatar cada campo e montar infos de resposta ---
        Map<String, String> valoresFormatados = new LinkedHashMap<>();
        List<CampoInfoResponse> campoInfos   = new ArrayList<>();

        for (Campo campo : campos) {
            String valorOriginal = valoresEfetivos.get(campo.getNome());

            validarTamanho(campo, valorOriginal);
            validarTipoDado(campo, valorOriginal);

            String valorFormatado = formatarCampo(campo, valorOriginal);
            valoresFormatados.put(campo.getNome(), valorFormatado);

            campoInfos.add(new CampoInfoResponse(
                    campo.getNome(),
                    campo.getPosicaoInicial() + "-" + campo.getPosicaoFinal(),
                    valorOriginal,
                    valorFormatado
            ));
        }

        // --- gerar o registro usando uniVocity ---
        String registroGerado = gerarRegistroComUniVocity(campos, valoresFormatados);

        int tamanhoTotal = campos.stream()
                .mapToInt(Campo::getPosicaoFinal)
                .max()
                .orElse(0);

        return new GerarRegistroResponse(registroGerado, campoInfos, tamanhoTotal);
    }

    // -------------------------------------------------------------------------
    // Geração via uniVocity-parsers
    // -------------------------------------------------------------------------

    /**
     * Monta o registro posicional usando {@code FixedWidthWriter} do uniVocity.
     * <p>
     * A API {@link FixedWidthFields#addField(String, int, FieldAlignment, char)} permite
     * configurar, por campo, o tamanho, alinhamento e caractere de padding — mapeando
     * diretamente os tipos de preenchimento do layout.
     * <p>
     * Campos com posição inicial maior que a posição final do campo anterior geram um
     * campo de "gap" preenchido com espaços, garantindo que as posições do registro
     * sejam fiéis ao layout.
     */
    private String gerarRegistroComUniVocity(List<Campo> campos, Map<String, String> valoresFormatados) {
        FixedWidthFields fields = new FixedWidthFields();
        List<String>     valores = new ArrayList<>();

        int currentPos = 1;                                              // posição esperada (1-based)

        for (Campo campo : campos) {
            // --- gap entre o campo anterior e este ---
            if (campo.getPosicaoInicial() > currentPos) {
                int gapSize = campo.getPosicaoInicial() - currentPos;
                fields.addField("_gap_" + currentPos, gapSize, FieldAlignment.LEFT, ' ');
                valores.add(" ".repeat(gapSize));
            }

            int tamanho = campo.getTamanho();

            // mapeia TipoPreenchimento → (FieldAlignment, padding char)
            FieldAlignment alinhamento = resolverAlinhamento(campo.getPreenchimento());
            char           padChar     = resolverPadding(campo.getPreenchimento());

            fields.addField(campo.getNome(), tamanho, alinhamento, padChar);
            valores.add(valoresFormatados.get(campo.getNome()));

            currentPos = campo.getPosicaoFinal() + 1;
        }

        FixedWidthWriterSettings settings = new FixedWidthWriterSettings(fields);
        settings.setWriteLineSeparatorAfterRecord(false);       // sem '\n' ao final

        StringWriter sw = new StringWriter();
        FixedWidthWriter writer = new FixedWidthWriter(sw, settings);
        writer.writeRow(valores.toArray(new String[0]));
        writer.close();

        return sw.toString();
    }

    private FieldAlignment resolverAlinhamento(TipoPreenchimento tipo) {
        return switch (tipo) {
            case ZERO_ESQUERDA  -> FieldAlignment.RIGHT;   // valor à direita, zeros à esquerda
            case ESPACO_DIREITA -> FieldAlignment.LEFT;    // valor à esquerda, espaços à direita
            case ESPACO_ESQUERDA-> FieldAlignment.RIGHT;   // valor à direita, espaços à esquerda
        };
    }

    private char resolverPadding(TipoPreenchimento tipo) {
        return switch (tipo) {
            case ZERO_ESQUERDA   -> '0';
            case ESPACO_DIREITA  -> ' ';
            case ESPACO_ESQUERDA -> ' ';
        };
    }

    // -------------------------------------------------------------------------
    // Formatação manual (usada para montar valorFormatado na resposta)
    // -------------------------------------------------------------------------

    private String formatarCampo(Campo campo, String valor) {
        int tamanho = campo.getTamanho();
        if (valor.length() >= tamanho) {
            return valor;                           // já preenche; validação de tamanho já rejeitou se > tamanho
        }
        return switch (campo.getPreenchimento()) {
            case ZERO_ESQUERDA   -> "0".repeat(tamanho - valor.length()) + valor;
            case ESPACO_DIREITA  -> valor + " ".repeat(tamanho - valor.length());
            case ESPACO_ESQUERDA -> " ".repeat(tamanho - valor.length()) + valor;
        };
    }

    // -------------------------------------------------------------------------
    // Validações
    // -------------------------------------------------------------------------

    private void validarLayoutDTO(LayoutDTO dto) {
        if (dto.nome() == null || dto.nome().isBlank()) {
            throw new ValidationException("Nome do layout é obrigatório.");
        }
        if (dto.campos() == null || dto.campos().isEmpty()) {
            throw new ValidationException("O layout deve ter pelo menos um campo.");
        }
    }

    /**
     * Valida posições, sobreposição e nomes duplicados dos campos.
     */
    private void validarCampos(List<Campo> campos) {
        Set<String> nomes = new HashSet<>();

        for (Campo campo : campos) {
            if (campo.getNome() == null || campo.getNome().isBlank()) {
                throw new ValidationException("Nome do campo é obrigatório para todos os campos.");
            }
            if (!nomes.add(campo.getNome())) {
                throw new ValidationException("Nome de campo duplicado no layout: '" + campo.getNome() + "'.");
            }
            if (campo.getPosicaoInicial() <= 0) {
                throw new ValidationException(
                        "Campo '" + campo.getNome() + "': posicaoInicial deve ser >= 1 (recebido: " + campo.getPosicaoInicial() + ").");
            }
            if (campo.getPosicaoInicial() > campo.getPosicaoFinal()) {
                throw new ValidationException(
                        "Campo '" + campo.getNome() + "': posicaoInicial (" + campo.getPosicaoInicial()
                                + ") deve ser <= posicaoFinal (" + campo.getPosicaoFinal() + ").");
            }
            validarValorDefault(campo);
        }

        // sobreposição — ordena por posicaoInicial e compara com o anterior
        List<Campo> sorted = campos.stream()
                .sorted(Comparator.comparingInt(Campo::getPosicaoInicial))
                .toList();

        for (int i = 1; i < sorted.size(); i++) {
            Campo prev = sorted.get(i - 1);
            Campo curr = sorted.get(i);
            if (curr.getPosicaoInicial() <= prev.getPosicaoFinal()) {
                throw new ValidationException(
                        "Campos sobrepostos: '" + prev.getNome()
                                + "' (posições " + prev.getPosicaoInicial() + "-" + prev.getPosicaoFinal()
                                + ") e '" + curr.getNome()
                                + "' (posições " + curr.getPosicaoInicial() + "-" + curr.getPosicaoFinal() + ").");
            }
        }
    }

    /**
     * Valida o {@code valorDefault} do campo contra tamanho e tipo.
     * Mensagens diferenciadas das validações de geração para deixar claro
     * que é o default da definição do layout que não está certo.
     */
    private void validarValorDefault(Campo campo) {
        String vd = campo.getValorDefault();
        if (vd == null || vd.isBlank()) {
            return;
        }

        if (vd.length() > campo.getTamanho()) {
            throw new ValidationException(
                    "Campo '" + campo.getNome() + "': valorDefault excede o tamanho do campo ("
                            + vd.length() + " de " + campo.getTamanho() + " caractere(s)). Valor: '" + vd + "'.");
        }

        switch (campo.getTipo()) {
            case NUMERICO -> {
                if (!vd.matches("\\d+")) {
                    throw new ValidationException(
                            "Campo '" + campo.getNome() + "': valorDefault '" + vd
                                    + "' é inválido para tipo NUMERICO (apenas dígitos 0-9).");
                }
            }
            case DECIMAL -> {
                try {
                    BigDecimal bd = new BigDecimal(vd);
                    if (campo.getPreenchimento() == TipoPreenchimento.ZERO_ESQUERDA && bd.signum() < 0) {
                        throw new ValidationException(
                                "Campo '" + campo.getNome() + "': valorDefault '" + vd
                                        + "' é inválido — tipo DECIMAL com ZERO_ESQUERDA não aceita negativos.");
                    }
                } catch (NumberFormatException e) {
                    throw new ValidationException(
                            "Campo '" + campo.getNome() + "': valorDefault '" + vd + "' é inválido para tipo DECIMAL.");
                }
            }
            case ALFANUMERICO -> {
                // qualquer string é válida
            }
        }
    }

    private void validarRequest(GerarRegistroRequest request) {
        if (request.idLayout() == null && (request.nomeLayout() == null || request.nomeLayout().isBlank())) {
            throw new ValidationException("É necessário fornecer idLayout ou nomeLayout na requisição.");
        }
    }

    private Layout resolverLayout(GerarRegistroRequest request) {
        if (request.idLayout() != null) {
            return layoutRepository.findById(request.idLayout())
                    .orElseThrow(() -> new NotFoundException("Layout com ID " + request.idLayout() + " não encontrado."));
        }
        return layoutRepository.findByNome(request.nomeLayout())
                .orElseThrow(() -> new NotFoundException("Layout com nome '" + request.nomeLayout() + "' não encontrado."));
    }

    /**
     * Constrói o map efetivo de valores: para cada campo do layout, usa o valor
     * fornecido pelo cliente quando presente e não-nulo; caso contrário aplica o
     * {@code valorDefault} do campo (se configurado).  Valores explicitamente
     * enviados como {@code ""} preservam a string vazia — o default não substitui.
     */
    private Map<String, String> aplicarDefaults(List<Campo> campos, Map<String, String> valores) {
        Map<String, String> resultado = new LinkedHashMap<>();
        for (Campo campo : campos) {
            String valor = valores.get(campo.getNome());
            if (valor == null && campo.getValorDefault() != null && !campo.getValorDefault().isBlank()) {
                resultado.put(campo.getNome(), campo.getValorDefault());
            } else {
                resultado.put(campo.getNome(), Objects.requireNonNullElse(valor, ""));
            }
        }
        return resultado;
    }

    private void validarCamposObrigatorios(List<Campo> campos, Map<String, String> valores) {
        for (Campo campo : campos) {
            if (campo.isObrigatorio()) {
                String valor = valores.get(campo.getNome());
                if (valor == null || valor.isBlank()) {
                    throw new ValidationException(
                            "Campo obrigatório não fornecido ou vazio: '" + campo.getNome() + "'.");
                }
            }
        }
    }

    private void validarCamposDesconhecidos(List<Campo> campos, Map<String, String> valores) {
        Set<String> nomesCampos = campos.stream()
                .map(Campo::getNome)
                .collect(Collectors.toSet());

        List<String> desconhecidos = valores.keySet().stream()
                .filter(nome -> !nomesCampos.contains(nome))
                .sorted()
                .toList();

        if (!desconhecidos.isEmpty()) {
            throw new ValidationException(
                    "Campos não encontrados no layout: " + desconhecidos
                            + ". Campos disponíveis: " + nomesCampos.stream().sorted().toList() + ".");
        }
    }

    private void validarTamanho(Campo campo, String valor) {
        if (valor.length() > campo.getTamanho()) {
            throw new ValidationException(
                    "Campo '" + campo.getNome() + "': valor excede o tamanho máximo permitido. "
                            + "Máximo: " + campo.getTamanho() + " caractere(s), fornecido: " + valor.length()
                            + " caractere(s). Valor: '" + valor + "'.");
        }
    }

    private void validarTipoDado(Campo campo, String valor) {
        if (valor.isEmpty()) {
            return;  // campos opcionais sem valor são permitidos
        }

        switch (campo.getTipo()) {
            case NUMERICO -> {
                if (!valor.matches("\\d+")) {
                    throw new ValidationException(
                            "Campo '" + campo.getNome() + "' é do tipo NUMERICO e aceita apenas dígitos (0-9). "
                                    + "Valor fornecido: '" + valor + "'.");
                }
            }
            case DECIMAL -> {
                try {
                    BigDecimal bd = new BigDecimal(valor);
                    if (campo.getPreenchimento() == TipoPreenchimento.ZERO_ESQUERDA && bd.signum() < 0) {
                        throw new ValidationException(
                                "Campo '" + campo.getNome() + "' é do tipo DECIMAL com preenchimento ZERO_ESQUERDA "
                                        + "e não aceita valores negativos. Valor fornecido: '" + valor + "'.");
                    }
                } catch (NumberFormatException e) {
                    throw new ValidationException(
                            "Campo '" + campo.getNome() + "' é do tipo DECIMAL e aceita apenas números decimais. "
                                    + "Valor fornecido: '" + valor + "'.");
                }
            }
            case ALFANUMERICO -> {
                // qualquer string é válida
            }
        }
    }

    // -------------------------------------------------------------------------
    // Utilidades
    // -------------------------------------------------------------------------

    private Campo toEntity(CampoDTO dto) {
        Campo campo = new Campo();
        campo.setNome(dto.nome());
        campo.setPosicaoInicial(dto.posicaoInicial());
        campo.setPosicaoFinal(dto.posicaoFinal());
        campo.setTipo(dto.tipo());
        campo.setPreenchimento(dto.preenchimento());
        campo.setObrigatorio(dto.obrigatorio());
        campo.setValorDefault(dto.valorDefault());
        return campo;
    }
}
