import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { Colors, Typography } from '../src/constants/theme';
import { SPLASH_QUOTES } from '../src/constants/quotes';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [randomQuote] = useState(
    SPLASH_QUOTES[Math.floor(Math.random() * SPLASH_QUOTES.length)]
  );

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Navigate after splash
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.logo}>SPCUF</Text>
        <Text style={styles.tagline}>Supporting Parents, Children, United Families</Text>
        <Text style={styles.quote}>"{randomQuote}"</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black.deep,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 56,
    color: Colors.white.pure,
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: 'Outfit_300Light',
    fontSize: Typography.sizes.base,
    color: Colors.silver.bright,
    textAlign: 'center',
    marginBottom: 40,
  },
  quote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
