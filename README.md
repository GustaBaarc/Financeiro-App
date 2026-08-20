# Minhas Finanças

Aplicação pessoal de controle financeiro construída com React, Vite, Supabase e uma função serverless da Vercel para a assistente Gemini.

## Recursos

- Dashboard mensal com saldo, receitas, despesas e valores pendentes
- Contas e cartões com resumo por banco
- Transações únicas, parceladas e receitas recorrentes
- Importação CSV com prévia e suporte a formatos brasileiros
- Exportação pronta para Excel, com UTF-8 e separador `;`
- Assistente em linguagem natural sem expor a chave do Gemini no navegador
- Controle administrativo de usuários por função
- Layout responsivo para desktop, tablet e celular

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-do-supabase
GEMINI_API_KEY=sua-chave-privada-do-gemini
```

Na Vercel, cadastre as mesmas variáveis em **Project Settings → Environment Variables**. Não use `VITE_` na chave Gemini: variáveis com esse prefixo podem ser incorporadas ao JavaScript público.

A assistente usa `/api/assistant`, uma função serverless protegida por sessão do Supabase. Para testar essa função localmente, use `vercel dev`; `npm run dev` executa apenas o frontend Vite.

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação completa:

```bash
npm run lint
npm test
npm run build
```

## Importação CSV

O importador detecta automaticamente arquivos separados por vírgula, ponto e vírgula, tabulação ou `|`. O cabeçalho precisa conter equivalentes de:

- Data (`Data`, `Date`, `Data Lançamento`)
- Descrição (`Descrição`, `Title`, `Histórico`, `Estabelecimento`)
- Valor (`Valor`, `Amount`, `Value`)

São aceitos valores como `R$ 1.234,56`, `-89.90` e datas `dd/mm/aaaa` ou `aaaa-mm-dd`. Arquivos UTF-8 e Windows-1252 são suportados.
