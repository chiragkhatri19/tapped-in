import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { lookupBarcode } from '@/lib/barcode';

export default function ScanBarcodeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [missed, setMissed] = useState(false);

  const handleBarcode = useCallback(
    async ({ data }: { data: string }) => {
      if (busy || missed) return;
      setBusy(true);

      const food = await lookupBarcode(data);

      if (food) {
        router.replace({
          pathname: '/log-meal',
          params: { scannedFood: JSON.stringify(food) },
        });
      } else {
        setMissed(true);
        setBusy(false);
      }
    },
    [busy, missed, router]
  );

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="barcode-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.title, { color: colors.foreground }]}>Camera access needed</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Tapped In uses the camera to scan product barcodes.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={[styles.btnLabel, { color: colors.primaryForeground }]}>Allow camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 8 }} onPress={() => router.back()}>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={busy || missed ? undefined : handleBarcode}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan barcode</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Viewfinder */}
      <View style={styles.viewfinder}>
        <View style={[styles.vfBox, busy && { borderColor: 'rgba(255,255,255,0.4)' }]} />
        {!busy && !missed && (
          <Text style={styles.vfHint}>Point at a product barcode</Text>
        )}
      </View>

      {/* Loading overlay */}
      {busy && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Looking up product…</Text>
        </View>
      )}

      {/* Miss panel */}
      {missed && (
        <View style={[styles.missPanel, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Product not found</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            The barcode wasn't in Open Food Facts. You can add it as a custom food.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() =>
              router.replace({ pathname: '/log-meal', params: { openCustomFood: '1' } })
            }
          >
            <Text style={[styles.btnLabel, { color: colors.primaryForeground }]}>
              Add custom food
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 12 }} onPress={() => setMissed(false)}>
            <Text style={[styles.sub, { color: colors.primary }]}>Try scanning again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Attribution */}
      {!missed && (
        <View style={[styles.attribution, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.attribText}>
            Product data from Open Food Facts (openfoodfacts.org)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 8 },
  btnLabel: { fontSize: 15, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  vfBox: {
    width: 280, height: 160, borderWidth: 2, borderColor: '#fff',
    borderRadius: 12, backgroundColor: 'transparent',
  },
  vfHint: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  overlayText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  missPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 28, paddingBottom: 36,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 8,
  },
  attribution: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', paddingTop: 8,
  },
  attribText: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
});
