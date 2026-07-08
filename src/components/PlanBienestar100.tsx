// SPDX-FileCopyrightText: Copyright Segunda Opinión Médica
// SPDX-License-Identifier: Apache-2.0
//
// Tarjeta de gamificación del Plan Bienestar · 100 días: progreso (día X/100), hitos
// con check y racha semanal. Si el paciente no está inscripto, no renderiza nada
// (o muestra una invitación breve si `invitar` es true, para la página "Mi plan").
import { Badge, Button, Card, Group, Progress, RingProgress, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { IconChevronRight, IconCircleCheck, IconCircleDashed, IconFlame, IconHeartHandshake } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import type { PlanBienestar } from '../fhir/bienestar';
import { cargarPlanBienestar } from '../fhir/bienestar';

export function PlanBienestar100({ invitar = false }: { invitar?: boolean }): JSX.Element | null {
  const medplum = useMedplum();
  const navigate = useNavigate();
  const profile = medplum.getProfile();
  const [plan, setPlan] = useState<PlanBienestar | null>();

  useEffect(() => {
    if (profile?.resourceType !== 'Patient') {
      setPlan(null);
      return;
    }
    cargarPlanBienestar(medplum, profile as Patient)
      .then((p) => setPlan(p ?? null))
      .catch((err) => {
        console.warn('Plan Bienestar no disponible', err);
        setPlan(null);
      });
  }, [medplum, profile]);

  const go = (href: string): void => {
    navigate(href)?.catch(console.error);
  };

  if (plan === undefined) {
    return null; // cargando: no ocupar lugar
  }

  if (plan === null) {
    if (!invitar) {
      return null;
    }
    return (
      <Card withBorder radius="lg" p="lg">
        <Group wrap="nowrap" align="flex-start">
          <ThemeIcon size={44} radius="xl" variant="light">
            <IconHeartHandshake size={24} stroke={1.5} />
          </ThemeIcon>
          <div>
            <Text fw={600}>Plan Bienestar · 100 días</Text>
            <Text size="sm" c="dimmed">
              Un programa guiado de 100 días para ordenar tu prevención cardiovascular: datos, hábitos y seguimiento.
              Consultanos por Mensajes para sumarte.
            </Text>
          </div>
        </Group>
      </Card>
    );
  }

  const pct = Math.round((plan.dia / plan.totalDias) * 100);
  const cumplidos = plan.hitos.filter((h) => h.cumplido).length;
  const proximo = plan.hitos.find((h) => !h.cumplido);

  return (
    <Card withBorder radius="lg" p="lg">
      <Group wrap="nowrap" align="center" gap="lg">
        <RingProgress
          size={104}
          thickness={10}
          roundCaps
          sections={[{ value: Math.min(pct, 100), color: 'segundaOpinion' }]}
          label={
            <div style={{ textAlign: 'center' }}>
              <Text fw={700} fz="lg" lh={1}>
                {plan.dia}
              </Text>
              <Text fz="xs" c="dimmed" lh={1.2}>
                de {plan.totalDias}
              </Text>
            </div>
          }
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" mb={4}>
            <Text fw={700}>Plan Bienestar · 100 días</Text>
            {plan.terminado && (
              <Badge color="green" variant="light">
                ¡Completado!
              </Badge>
            )}
          </Group>
          <Group gap="xs" mb={6}>
            <ThemeIcon size={22} radius="xl" variant="light" color={plan.rachaActual > 0 ? 'orange' : 'gray'}>
              <IconFlame size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              {plan.rachaActual > 0
                ? `Racha de ${plan.rachaActual} ${plan.rachaActual === 1 ? 'semana' : 'semanas'} · ${plan.semanasActivas} activas en total`
                : `${plan.semanasActivas} ${plan.semanasActivas === 1 ? 'semana activa' : 'semanas activas'} — ¡retomá esta semana!`}
            </Text>
          </Group>
          <Text size="sm" fw={500} mb={4}>
            Hitos: {cumplidos}/{plan.hitos.length}
          </Text>
          <Progress value={(cumplidos / plan.hitos.length) * 100} size="sm" radius="xl" />
        </div>
      </Group>

      <Stack gap={6} mt="md">
        {plan.hitos.map((h) => (
          <UnstyledButton
            key={h.id}
            onClick={() => go(h.href)}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            {h.cumplido ? (
              <IconCircleCheck size={20} color="var(--mantine-color-green-6)" />
            ) : (
              <IconCircleDashed size={20} color="var(--mantine-color-gray-5)" />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={h.cumplido ? 400 : 600} td={h.cumplido ? 'line-through' : undefined} c={h.cumplido ? 'dimmed' : undefined}>
                {h.label}
              </Text>
              {!h.cumplido && (
                <Text size="xs" c="dimmed">
                  {h.descripcion}
                </Text>
              )}
            </div>
            {!h.cumplido && <IconChevronRight size={16} color="var(--mantine-color-gray-5)" />}
          </UnstyledButton>
        ))}
      </Stack>

      {proximo && (
        <Button mt="md" radius="xl" size="sm" onClick={() => go(proximo.href)}>
          Próximo paso: {proximo.label}
        </Button>
      )}
    </Card>
  );
}
