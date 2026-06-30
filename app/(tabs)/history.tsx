import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { loadHistoryImage, deleteHistoryImage } from "@/lib/image-persistence";
import type { ScanHistory } from "@/shared/ocr-types";

const HISTORY_KEY = "obatscan_history";

export function HistoryImage({ uriOrKey, style }: { uriOrKey: string; style: any }) {
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadHistoryImage(uriOrKey).then((uri) => {
      if (active) setResolvedUri(uri);
    });
    return () => {
      active = false;
    };
  }, [uriOrKey]);

  if (!resolvedUri) {
    return <View style={[style, { backgroundColor: "#e5e7eb" }]} />;
  }

  return <Image source={{ uri: resolvedUri }} style={style} resizeMode="cover" />;
}

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [history, setHistory] = useState<ScanHistory[]>([]);

  // Selection states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleExitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const handleItemPress = async (item: ScanHistory) => {
    if (isSelectMode) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedIds((prev) => {
        if (prev.includes(item.id)) {
          return prev.filter((id) => id !== item.id);
        } else {
          if (prev.length >= 5) {
            Alert.alert("Batas Maksimal", "Kamu hanya bisa memilih maksimal 5 obat untuk dicek interaksinya.");
            return prev;
          }
          return [...prev, item.id];
        }
      });
    } else {
      router.push({
        pathname: "/history/[id]",
        params: { id: item.id },
      });
    }
  };

  const handleItemLongPress = async (item: ScanHistory) => {
    if (isSelectMode) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSelectMode(true);
    setSelectedIds([item.id]);
  };

  const handleCheckInteraction = async () => {
    if (selectedIds.length < 2) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const selectedDrugs = history
      .filter((h) => selectedIds.includes(h.id))
      .map((h) => ({
        namaObat: h.result.namaObat || "Obat",
        komposisi: h.result.komposisi || "",
      }));

    router.push({
      pathname: "/interaction",
      params: { drugs: JSON.stringify(selectedDrugs) },
    });

    handleExitSelectMode();
  };

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) {
        setHistory(JSON.parse(raw));
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Refresh history automatically when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      "Hapus Riwayat",
      "Apakah kamu yakin ingin menghapus riwayat scan ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const itemToDelete = history.find((h) => h.id === id);
            if (itemToDelete) {
              await deleteHistoryImage(itemToDelete.imageUri);
            }
            const updated = history.filter((h) => h.id !== id);
            setHistory(updated);
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (history.length === 0) return;
    Alert.alert(
      "Hapus Semua Riwayat",
      "Apakah kamu yakin ingin menghapus semua riwayat scan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus Semua",
          style: "destructive",
          onPress: async () => {
            for (const h of history) {
              await deleteHistoryImage(h.imageUri);
            }
            setHistory([]);
            await AsyncStorage.removeItem(HISTORY_KEY);
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
    },
    clearBtn: {
      padding: 8,
    },
    clearBtnText: {
      fontSize: 13,
      color: colors.error,
      fontWeight: "600",
    },
    historyItem: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyThumb: {
      width: 64,
      height: 64,
      borderRadius: 10,
      backgroundColor: colors.border,
    },
    historyInfo: {
      flex: 1,
    },
    historyName: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 3,
    },
    historyProdusen: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 2,
    },
    historyDate: {
      fontSize: 11,
      color: colors.muted,
    },
    historyActions: {
      gap: 8,
      alignItems: "center",
    },
    deleteBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: `${colors.error}18`,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
      paddingHorizontal: 40,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
    },
    emptyDesc: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 20,
    },
    scanNowBtn: {
      marginTop: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    scanNowBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    countText: {
      fontSize: 13,
      color: colors.muted,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    cancelBtn: {
      paddingVertical: 8,
    },
    cancelBtnText: {
      fontSize: 15,
      color: colors.muted,
      fontWeight: "600",
    },
    headerTitleSelect: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      flex: 1,
      textAlign: "center",
    },
    historyItemSec: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}08`,
    },
    checkboxContainer: {
      justifyContent: "center",
      alignItems: "center",
      marginRight: 4,
    },
    checkboxUnselected: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      backgroundColor: "transparent",
    },
    fabContainer: {
      position: "absolute",
      bottom: 24,
      left: 16,
      right: 16,
      alignItems: "center",
      zIndex: 10,
    },
    fab: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 28,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 6,
    },
    fabText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
  });

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        {isSelectMode ? (
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleExitSelectMode}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitleSelect}>Pilih Obat ({selectedIds.length})</Text>
            <View style={{ width: 40 }} /> {/* to balance layout */}
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>Riwayat Scan</Text>
            {history.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
                <Text style={styles.clearBtnText}>Hapus Semua</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {history.length > 0 && !isSelectMode && (
        <Text style={styles.countText}>{history.length} hasil scan tersimpan</Text>
      )}
      {history.length > 0 && isSelectMode && (
        <Text style={styles.countText}>Pilih 2 hingga 5 obat untuk mengecek interaksi</Text>
      )}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity
              style={[
                styles.historyItem,
                isSelected && styles.historyItemSec,
              ]}
              onPress={() => handleItemPress(item)}
              onLongPress={() => handleItemLongPress(item)}
              activeOpacity={0.75}
            >
              {isSelectMode && (
                <View style={styles.checkboxContainer}>
                  {isSelected ? (
                    <IconSymbol name="checkmark.circle.fill" size={22} color={colors.primary} />
                  ) : (
                    <View style={[styles.checkboxUnselected, { borderColor: colors.border }]} />
                  )}
                </View>
              )}
              <HistoryImage
                uriOrKey={item.imageUri}
                style={styles.historyThumb}
              />
              <View style={styles.historyInfo}>
                <Text style={styles.historyName} numberOfLines={1}>
                  {item.result.namaObat || "Obat Tidak Diketahui"}
                </Text>
                {item.result.produsen ? (
                  <Text style={styles.historyProdusen} numberOfLines={1}>
                    {item.result.produsen}
                  </Text>
                ) : null}
                <Text style={styles.historyDate}>
                  {new Date(item.scannedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {!isSelectMode && (
                <View style={styles.historyActions}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                  >
                    <IconSymbol name="trash" size={16} color={colors.error} />
                  </TouchableOpacity>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="clock.fill" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
            <Text style={styles.emptyDesc}>
              Riwayat scan label obat akan muncul di sini setelah kamu menyimpan hasil scan.
            </Text>
            <TouchableOpacity
              style={styles.scanNowBtn}
              onPress={() => router.push("/")}
            >
              <Text style={styles.scanNowBtnText}>Mulai Scan</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: isSelectMode && selectedIds.length >= 2 ? 100 : 24 }}
        showsVerticalScrollIndicator={false}
      />

      {isSelectMode && selectedIds.length >= 2 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab} onPress={handleCheckInteraction}>
            <IconSymbol name="xmark.octagon.fill" size={18} color="#FFFFFF" />
            <Text style={styles.fabText}>Cek Interaksi ({selectedIds.length})</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}
