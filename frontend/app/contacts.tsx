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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { caseAPI, contactAPI } from '../src/services/api';
import { Case, Contact } from '../src/types';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';

const CONTACT_TYPES = ['caseworker', 'attorney', 'CASA', 'AAL', 'supervisor', 'therapist', 'other'];

export default function ContactsScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_type: 'caseworker',
    title: '',
    phone: '',
    email: '',
    organization: '',
    supervisor_name: '',
    notes: '',
  });

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

  const handleAddContact = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Required', 'Please enter a contact name');
      return;
    }
    if (cases.length === 0) {
      Alert.alert('No Case', 'Please create a case first before adding contacts');
      return;
    }

    setIsSaving(true);
    try {
      await contactAPI.createContact({
        case_id: cases[0].id,
        ...formData,
      });
      Alert.alert('Success', 'Contact added successfully');
      setShowAddForm(false);
      setFormData({
        name: '',
        contact_type: 'caseworker',
        title: '',
        phone: '',
        email: '',
        organization: '',
        supervisor_name: '',
        notes: '',
      });
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete "${contact.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(contact.id),
        },
      ]
    );
  };

  const confirmDelete = async (contactId: string) => {
    setDeletingId(contactId);
    try {
      await contactAPI.deleteContact(contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
      Alert.alert('Deleted', 'Contact removed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete contact');
    } finally {
      setDeletingId(null);
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Contacts</Text>
          <Text style={styles.headerSubtitle}>Case Team & Service Providers</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.accent.steel} />
        </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add-circle" size={20} color={Colors.accent.steel} />
              <Text style={styles.emptyAddText}>Add First Contact</Text>
            </TouchableOpacity>
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
                <TouchableOpacity
                  onPress={() => handleDeleteContact(contact)}
                  disabled={deletingId === contact.id}
                  style={styles.deleteIconButton}
                >
                  {deletingId === contact.id ? (
                    <ActivityIndicator size="small" color={Colors.accent.crimson} />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color={Colors.accent.crimson} />
                  )}
                </TouchableOpacity>
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

      {/* Add Contact Modal */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isSaving && setShowAddForm(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Contact</Text>
              <TouchableOpacity
                onPress={() => !isSaving && setShowAddForm(false)}
                disabled={isSaving}
              >
                <Ionicons name="close" size={24} color={Colors.silver.bright} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={Colors.silver.light}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                {CONTACT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      formData.contact_type === type && {
                        backgroundColor: getContactColor(type) + '30',
                        borderColor: getContactColor(type),
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, contact_type: type })}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        formData.contact_type === type && { color: getContactColor(type) },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Job title"
                placeholderTextColor={Colors.silver.light}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={Colors.silver.light}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.silver.light}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Organization</Text>
              <TextInput
                style={styles.input}
                placeholder="Organization or agency"
                placeholderTextColor={Colors.silver.light}
                value={formData.organization}
                onChangeText={(text) => setFormData({ ...formData, organization: text })}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional notes"
                placeholderTextColor={Colors.silver.light}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleAddContact}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={Colors.white.pure} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Contact</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.accent.steelGlow,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.accent.steelBorder,
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
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.accent.steelGlow,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.accent.steelBorder,
  },
  emptyAddText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.accent.steel,
    marginLeft: Spacing.sm,
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  deleteIconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.black.surface,
    borderTopLeftRadius: BorderRadius.modal + 10,
    borderTopRightRadius: BorderRadius.modal + 10,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.silver.border,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: Typography.sizes.xl,
    color: Colors.white.pure,
  },
  modalForm: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.white.soft,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.black.card,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.black.card,
  },
  typeChipText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
  },
  saveButton: {
    backgroundColor: Colors.accent.steel,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.pure,
  },
});
