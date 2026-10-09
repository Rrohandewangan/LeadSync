import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { fetchLeads } from '../services/api';
import socket from '../services/socket';
import LeadCard from '../components/LeadCard';

export default function LeadsScreen() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);

  // Load all existing leads from the API
  const loadLeads = useCallback(async () => {
    try {
      const res = await fetchLeads();
      setLeads(res.data);
    } catch (err) {
      console.warn('Failed to load leads:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Socket.IO — listen for new leads pushed from the backend
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socket.on('new_lead', (lead) => {
      console.log('New lead received via socket:', lead.name);
      // Prepend to the list so newest shows first
      setLeads((prev) => [lead, ...prev]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_lead');
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLeads();
  }, [loadLeads]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>LeadSync</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: connected ? '#22c55e' : '#ef4444' },
            ]}
          />
          <Text style={styles.statusText}>
            {connected ? 'Live' : 'Disconnected'}
          </Text>
          <Text style={styles.countText}>{leads.length} leads</Text>
        </View>
      </View>

      {/* Lead list */}
      {leads.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No leads yet</Text>
          <Text style={styles.emptySubtitle}>
            Submit a test lead from Meta's Lead Ads Testing Tool or POST to
            /api/leads to see it appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <LeadCard lead={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4361ee"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#ccc',
  },
  countText: {
    fontSize: 13,
    color: '#ccc',
    marginLeft: 'auto',
  },
  list: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
