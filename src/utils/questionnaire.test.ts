// SPDX-FileCopyrightText: Copyright Segunda Opinión Médica
// SPDX-License-Identifier: Apache-2.0
import type { Questionnaire } from '@medplum/fhirtypes';
import { describe, expect, it } from 'vitest';
import { relaxRequiredBooleans } from './questionnaire';

describe('relaxRequiredBooleans', () => {
  it('quita required de los ítems booleanos (permite responder "No")', () => {
    const q: Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'active',
      item: [
        { linkId: 'situacion', text: 'Situación', type: 'choice', required: true },
        { linkId: 'convive-fumador', text: '¿Convivís con fumador?', type: 'boolean', required: true },
      ],
    };
    const out = relaxRequiredBooleans(q);
    expect(out.item?.[0]?.required).toBe(true); // choice sigue obligatorio
    expect(out.item?.[1]?.required).toBe(false); // boolean deja de serlo
  });

  it('recorre subítems anidados', () => {
    const q: Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'active',
      item: [
        {
          linkId: 'grupo',
          type: 'group',
          item: [{ linkId: 'b', text: 'B', type: 'boolean', required: true }],
        },
      ],
    };
    const out = relaxRequiredBooleans(q);
    expect(out.item?.[0]?.item?.[0]?.required).toBe(false);
  });

  it('no muta el questionnaire original', () => {
    const q: Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'active',
      item: [{ linkId: 'b', text: 'B', type: 'boolean', required: true }],
    };
    relaxRequiredBooleans(q);
    expect(q.item?.[0]?.required).toBe(true);
  });
});
