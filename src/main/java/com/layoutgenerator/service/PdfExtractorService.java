package com.layoutgenerator.service;

import com.layoutgenerator.exception.ValidationException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class PdfExtractorService {

    public String extrairTexto(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ValidationException("Arquivo PDF é obrigatório.");
        }

        String contentType = arquivo.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new ValidationException("O arquivo deve ser um PDF.");
        }

        try (PDDocument document = Loader.loadPDF(arquivo.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (IOException e) {
            throw new ValidationException("Erro ao processar o PDF: " + e.getMessage());
        }
    }

    public String extrairTexto(MultipartFile arquivo, int paginaInicial, int paginaFinal) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ValidationException("Arquivo PDF é obrigatório.");
        }

        try (PDDocument document = Loader.loadPDF(arquivo.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(paginaInicial);
            stripper.setEndPage(paginaFinal);
            return stripper.getText(document);
        } catch (IOException e) {
            throw new ValidationException("Erro ao processar o PDF: " + e.getMessage());
        }
    }
}
