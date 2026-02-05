package com.layoutgenerator.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "campos")
public class Campo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(name = "posicao_inicial", nullable = false)
    private int posicaoInicial;

    @Column(name = "posicao_final", nullable = false)
    private int posicaoFinal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDado tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoPreenchimento preenchimento;

    @Column(nullable = false)
    private boolean obrigatorio;

    @Column(name = "valor_default", length = 500)
    private String valorDefault;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "layout_id", nullable = false)
    @JsonBackReference
    private Layout layout;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public int getPosicaoInicial() {
        return posicaoInicial;
    }

    public void setPosicaoInicial(int posicaoInicial) {
        this.posicaoInicial = posicaoInicial;
    }

    public int getPosicaoFinal() {
        return posicaoFinal;
    }

    public void setPosicaoFinal(int posicaoFinal) {
        this.posicaoFinal = posicaoFinal;
    }

    public TipoDado getTipo() {
        return tipo;
    }

    public void setTipo(TipoDado tipo) {
        this.tipo = tipo;
    }

    public TipoPreenchimento getPreenchimento() {
        return preenchimento;
    }

    public void setPreenchimento(TipoPreenchimento preenchimento) {
        this.preenchimento = preenchimento;
    }

    public boolean isObrigatorio() {
        return obrigatorio;
    }

    public void setObrigatorio(boolean obrigatorio) {
        this.obrigatorio = obrigatorio;
    }

    public String getValorDefault() {
        return valorDefault;
    }

    public void setValorDefault(String valorDefault) {
        this.valorDefault = valorDefault;
    }

    public Layout getLayout() {
        return layout;
    }

    public void setLayout(Layout layout) {
        this.layout = layout;
    }

    /** Retorna o tamanho do campo em caracteres (1-based, inclusive). */
    public int getTamanho() {
        return posicaoFinal - posicaoInicial + 1;
    }
}
