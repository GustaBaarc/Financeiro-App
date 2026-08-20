const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function exportToCSV(transactions, banks) {
  if (!transactions?.length) {
    throw new Error('Não há transações para exportar.');
  }

  const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Banco', 'Status'];
  const rows = transactions.map((transaction) => {
    const bankName = banks.find(bank => String(bank.id) === String(transaction.bankId))?.name || 'Sem conta';
    const typeLabel = transaction.type === 'credit'
      ? 'Crédito'
      : transaction.type === 'income' ? 'Receita' : 'Débito';
    const date = new Date(transaction.date);
    const dateLabel = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR');
    const amount = Number(transaction.amount || 0).toFixed(2).replace('.', ',');

    return [
      dateLabel,
      transaction.description,
      amount,
      typeLabel,
      transaction.category,
      bankName,
      transaction.status === 'pending' ? 'Pendente' : 'Confirmado',
    ].map(escapeCell).join(';');
  });

  const content = `\uFEFF${headers.map(escapeCell).join(';')}\r\n${rows.join('\r\n')}`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `minhas-financas-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
