/**
 * Script de indexação RAG para os arquivos NBR.
 *
 * Uso:
 *   npx tsx src/scripts/index-nbr.ts
 *
 * Isso lê todos os arquivos .txt e -research.txt em docs/nbr/,
 * divide em chunks semânticos (por regra [CODE] ou por seção ====),
 * gera embeddings com Gemini Embedding-001 e indexa no
 * dev-local-vectorstore (persistido em disco local).
 */

import { indexAllNbrFiles } from '@/lib/nbr-rag';

async function main() {
  console.log('Iniciando indexação RAG dos arquivos NBR...');
  console.log('Diretório: docs/nbr/');

  const start = Date.now();
  const count = await indexAllNbrFiles();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`✓ Indexação concluída: ${count} chunks em ${elapsed}s`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro na indexação:', err);
  process.exit(1);
});
