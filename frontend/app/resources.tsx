import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { resourceAPI } from '../src/services/api';
import { Resource } from '../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ResourcesScreen() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const data = await resourceAPI.getResources();
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Resources', color: Colors.accent.lavender },
    { id: 'emotional_support', name: 'Emotional Support', color: Colors.accent.lavender },
    { id: 'legal_aid', name: 'Legal Aid', color: Colors.accent.teal },
    { id: 'parenting', name: 'Parenting', color: Colors.accent.sage },
    { id: 'substance_use', name: 'Recovery', color: Colors.accent.amber },
    { id: 'domestic_violence', name: 'DV Support', color: Colors.accent.crimson },
    { id: 'mental_health', name: 'Mental Health', color: Colors.accent.steel },
    { id: 'youth', name: 'Youth Support', color: Colors.accent.copper },
  ];

  const filteredResources = selectedCategory === 'all'
    ? resources
    : resources.filter(r => r.category === selectedCategory);

  const handleCall = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleLink = (url: string) => {
    Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.lavender} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white.soft} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Resource Center</Text>
          <Text style={styles.headerSubtitle}>Support for Parents & Children</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && { backgroundColor: category.color + '30' },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && { color: category.color },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredResources.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={Colors.silver.mid} />
            <Text style={styles.emptyText}>No resources found in this category</Text>
          </View>
        ) : (
          filteredResources.map((resource) => (
            <View
              key={resource.id}
              style={[styles.resourceCard, { borderLeftColor: Colors.accent.lavender }]}
            >
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{resource.subcategory}</Text>
              </View>
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text style={styles.resourceDescription}>{resource.description}</Text>
              
              {resource.content && (
                <Text style={styles.resourceContent}>{resource.content}</Text>
              )}

              {resource.phone_numbers.length > 0 && (
                <View style={styles.contactSection}>
                  {resource.phone_numbers.map((phone, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.phoneButton}
                      onPress={() => handleCall(phone)}
                    >
                      <Ionicons name="call" size={16} color={Colors.accent.lavender} />
                      <Text style={styles.phoneText}>{phone}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {resource.links.length > 0 && (
                <View style={styles.contactSection}>
                  {resource.links.map((link, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.linkButton}
                      onPress={() => handleLink(link)}
                    >
                      <Ionicons name="globe" size={16} color={Colors.accent.teal} />
                      <Text style={styles.linkText} numberOfLines={1}>
                        {link.replace('https://', '').replace('http://', '')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141420', // Slight lavender tint
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#141420',
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
    borderBottomColor: Colors.accent.lavenderBorder,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xl,
    color: Colors.white.pure,
  },
  headerSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.lavender,
  },
  categoryScroll: {
    maxHeight: 50,
    backgroundColor: Colors.black.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.silver.border,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: 4,
    borderRadius: BorderRadius.card,
    backgroundColor: Colors.black.card,
  },
  categoryChipText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.silver.mid,
    marginTop: Spacing.md,
  },
  resourceCard: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent.lavenderBorder,
    borderLeftWidth: 3,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.lavenderGlow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.sm,
  },
  categoryBadgeText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.xs,
    color: Colors.accent.lavender,
  },
  resourceTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginBottom: Spacing.sm,
  },
  resourceDescription: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  resourceContent: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    lineHeight: 18,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  contactSection: {
    marginTop: Spacing.sm,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.lavenderGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.xs,
  },
  phoneText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.accent.lavender,
    marginLeft: Spacing.sm,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.tealGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.xs,
  },
  linkText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.accent.teal,
    marginLeft: Spacing.sm,
  },
});
