import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSVWithMeta } from './csvParser.js';

test('interpreta CSV brasileiro com ponto de milhar, vírgula decimal e ponto e vírgula', () => {
  const csv = [
    'Data;Descrição;Valor',
    '20/08/2026;Mercado, bairro;"R$ 1.234,56"',
    '19/08/2026;Salário;2500,00',
  ].join('\r\n');

  const result = parseCSVWithMeta(csv);
  assert.equal(result.delimiter, ';');
  assert.equal(result.transactions.length, 2);
  assert.equal(result.transactions[0].description, 'Mercado, bairro');
  assert.equal(result.transactions[0].amount, 1234.56);
  assert.equal(result.transactions[1].amount, 2500);
});

test('respeita vírgulas, quebras de linha e aspas escapadas dentro de campos', () => {
  const csv = [
    'date,title,amount',
    '2026-08-18,"Restaurante, Centro",-89.90',
    '2026-08-17,"Compra ""especial""",-45.50',
  ].join('\n');

  const result = parseCSVWithMeta(csv);
  assert.equal(result.delimiter, ',');
  assert.equal(result.transactions[0].description, 'Restaurante, Centro');
  assert.equal(result.transactions[0].type, 'debit');
  assert.equal(result.transactions[1].description, 'Compra "especial"');
});

test('aceita BOM, tabulação e cabeçalhos acentuados', () => {
  const csv = '\uFEFFData\tHistórico\tValor\n20/08/2026\tFarmácia\t-45,70';
  const result = parseCSVWithMeta(csv);
  assert.equal(result.delimiter, '\t');
  assert.equal(result.transactions[0].description, 'Farmácia');
  assert.equal(result.transactions[0].amount, 45.7);
});

test('ignora linhas inválidas e informa a quantidade', () => {
  const csv = 'Data;Descrição;Valor\n32/08/2026;Inválida;10,00\n20/08/2026;Válida;-20,00';
  const result = parseCSVWithMeta(csv);
  assert.equal(result.transactions.length, 1);
  assert.equal(result.skippedRows, 1);
});

test('explica quando as colunas obrigatórias não existem', () => {
  assert.throws(
    () => parseCSVWithMeta('Coluna A;Coluna B\n1;2'),
    /Data, Valor e Descrição/,
  );
});
