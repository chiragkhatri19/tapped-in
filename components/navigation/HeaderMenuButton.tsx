import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';

type MenuItem = {
  label: string;
  sub: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route: string;
  accent: string;
};

/**
 * Persistent top-right avatar/menu button present on every tab screen.
 * Surfaces the three low-frequency screens that live off the main dock:
 * Profile, Science Library, and Recipes.
 */
export function HeaderMenuButton() {
  const [open, setOpen] = useState(false);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const items: MenuItem[] = [
    {
      label: 'profile & settings',
      sub: 'targets, goal, theme',
      icon: 'user',
      route: '/(tabs)/profile',
      accent: colors.primary,
    },
    {
      label: 'science library',
      sub: 'evidence behind every rec',
      icon: 'book-open',
      route: '/(tabs)/evidence',
      accent: colors.teal,
    },
    {
      label: 'recipes',
      sub: 'high-protein, verified macros',
      icon: 'coffee',
      route: '/(tabs)/recipes',
      accent: colors.orange,
    },
  ];

  const handleItem = (route: string) => {
    Haptics.selectionAsync();
    setOpen(false);
    // Small delay so the modal closes before navigation animates
    setTimeout(() => router.push(route as never), 80);
  };

  return (
    <>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); setOpen(true); }}
        style={[
          styles.btn,
          { borderColor: colors.foreground, backgroundColor: colors.card },
        ]}
        hitSlop={8}
        accessibilityLabel="Open menu"
      >
        <Feather name="menu" size={18} color={colors.foreground} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.menu,
              {
                backgroundColor: colors.card,
                borderColor: colors.foreground,
                top: insets.top + 56,
              },
            ]}
            // Prevent backdrop close when tapping inside the menu
            onPress={(e) => e.stopPropagation()}
          >
            {items.map((item, i) => (
              <React.Fragment key={item.route}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.foreground }]} />}
                <Pressable
                  onPress={() => handleItem(item.route)}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.accent + '22', borderColor: item.accent }]}>
                    <Feather name={item.icon} size={15} color={item.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </Pressable>
              </React.Fragment>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: BRUTAL.radius,
    borderWidth: BRUTAL.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    right: 20,
    borderWidth: BRUTAL.border,
    borderRadius: BRUTAL.radiusLg,
    paddingVertical: 6,
    minWidth: 240,
    // Hard offset shadow
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: BRUTAL.radius,
    borderWidth: BRUTAL.borderThin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontFamily: F.bodyBold,
    fontSize: 14,
  },
  itemSub: {
    fontFamily: F.bodyReg,
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
    opacity: 0.12,
  },
});
