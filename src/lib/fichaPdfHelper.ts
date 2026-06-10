import { FichaFiliacao } from "../types";

export const generateFichaPdf = (ficha: FichaFiliacao): Blob => {
  const clean = (str: string) => {
    return (str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/–/g, "-")
      .replace(/[œŒæÆ]/g, "")
      .replace(/[“‘’”]/g, "'")
      .replace(/[çÇ]/g, "c")
      .replace(/ª/g, "a")
      .replace(/º/g, "o")
      .replace(/[^\x00-\x7F]/g, ""); // ASCII standard
  };

  const oName = clean(ficha.memberName).substring(0, 48);
  const oCpf = clean(ficha.memberCpf);
  const oMatricula = clean(ficha.matricula);
  const oOrgan = clean(ficha.organ === "OUTRO" ? (ficha.organOther || "OUTRO") : ficha.organ);
  const oLotacao = clean(ficha.lotacaoMunicipio);
  const oCat = clean(ficha.categoria);
  const oBirth = clean(ficha.birthDate);
  const oGender = clean(ficha.genero);
  const oRua = clean(ficha.addressRua).substring(0, 45);
  const oBairro = clean(ficha.addressBairro).substring(0, 25);
  const oCep = clean(ficha.addressCep);
  const oCidade = clean(ficha.addressCidade).substring(0, 25);
  const oFone = clean(ficha.contactFones);
  const oEmail = clean(ficha.contactEmail).substring(0, 40);
  const oSigDate = clean(ficha.signatureDate);
  const oLocalData = clean(ficha.dataInscricao);
  const oSigName = clean(ficha.assinaturaNome);
  const oSeal = clean(ficha.securitySeal);
  
  // Percentual
  let detailDesc = "";
  if (ficha.opcaoAutorizacao === 1) {
    detailDesc = `1. AUTORIZA DESCONTO EM FOLHA DE: ${ficha.percentualDesconto || 1.2}%`;
  } else if (ficha.opcaoAutorizacao === 2) {
    detailDesc = `2. ALTERA DESCONTO DE: ${ficha.percentualAnterior || 1.2}% PARA: ${ficha.percentualNovo || 1.8}%`;
  } else {
    detailDesc = `3. SOLICITA O CANCELAMENTO DO DESCONTO EM FOLHA`;
  }

  let streamText = `BT\n`;
  streamText += `  /F1 14 Tf\n`;
  streamText += `  40 790 Td\n`;
  streamText += `  (ESTADO DE SANTA CATARINA) Tj\n`;
  streamText += `  /F1 10 Tf\n`;
  streamText += `  0 -20 Td\n`;
  streamText += `  (AUTORIZACAO DE DESCONTO / CANCELAMENTO EM FOLHA) Tj\n`;
  
  streamText += `  0 -35 Td\n`;
  streamText += `  (ENTIDADE CONSIGNADA: UMESC - UNIAO DE MILITARES EVANGELICOS DE SC) Tj\n`;
  streamText += `  0 -15 Td\n`;
  streamText += `  (CODIGO DE CONSIGNACAO: 05-0554-01) Tj\n`;

  streamText += `  /F1 11 Tf\n`;
  streamText += `  0 -30 Td\n`;
  streamText += `  (--- DADOS DA REPARTICAO / PARAMETROS ---) Tj\n`;
  streamText += `  /F1 9 Tf\n`;
  streamText += `  0 -18 Td\n`;
  streamText += `  (ORGAO VINCULAR: ${oOrgan}          LOTACAO MUNICIPIO: ${oLotacao}) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (CATEGORIA MILITAR: ${oCat}) Tj\n`;

  streamText += `  /F1 11 Tf\n`;
  streamText += `  0 -30 Td\n`;
  streamText += `  (--- IDENTIFICACAO DO SERVIDOR FILIADO ---) Tj\n`;
  streamText += `  /F1 9 Tf\n`;
  streamText += `  0 -18 Td\n`;
  streamText += `  (NOME COMPLETO: ${oName}) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (CPF DO MILITAR: ${oCpf}          MATRICULA: ${oMatricula}      VINCULO: ${ficha.vinculo}) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (DATA DE NASCIMENTO: ${oBirth}          GENERO: ${oGender}) Tj\n`;

  streamText += `  /F1 11 Tf\n`;
  streamText += `  0 -30 Td\n`;
  streamText += `  (--- ENDERECO RESIDENCIAL ---) Tj\n`;
  streamText += `  /F1 9 Tf\n`;
  streamText += `  0 -18 Td\n`;
  streamText += `  (ENDERECO: ${oRua}          BAIRRO: ${oBairro}) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (CEP: ${oCep}          CIDADE: ${oCidade}) Tj\n`;

  streamText += `  /F1 11 Tf\n`;
  streamText += `  0 -30 Td\n`;
  streamText += `  (--- CONTATOS E COMUNICACAO ---) Tj\n`;
  streamText += `  /F1 9 Tf\n`;
  streamText += `  0 -18 Td\n`;
  streamText += `  (FONE/WHATSAPP: ${oFone}          EMAIL: ${oEmail}) Tj\n`;

  streamText += `  /F1 11 Tf\n`;
  streamText += `  0 -30 Td\n`;
  streamText += `  (--- OPCIONAL DE AUTORIZACAO EM FOLHA (01) ---) Tj\n`;
  streamText += `  /F1 9 Tf\n`;
  streamText += `  0 -18 Td\n`;
  streamText += `  (OPERACAO SOLICITADA EM FOLHA DE PAGAMENTO:) Tj\n`;
  streamText += `  0 -15 Td\n`;
  streamText += `  (  => ${detailDesc}) Tj\n`;

  streamText += `  /F1 11 Tf\n`;
  streamText += `  0 -35 Td\n`;
  streamText += `  (--- ASSINATURA ELETRONICA E CERTIFICACAO ---) Tj\n`;
  streamText += `  /F1 9 Tf\n`;
  streamText += `  0 -18 Td\n`;
  streamText += `  (LOCAL DO PROTOCOLO: ${oLocalData}) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (ASSINADO DIGITALMENTE POR: ${oSigName}) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (DATA/HORA DA ASSINATURA: ${oSigDate} - IP: ${ficha.ipAddress}) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (SELO DIGITAL ICP-BRASIL SIMULADO: ${oSeal}) Tj\n`;
  streamText += `  0 -14 Td\n`;
  streamText += `  (ESTE PROTOCOLO E VALIDO PARA TODOS OS EFEITOS DE CONVENIO COM A PMSC E BMSC.) Tj\n`;
  streamText += `  0 -20 Td\n`;
  streamText += `  (Uniao de Militares Evangelicos de Santa Catarina - Utilidade Publica Estadual) Tj\n`;
  streamText += `ET`;

  const pdfBody = `%PDF-1.4\n` +
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n` +
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n` +
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n` +
    `4 0 obj\n<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream\nendobj\n` +
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n` +
    `xref\n0 6\n0000000000 65535 f\n` +
    `trailer\n<< /Size 6 /Root 1 0 R >>\n` +
    `startxref\n350\n%%EOF`;

  return new Blob([pdfBody], { type: "application/pdf" });
};
