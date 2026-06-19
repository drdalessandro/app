// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Catálogo de paneles de biomarcadores de BioWellness.
 *
 * Cada panel se expone como una sección de menú dentro de "Biomarcadores"
 * (Historia Clínica) y permite al paciente cargar y visualizar sus resultados
 * de laboratorio. Cada biomarcador se persiste como un recurso FHIR
 * `Observation` (category=laboratory) en el servidor Medplum.
 *
 * IMPORTANTE: los códigos LOINC, unidades y rangos son un punto de partida.
 * Deben validarse contra el Manual de Protocolos v8 y el laboratorio (Regenerar)
 * antes de uso clínico. El "rango funcional" es el rango óptimo de medicina
 * funcional/longevidad y puede ser más estrecho que el "rango convencional"
 * del laboratorio.
 */

export interface BiomarkerRange {
  readonly low?: number;
  readonly high?: number;
}

export interface Biomarker {
  /** Código LOINC del analito. */
  readonly code: string;
  /** Nombre visible en español. */
  readonly title: string;
  /** Unidad UCUM. */
  readonly unit: string;
  /** Descripción breve para el paciente. */
  readonly description: string;
  /** Rango de referencia convencional del laboratorio. */
  readonly conventional?: BiomarkerRange;
  /** Rango funcional / óptimo (medicina funcional / longevidad). */
  readonly functional?: BiomarkerRange;
}

export interface BiomarkerPanelType {
  /** Slug usado en la ruta /health-record/biomarkers/:panelId */
  readonly id: string;
  /** Título visible (menú y página). */
  readonly title: string;
  /** Descripción del panel para el paciente. */
  readonly description: string;
  readonly biomarkers: Biomarker[];
}

export const biomarkerPanels: Record<string, BiomarkerPanelType> = {
  endocrinologia: {
    id: 'endocrinologia',
    title: 'Endocrinología / Hormonal',
    description:
      'Marcadores del eje tiroideo, suprarrenal y hormonas sexuales. Permiten evaluar el equilibrio hormonal, la energía y la composición corporal.',
    biomarkers: [
      {
        code: '3016-3',
        title: 'TSH (Tirotrofina)',
        unit: 'mIU/L',
        description: 'Hormona que regula la función de la tiroides.',
        conventional: { low: 0.4, high: 4.0 },
        functional: { low: 1.0, high: 2.0 },
      },
      {
        code: '3024-7',
        title: 'T4 Libre',
        unit: 'ng/dL',
        description: 'Hormona tiroidea libre disponible para los tejidos.',
        conventional: { low: 0.8, high: 1.8 },
        functional: { low: 1.0, high: 1.5 },
      },
      {
        code: '3051-0',
        title: 'T3 Libre',
        unit: 'pg/mL',
        description: 'Forma activa de la hormona tiroidea.',
        conventional: { low: 2.3, high: 4.2 },
        functional: { low: 3.0, high: 4.0 },
      },
      {
        code: '2143-6',
        title: 'Cortisol (matinal)',
        unit: 'ug/dL',
        description: 'Hormona del estrés; se mide preferentemente por la mañana.',
        conventional: { low: 6, high: 18 },
        functional: { low: 10, high: 15 },
      },
      {
        code: '2484-4',
        title: 'Insulina (ayunas)',
        unit: 'uIU/mL',
        description: 'Hormona que regula la glucemia; clave en resistencia a la insulina.',
        conventional: { low: 2.6, high: 24.9 },
        functional: { low: 2, high: 6 },
      },
      {
        code: '2986-8',
        title: 'Testosterona total',
        unit: 'ng/dL',
        description: 'Principal hormona androgénica.',
        conventional: { low: 300, high: 1000 },
      },
    ],
  },
  inflamatorios: {
    id: 'inflamatorios',
    title: 'Biomarcadores Inflamatorios',
    description:
      'Marcadores de inflamación sistémica de bajo grado, asociados al riesgo cardiovascular, metabólico y de envejecimiento.',
    biomarkers: [
      {
        code: '30522-7',
        title: 'PCR ultrasensible (hs-CRP)',
        unit: 'mg/L',
        description: 'Proteína C reactiva de alta sensibilidad; marcador de inflamación.',
        conventional: { high: 3.0 },
        functional: { high: 1.0 },
      },
      {
        code: '13965-9',
        title: 'Homocisteína',
        unit: 'umol/L',
        description: 'Aminoácido asociado a riesgo cardiovascular y metilación.',
        conventional: { high: 15 },
        functional: { high: 7 },
      },
      {
        code: '2276-4',
        title: 'Ferritina',
        unit: 'ng/mL',
        description: 'Reserva de hierro; también es un reactante de fase aguda.',
        conventional: { low: 30, high: 400 },
        functional: { low: 50, high: 150 },
      },
      {
        code: '3255-7',
        title: 'Fibrinógeno',
        unit: 'mg/dL',
        description: 'Proteína de la coagulación que se eleva con la inflamación.',
        conventional: { low: 200, high: 400 },
      },
      {
        code: '30341-2',
        title: 'Eritrosedimentación (VSG)',
        unit: 'mm/h',
        description: 'Velocidad de sedimentación globular; marcador inespecífico de inflamación.',
        conventional: { high: 20 },
        functional: { high: 10 },
      },
    ],
  },
  metabolico: {
    id: 'metabolico',
    title: 'Metabólico',
    description:
      'Marcadores de glucemia y perfil lipídico para evaluar la salud metabólica y el riesgo cardiovascular.',
    biomarkers: [
      {
        code: '1558-6',
        title: 'Glucemia en ayunas',
        unit: 'mg/dL',
        description: 'Nivel de glucosa en sangre en ayunas.',
        conventional: { low: 70, high: 99 },
        functional: { low: 75, high: 86 },
      },
      {
        code: '4548-4',
        title: 'Hemoglobina glicosilada (HbA1c)',
        unit: '%',
        description: 'Promedio de glucemia de los últimos 2-3 meses.',
        conventional: { high: 5.7 },
        functional: { high: 5.4 },
      },
      {
        code: '2093-3',
        title: 'Colesterol total',
        unit: 'mg/dL',
        description: 'Colesterol total en sangre.',
        conventional: { high: 200 },
      },
      {
        code: '2085-9',
        title: 'Colesterol HDL',
        unit: 'mg/dL',
        description: 'Colesterol "bueno"; valores altos son protectores.',
        conventional: { low: 40 },
        functional: { low: 60 },
      },
      {
        code: '13457-7',
        title: 'Colesterol LDL',
        unit: 'mg/dL',
        description: 'Colesterol "malo"; valores bajos reducen el riesgo cardiovascular.',
        conventional: { high: 100 },
      },
      {
        code: '2571-8',
        title: 'Triglicéridos',
        unit: 'mg/dL',
        description: 'Grasas en sangre asociadas a la dieta y al metabolismo.',
        conventional: { high: 150 },
        functional: { high: 100 },
      },
    ],
  },
  longevidad: {
    id: 'longevidad',
    title: 'Longevidad / Micronutrientes',
    description:
      'Vitaminas y minerales clave para la energía, la inmunidad y los procesos asociados a la longevidad.',
    biomarkers: [
      {
        code: '1989-3',
        title: 'Vitamina D (25-OH)',
        unit: 'ng/mL',
        description: 'Vitamina D; importante para hueso, inmunidad y estado de ánimo.',
        conventional: { low: 30, high: 100 },
        functional: { low: 50, high: 80 },
      },
      {
        code: '2132-9',
        title: 'Vitamina B12',
        unit: 'pg/mL',
        description: 'Vitamina B12; esencial para el sistema nervioso y la sangre.',
        conventional: { low: 200, high: 900 },
        functional: { low: 500, high: 900 },
      },
      {
        code: '2284-8',
        title: 'Ácido fólico (Folato)',
        unit: 'ng/mL',
        description: 'Folato; clave en la metilación y la formación de glóbulos rojos.',
        conventional: { low: 3, high: 17 },
        functional: { low: 10, high: 17 },
      },
      {
        code: '2601-3',
        title: 'Magnesio',
        unit: 'mg/dL',
        description: 'Mineral involucrado en cientos de reacciones enzimáticas.',
        conventional: { low: 1.7, high: 2.2 },
        functional: { low: 2.0, high: 2.2 },
      },
      {
        code: '5763-8',
        title: 'Zinc',
        unit: 'ug/dL',
        description: 'Mineral esencial para la inmunidad y la reparación de tejidos.',
        conventional: { low: 70, high: 120 },
      },
    ],
  },
};
