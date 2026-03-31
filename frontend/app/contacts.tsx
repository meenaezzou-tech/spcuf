import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { caseAPI, contactAPI } from '../src/services/api';
import { Case, Contact } from '../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';

export default function ContactsScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const casesData = await caseAPI.getCases();
      setCases(casesData);
      
      if (casesData.length > 0) {
        const contactsData = await contactAPI.getContacts(casesData[0].id);
        setContacts(contactsData);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCall = (phone: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      Linking.openURL(`tel:${cleanPhone}`);
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const getContactColor = (type: string): string => {
    const colors: Record<string, string> = {
      caseworker: Colors.accent.steel,
      attorney: Colors.accent.teal,
      CASA: Colors.accent.lavender,
      AAL: Colors.accent.copper,
      supervisor: Colors.accent.amber,
      therapist: Colors.accent.sage,
    };
    return colors[type] || Colors.silver.bright;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.steel} />
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
          <Text style={styles.headerTitle}>Contacts</Text>
          <Text style={styles.headerSubtitle}>Case Team & Service Providers</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.steel} />
        }
      >
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.silver.mid} />
            <Text style={styles.emptyTitle}>No Contacts Added</Text>
            <Text style={styles.emptyText}>
              Add contacts for caseworkers, attorneys, CASA, and other service providers involved in your case.
            </Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View
              key={contact.id}
              style={[styles.contactCard, { borderLeftColor: getContactColor(contact.contact_type) }]}
            >
              <View style={styles.contactHeader}>
                <View style={[styles.typeBadge, { backgroundColor: getContactColor(contact.contact_type) + '20' }]}>
                  <Text style={[styles.typeBadgeText, { color: getContactColor(contact.contact_type) }]}>
                    {contact.contact_type}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.contactName}>{contact.name}</Text>
              {contact.title && <Text style={styles.contactTitle}>{contact.title}</Text>}
              {contact.organization && (
                <Text style={styles.contactOrg}>{contact.organization}</Text>
              )}

              <View style={styles.contactActions}>
                {contact.phone && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCall(contact.phone!)}
                  >
                    <Ionicons name="call" size={16} color={Colors.accent.steel} />
                    <Text style={styles.actionButtonText}>{contact.phone}</Text>
                  </TouchableOpacity>
                )}
                {contact.email && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEmail(contact.email!)}
                  >
                    <Ionicons name="mail" size={16} color={Colors.accent.teal} />
                    <Text style={styles.actionButtonText}>{contact.email}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {contact.supervisor_name && (
                <Text style={styles.supervisor}>Supervisor: {contact.supervisor_name}</Text>
              )}
              {contact.notes && (
                <Text style={styles.notes}>{contact.notes}</Text>
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
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xl,
    color: Colors.white.pure,
  },
  headerSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
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
    maxWidth: 300,
  },
  contactCard: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  typeBadgeText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.xs,
  },
  contactName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginBottom: 4,
  },
  contactTitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    marginBottom: 4,
  },
  contactOrg: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    marginBottom: Spacing.md,
  },
  contactActions: {
    marginTop: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  actionButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    marginLeft: Spacing.sm,
  },
  supervisor: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.silver.mid,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.silver.border,
  },
  notes: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.bright,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
