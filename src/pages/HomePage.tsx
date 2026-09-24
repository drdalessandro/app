// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  Overlay,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import { formatHumanName } from '@medplum/core';
import type { Patient, Practitioner } from '@medplum/fhirtypes';
import { useMedplumProfile } from '@medplum/react';
import {
  IconCalendarEvent,
  IconChevronRight,
  IconClipboardHeart,
  IconDeviceWatch,
  IconDropletHeart,
  IconDna2,
  IconFileCheck,
  IconFileText,
  IconGenderFemale,
  IconMessage,
  IconReportMedical,
  IconStethoscope,
  IconUserPlus,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { PlanBienestar100 } from '../components/PlanBienestar100';
import classes from './HomePage.module.css';
import { EstadioCkmCard, PlanBienestarCard, RiesgoPreventCard } from '@epa/plan-bienestar-react';

// Tablero mobile: All-in Plan Bienestar 100 días. La card CTA lleva al plan; las acciones
// rápidas y las filas NO duplican esa entrada (el Consentimiento vive dentro de Salud).
const mobileTiles: { icon: Icon; title: string; href: string }[] = [
  { icon: IconReportMedical, title: 'Cargar resultado', href: '/health-record/biomarkers' },
  { icon: IconCalendarEvent, title: 'Reservar', href: '/get-care' },
  { icon: IconMessage, title: 'Mensajes', href: '/Communication' },
];

const mobileRows: { icon: Icon; title: string; description: string; href: string }[] = [
  { icon: IconDropletHeart, title: 'Entendé tu salud CKM', description: 'Corazón, riñones y metabolismo, fase por fase', href: '/ckm' },
  { icon: IconStethoscope, title: 'Mi salud cardiovascular', description: "Tus hábitos: cuestionarios Life's Essential 8", href: '/health-record/cuestionarios' },
  { icon: IconReportMedical, title: 'Mis biomarcadores', description: 'Resultados y evolución', href: '/health-record/biomarkers' },
  { icon: IconFileText, title: 'Historia clínica', description: 'Estudios y registros', href: '/health-record' },
  { icon: IconClipboardHeart, title: 'Mi Plan Bienestar', description: 'Pasos, metas y consultas de tus 100 días', href: '/care-plan/plan-100-dias' },
  { icon: IconWallet, title: 'Mi membresía', description: 'Turnos, sesiones y pagos', href: '/membership' },
];

interface CardItem {
  readonly icon: Icon;
  readonly title: string;
  readonly description: string;
  readonly href?: string;
}

// Accesos rápidos a las funciones reales del portal.
const quickActions: CardItem[] = [
  {
    icon: IconClipboardHeart,
    title: 'Plan Bienestar · 100 días',
    description: 'Tus pasos, metas y consultas con un profesional de la red.',
    href: '/care-plan/plan-100-dias',
  },
  {
    icon: IconDropletHeart,
    title: 'Tu salud CKM',
    description: 'La guía AHA explicada fácil: descubrí tu estadío (0-4) y qué hacer en cada fase.',
    href: '/ckm',
  },
  {
    icon: IconReportMedical,
    title: 'Biomarcadores',
    description: 'Cargá tus resultados de laboratorio y seguí su evolución.',
    href: '/health-record/biomarkers',
  },
  {
    icon: IconFileText,
    title: 'Historia Clínica',
    description: 'Resultados, estudios y registros de tus visitas.',
    href: '/health-record',
  },
  {
    icon: IconMessage,
    title: 'Mensajes',
    description: 'Comunicate con el equipo de Segunda Opinión Médica.',
    href: '/Communication',
  },
  {
    icon: IconStethoscope,
    title: 'Mi salud cardiovascular',
    description: "Completá tus hábitos con los cuestionarios Life's Essential 8.",
    href: '/health-record/cuestionarios',
  },
  {
    icon: IconFileCheck,
    title: 'Consentimiento informado',
    description: 'Leé y firmá tu consentimiento.',
    href: '/health-record/consent',
  },
];

// "Nuestros servicios" — la oferta cardiovascular de Segunda Opinión Médica
// (segundaopinionmedica.org). Salud convencional cardiovascular, centrada en datos y prevención.
const services: CardItem[] = [
  {
    icon: IconStethoscope,
    title: 'Consultas con especialistas',
    description: 'Dentro de tu Plan Bienestar, consultas con cardiólogos de la red según tu estadío CKM (guía AHA 2023).',
  },
  {
    icon: IconUsers,
    title: 'Líderes globales en salud',
    description: 'Conectamos tu caso con especialistas y referentes globales en cardiología.',
  },
  {
    icon: IconUserPlus,
    title: 'Derivación de colegas',
    description: 'Si sos profesional, sumá a tu paciente al Plan Bienestar y seguí su evolución.',
  },
  {
    icon: IconDeviceWatch,
    title: 'Monitoreo remoto',
    description: 'Seguimiento de tus datos para prevenir antes de los síntomas (Salud 3.0).',
  },
  {
    icon: IconDna2,
    title: 'Genómica',
    description: 'Información genética aplicada a tu prevención cardiovascular.',
  },
  {
    icon: IconGenderFemale,
    title: 'Corazón y Mujer',
    description: 'Atención cardiovascular pensada para la salud de la mujer.',
  },
];

// "Cómo funciona" — el recorrido del Plan Bienestar 100 días, en 3 pasos.
const steps = [
  {
    n: 1,
    title: 'Conocé tu punto de partida',
    description: "Tus datos, tus hábitos (Life's Essential 8) y tu laboratorio: calculamos tu estadío CKM y tu riesgo PREVENT.",
  },
  {
    n: 2,
    title: 'Seguí tu plan',
    description: 'Pasos y metas semanales durante 100 días, adaptados a tu estadío.',
  },
  {
    n: 3,
    title: 'Acompañamiento profesional',
    description: 'Un profesional de la red revisa tu evolución, ajusta el plan y te atiende en las consultas.',
  },
];

export function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const profile = useMedplumProfile() as Patient | Practitioner;
  const profileName = profile.name ? formatHumanName(profile.name[0]) : '';
  const go = (href: string): void => {
    navigate(href)?.catch(console.error);
  };

  return (
    <>
      {/* MOBILE — tablero estilo app */}
      <Box hiddenFrom="sm" bg="gray.0" px="md" py="lg" mih="100%">
        <Text fz="sm" c="dimmed">
          Hola,
        </Text>
        <Title order={2} mb="md" style={{ letterSpacing: '-0.01em' }}>
          {profileName || 'qué bueno verte'}
        </Title>

        {/* Tarjeta de prioridad */}
        <Card radius="lg" p="lg" mb="lg" style={{ backgroundColor: 'var(--mantine-primary-color-filled)' }}>
          <Text c="white" fw={700} fz="lg">
            Tu Plan Bienestar · 100 días
          </Text>
          <Text c="gray.3" fz="sm" mt={4} mb="md">
            Datos, hábitos y metas para tu salud cardiovascular, con el acompañamiento de un profesional de la red.
          </Text>
          <Button variant="white" radius="xl" size="sm" onClick={() => go('/care-plan/plan-100-dias')}>
            Ir a mi plan
          </Button>
        </Card>
        <Container mt="md">
          <PlanBienestarCard />
          <Box mt="md">
            <EstadioCkmCard />
          </Box>
          <Box mt="md">
            <RiesgoPreventCard basePath="/care-plan/plan-100-dias" />
          </Box>
        </Container>

        {/* Plan Bienestar · 100 días (solo si el paciente está inscripto) */}
        <Box mb="lg">
          <PlanBienestar100 />
        </Box>
        {/* Acciones rápidas */}
        <SimpleGrid cols={3} spacing="sm" mb="lg">
          {mobileTiles.map((t) => (
            <UnstyledButton key={t.title} className={classes.tile} onClick={() => go(t.href)}>
              <ThemeIcon size={44} radius="md" variant="light" color={theme.primaryColor}>
                <t.icon size={22} stroke={1.5} />
              </ThemeIcon>
              <Text fz="xs" fw={600} ta="center" mt={6}>
                {t.title}
              </Text>
            </UnstyledButton>
          ))}
        </SimpleGrid>

        {/* Filas a las secciones */}
        <Stack gap="xs">
          {mobileRows.map((r) => (
            <UnstyledButton key={r.title} className={classes.row} onClick={() => go(r.href)}>
              <ThemeIcon size={38} radius="md" variant="light" color={theme.primaryColor}>
                <r.icon size={20} stroke={1.5} />
              </ThemeIcon>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600} fz="sm">
                  {r.title}
                </Text>
                <Text fz="xs" c="dimmed">
                  {r.description}
                </Text>
              </div>
              <IconChevronRight size={18} color="var(--mantine-color-gray-5)" />
            </UnstyledButton>
          ))}
        </Stack>
      </Box>

      {/* DESKTOP — home completa */}
      <Box visibleFrom="sm" bg="gray.0">
      {/* Hero */}
      <div className={classes.hero}>
        <Overlay
          gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.55) 100%)"
          opacity={1}
          zIndex={0}
        />
        <Container className={classes.heroContainer}>
          <Title className={classes.heroTitle}>
            Hola <span>{profileName}</span>,<br /> tu Plan Bienestar de 100 días para tu salud cardiovascular
          </Title>
          <Text c="white" size="lg" maw={640} mt="md" style={{ position: 'relative', zIndex: 1 }}>
            Salud 3.0: datos y prevención. Conocé tu estadío CKM, completá tus hábitos Life&apos;s Essential 8 y
            avanzá con metas claras, acompañado por un profesional de la red.
          </Text>
          <Group mt="xl" style={{ position: 'relative', zIndex: 1 }}>
            <Button size="lg" radius="xl" className={classes.heroButton} onClick={() => go('/care-plan/plan-100-dias')}>
              Ir a mi Plan Bienestar
            </Button>
            <Button
              size="lg"
              radius="xl"
              variant="white"
              onClick={() => navigate('/health-record/biomarkers')?.catch(console.error)}
            >
              Cargar mis biomarcadores
            </Button>
          </Group>
        </Container>
      </div>

      {/* Plan Bienestar · 100 días (solo si el paciente está inscripto) */}
      <Container pt={48}>
        <PlanBienestar100 />
      </Container>
      {/* Accesos rápidos */}
      <Container py={48}>
        {/* Plan Bienestar · 100 días: la card se auto-gestiona (null si el paciente no es elegible). */}
        <Box mb="xl">
          <PlanBienestarCard />
          <Box mt="md">
            <EstadioCkmCard />
          </Box>
          <Box mt="md">
            <RiesgoPreventCard basePath="/care-plan/plan-100-dias" />
          </Box>
        </Box>
        <Title order={2} mb="lg">
          Accesos rápidos
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {quickActions.map((item) => (
            <Card
              key={item.title}
              withBorder
              radius="md"
              p="lg"
              className={classes.card}
              style={{ cursor: 'pointer' }}
              onClick={() => item.href && navigate(item.href)?.catch(console.error)}
            >
              <Group wrap="nowrap" align="flex-start">
                <ThemeIcon size={44} radius="md" variant="light" color={theme.primaryColor}>
                  <item.icon size={24} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Text fw={600}>{item.title}</Text>
                  <Text size="sm" c="dimmed">
                    {item.description}
                  </Text>
                </div>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Container>

      {/* Nuestros servicios */}
      <Box bg="white">
        <Container py={48}>
          <Title order={2} mb={4}>
            Nuestros servicios
          </Title>
          <Text c="dimmed" mb="lg" maw={720}>
            Atención cardiovascular centrada en datos y prevención: 100 días de plan con acompañamiento experto.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {services.map((item) => (
              <Card key={item.title} withBorder radius="md" p="lg" className={classes.card}>
                <ThemeIcon size={44} radius="md" variant="light" color={theme.primaryColor}>
                  <item.icon size={24} stroke={1.5} />
                </ThemeIcon>
                <Text fw={600} mt="md">
                  {item.title}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {item.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Cómo funciona */}
      <Container py={48}>
        <Title order={2} mb={4}>
          Cómo funciona
        </Title>
        <Text c="dimmed" mb="lg" maw={720}>
          Tu Plan Bienestar de 100 días, en tres pasos.
        </Text>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {steps.map((step) => (
            <Card key={step.n} withBorder radius="md" p="lg" className={classes.card}>
              <ThemeIcon size={40} radius="xl" color={theme.primaryColor}>
                {step.n}
              </ThemeIcon>
              <Text fw={600} mt="md">
                {step.title}
              </Text>
              <Text size="sm" c="dimmed" mt={4}>
                {step.description}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
      </Box>
    </>
  );
}
