import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

const EFFECTIVE_DATE = 'March 22, 2026';
const COMPANY_NAME = 'ALSTIG INC';
const APP_NAME = 'ChefScale';
const CONTACT_EMAIL = 'support@alstiginc.com';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.meta}>Effective Date: {EFFECTIVE_DATE}</Text>
        <Text style={styles.meta}>Last Updated: {EFFECTIVE_DATE}</Text>

        <Section title="1. Overview">
          {COMPANY_NAME} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) built {APP_NAME} (the &quot;App&quot;) as a recipe scaling,
          costing, and kitchen management tool for restaurant professionals. This Privacy Policy
          explains how we handle information in connection with your use of the App. We are committed
          to protecting your privacy and being transparent about our practices.
        </Section>

        <Section title="2. Information We Collect">
          <Text style={styles.body}>
            {APP_NAME} collects and processes limited information to provide its core functionality:
          </Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Recipe data</Text> — recipes,
            ingredients, instructions, scaling settings, and cost calculations you create, stored
            locally on your device</Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Pricing data</Text> — ingredient
            prices and cost-per-plate calculations, stored locally on your device</Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Subscription status</Text> — anonymous
            subscription identifiers managed by RevenueCat and Apple</Text>
        </Section>

        <Section title="3. AI-Powered Features">
          <Text style={styles.body}>
            {APP_NAME} uses AI to enhance recipe management:
          </Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Recipe OCR</Text> — when you scan a
            recipe image, the photo may be sent to OpenAI&apos;s servers (GPT-4o) for text extraction and
            structured data parsing</Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>AI recipe validation</Text> — recipe
            content may be reviewed by AI for quality and completeness</Text>
          <Text style={styles.body}>
            When using AI features, recipe images or text are sent to OpenAI&apos;s servers for processing.
            OpenAI processes this data in accordance with their API data usage policies. We do not use
            your data to train AI models. The App may also attempt on-device text recognition first
            before falling back to server-based processing.
          </Text>
        </Section>

        <Section title="4. Local Storage">
          All recipe data, ingredient prices, scaling settings, and prep sheets are stored locally on
          your device. This data does not leave your device except when sent to AI services for
          processing as described in Section 3.
        </Section>

        <Section title="5. Camera and Photo Library Access">
          <Text style={styles.body}>
            The App may request access to your camera or photo library to allow you to:
          </Text>
          <Text style={styles.bullet}>• Scan recipes using OCR (optical character recognition)</Text>
          <Text style={styles.bullet}>• Add photos to your recipes</Text>
          <Text style={styles.body}>
            Recipe photos sent for OCR are processed by OpenAI and are not stored on any external
            server beyond the time needed for processing. Recipe photos you add are stored locally on
            your device only.
          </Text>
        </Section>

        <Section title="6. Subscription and Payment Information">
          {APP_NAME} offers optional auto-renewable subscriptions processed entirely through Apple&apos;s
          App Store. We do not collect or have access to your payment information. All billing is
          handled by Apple in accordance with their privacy policy and terms of service. For
          information about how Apple handles your payment data, please refer to Apple&apos;s Privacy
          Policy at{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://www.apple.com/legal/privacy/')}
          >
            apple.com/legal/privacy
          </Text>.
        </Section>

        <Section title="7. Third-Party Services">
          <Text style={styles.body}>
            The App uses the following third-party services:
          </Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>OpenAI</Text> — to extract recipe data
            from photos and validate recipe content. Recipe images and text are sent to OpenAI for
            processing. See{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('https://openai.com/policies/privacy-policy')}>
              openai.com/policies/privacy-policy
            </Text>.</Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>RevenueCat</Text> — to manage in-app
            subscription status. RevenueCat may collect limited technical data (such as your
            Apple-assigned anonymous subscriber ID) solely for subscription management. See{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('https://www.revenuecat.com/privacy')}>
              revenuecat.com/privacy
            </Text>.</Text>
        </Section>

        <Section title="8. Children's Privacy">
          The App is not directed to children under the age of 13. We do not knowingly collect any
          personal information from children under 13. If you believe a child under 13 has provided
          personal information through the App, please contact us and we will take steps to delete
          such information.
        </Section>

        <Section title="9. Data Security">
          We take reasonable measures to protect the information processed through the App. Local
          data is protected by your device&apos;s built-in security features. Data transmitted to
          third-party services (OpenAI, RevenueCat) is sent over encrypted connections. We recommend
          using a strong passcode or biometric lock on your device.
        </Section>

        <Section title="10. Your Rights (CCPA / GDPR)">
          <Text style={styles.body}>
            We respect your privacy rights under the California Consumer Privacy Act (CCPA) and the
            General Data Protection Regulation (GDPR). You have the right to:
          </Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Access</Text> — request details about
            what personal data we process</Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Deletion</Text> — request deletion of
            any personal data we hold. You can also delete all local App data by removing the App
            from your device</Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Portability</Text> — receive your data
            in a portable format</Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Opt-out of sale</Text> — we do not sell
            your personal information to third parties</Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Non-discrimination</Text> — exercising
            your rights will not affect the service you receive</Text>
          <Text style={styles.body}>
            To exercise any of these rights, contact us at {CONTACT_EMAIL}. We will respond within
            30 days (CCPA) or without undue delay and no later than one month (GDPR).
          </Text>
        </Section>

        <Section title="11. Changes to This Privacy Policy">
          We may update this Privacy Policy from time to time. We will notify you of any material
          changes by updating the &quot;Last Updated&quot; date at the top of this page. Your continued use
          of the App after any changes constitutes your acceptance of the updated Privacy Policy.
        </Section>

        <Section title="12. Contact Us">
          <Text style={styles.body}>
            If you have any questions or concerns about this Privacy Policy, please contact us at:
          </Text>
          <Text style={styles.body}>{COMPANY_NAME}</Text>
          <Text
            style={styles.link}
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
          >
            {CONTACT_EMAIL}
          </Text>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{'\u00A9'} {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {typeof children === 'string' ? (
        <Text style={styles.body}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDeep,
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.backgroundDeep,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 4,
    fontFamily: 'DMSans_600SemiBold',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: 'DMSans_700Bold',
  },
  appName: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'DMSans_600SemiBold',
  },
  meta: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 2,
    fontFamily: 'DMSans_400Regular',
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    fontFamily: 'DMSans_700Bold',
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
    marginBottom: 8,
    fontFamily: 'DMSans_400Regular',
  },
  bullet: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
    paddingLeft: 8,
    marginBottom: 4,
    fontFamily: 'DMSans_400Regular',
  },
  bold: {
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'DMSans_600SemiBold',
  },
  link: {
    fontSize: 15,
    color: Colors.primary,
    textDecorationLine: 'underline',
    fontFamily: 'DMSans_400Regular',
  },
  footer: {
    marginTop: 48,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
  },
});
