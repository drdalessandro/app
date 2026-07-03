// SPDX-FileCopyrightText: Copyright Segunda Opinión Médica
// SPDX-License-Identifier: Apache-2.0
//
// Publica en Medplum los Questionnaire de Life's Essential 8 definidos en
// `src/le8.questionnaires.ts` (fuente de verdad). Upsert idempotente por `url` canónico.
//
//   npm run upload-le8 -- --dry-run     → lista qué subiría, sin conectarse.
//   npm run upload-le8 -- --emit-json   → escribe los 4 JSON en docs/medplum/questionnaires/
//                                          (para pegar en la consola de Medplum), sin conectarse.
//   npm run upload-le8                  → conecta y hace upsert (requiere credenciales).
//
// ⚠️ Credenciales: usar un ClientApplication con permiso de ESCRITURA de Questionnaire en
// el proyecto SOM (p.ej. el mismo client admin que usa el seed de `recepcionistas`), NO el
// client del portal (que es de sólo lectura). Variables (se leen también de `.env`):
//   MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MedplumClient } from '@medplum/core';
import type { Questionnaire } from '@medplum/fhirtypes';
import { LE8_QUESTIONNAIRE_LIST } from '../src/le8.questionnaires';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return v;
}

async function upsert(medplum: MedplumClient, q: Questionnaire): Promise<void> {
  const existing = q.url ? await medplum.searchOne('Questionnaire', `url=${encodeURIComponent(q.url)}`) : undefined;
  if (existing?.id) {
    await medplum.updateResource({ ...q, id: existing.id });
    console.log(`  ✓ actualizado  ${q.name}  (${q.url})`);
  } else {
    await medplum.createResource(q);
    console.log(`  ✓ creado       ${q.name}  (${q.url})`);
  }
}

/** Escribe los 4 JSON en docs/medplum/questionnaires/ para pegarlos en la consola. */
function emitJson(): void {
  const dir = join(process.cwd(), 'docs', 'medplum', 'questionnaires');
  mkdirSync(dir, { recursive: true });
  for (const q of LE8_QUESTIONNAIRE_LIST) {
    const file = join(dir, `${q.name}.json`);
    writeFileSync(file, `${JSON.stringify(q, null, 2)}\n`);
    console.log(`  ✓ ${file}`);
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const emit = process.argv.includes('--emit-json');

  console.log(`=== Upload Questionnaires LE8 (${LE8_QUESTIONNAIRE_LIST.length}) ===`);
  for (const q of LE8_QUESTIONNAIRE_LIST) {
    console.log(`  • ${q.name} → ${q.url}`);
  }

  if (emit) {
    console.log('\nEscribiendo espejos JSON (pegar en la consola de Medplum):');
    emitJson();
    return;
  }

  if (dryRun) {
    console.log('\n[dry-run] No se conecta a Medplum. Definiciones construidas OK.');
    return;
  }

  const medplum = new MedplumClient({ baseUrl: requireEnv('MEDPLUM_BASE_URL'), fetch });
  await medplum.startClientLogin(requireEnv('MEDPLUM_CLIENT_ID'), requireEnv('MEDPLUM_CLIENT_SECRET'));
  console.log(`\nConectado a Medplum: ${medplum.getBaseUrl()}`);

  for (const q of LE8_QUESTIONNAIRE_LIST) {
    await upsert(medplum, q);
  }

  console.log('\nUpload completado.');
}

main().catch((err) => {
  console.error('Upload falló:', err);
  process.exitCode = 1;
});
