import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { WELCOME_MESSAGE } from '../../src/constants/quotes';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Welcome to SPCUF</Text>
        <Text style={styles.message}>{WELCOME_MESSAGE}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.buttonText}>Enter Your Case Dashboard →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black.deep,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xxxl,
    color: Colors.white.pure,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.bright,
    lineHeight: 26,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.black.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.silver.border,
  },
  button: {
    backgroundColor: Colors.accent.steel,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.pure,
  },
});
