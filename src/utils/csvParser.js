export const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Pega o header (primeira linha)
  const headers = lines[0].toLowerCase().split(',');

  // Tenta adivinhar os índices das colunas principais
  const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));
  const amountIdx = headers.findIndex(h => h.includes('valor') || h.includes('amount'));
  const descIdx = headers.findIndex(h => h.includes('descrição') || h.includes('descricao') || h.includes('title') || h.includes('identificador'));

  if (dateIdx === -1 || amountIdx === -1 || descIdx === -1) {
    throw new Error('Não foi possível identificar as colunas (Data, Valor, Descrição) no CSV.');
  }

  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    // Tratamento simples para ignorar vírgulas dentro de aspas duplas (básico)
    const row = lines[i].split(',');
    
    if (row.length > Math.max(dateIdx, amountIdx, descIdx)) {
      const dateStr = row[dateIdx].trim();
      let amountStr = row[amountIdx].trim();
      const desc = row[descIdx].trim();

      // Ajusta valores monetários (remove R$, ajusta , para .)
      amountStr = amountStr.replace('R$', '').replace(/\s/g, '');
      // Se for formato brasileiro 1.200,00 -> 1200.00
      if (amountStr.includes(',') && amountStr.includes('.')) {
        amountStr = amountStr.replace('.', '').replace(',', '.');
      } else if (amountStr.includes(',')) {
        amountStr = amountStr.replace(',', '.');
      }
      
      const amount = parseFloat(amountStr);
      
      // Parse de data básica (dd/mm/yyyy para ISO)
      let parsedDate = new Date();
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        if (y && m && d) {
            parsedDate = new Date(`${y}-${m}-${d}T12:00:00`);
        }
      } else if (dateStr.includes('-')) {
         parsedDate = new Date(dateStr);
      }

      if (!isNaN(amount) && desc) {
        transactions.push({
          description: desc,
          amount: Math.abs(amount), // Gastos geralmente vêm negativos, vamos salvar positivo para manter o padrão
          date: parsedDate.toISOString(),
          // Campos a preencher na UI
          bankId: null,
          type: 'credit',
          category: 'Outros'
        });
      }
    }
  }

  return transactions;
};
