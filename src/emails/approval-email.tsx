import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface ApprovalEmailProps {
  userName: string;
  loginUrl: string;
}

export default function ApprovalEmail({
  userName = 'Athlète',
  loginUrl = 'http://localhost:3000',
}: ApprovalEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre compte a été approuvé - Bienvenue chez ASUL Team !</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Modification du titre */}
          <Heading style={h1}>Bienvenue ! 🎉</Heading>

          <Text style={text}>
            Bonjour {userName},
          </Text>

          {/* Modification du texte d'intro avec le nom ASUL Team */}
          <Text style={text}>
            Bonne nouvelle ! Votre compte sur <strong>la plateforme ASUL Team</strong> a été approuvé par un coach.
          </Text>

          <Text style={text}>
            Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme :
          </Text>

          {/* Nouvelle liste de fonctionnalités */}
          <Section style={listContainer}>
            <Text style={listItem}>✅ Consulter votre planning d&apos;entraînement</Text>
            <Text style={listItem}>✅ Créer vos propres séances</Text>
            <Text style={listItem}>✅ Télécharger les séances en PDF</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              Accéder à la plateforme
            </Button>
          </Section>

          <Text style={footer}>
            Bon entraînement ! 🏃‍♂️💨<br />
            L&apos;équipe ASUL Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles (identiques à ta version précédente)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '580px',
  borderRadius: '8px',
};

const h1 = {
  color: '#333',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const listContainer = {
  padding: '0 40px',
};

const listItem = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '32px',
  margin: '0',
};

const buttonContainer = {
  padding: '27px 40px',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 40px',
  textAlign: 'center' as const,
};