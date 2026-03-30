import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'folder',
      title: 'Documents',
      subtitle: 'Upload and manage case documents',
      color: Colors.accent.copper,
      onPress: () => router.push('/documents'),
    },
    {
      icon: 'calendar',
      title: 'Deadlines & Hearings',
      subtitle: 'Track important dates and court hearings',
      color: Colors.accent.amber,
      onPress: () => router.push('/deadlines'),
    },
    {
      icon: 'people',
      title: 'Contacts',
      subtitle: 'Manage caseworkers, attorneys, and other contacts',
      color: Colors.silver.bright,
      onPress: () => router.push('/contacts'),
    },
    {
      icon: 'heart',
      title: 'Resources',
      subtitle: 'Support services for parents and children',
      color: Colors.accent.lavender,
      onPress: () => router.push('/resources'),
    },
    {
      icon: 'alert-circle',
      title: 'File a Complaint',
      subtitle: 'Report rights violations or misconduct',
      color: Colors.accent.crimson,
      onPress: () => router.push('/complaint'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.full_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.full_name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { borderLeftColor: item.color }]}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon as any} size={24} color={item.color} />
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.silver.mid} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.appName}>SPCUF</Text>
            <Text style={styles.appTagline}>Supporting Parents, Children, United Families</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.accent.crimson} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black.primary,
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
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  userCard: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.steel,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent.steelGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.accent.steel,
  },
  avatarText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.xxl,
    color: Colors.accent.steel,
  },
  userName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.lg,
    color: Colors.white.soft,
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    borderLeftWidth: 3,
  },
  menuContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  menuTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.white.soft,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.silver.mid,
  },
  infoCard: {
    backgroundColor: Colors.black.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.silver.border,
    alignItems: 'center',
  },
  appName: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: Typography.sizes.xxl,
    color: Colors.white.pure,
    marginBottom: 4,
  },
  appTagline: {
    fontFamily: 'Outfit_400Regular',
    fontSize: Typography.sizes.sm,
    color: Colors.silver.mid,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  appVersion: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.silver.light,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.crimsonGlow,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent.crimsonBorder,
  },
  logoutText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: Typography.sizes.base,
    color: Colors.accent.crimson,
    marginLeft: Spacing.sm,
  },
});
