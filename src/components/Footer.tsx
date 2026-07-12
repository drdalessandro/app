// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Anchor, Container, Divider, Stack, Text } from '@mantine/core';
import type { JSX } from 'react';
import classes from './Footer.module.css';

export function Footer(): JSX.Element {
  return (
    <footer className={classes.footer}>
      <div className={classes.inner}>
        <Container p="xl">
          <Stack gap="md">
            <div>
              <Text fw={700}>Segunda Opinión Médica</Text>
              <Text c="dimmed" size="sm">
                Dr. Alejandro Barbagelata
              </Text>
              <Text c="dimmed" size="sm">
                Húsares 2248 6° E · C1428 CABA (Bajo Belgrano) · Argentina
              </Text>
              <Text c="dimmed" size="sm">
                <Anchor href="mailto:info@segundaopinionmedica.org">info@segundaopinionmedica.org</Anchor>
              </Text>
            </div>

            <Divider />

            <Text c="dimmed" size="sm">
              &copy; {new Date().getFullYear()} Segunda Opinión Médica. Todos los derechos reservados.
            </Text>
            <Text c="dimmed" size="xs">
              Powered by EPA Bienestar IA · CTO: Dr. Alejandro Sergio D&apos;Alessandro
            </Text>
            <Text c="dimmed" size="xs">
              Cloud AWS · TypeScript · IA Anthropic · Infra IA NVIDIA
            </Text>
          </Stack>
        </Container>
      </div>
    </footer>
  );
}
