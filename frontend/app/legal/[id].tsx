import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { legalLibraryAPI } from '../src/services/api';
import { LegalTopic } from '../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function LegalTopicDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [topic, setTopic] = useState<LegalTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTopic();
    }
  }, [id]);

  const loadTopic = async () => {
    try {
      const topicData = await legalLibraryAPI.getTopic(id as string);
      setTopic(topicData);
    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.teal} />
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Topic not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white.soft} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{topic.category}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Topic Title */}
        <Text style={styles.title}>{topic.title}</Text>
        
        {/* Summary */}
        <Text style={styles.summary}>{topic.summary}</Text>

        {/* Citations */}
        {(topic.statute_citation || topic.policy_citation) && (
          <View style={[styles.citationCard, { borderLeftColor: Colors.accent.teal }]}>
            <Ionicons name="book" size={20} color={Colors.accent.teal} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              {topic.statute_citation && (
                <Text style={styles.citation}>
                  <Text style={styles.citationLabel}>Law: </Text>
                  {topic.statute_citation}
                </Text>
              )}
              {topic.policy_citation && (
                <Text style={styles.citation}>
                  <Text style={styles.citationLabel}>Policy: </Text>
                  {topic.policy_citation}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Plain Language Explanation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What The Law Says</Text>
          <Text style={styles.sectionText}>{topic.plain_language_explanation}</Text>
        </View>

        {/* What This Means */}
        <View style={[styles.section, styles.highlightSection]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.accent.steel} />
            <Text style={styles.sectionTitle}>What This Means For You</Text>
          </View>
          <Text style={styles.sectionText}>{topic.what_this_means}</Text>
        </View>

        {/* What If Violated */}
        <View style={[styles.section, styles.violationSection]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.accent.amber} />
            <Text style={styles.sectionTitle}>If This Right Is Violated</Text>
          </View>
          <Text style={styles.sectionText}>{topic.what_if_violated}</Text>
        </View>

        {/* Last Verified */}
        <Text style={styles.verifiedDate}>
          Last verified: {format(new Date(topic.last_verified_date), 'MMMM d, yyyy')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.black.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.black.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.silver.border,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.accent.teal,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xxxl,
    color: Colors.white.pure,
    marginBottom: Spacing.md,
    lineHeight: 38,
  },
  summary: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.lg,
    color: Colors.silver.bright,
    marginBottom: Spacing.xl,
    lineHeight: 26,
  },
  citationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.tealGlow,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.accent.tealBorder,
    borderLeftWidth: 3,
    alignItems: 'flex-start',
  },
  citation: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    marginBottom: 4,
  },
  citationLabel: {
    fontFamily: 'JetBrainsMono_500Medium',
    color: Colors.accent.teal,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  highlightSection: {
    backgroundColor: Colors.accent.steelGlow,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.steelBorder,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.steel,
  },
  violationSection: {
    backgroundColor: Colors.accent.amberGlow,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.amberBorder,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.amber,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginLeft: Spacing.sm,
  },
  sectionText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.bright,
    lineHeight: 24,
  },
  verifiedDate: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.silver.mid,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.mid,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
