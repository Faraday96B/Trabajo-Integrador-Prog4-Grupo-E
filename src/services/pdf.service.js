const fs = require('fs/promises');
const path = require('path');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

function formatDate(value, { includeTime = false } = {}) {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

function sanitizeFileName(value) {
  const cleanValue = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return cleanValue || 'diploma';
}

async function renderTemplate(templateName, data) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  const templateSource = await fs.readFile(templatePath, 'utf8');
  const template = Handlebars.compile(templateSource);

  return template(data);
}

async function generarPDF({ templateName, data, outputPrefix, fileNameParts = [] }) {
  const timestamp = Date.now();
  const fileNameBase = [outputPrefix, ...fileNameParts]
    .map(sanitizeFileName)
    .filter(Boolean)
    .join('-');
  const fileName = `${fileNameBase}-${timestamp}.pdf`;
  const html = await renderTemplate(templateName, data);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '18mm',
        right: '16mm',
        bottom: '18mm',
        left: '16mm',
      },
    });

    return {
      ok: true,
      message: 'PDF generado correctamente.',
      data: {
        buffer: Buffer.from(pdfBuffer),
        nombreArchivo: fileName,
      },
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function generarCertificadoPDF(certificado = {}) {
  const data = {
    titulo: certificado.titulo || 'Certificado',
    nombreCurso: certificado.nombreCurso || '-',
    descripcionCurso: certificado.descripcionCurso || '-',
    fechaInicio: formatDate(certificado.fechaInicio),
    cantidadHoras: certificado.cantidadHoras ?? '-',
    estadoCurso: certificado.estadoCurso || '-',
    fechaEmision: formatDate(new Date()),
  };

  return generarPDF({
    templateName: 'certificado-curso.hbs',
    data,
    outputPrefix: 'certificado-curso',
    fileNameParts: [data.nombreCurso],
  });
}

async function generarDiplomaInscripcionPDF(diploma = {}) {
  const data = {
    titulo: diploma.titulo || 'Constancia de inscripcion',
    idInscripcion: diploma.idInscripcion ?? '-',
    estudianteNombre: diploma.estudianteNombre || '-',
    documento: diploma.documento || '-',
    nombreCurso: diploma.nombreCurso || '-',
    cantidadHoras: diploma.cantidadHoras ?? '-',
    fechaInicio: formatDate(diploma.fechaInicio),
    fechaInscripcion: formatDate(diploma.fechaInscripcion, { includeTime: true }),
    estadoInscripcion: diploma.estadoInscripcion || '-',
    fechaEmision: formatDate(new Date()),
  };

  return generarPDF({
    templateName: 'diploma-inscripcion.hbs',
    data,
    outputPrefix: 'diploma-inscripcion',
    fileNameParts: [data.idInscripcion, data.estudianteNombre, data.nombreCurso],
  });
}

module.exports = {
  generarCertificadoPDF,
  generarDiplomaInscripcionPDF,
};
