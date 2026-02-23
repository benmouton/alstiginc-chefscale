import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page not found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.backgroundDark,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  link: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  linkText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
