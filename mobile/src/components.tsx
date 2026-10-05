import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { imageUrl } from './api';
import { colors, shadow } from './theme';
import type { Product } from './types';

export const money = (value: number) => `₦${value.toLocaleString('en-NG')}`;

export function LoadingState({ label = 'Loading the collection…' }: { label?: string }) {
  return <View style={styles.state}><ActivityIndicator color={colors.blue} /><Text style={styles.stateText}>{label}</Text></View>;
}
export function EmptyState({ icon = 'bag-outline', title, message }: { icon?: keyof typeof Ionicons.glyphMap; title: string; message: string }) {
  return <View style={styles.state}><View style={styles.emptyIcon}><Ionicons name={icon} size={28} color={colors.blue} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.stateText}>{message}</Text></View>;
}
export function ErrorBanner({ message, retry }: { message: string; retry: () => void }) {
  if (!message) return null;
  return <Pressable style={styles.error} onPress={retry}><Ionicons name="alert-circle" size={20} color={colors.danger} /><Text style={styles.errorText}>{message}</Text><Text style={styles.retry}>Retry</Text></Pressable>;
}
export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <View style={styles.sectionTitle}><View>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{title}</Text></View>{action}</View>;
}

export function PrimaryButton({ title, onPress, disabled, icon }: { title: string; onPress: () => void; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primary, pressed && styles.pressed, disabled && styles.disabled]}>{icon ? <Ionicons name={icon} color="white" size={19} /> : null}<Text style={styles.primaryText}>{title}</Text></Pressable>;
}

export function SizeSheet({ product, visible, onClose, onSelect }: { product: Product | null; visible: boolean; onClose: () => void; onSelect: (size: string) => Promise<void> }) {
  const insets = useSafeAreaInsets();
  const [adding, setAdding] = useState('');
  if (!product) return null;
  const choose = async (size: string) => { setAdding(size); try { await onSelect(size); onClose(); } finally { setAdding(''); } };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalRoot}><Pressable style={styles.scrim} onPress={onClose} /><View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
      <View style={styles.handle} /><View style={styles.sheetHeader}><View><Text style={styles.eyebrow}>QUICK ADD</Text><Text style={styles.sheetTitle}>{product.name}</Text></View><Pressable accessibilityLabel="Close" onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>
      <Text style={styles.sheetPrompt}>Choose a size</Text><View style={styles.sizes}>{product.sizes.map(size => <Pressable key={size} disabled={Boolean(adding)} onPress={() => choose(size)} style={({ pressed }) => [styles.size, pressed && styles.sizeActive]}><Text style={styles.sizeText}>{adding === size ? '…' : size}</Text></Pressable>)}</View>
    </View></View>
  </Modal>;
}

export function ProductCard({ product, saved, onOpen, onFavourite, onQuickAdd }: { product: Product; saved: boolean; onOpen: () => void; onFavourite: () => void; onQuickAdd: () => void }) {
  return <View style={styles.productCard}><Pressable onPress={onOpen}><Image source={{ uri: imageUrl(product.image) }} style={styles.productImage} />{product.isNew ? <View style={styles.badge}><Text style={styles.badgeText}>NEW</Text></View> : null}</Pressable>
    <Pressable accessibilityLabel={saved ? 'Remove from saved' : 'Save item'} onPress={onFavourite} style={styles.heart}><Ionicons name={saved ? 'heart' : 'heart-outline'} size={21} color={saved ? colors.blue : colors.ink} /></Pressable>
    <View style={styles.productBody}><Text numberOfLines={1} style={styles.productName}>{product.name}</Text><Text style={styles.productPrice}>{money(product.price)}</Text><Text style={styles.productColor}>{product.color.toUpperCase()}</Text>
      <Pressable disabled={!product.sizes.length} onPress={onQuickAdd} style={({ pressed }) => [styles.quickAdd, pressed && styles.pressed]}><Text style={styles.quickAddText}>{product.sizes.length ? 'Quick Add' : 'Sold Out'}</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  state: { minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  stateText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  emptyTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  error: { marginHorizontal: 16, marginBottom: 12, minHeight: 48, padding: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF1F0' },
  errorText: { flex: 1, color: colors.ink, fontSize: 14 }, retry: { color: colors.blue, fontWeight: '700' },
  sectionTitle: { paddingHorizontal: 20, marginTop: 28, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  eyebrow: { marginBottom: 5, color: colors.blue, fontSize: 12, fontWeight: '700', letterSpacing: 1.3 },
  title: { color: colors.ink, fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  primary: { minHeight: 50, borderRadius: 14, paddingHorizontal: 20, backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: 'white', fontSize: 16, fontWeight: '700' }, pressed: { opacity: 0.76 }, disabled: { opacity: 0.45 },
  productCard: { width: '48.2%', marginBottom: 20, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.card, ...shadow },
  productImage: { width: '100%', aspectRatio: 0.77, backgroundColor: colors.pale },
  badge: { position: 'absolute', top: 10, left: 10, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,.92)' },
  badgeText: { color: colors.ink, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heart: { position: 'absolute', top: 9, right: 9, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.94)' },
  productBody: { padding: 12 }, productName: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  productPrice: { marginTop: 5, color: colors.ink, fontSize: 16, fontWeight: '700' }, productColor: { marginTop: 3, color: colors.muted, fontSize: 11, letterSpacing: .7 },
  quickAdd: { minHeight: 40, marginTop: 11, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  quickAddText: { color: colors.blue, fontSize: 14, fontWeight: '700' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,.32)' },
  sheet: { padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.card, ...shadow }, handle: { width: 38, height: 5, marginBottom: 18, borderRadius: 3, alignSelf: 'center', backgroundColor: '#C7C7CC' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sheetTitle: { color: colors.ink, fontSize: 23, fontWeight: '700' },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }, sheetPrompt: { marginTop: 25, marginBottom: 12, color: colors.muted, fontSize: 15 },
  sizes: { flexDirection: 'row', gap: 10 }, size: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.separator, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }, sizeActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft }, sizeText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
});
