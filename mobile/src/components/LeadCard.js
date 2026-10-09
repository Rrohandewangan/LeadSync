import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LeadCard({ lead }) {
  const initial = lead.name ? lead.name.charAt(0).toUpperCase() : '?';
  const timeAgo = getTimeAgo(lead.createdAt);

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{lead.name || 'No name'}</Text>

        {lead.email ? (
          <Text style={styles.detail}>✉  {lead.email}</Text>
        ) : null}

        {lead.phone ? (
          <Text style={styles.detail}>☎  {lead.phone}</Text>
        ) : null}

        <Text style={styles.meta}>
          {lead.source === 'meta' ? 'Facebook Lead' : 'Manual'} · {timeAgo}
        </Text>
      </View>
    </View>
  );
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';

  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4361ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  meta: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});
