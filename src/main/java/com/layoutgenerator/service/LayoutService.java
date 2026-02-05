package com.layoutgenerator.service;

import com.layoutgenerator.dto.*;
import com.layoutgenerator.entity.Campo;
import com.layoutgenerator.entity.Layout;
import com.layoutgenerator.entity.Registro;
import com.layoutgenerator.entity.TipoPreenchimento;
import com.layoutgenerator.exception.NotFoundException;
import com.layoutgenerator.exception.ValidationException;
import com.layoutgenerator.mapper.CampoMapper;
import com.layoutgenerator.mapper.RegistroMapper;
import com.layoutgenerator.repository.LayoutRepository;
import com.layoutgenerator.repository.RegistroRepository;
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
    private final RegistroRepository registroRepository;
    private final RegistroMapper registroMapper;
    private final CampoMapper campoMapper;

    public LayoutService(LayoutRepository layoutRepository,
                         RegistroRepository registroRepository,
                         RegistroMapper registroMapper,
                         CampoMapper campoMapper) {
        this.layoutRepository = layoutRepository;
        this.registroRepository = registroRepository;
        this.registroMapper = registroMapper;
        this.campoMapper = campoMapper;
    }

    // -------------------------------------------------------------------------
    // CRUD Layout
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

        List<Registro> registros = dto.registros().stream()
                .map(registroMapper::toEntity)
                .collect(Collectors.toList());

        for (Registro registro : registros) {
            validarCampos(registro.getCampos());
            registro.setLayout(layout);
            registro.getCampos().forEach(c -> c.setRegistro(registro));
        }

        layout.setRegistros(registros);
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

        layoutRepository.findByNome(dto.nome()).ifPresent(existente -> {
            if (!existente.getId().equals(id)) {
                throw new ValidationException("Layout com nome '" + dto.nome() + "' já existe.");
            }
        });

        List<Registro> novos = dto.registros().stream()
                .map(registroMapper::toEntity)
                .collect(Collectors.toList());

        for (Registro registro : novos) {
            validarCampos(registro.getCampos());
            registro.setLayout(layout);
            registro.getCampos().forEach(c -> c.setRegistro(registro));
        }

        layout.setNome(dto.nome());
        layout.setDescricao(dto.descricao());
        layout.getRegistros().clear();
        layout.getRegistros().addAll(novos);

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
    // Geração de Registro
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public GerarRegistroResponse gerarRegistro(GerarRegistroRequest request) {
        validarGerarRequest(request);

        Registro registro = resolverRegistro(request);
        Map<String, String> valores = request.valores() != null ? request.valores() : Collections.emptyMap();

        List<Campo> campos = registro.getCampos().stream()
                .sorted(Comparator.comparingInt(Campo::getPosicaoInicial))
                .collect(Collectors.toList());

        validarCamposDesconhecidos(campos, valores);
        Map<String, String> valoresEfetivos = aplicarDefaults(campos, valores);
        validarCamposObrigatorios(campos, valoresEfetivos);

        Map<String, String> valoresFormatados = new LinkedHashMap<>();
        List<CampoInfoResponse> campoInfos = new ArrayList<>();

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

        String registroGerado = gerarRegistroComUniVocity(campos, valoresFormatados);

        int tamanhoTotal = campos.stream()
                .mapToInt(Campo::getPosicaoFinal)
                .max()
                .orElse(0);

        return new GerarRegistroResponse(registroGerado, campoInfos, tamanhoTotal);
    }

    // -------------------------------------------------------------------------
    // Parsing de Registro
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ParseRegistroResponse parsearRegistro(ParseRegistroRequest request) {
        validarParseRequest(request);

        Registro registro = resolverRegistroParse(request);
        String conteudo = request.registro();

        List<Campo> campos = registro.getCampos().stream()
                .sorted(Comparator.comparingInt(Campo::getPosicaoInicial))
                .collect(Collectors.toList());

        int tamanhoEsperado = campos.stream()
                .mapToInt(Campo::getPosicaoFinal)
                .max()
                .orElse(0);

        if (conteudo.length() < tamanhoEsperado) {
            throw new ValidationException(
                    "Registro muito curto. Tamanho esperado: " + tamanhoEsperado
                            + " caractere(s), recebido: " + conteudo.length() + " caractere(s).");
        }

        Map<String, String> valores = new LinkedHashMap<>();

        for (Campo campo : campos) {
            int inicio = campo.getPosicaoInicial() - 1;
            int fim = campo.getPosicaoFinal();

            String valorBruto = conteudo.substring(inicio, fim);
            String valorLimpo = removerPadding(campo, valorBruto);

            valores.put(campo.getNome(), valorLimpo);
        }

        return new ParseRegistroResponse(valores);
    }

    // -------------------------------------------------------------------------
    // Resolvers
    // -------------------------------------------------------------------------

    private Registro resolverRegistro(GerarRegistroRequest request) {
        if (request.idRegistro() != null) {
            return registroRepository.findById(request.idRegistro())
                    .orElseThrow(() -> new NotFoundException("Registro com ID " + request.idRegistro() + " não encontrado."));
        }

        Layout layout = resolverLayout(request.idLayout(), request.nomeLayout());

        if (request.nomeRegistro() != null && !request.nomeRegistro().isBlank()) {
            return layout.getRegistros().stream()
                    .filter(r -> r.getNome().equals(request.nomeRegistro()))
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException(
                            "Registro '" + request.nomeRegistro() + "' não encontrado no layout '" + layout.getNome() + "'."));
        }

        if (layout.getRegistros().size() == 1) {
            return layout.getRegistros().get(0);
        }

        throw new ValidationException(
                "Layout possui múltiplos registros. É necessário especificar idRegistro ou nomeRegistro.");
    }

    private Registro resolverRegistroParse(ParseRegistroRequest request) {
        if (request.idRegistro() != null) {
            return registroRepository.findById(request.idRegistro())
                    .orElseThrow(() -> new NotFoundException("Registro com ID " + request.idRegistro() + " não encontrado."));
        }

        Layout layout = resolverLayout(request.idLayout(), request.nomeLayout());

        if (request.nomeRegistro() != null && !request.nomeRegistro().isBlank()) {
            return layout.getRegistros().stream()
                    .filter(r -> r.getNome().equals(request.nomeRegistro()))
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException(
                            "Registro '" + request.nomeRegistro() + "' não encontrado no layout '" + layout.getNome() + "'."));
        }

        if (layout.getRegistros().size() == 1) {
            return layout.getRegistros().get(0);
        }

        throw new ValidationException(
                "Layout possui múltiplos registros. É necessário especificar idRegistro ou nomeRegistro.");
    }

    private Layout resolverLayout(Long idLayout, String nomeLayout) {
        if (idLayout != null) {
            return layoutRepository.findById(idLayout)
                    .orElseThrow(() -> new NotFoundException("Layout com ID " + idLayout + " não encontrado."));
        }
        return layoutRepository.findByNome(nomeLayout)
                .orElseThrow(() -> new NotFoundException("Layout com nome '" + nomeLayout + "' não encontrado."));
    }

    // -------------------------------------------------------------------------
    // Geração via uniVocity
    // -------------------------------------------------------------------------

    private String gerarRegistroComUniVocity(List<Campo> campos, Map<String, String> valoresFormatados) {
        FixedWidthFields fields = new FixedWidthFields();
        List<String> valores = new ArrayList<>();

        int currentPos = 1;

        for (Campo campo : campos) {
            if (campo.getPosicaoInicial() > currentPos) {
                int gapSize = campo.getPosicaoInicial() - currentPos;
                fields.addField("_gap_" + currentPos, gapSize, FieldAlignment.LEFT, ' ');
                valores.add(" ".repeat(gapSize));
            }

            int tamanho = campo.getTamanho();
            FieldAlignment alinhamento = resolverAlinhamento(campo.getPreenchimento());
            char padChar = resolverPadding(campo.getPreenchimento());

            fields.addField(campo.getNome(), tamanho, alinhamento, padChar);
            valores.add(valoresFormatados.get(campo.getNome()));

            currentPos = campo.getPosicaoFinal() + 1;
        }

        FixedWidthWriterSettings settings = new FixedWidthWriterSettings(fields);
        settings.setWriteLineSeparatorAfterRecord(false);

        StringWriter sw = new StringWriter();
        FixedWidthWriter writer = new FixedWidthWriter(sw, settings);
        writer.writeRow(valores.toArray(new String[0]));
        writer.close();

        return sw.toString();
    }

    private FieldAlignment resolverAlinhamento(TipoPreenchimento tipo) {
        return switch (tipo) {
            case ZERO_ESQUERDA -> FieldAlignment.RIGHT;
            case ESPACO_DIREITA -> FieldAlignment.LEFT;
            case ESPACO_ESQUERDA -> FieldAlignment.RIGHT;
        };
    }

    private char resolverPadding(TipoPreenchimento tipo) {
        return switch (tipo) {
            case ZERO_ESQUERDA -> '0';
            case ESPACO_DIREITA, ESPACO_ESQUERDA -> ' ';
        };
    }

    private String removerPadding(Campo campo, String valor) {
        return switch (campo.getPreenchimento()) {
            case ZERO_ESQUERDA -> {
                String semZeros = valor.replaceFirst("^0+", "");
                yield semZeros.isEmpty() ? "0" : semZeros;
            }
            case ESPACO_DIREITA -> valor.stripTrailing();
            case ESPACO_ESQUERDA -> valor.stripLeading();
        };
    }

    private String formatarCampo(Campo campo, String valor) {
        int tamanho = campo.getTamanho();
        if (valor.length() >= tamanho) {
            return valor;
        }
        return switch (campo.getPreenchimento()) {
            case ZERO_ESQUERDA -> "0".repeat(tamanho - valor.length()) + valor;
            case ESPACO_DIREITA -> valor + " ".repeat(tamanho - valor.length());
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
        if (dto.registros() == null || dto.registros().isEmpty()) {
            throw new ValidationException("O layout deve ter pelo menos um registro.");
        }
        for (RegistroDTO reg : dto.registros()) {
            if (reg.nome() == null || reg.nome().isBlank()) {
                throw new ValidationException("Nome do registro é obrigatório.");
            }
            if (reg.campos() == null || reg.campos().isEmpty()) {
                throw new ValidationException("Registro '" + reg.nome() + "' deve ter pelo menos um campo.");
            }
        }
    }

    private void validarCampos(List<Campo> campos) {
        Set<String> nomes = new HashSet<>();

        for (Campo campo : campos) {
            if (campo.getNome() == null || campo.getNome().isBlank()) {
                throw new ValidationException("Nome do campo é obrigatório para todos os campos.");
            }
            if (!nomes.add(campo.getNome())) {
                throw new ValidationException("Nome de campo duplicado: '" + campo.getNome() + "'.");
            }
            if (campo.getPosicaoInicial() <= 0) {
                throw new ValidationException(
                        "Campo '" + campo.getNome() + "': posicaoInicial deve ser >= 1.");
            }
            if (campo.getPosicaoInicial() > campo.getPosicaoFinal()) {
                throw new ValidationException(
                        "Campo '" + campo.getNome() + "': posicaoInicial deve ser <= posicaoFinal.");
            }
            validarValorDefault(campo);
        }

        List<Campo> sorted = campos.stream()
                .sorted(Comparator.comparingInt(Campo::getPosicaoInicial))
                .toList();

        for (int i = 1; i < sorted.size(); i++) {
            Campo prev = sorted.get(i - 1);
            Campo curr = sorted.get(i);
            if (curr.getPosicaoInicial() <= prev.getPosicaoFinal()) {
                throw new ValidationException(
                        "Campos sobrepostos: '" + prev.getNome() + "' e '" + curr.getNome() + "'.");
            }
        }
    }

    private void validarValorDefault(Campo campo) {
        String vd = campo.getValorDefault();
        if (vd == null || vd.isBlank()) {
            return;
        }

        if (vd.length() > campo.getTamanho()) {
            throw new ValidationException(
                    "Campo '" + campo.getNome() + "': valorDefault excede o tamanho.");
        }

        switch (campo.getTipo()) {
            case NUMERICO -> {
                if (!vd.matches("\\d+")) {
                    throw new ValidationException(
                            "Campo '" + campo.getNome() + "': valorDefault inválido para NUMERICO.");
                }
            }
            case DECIMAL -> {
                try {
                    BigDecimal bd = new BigDecimal(vd);
                    if (campo.getPreenchimento() == TipoPreenchimento.ZERO_ESQUERDA && bd.signum() < 0) {
                        throw new ValidationException(
                                "Campo '" + campo.getNome() + "': valorDefault negativo com ZERO_ESQUERDA.");
                    }
                } catch (NumberFormatException e) {
                    throw new ValidationException(
                            "Campo '" + campo.getNome() + "': valorDefault inválido para DECIMAL.");
                }
            }
            case ALFANUMERICO -> { }
        }
    }

    private void validarGerarRequest(GerarRegistroRequest request) {
        boolean temLayout = request.idLayout() != null ||
                (request.nomeLayout() != null && !request.nomeLayout().isBlank());
        boolean temRegistro = request.idRegistro() != null;

        if (!temLayout && !temRegistro) {
            throw new ValidationException("É necessário fornecer idLayout/nomeLayout ou idRegistro.");
        }
    }

    private void validarParseRequest(ParseRegistroRequest request) {
        boolean temLayout = request.idLayout() != null ||
                (request.nomeLayout() != null && !request.nomeLayout().isBlank());
        boolean temRegistro = request.idRegistro() != null;

        if (!temLayout && !temRegistro) {
            throw new ValidationException("É necessário fornecer idLayout/nomeLayout ou idRegistro.");
        }
        if (request.registro() == null || request.registro().isEmpty()) {
            throw new ValidationException("O registro a ser parseado é obrigatório.");
        }
    }

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
                    throw new ValidationException("Campo obrigatório não fornecido: '" + campo.getNome() + "'.");
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
            throw new ValidationException("Campos não encontrados: " + desconhecidos);
        }
    }

    private void validarTamanho(Campo campo, String valor) {
        if (valor.length() > campo.getTamanho()) {
            throw new ValidationException(
                    "Campo '" + campo.getNome() + "': valor excede o tamanho máximo.");
        }
    }

    private void validarTipoDado(Campo campo, String valor) {
        if (valor.isEmpty()) {
            return;
        }

        switch (campo.getTipo()) {
            case NUMERICO -> {
                if (!valor.matches("\\d+")) {
                    throw new ValidationException(
                            "Campo '" + campo.getNome() + "' aceita apenas dígitos.");
                }
            }
            case DECIMAL -> {
                try {
                    BigDecimal bd = new BigDecimal(valor);
                    if (campo.getPreenchimento() == TipoPreenchimento.ZERO_ESQUERDA && bd.signum() < 0) {
                        throw new ValidationException(
                                "Campo '" + campo.getNome() + "' não aceita negativos com ZERO_ESQUERDA.");
                    }
                } catch (NumberFormatException e) {
                    throw new ValidationException(
                            "Campo '" + campo.getNome() + "' aceita apenas números decimais.");
                }
            }
            case ALFANUMERICO -> { }
        }
    }
}
