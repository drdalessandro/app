// SPDX-FileCopyrightText: Copyright Segunda Opinión Médica
// SPDX-License-Identifier: Apache-2.0
//
// Definiciones FHIR de los cuestionarios de Life's Essential 8 (LE8, AHA 2022) que
// completa el paciente en el portal. Son la **fuente de verdad** del formulario y el
// **fallback local** de `LE8QuestionnairePage` (si el Questionnaire no está cargado en
// el server, el portal igual lo renderiza desde acá).
//
// Instrumentos validados usados:
//  - Sueño:      PSQI (Pittsburgh Sleep Quality Index, Buysse et al. 1989). Ítems Q1–Q9
//                (los que puntúan; el bloque Q10 de "compañero/a de cama" no puntúa y se omite).
//  - Alimentación: MEDAS / MEPA 14 ítems (PREDIMED, Schröder et al. 2011). Cada criterio
//                  cumplido suma 1 → 0–14 (≥9 = buena adherencia mediterránea).
//  - Actividad:  Exercise Vital Sign (EVS): días/semana × minutos/día = min/semana de
//                actividad moderada-intensa → puntaje LE8 por min/semana.
//  - Tabaco:     Exposición a nicotina de LE8 (estado + tiempo desde que dejó + humo ajeno).
//
// ⚠️ CONTRATO CON EL DASHBOARD: los `linkId` y los `code` de las opciones son el contrato
// que interpreta la app clínica (dashboard) para calcular los scores LE8. No renombrarlos
// sin coordinar. El scoring de cada instrumento se documenta en comentarios acá.
import type { Questionnaire, QuestionnaireItemAnswerOption } from '@medplum/fhirtypes';
import { LE8_QUESTIONNAIRES, type LE8QuestionnaireSlug } from './le8';

/** URL canónica por slug (fuente única: `le8.ts`). */
const URL_BY_SLUG = Object.fromEntries(LE8_QUESTIONNAIRES.map((q) => [q.slug, q.url])) as Record<
  LE8QuestionnaireSlug,
  string
>;

/**
 * Escala de frecuencia del PSQI (ítems 5, 7, 8): 0–3. El `code` ES el puntaje del ítem.
 * "Ninguna vez"=0 · "<1/sem"=1 · "1–2/sem"=2 · "≥3/sem"=3.
 */
const PSQI_FREQ: QuestionnaireItemAnswerOption[] = [
  { valueCoding: { code: '0', display: 'Ninguna vez en el último mes' } },
  { valueCoding: { code: '1', display: 'Menos de una vez a la semana' } },
  { valueCoding: { code: '2', display: 'Una o dos veces a la semana' } },
  { valueCoding: { code: '3', display: 'Tres o más veces a la semana' } },
];

/** Un ítem del bloque Q5 del PSQI (motivo por el que no durmió bien), con la escala 0–3. */
function psqiQ5(linkId: string, text: string): NonNullable<Questionnaire['item']>[number] {
  return { linkId, text, type: 'choice', answerOption: PSQI_FREQ };
}

/**
 * PSQI — Calidad del sueño. Componentes (0–3 c/u; global 0–21):
 *  C1 Calidad subjetiva (Q6) · C2 Latencia (Q2+Q5a) · C3 Duración (Q4) ·
 *  C4 Eficiencia habitual (Q1,Q3,Q4) · C5 Perturbaciones (Q5b–Q5j) ·
 *  C6 Uso de medicación (Q7) · C7 Disfunción diurna (Q8+Q9).
 * A mayor global, peor calidad (>5 = mala calidad). LE8 además usa la duración (Q4).
 */
const sleepPsqi: Questionnaire = {
  resourceType: 'Questionnaire',
  url: URL_BY_SLUG['le8-sleep-psqi-v1'],
  version: '1.0.0',
  status: 'active',
  name: 'le8-sleep-psqi',
  title: 'Calidad del sueño (PSQI)',
  subjectType: ['Patient'],
  item: [
    {
      linkId: 'psqi-intro',
      type: 'display',
      text: 'Las siguientes preguntas se refieren a tus hábitos de sueño durante el último mes. Respondé pensando en la mayoría de los días y noches del último mes.',
    },
    {
      linkId: 'psqi-q1',
      text: '¿A qué hora te acostaste habitualmente por la noche?',
      type: 'time',
    },
    {
      linkId: 'psqi-q2',
      text: '¿Cuántos minutos tardaste en dormirte, en general?',
      type: 'integer',
    },
    {
      linkId: 'psqi-q3',
      text: '¿A qué hora te levantaste habitualmente por la mañana?',
      type: 'time',
    },
    {
      linkId: 'psqi-q4',
      text: '¿Cuántas horas dormiste realmente por noche (puede diferir de las horas que estuviste en la cama)?',
      type: 'decimal',
    },
    {
      linkId: 'psqi-q5',
      text: 'Durante el último mes, ¿con qué frecuencia tuviste problemas para dormir porque…',
      type: 'group',
      item: [
        psqiQ5('psqi-q5a', '…no pudiste dormirte en los primeros 30 minutos?'),
        psqiQ5('psqi-q5b', '…te despertaste durante la noche o de madrugada?'),
        psqiQ5('psqi-q5c', '…tuviste que levantarte para ir al baño?'),
        psqiQ5('psqi-q5d', '…no pudiste respirar cómodamente?'),
        psqiQ5('psqi-q5e', '…tosiste o roncaste ruidosamente?'),
        psqiQ5('psqi-q5f', '…sentiste demasiado frío?'),
        psqiQ5('psqi-q5g', '…sentiste demasiado calor?'),
        psqiQ5('psqi-q5h', '…tuviste malos sueños o pesadillas?'),
        psqiQ5('psqi-q5i', '…tuviste dolor?'),
        psqiQ5('psqi-q5j', '…otra razón?'),
        {
          linkId: 'psqi-q5j-detalle',
          text: 'Si hubo otra razón, describila',
          type: 'string',
          enableWhen: [{ question: 'psqi-q5j', operator: '!=', answerCoding: { code: '0' } }],
        },
      ],
    },
    {
      linkId: 'psqi-q6',
      text: 'Durante el último mes, ¿cómo calificarías la calidad general de tu sueño?',
      type: 'choice',
      answerOption: [
        { valueCoding: { code: '0', display: 'Muy buena' } },
        { valueCoding: { code: '1', display: 'Bastante buena' } },
        { valueCoding: { code: '2', display: 'Bastante mala' } },
        { valueCoding: { code: '3', display: 'Muy mala' } },
      ],
    },
    {
      linkId: 'psqi-q7',
      text: 'Durante el último mes, ¿con qué frecuencia tomaste medicación (recetada o de venta libre) para dormir?',
      type: 'choice',
      answerOption: PSQI_FREQ,
    },
    {
      linkId: 'psqi-q8',
      text: 'Durante el último mes, ¿con qué frecuencia te costó mantenerte despierto/a (manejando, comiendo o en actividades sociales)?',
      type: 'choice',
      answerOption: PSQI_FREQ,
    },
    {
      linkId: 'psqi-q9',
      text: 'Durante el último mes, ¿cuánto problema representó mantener el entusiasmo para hacer las cosas?',
      type: 'choice',
      answerOption: [
        { valueCoding: { code: '0', display: 'Ningún problema' } },
        { valueCoding: { code: '1', display: 'Un problema muy leve' } },
        { valueCoding: { code: '2', display: 'Algo de problema' } },
        { valueCoding: { code: '3', display: 'Un gran problema' } },
      ],
    },
  ],
};

/** Opción binaria de MEDAS: `code:'1'` = cumple el criterio mediterráneo (suma 1). */
function medas(
  linkId: string,
  text: string,
  cumple: string,
  noCumple: string
): NonNullable<Questionnaire['item']>[number] {
  return {
    linkId,
    text,
    type: 'choice',
    answerOption: [
      { valueCoding: { code: '1', display: cumple } },
      { valueCoding: { code: '0', display: noCumple } },
    ],
  };
}

/**
 * Alimentación — MEDAS / MEPA (14 ítems, PREDIMED). Cada `code:'1'` suma 1 → 0–14.
 * ≥9 = buena adherencia al patrón mediterráneo. LE8 mapea la adherencia a su score de dieta.
 */
const dietMepa: Questionnaire = {
  resourceType: 'Questionnaire',
  url: URL_BY_SLUG['le8-diet-mepa-v1'],
  version: '1.0.0',
  status: 'active',
  name: 'le8-diet-mepa',
  title: 'Alimentación (patrón mediterráneo, MEDAS)',
  subjectType: ['Patient'],
  item: [
    {
      linkId: 'medas-intro',
      type: 'display',
      text: 'Estas 14 preguntas evalúan qué tan cercana es tu alimentación al patrón mediterráneo. Respondé según lo que comés habitualmente.',
    },
    medas('medas-01', '¿Usás el aceite de oliva como principal grasa para cocinar?', 'Sí', 'No'),
    medas('medas-02', '¿Cuánto aceite de oliva consumís por día?', '4 o más cucharadas', 'Menos de 4 cucharadas'),
    medas('medas-03', '¿Cuántas porciones de verduras u hortalizas comés por día?', '2 o más (al menos 1 cruda o en ensalada)', 'Menos de 2'),
    medas('medas-04', '¿Cuántas piezas de fruta comés por día?', '3 o más', 'Menos de 3'),
    medas('medas-05', '¿Cuántas porciones de carnes rojas, hamburguesas o embutidos comés por día?', 'Menos de 1', '1 o más'),
    medas('medas-06', '¿Cuántas porciones de manteca, margarina o crema consumís por día?', 'Menos de 1', '1 o más'),
    medas('medas-07', '¿Cuántas bebidas azucaradas (gaseosas, jugos con azúcar) tomás por día?', 'Menos de 1', '1 o más'),
    medas('medas-08', '¿Cuántas porciones de legumbres comés por semana?', '3 o más', 'Menos de 3'),
    medas('medas-09', '¿Cuántas porciones de pescado o mariscos comés por semana?', '3 o más', 'Menos de 3'),
    medas('medas-10', '¿Cuántas veces por semana comés repostería industrial (no casera: facturas, galletitas, tortas compradas)?', 'Menos de 3', '3 o más'),
    medas('medas-11', '¿Cuántas veces por semana comés frutos secos?', '3 o más', 'Menos de 3'),
    medas('medas-12', '¿Preferís comer pollo, pavo o conejo en lugar de carne vacuna, cerdo o embutidos?', 'Sí', 'No'),
    medas('medas-13', '¿Cuántas veces por semana comés verduras, pasta, arroz u otros platos preparados con salsa de tomate, cebolla y ajo (sofrito)?', '2 o más', 'Menos de 2'),
    medas('medas-14', '¿Tomás vino? (si corresponde a tu situación de salud) ¿Cuánto?', '7 o más vasos por semana', 'Menos de 7 vasos por semana'),
  ],
};

/**
 * Actividad física — Exercise Vital Sign (EVS). min/semana = días × minutos.
 * LE8 puntúa por min/semana de actividad moderada-intensa (≥150 min/sem = óptimo).
 */
const activityEvs: Questionnaire = {
  resourceType: 'Questionnaire',
  url: URL_BY_SLUG['le8-activity-evs-v1'],
  version: '1.0.0',
  status: 'active',
  name: 'le8-activity-evs',
  title: 'Actividad física',
  subjectType: ['Patient'],
  item: [
    {
      linkId: 'evs-intro',
      type: 'display',
      text: 'Pensá en una semana típica. "Actividad moderada a intensa" es la que acelera tu respiración o tu pulso (caminata rápida, bici, nadar, correr, deportes, etc.).',
    },
    {
      linkId: 'evs-days',
      text: 'En una semana típica, ¿cuántos días hacés actividad física moderada a intensa?',
      type: 'integer',
      required: true,
    },
    {
      linkId: 'evs-minutes',
      text: 'En esos días, ¿cuántos minutos en promedio dedicás a la actividad?',
      type: 'integer',
      required: true,
      enableWhen: [{ question: 'evs-days', operator: '>', answerInteger: 0 }],
    },
  ],
};

/**
 * Tabaco — Exposición a nicotina (LE8). Estado + tiempo desde que dejó + humo ajeno.
 * LE8: Nunca=100 · Ex ≥5a=75 · Ex 1–5a=50 · Ex <1a=25 · Fuma=0; convivencia con
 * fumador dentro del hogar resta 20 puntos.
 */
const tobacco: Questionnaire = {
  resourceType: 'Questionnaire',
  url: URL_BY_SLUG['le8-tobacco-v1'],
  version: '1.0.0',
  status: 'active',
  name: 'le8-tobacco',
  title: 'Tabaco y nicotina',
  subjectType: ['Patient'],
  item: [
    {
      linkId: 'tabaco-estado',
      text: '¿Cuál es tu situación respecto del tabaco o la nicotina?',
      type: 'choice',
      required: true,
      answerOption: [
        { valueCoding: { code: 'never', display: 'Nunca fumé (ni vapeo)' } },
        { valueCoding: { code: 'former', display: 'Fumé, pero lo dejé' } },
        { valueCoding: { code: 'current', display: 'Fumo o vapeo actualmente' } },
      ],
    },
    {
      linkId: 'tabaco-tiempo-dejo',
      text: '¿Hace cuánto que lo dejaste?',
      type: 'choice',
      enableWhen: [{ question: 'tabaco-estado', operator: '=', answerCoding: { code: 'former' } }],
      answerOption: [
        { valueCoding: { code: 'lt1', display: 'Hace menos de 1 año' } },
        { valueCoding: { code: '1to5', display: 'Entre 1 y 5 años' } },
        { valueCoding: { code: 'gte5', display: '5 años o más' } },
      ],
    },
    {
      linkId: 'tabaco-tipo',
      text: '¿Qué productos usás?',
      type: 'choice',
      enableWhen: [{ question: 'tabaco-estado', operator: '=', answerCoding: { code: 'current' } }],
      answerOption: [
        { valueCoding: { code: 'cigarrillos', display: 'Cigarrillos' } },
        { valueCoding: { code: 'vapeo', display: 'Vapeo / cigarrillo electrónico' } },
        { valueCoding: { code: 'otros', display: 'Otros productos con nicotina' } },
      ],
    },
    {
      linkId: 'tabaco-cantidad',
      text: 'En promedio, ¿cuántos cigarrillos por día? (si aplica)',
      type: 'integer',
      enableWhen: [{ question: 'tabaco-estado', operator: '=', answerCoding: { code: 'current' } }],
    },
    {
      linkId: 'tabaco-humo-ajeno',
      text: '¿Convivís con alguien que fuma dentro de tu casa (exposición al humo de otros)?',
      type: 'boolean',
      required: true,
    },
  ],
};

/** Las 4 definiciones, indexadas por slug (mismo slug/url que `le8.ts`). */
export const LE8_QUESTIONNAIRE_DEFS: Record<LE8QuestionnaireSlug, Questionnaire> = {
  'le8-sleep-psqi-v1': sleepPsqi,
  'le8-diet-mepa-v1': dietMepa,
  'le8-activity-evs-v1': activityEvs,
  'le8-tobacco-v1': tobacco,
};

/** Definición local (fallback) del cuestionario para un slug, si existe. */
export function le8QuestionnaireDef(slug: string): Questionnaire | undefined {
  return (LE8_QUESTIONNAIRE_DEFS as Record<string, Questionnaire>)[slug];
}

/** Todas las definiciones (para el uploader). */
export const LE8_QUESTIONNAIRE_LIST: Questionnaire[] = Object.values(LE8_QUESTIONNAIRE_DEFS);
