import { CATEGORIES } from '../constants.js';

const DELIMITERS = [';', ',', '\t', '|'];

const normalizeText = (value = '') => String(value)
  .replace(/^\uFEFF/, '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[_-]+/g, ' ')
  .replace(/[^a-z0-9 ]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const parseRows = (text, delimiter) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field.trim());
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field.trim());
  if (row.some(cell => cell.length > 0)) rows.push(row);
  return rows;
};

const detectDelimiter = (text) => {
  let best = { delimiter: ',', score: -1 };

  DELIMITERS.forEach((delimiter) => {
    const rows = parseRows(text, delimiter).slice(0, 8);
    const headerSize = rows[0]?.length || 0;
    if (headerSize < 2) return;

    const consistentRows = rows.slice(1).filter(row => row.length === headerSize).length;
    const score = (consistentRows * 10) + Math.min(headerSize, 12);
    if (score > best.score) best = { delimiter, score };
  });

  return best.delimiter;
};

const findColumn = (headers, candidates, exactOnly = []) => {
  const exactIndex = headers.findIndex(header => candidates.includes(header));
  if (exactIndex >= 0) return exactIndex;
  const fuzzyCandidates = candidates.filter(candidate => !exactOnly.includes(candidate));
  return headers.findIndex(header => fuzzyCandidates.some(candidate => header.includes(candidate)));
};

const parseAmount = (rawValue) => {
  let value = String(rawValue ?? '').trim();
  if (!value) return Number.NaN;

  const negative = value.startsWith('(') || value.endsWith('-') || value.includes('-');
  value = value.replace(/\s|R\$|BRL/gi, '').replace(/[()\-+]/g, '');
  value = value.replace(/[^0-9.,]/g, '');

  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? /\./g : /,/g;
    value = value.replace(thousandsSeparator, '').replace(decimalSeparator, '.');
  } else if (lastComma >= 0) {
    const decimals = value.length - lastComma - 1;
    value = decimals > 0 && decimals <= 2
      ? value.replace(/\./g, '').replace(',', '.')
      : value.replace(/,/g, '');
  } else if (lastDot >= 0) {
    const decimals = value.length - lastDot - 1;
    value = decimals > 0 && decimals <= 2
      ? value.replace(/,/g, '')
      : value.replace(/\./g, '');
  }

  const number = Number(value);
  return negative ? -number : number;
};

const createValidatedDate = (year, month, day) => {
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(fullYear, month - 1, day, 12, 0, 0);
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null;
  return date;
};

const parseDate = (rawValue) => {
  const value = String(rawValue ?? '').trim();
  if (!value) return null;

  if (/^\d{5}(?:\.\d+)?$/.test(value)) {
    const serial = Number(value);
    if (serial >= 20000 && serial <= 80000) {
      const excelEpoch = new Date(1899, 11, 30, 12, 0, 0);
      excelEpoch.setDate(excelEpoch.getDate() + Math.floor(serial));
      return excelEpoch;
    }
  }

  const isoMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) return createValidatedDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));

  const localMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (localMatch) return createValidatedDate(Number(localMatch[3]), Number(localMatch[2]), Number(localMatch[1]));

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeCategory = (rawCategory) => {
  const normalized = normalizeText(rawCategory);
  return CATEGORIES.find(category => normalizeText(category) === normalized) || 'Outros';
};

const inferType = (rawType, signedAmount) => {
  const normalized = normalizeText(rawType);
  if (/receita|entrada|income|deposito|salario/.test(normalized)) return 'income';
  if (/debito|debit|pix/.test(normalized)) return 'debit';
  if (/credito|credit|cartao/.test(normalized)) return 'credit';
  return signedAmount > 0 ? 'income' : 'debit';
};

export const parseCSVWithMeta = (csvText) => {
  const cleanText = String(csvText ?? '').replace(/^\uFEFF/, '').trim();
  if (!cleanText) throw new Error('O arquivo CSV está vazio.');

  const delimiter = detectDelimiter(cleanText);
  const rows = parseRows(cleanText, delimiter);
  if (rows.length < 2) throw new Error('O arquivo não possui linhas de transações.');

  const headers = rows[0].map(normalizeText);
  const dateIndex = findColumn(headers, ['data', 'date', 'data lancamento', 'data transacao', 'transaction date']);
  const amountIndex = findColumn(headers, ['valor', 'amount', 'value', 'valor lancamento', 'valor transacao']);
  const descriptionIndex = findColumn(headers, [
    'descricao', 'description', 'title', 'identificador', 'historico',
    'estabelecimento', 'detalhe', 'lancamento', 'memo',
  ], ['lancamento']);
  const categoryIndex = findColumn(headers, ['categoria', 'category']);
  const typeIndex = findColumn(headers, ['tipo', 'type', 'natureza']);

  if (dateIndex < 0 || amountIndex < 0 || descriptionIndex < 0) {
    throw new Error('Não identifiquei as colunas de Data, Valor e Descrição. Confira o cabeçalho do arquivo.');
  }

  let skippedRows = 0;
  const transactions = [];

  rows.slice(1).forEach((row) => {
    const date = parseDate(row[dateIndex]);
    const signedAmount = parseAmount(row[amountIndex]);
    const description = String(row[descriptionIndex] ?? '').trim();

    if (!date || !Number.isFinite(signedAmount) || !description || signedAmount === 0) {
      skippedRows += 1;
      return;
    }

    transactions.push({
      description,
      amount: Math.abs(signedAmount),
      date: date.toISOString(),
      bankId: '',
      type: inferType(typeIndex >= 0 ? row[typeIndex] : '', signedAmount),
      category: normalizeCategory(categoryIndex >= 0 ? row[categoryIndex] : ''),
      status: 'confirmed',
    });
  });

  if (!transactions.length) {
    throw new Error('Nenhuma transação válida foi encontrada. Verifique datas e valores do arquivo.');
  }

  return {
    transactions,
    skippedRows,
    delimiter,
    headers: rows[0],
  };
};

export const parseCSV = (csvText) => parseCSVWithMeta(csvText).transactions;

export const decodeCSVFile = async (file) => {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
};
