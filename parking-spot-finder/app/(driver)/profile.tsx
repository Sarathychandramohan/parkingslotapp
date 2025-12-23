import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';
import { bookingService, DriverStats } from '~/constants/apiService';
import { Colors } from '~/constants/Colors';
import ThemeSwitcher from '~/components/ThemeSwitcher';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getDriverStats();
      setStats(data);
    } catch (error: any) {
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.name || 'User')}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.memberSince}>Member since Jan 2024</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.total_bookings || 0}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₹{stats?.total_amount_spent.toFixed(2) || 0}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
      </View>

      {/* Additional Stats */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Completed Bookings</Text>
            <Text style={styles.detailValue}>{stats?.completed_bookings || 0}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="time" size={24} color={Colors.light.primary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Active Bookings</Text>
            <Text style={styles.detailValue}>{stats?.active_bookings || 0}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="close-circle" size={24} color="#FF5252" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Cancelled Bookings</Text>
            <Text style={styles.detailValue}>{stats?.cancelled_bookings || 0}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="hourglass" size={24} color="#FF9800" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Total Hours Parked</Text>
            <Text style={styles.detailValue}>{stats?.total_hours_parked || 0} hrs</Text>
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.appearanceOptions}>
          <TouchableOpacity style={[styles.appearanceButton, styles.appearanceButtonActive]}>
            <Ionicons name="sunny" size={24} color={Colors.light.primary} />
            <Text style={styles.appearanceText}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.appearanceButton}>
            <Ionicons name="moon" size={24} color="#666" />
            <Text style={styles.appearanceText}>Dark</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.appearanceButton}>
            <Ionicons name="phone-portrait" size={24} color="#666" />
            <Text style={styles.appearanceText}>Auto</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Ionicons name="notifications" size={24} color="#666" />
            <Text style={styles.settingText}>Notifications</Text>
            <View style={styles.toggle}>
              <View style={styles.toggleActive} />
            </View>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color="#FF5252" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: '#999',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailIcon: {
    width: 40,
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#333',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  appearanceOptions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  appearanceButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  appearanceButtonActive: {
    borderColor: Colors.light.primary,
    backgroundColor: '#E3F2FD',
  },
  appearanceText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    paddingHorizontal: 3,
    alignItems: 'flex-end',
  },
  toggleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5252',
  },
});

<ThemeSwitcher />
