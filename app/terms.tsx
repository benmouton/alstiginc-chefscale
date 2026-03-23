import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const EFFECTIVE_DATE = 'March 22, 2026';
const COMPANY_NAME = 'ALSTIG INC';
const APP_NAME = 'ChefScale';
const CONTACT_EMAIL = 'support@alstiginc.com';

export default function TermsOfService() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#F5A623" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.meta}>Effective Date: {EFFECTIVE_DATE}</Text>
        <Text style={styles.meta}>Last Updated: {EFFECTIVE_DATE}</Text>

        <Section title="1. Agreement to Terms">
          By downloading, installing, or using {APP_NAME} (&quot;the App&quot;), you agree to be bound by
          these Terms of Service (&quot;Terms&quot;). These Terms constitute a legally binding agreement between
          you and {COMPANY_NAME} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). If you do not agree to these Terms, do
          not use the App.
        </Section>

        <Section title="2. Description of Service">
          {APP_NAME} is a recipe scaling, costing, and kitchen management tool for restaurant
          professionals. The App allows you to scale recipes, calculate plate costs, manage
          ingredient pricing, and organize kitchen workflows.
        </Section>

        <Section title="3. AI-Generated Content Disclaimer">
          <Text style={styles.body}>
            The App uses artificial intelligence (OpenAI) for recipe scanning (OCR) and recipe
            validation features. You acknowledge and agree that:
          </Text>
          <Text style={styles.bullet}>• AI-processed content may contain inaccuracies or errors in text extraction, ingredient
            quantities, or recipe instructions</Text>
          <Text style={styles.bullet}>• You are solely responsible for reviewing, verifying, and approving any AI-extracted or
            AI-validated content before use</Text>
          <Text style={styles.bullet}>• {COMPANY_NAME} is not responsible for any consequences arising from your use of
            AI-processed content, including but not limited to food safety issues, incorrect
            measurements, or recipe errors</Text>
          <Text style={styles.bullet}>• You should always verify cooking temperatures and food safety information independently</Text>
        </Section>

        <Section title="4. Subscriptions and Payments">
          <Text style={styles.body}>
            The App offers optional auto-renewable subscription plans managed through Apple&apos;s App
            Store.
          </Text>

          <Text style={styles.subhead}>Billing</Text>
          <Text style={styles.body}>
            Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions
            automatically renew unless auto-renew is turned off at least 24 hours before the end of the
            current period. Your account will be charged for renewal within 24 hours prior to the end of
            the current period at the rate of your selected plan.
          </Text>

          <Text style={styles.subhead}>Managing Subscriptions</Text>
          <Text style={styles.body}>
            You can manage your subscription and turn off auto-renewal at any time by going to your
            Account Settings in the App Store after purchase. Cancellation takes effect at the end of
            the current billing period.
          </Text>

          <Text style={styles.subhead}>Refunds</Text>
          <Text style={styles.body}>
            All purchases are final. Refund requests must be submitted directly to Apple in accordance
            with Apple&apos;s refund policy.
          </Text>
        </Section>

        <Section title="5. User Content and Data">
          <Text style={styles.body}>
            You retain ownership of all recipe data, ingredient pricing, scaling settings, and other
            content you create or input into the App (&quot;User Content&quot;). By using the App, you grant us
            a limited, non-exclusive license to process your User Content solely for the purpose of
            providing the App&apos;s services.
          </Text>
          <Text style={styles.body}>
            Recipe images sent for OCR scanning are processed by OpenAI. We do not sell, share, or
            use your data for advertising purposes.
          </Text>
        </Section>

        <Section title="6. Acceptable Use">
          <Text style={styles.body}>You agree not to:</Text>
          <Text style={styles.bullet}>• Use the App for any unlawful purpose</Text>
          <Text style={styles.bullet}>• Attempt to reverse engineer or modify the App</Text>
          <Text style={styles.bullet}>• Use the App to infringe on any third-party intellectual property rights</Text>
          <Text style={styles.bullet}>• Attempt to gain unauthorized access to any portion of the App or its infrastructure</Text>
        </Section>

        <Section title="7. Intellectual Property">
          The App and all of its original content, features, and functionality are owned by {COMPANY_NAME}
          and are protected by applicable intellectual property laws. You may not copy, modify, distribute,
          or create derivative works based on the App without our prior written consent.
        </Section>

        <Section title="8. Data and Privacy">
          Your use of the App is also governed by our Privacy Policy, which is incorporated into these
          Terms by reference. Please review our{' '}
          <Text style={styles.link} onPress={() => router.push('/privacy')}>Privacy Policy</Text>
          {' '}to understand our practices.
        </Section>

        <Section title="9. Disclaimer of Warranties">
          THE APP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER
          EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP
          WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE
          MAKE NO WARRANTIES REGARDING THE ACCURACY, QUALITY, OR RELIABILITY OF AI-PROCESSED
          CONTENT, INCLUDING RECIPE TEXT EXTRACTION, INGREDIENT QUANTITIES, OR COST CALCULATIONS.
        </Section>

        <Section title="10. Limitation of Liability">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY_NAME} SHALL NOT BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF
          DATA, LOSS OF REVENUE, LOSS OF PROFITS, OR HARM ARISING FROM RELIANCE ON AI-PROCESSED
          CONTENT, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE APP.
        </Section>

        <Section title="11. Termination">
          We reserve the right to terminate or suspend your access to the App at our sole discretion,
          without notice, for conduct that we believe violates these Terms or is harmful to other users,
          us, third parties, or for any other reason.
        </Section>

        <Section title="12. Changes to Terms">
          We may update these Terms from time to time. We will notify you of any material changes by
          updating the &quot;Last Updated&quot; date at the top of this page. Your continued use of the App after
          any changes constitutes your acceptance of the new Terms.
        </Section>

        <Section title="13. Governing Law">
          These Terms are governed by the laws of the State of Texas, United States, without regard
          to its conflict of law provisions.
        </Section>

        <Section title="14. Contact Us">
          <Text style={styles.body}>
            If you have any questions about these Terms, please contact us at:
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
    backgroundColor: '#0A0A0A',
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#F5A623',
    marginLeft: 4,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  appName: {
    fontSize: 16,
    color: '#F5A623',
    fontWeight: '600',
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cccccc',
    marginTop: 12,
    marginBottom: 6,
  },
  body: {
    fontSize: 15,
    color: '#aaaaaa',
    lineHeight: 23,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 15,
    color: '#aaaaaa',
    lineHeight: 23,
    paddingLeft: 8,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '600',
    color: '#cccccc',
  },
  link: {
    fontSize: 15,
    color: '#F5A623',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 48,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  footerText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
});
