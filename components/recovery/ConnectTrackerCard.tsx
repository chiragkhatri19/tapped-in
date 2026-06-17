import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrutalButton } from '@/components/brutal';
import { useHealthConnection } from '@/stores/health-store';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';

interface Props {
  onConnect: () => void;
  onSync: () => void;
}

function formatSyncTime(isoDate: string | null): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 2) return 'synced just now';
  if (diffMin < 60) return `synced ${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `synced ${diffH}h ago`;
  return `synced ${Math.floor(diffH / 24)}d ago`;
}

export function ConnectTrackerCard({ onConnect, onSync }: Props) {
  const colors = useColors();
  const { connected, providerId, lastSyncAt, grantedScopes } = useHealthConnection();

  // Not on Android — show platform note
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return (
      <View style={[styles.row, { opacity: 0.5 }]}>
        <View style={[styles.icon, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
          <Feather name="watch" size={16} color={colors.mutedForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { fontFamily: F.bodySemi, color: colors.mutedForeground }]}>
            connect your tracker
          </Text>
          <Text style={[styles.sub, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
            available on android and iphone
          </Text>
        </View>
      </View>
    );
  }

  if (connected && providerId) {
    return (
      <View style={styles.connectedRow}>
        <View style={[styles.icon, { borderColor: colors.teal, backgroundColor: colors.teal + '20' }]}>
          <Feather name="check-circle" size={16} color={colors.teal} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.title, { fontFamily: F.bodySemi, color: colors.foreground }]}>
            {providerId === 'health_connect' ? 'health connect' : 'apple health'} connected
          </Text>
          {lastSyncAt && (
            <Text style={[styles.sub, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
              {formatSyncTime(lastSyncAt)} · {grantedScopes.join(', ')}
            </Text>
          )}
        </View>
        <BrutalButton label="sync" onPress={onSync} variant="secondary" height={36} style={{ paddingHorizontal: 14 }} />
      </View>
    );
  }

  return (
    <View style={styles.disconnectedRow}>
      <View style={styles.iconTextRow}>
        <View style={[styles.icon, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
          <Feather name="watch" size={16} color={colors.mutedForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { fontFamily: F.bodySemi, color: colors.foreground }]}>
            connect your tracker
          </Text>
          <Text style={[styles.sub, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
            {Platform.OS === 'android'
              ? 'import sleep, steps + heart rate from health connect'
              : 'import sleep, steps + heart rate from apple health'}
          </Text>
        </View>
      </View>
      <BrutalButton
        label="connect"
        onPress={onConnect}
        variant="primary"
        height={44}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  connectedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  disconnectedRow: { gap: 14 },
  iconTextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, marginBottom: 2 },
  sub: { fontSize: 12, lineHeight: 17 },
});
