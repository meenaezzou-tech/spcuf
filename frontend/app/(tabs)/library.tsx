import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { legalLibraryAPI, seedAPI } from '../../src/services/api';
import { LegalTopic } from '../../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LibraryScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<LegalTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const data = await legalLibraryAPI.getTopics();
      setTopics(data);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedAPI.seedData();
      await loadTopics();
    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTopics();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.teal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rights & Law Library</Text>
        <Text style={styles.headerSubtitle}>Texas CPS Legal Information</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.teal} />
        }
      >
        {topics.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color={Colors.silver.mid} />
            <Text style={styles.emptyTitle}>Library Not Loaded</Text>
            <Text style={styles.emptyText}>
              Load the legal library with Texas statutes and rights information.
            </Text>
            <TouchableOpacity
              style={[styles.seedButton, isSeeding && styles.seedButtonDisabled]}
              onPress={handleSeedData}
              disabled={isSeeding}
            >
              {isSeeding ? (
                <ActivityIndicator color={Colors.white.pure} />
              ) : (
                <Text style={styles.seedButtonText}>Load Library</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.infoCard, { borderLeftColor: Colors.accent.teal }]}>
              <Ionicons name="information-circle" size={20} color={Colors.accent.teal} />
              <Text style={styles.infoText}>
                This information is for educational purposes. Always consult with a licensed attorney for legal advice.
              </Text>
            </View>

            {topics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.topicCard, { borderLeftColor: Colors.accent.teal }]}
                onPress={() => router.push(`/legal/${topic.id}`)}
              >
                <View style={styles.topicHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{topic.category}</Text>
                  </View>
                </View>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicSummary} numberOfLines={2}>
                  {topic.summary}
                </Text>
                {topic.statute_citation && (
                  <Text style={styles.citation}>
                    📖 {topic.statute_citation}
                  </Text>
                )}
                <View style={styles.topicFooter}>
                  <Text style={styles.readMoreText}>Read More →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.black.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.silver.border,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xxl,
    color: Colors.white.pure,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.teal,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xxl,
    color: Colors.white.soft,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.mid,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    maxWidth: 300,
  },
  seedButton: {
    backgroundColor: Colors.accent.teal,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.card,
  },
  seedButtonDisabled: {
    opacity: 0.6,
  },
  seedButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.pure,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.tealGlow,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.tealBorder,
    borderLeftWidth: 3,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    marginLeft: Spacing.sm,
    lineHeight: 18,
  },
  topicCard: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: Colors.accent.tealGlow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  categoryText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.xs,
    color: Colors.accent.teal,
  },
  topicTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginBottom: Spacing.sm,
  },
  topicSummary: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  citation: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.accent.teal,
    marginBottom: Spacing.sm,
  },
  topicFooter: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.silver.border,
  },
  readMoreText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.teal,
  },
});
