// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createReference, formatDate, getReferenceString } from '@medplum/core';
import type { Observation, Patient } from '@medplum/fhirtypes';
import { Document, useMedplum } from '@medplum/react';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import type { ChartData } from 'chart.js';
import { useCallback, useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Navigate, useParams } from 'react-router';
import { LineChart } from '../../components/LineChart';
import { showErrorNotification } from '../../utils/notifications';
import type { Biomarker, BiomarkerRange } from './Biomarkers.data';
import { biomarkerPanels } from './Biomarkers.data';

const chartColors = {
  backgroundColor: 'rgba(29, 112, 214, 0.7)',
  borderColor: 'rgba(29, 112, 214, 1)',
};

/** Devuelve true si el valor cae dentro del rango (límites opcionales). */
function inRange(value: number, range: BiomarkerRange): boolean {
  return (range.low === undefined || value >= range.low) && (range.high === undefined || value <= range.high);
}

/** Color del semáforo: verde = rango funcional, amarillo = convencional, rojo = fuera. */
function rangeColor(value: number | undefined, bm: Biomarker): string {
  if (value === undefined) {
    return 'gray';
  }
  if (bm.functional && inRange(value, bm.functional)) {
    return 'green';
  }
  if (bm.conventional && inRange(value, bm.conventional)) {
    return 'yellow';
  }
  if (bm.conventional || bm.functional) {
    return 'red';
  }
  return 'gray';
}

/** Formatea un rango como texto legible. */
function formatRange(range?: BiomarkerRange): string {
  if (!range || (range.low === undefined && range.high === undefined)) {
    return '—';
  }
  if (range.low !== undefined && range.high !== undefined) {
    return `${range.low} – ${range.high}`;
  }
  if (range.low !== undefined) {
    return `≥ ${range.low}`;
  }
  return `≤ ${range.high}`;
}

export function BiomarkerPanel(): JSX.Element {
  const { panelId } = useParams();
  const medplum = useMedplum();
  const patient = medplum.getProfile() as Patient;
  const panel = panelId ? biomarkerPanels[panelId] : undefined;

  const [observations, setObservations] = useState<Observation[]>([]);
  const [activeBiomarker, setActiveBiomarker] = useState<Biomarker | null>(null);
  const [value, setValue] = useState<number | string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const codes = panel?.biomarkers.map((b) => b.code).join(',');

  const loadData = useCallback(() => {
    if (!codes) {
      return;
    }
    medplum
      .searchResources('Observation', `code=${codes}&patient=${getReferenceString(patient)}&_sort=-date&_count=200`)
      .then(setObservations)
      .catch(showErrorNotification);
  }, [medplum, codes, patient]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!panel) {
    return <Navigate replace to="/health-record/biomarkers/endocrinologia" />;
  }

  function observationsFor(code: string): Observation[] {
    return observations.filter((obs) => obs.code?.coding?.some((c) => c.code === code));
  }

  function openModal(bm: Biomarker): void {
    setActiveBiomarker(bm);
    setValue('');
    setDate(new Date().toISOString().slice(0, 10));
  }

  function submitObservation(): void {
    const bm = activeBiomarker;
    if (!bm || value === '' || Number.isNaN(Number(value))) {
      return;
    }

    const obs: Observation = {
      resourceType: 'Observation',
      status: 'preliminary',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory',
            },
          ],
        },
      ],
      subject: createReference(patient),
      effectiveDateTime: date,
      code: {
        coding: [{ system: bm.system ?? 'http://loinc.org', code: bm.code, display: bm.title }],
        text: bm.title,
      },
      valueQuantity: {
        value: Number(value),
        unit: bm.unit,
        system: 'http://unitsofmeasure.org',
        code: bm.unit,
      },
      referenceRange: bm.conventional
        ? [
            {
              low: bm.conventional.low !== undefined ? { value: bm.conventional.low, unit: bm.unit } : undefined,
              high: bm.conventional.high !== undefined ? { value: bm.conventional.high, unit: bm.unit } : undefined,
              text: 'Rango convencional',
            },
          ]
        : undefined,
    };

    medplum
      .createResource(obs)
      .then(() => {
        notifications.show({ color: 'green', title: 'Cargado', message: `${bm.title} guardado correctamente.` });
        setActiveBiomarker(null);
        loadData();
      })
      .catch(showErrorNotification);
  }

  return (
    <Document>
      <Title order={1} mb="xs">
        {panel.title}
      </Title>
      <Text c="dimmed" mb="xl">
        {panel.description}
      </Text>

      <Accordion variant="separated" multiple>
        {panel.biomarkers.map((bm) => {
          const history = observationsFor(bm.code);
          const latest = history[0]?.valueQuantity?.value;
          const color = rangeColor(latest, bm);

          const ascending = [...history].reverse();
          const chartData: ChartData<'line', number[]> = {
            labels: ascending.map((obs) => formatDate(obs.effectiveDateTime)),
            datasets: [
              {
                label: `${bm.title} (${bm.unit})`,
                data: ascending.map((obs) => obs.valueQuantity?.value as number),
                ...chartColors,
              },
            ],
          };

          return (
            <Accordion.Item key={bm.code} value={bm.code}>
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap" pr="md">
                  <Text fw={500}>{bm.title}</Text>
                  <Badge color={color} variant="light" size="lg">
                    {latest !== undefined ? `${latest} ${bm.unit}` : 'Sin datos'}
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Text size="sm" c="dimmed">
                    {bm.description}
                  </Text>
                  <Group gap="xl">
                    <Text size="sm">
                      <b>Rango funcional:</b> {formatRange(bm.functional)} {bm.unit}
                    </Text>
                    <Text size="sm">
                      <b>Rango convencional:</b> {formatRange(bm.conventional)} {bm.unit}
                    </Text>
                  </Group>

                  <Group justify="flex-end">
                    <Button leftSection={<IconPlus size={16} />} onClick={() => openModal(bm)}>
                      Cargar resultado
                    </Button>
                  </Group>

                  {history.length > 0 ? (
                    <>
                      {history.length > 1 && <LineChart chartData={chartData} />}
                      <Table.ScrollContainer minWidth={320}>
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Fecha</Table.Th>
                              <Table.Th>Valor</Table.Th>
                              <Table.Th>Estado</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {history.map((obs) => {
                              const v = obs.valueQuantity?.value;
                              return (
                                <Table.Tr key={obs.id}>
                                  <Table.Td>{formatDate(obs.effectiveDateTime)}</Table.Td>
                                  <Table.Td>
                                    {v} {bm.unit}
                                  </Table.Td>
                                  <Table.Td>
                                    <Badge color={rangeColor(v, bm)} variant="dot" size="sm" />
                                  </Table.Td>
                                </Table.Tr>
                              );
                            })}
                          </Table.Tbody>
                        </Table>
                      </Table.ScrollContainer>
                    </>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Todavía no cargaste resultados para este biomarcador.
                    </Text>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>

      <Box mt="xl">
        <Alert icon={<IconInfoCircle size={16} />} color="gray" radius="md">
          Los valores que cargás quedan registrados como preliminares hasta que un profesional de BioWellness los valide.
          El rango funcional representa el valor óptimo; puede ser más estricto que el rango del laboratorio.
        </Alert>
      </Box>

      <Modal
        opened={activeBiomarker !== null}
        onClose={() => setActiveBiomarker(null)}
        title={activeBiomarker ? `Cargar ${activeBiomarker.title}` : ''}
      >
        <Stack gap="md">
          <NumberInput
            label={`Valor${activeBiomarker ? ` (${activeBiomarker.unit})` : ''}`}
            placeholder="Ingresá el valor"
            value={value}
            onChange={setValue}
            decimalScale={2}
            step={0.1}
          />
          <TextInput
            label="Fecha del estudio"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setActiveBiomarker(null)}>
              Cancelar
            </Button>
            <Button onClick={submitObservation} disabled={value === ''}>
              Guardar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Document>
  );
}
