// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Container, Group } from '@mantine/core';
import { Suspense } from 'react';
import type { JSX } from 'react';
import { Outlet } from 'react-router';
import { Loading } from '../../components/Loading';
import { SideMenu } from '../../components/SideMenu';
import { biomarkerPanels } from './Biomarkers.data';
import { measurementsMeta } from './Measurement.data';

const sideMenu = {
  title: 'Historia Clínica',
  menu: [
    { name: 'Resultados de Laboratorio', href: '/health-record/lab-results' },
    {
      name: 'Biomarcadores',
      href: '/health-record/biomarkers',
      subMenu: Object.values(biomarkerPanels).map(({ title, id }) => ({
        name: title,
        href: `/health-record/biomarkers/${id}`,
      })),
    },
    {
      name: 'Signos Vitales',
      href: '/health-record/vitals',
      subMenu: Object.values(measurementsMeta).map(({ title, id }) => ({
        name: title,
        href: `/health-record/vitals/${id}`,
      })),
    },
    { name: 'Medicación', href: '/health-record/medications' },
    { name: 'Vacunas', href: '/health-record/vaccines' },
    { name: 'Cuestionarios', href: '/health-record/questionnaire-responses' },
    { name: 'Consentimiento Informado', href: '/health-record/consent' },
  ],
};

export function HealthRecord(): JSX.Element {
  return (
    <Container size="lg">
      <Group align="flex-start" gap="xl" wrap="wrap">
        <SideMenu {...sideMenu} />
        <div style={{ flex: 1, minWidth: 0, maxWidth: 820 }}>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </div>
      </Group>
    </Container>
  );
}
