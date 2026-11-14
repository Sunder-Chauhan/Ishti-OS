import React from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useFonts, CormorantGaramond_500Medium, CormorantGaramond_600SemiBold } from "@expo-google-fonts/cormorant-garamond";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { brandColor, brandInk, platformPillars } from "@spiritual-os/types";

export default function App() {
  const [fontsReady] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const display = fontsReady ? "CormorantGaramond_600SemiBold" : undefined;
  const displayBody = fontsReady ? "CormorantGaramond_500Medium" : undefined;
  const sans = fontsReady ? "Inter_400Regular" : undefined;
  const sansStrong = fontsReady ? "Inter_600SemiBold" : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColor.ivory} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.brand, { fontFamily: display }]}>ISHTI</Text>
        <Text style={[styles.tagline, { fontFamily: sans }]}>Rooted in Tradition. Connected to Today.</Text>
        <View style={styles.rule} />
        <Text style={[styles.kicker, { fontFamily: sansStrong }]}>A modern spiritual ecosystem</Text>
        <Text style={[styles.title, { fontFamily: displayBody }]}>Authentic knowledge, practice and community, made accessible.</Text>
        <Text style={[styles.copy, { fontFamily: sans }]}>
          ISHTI is inspired by India’s timeless traditions. Technology should make them easier to reach and live with, and it should never distort them.
        </Text>
        <Text style={[styles.heading, { fontFamily: display }]}>Six families, one identity</Text>
        {platformPillars.map((pillar, index) => (
          <View key={pillar.id} style={styles.card}>
            <Text style={[styles.index, { fontFamily: sansStrong }]}>0{index + 1}</Text>
            <Text style={[styles.cardTitle, { fontFamily: display }]}>{pillar.name}</Text>
            <Text style={[styles.copy, { fontFamily: sans }]}>{pillar.description}</Text>
            <Text style={[styles.planned, { fontFamily: sansStrong }]}>Planned</Text>
          </View>
        ))}
        <Text style={[styles.integrity, { fontFamily: sans }]}>
          Ritual guidance is shown only from approved sources. When an answer is uncertain, ISHTI says so.
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <Text style={[styles.footerMark, { fontFamily: display }]}>ISHTI</Text>
        <Text style={[styles.footerCopy, { fontFamily: sans }]}>Rooted in Tradition. Connected to Today.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brandColor.ivory },
  container: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 28 },
  brand: { color: brandInk.onIvory, fontSize: 28, letterSpacing: 4 },
  tagline: { color: brandInk.mutedOnIvory, fontSize: 13, lineHeight: 20, marginTop: 10 },
  rule: { width: 36, height: 2, backgroundColor: brandColor.terracotta, marginTop: 22, marginBottom: 28 },
  kicker: { color: brandInk.onIvory, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" },
  title: { color: brandInk.onIvory, fontSize: 40, lineHeight: 46, marginTop: 16 },
  copy: { color: brandInk.mutedOnIvory, fontSize: 15, lineHeight: 23, marginTop: 12 },
  heading: { color: brandInk.onIvory, fontSize: 32, lineHeight: 38, marginTop: 40 },
  card: { backgroundColor: brandColor.sand, borderTopWidth: 3, borderTopColor: brandColor.sage, padding: 20, marginTop: 14 },
  index: { color: brandInk.onIvory, fontSize: 12, letterSpacing: 1.4 },
  cardTitle: { color: brandInk.onIvory, fontSize: 26, lineHeight: 32, marginTop: 16 },
  planned: { color: brandInk.onIvory, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 16 },
  integrity: { color: brandInk.mutedOnIvory, fontSize: 14, lineHeight: 22, marginTop: 28 },
  footer: { backgroundColor: brandColor.charcoal, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 },
  footerMark: { color: brandInk.accentOnCharcoal, fontSize: 22, letterSpacing: 4 },
  footerCopy: { color: brandInk.mutedOnCharcoal, fontSize: 14, lineHeight: 20, marginTop: 8 },
});
