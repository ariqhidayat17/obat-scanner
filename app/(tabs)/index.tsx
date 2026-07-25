import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setImageBase64 } from "@/lib/image-store";
import { compressImageForOcr } from "@/lib/image-utils";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { loadHistoryImage } from "@/lib/image-persistence";
import type { ScanHistory } from "@/shared/ocr-types";
import { showAlert } from "@/lib/utils";

const HISTORY_KEY = "obatscan_history";

function HistoryImage({ uriOrKey, style }: { uriOrKey: string; style: any }) {
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

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [recentHistory, setRecentHistory] = useState<ScanHistory[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) {
        const all: ScanHistory[] = JSON.parse(raw);
        setRecentHistory(all.slice(0, 5));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Refresh history when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleOpenCamera = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/camera");
  };

  const handlePickFromGallery = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert(
        "Izin Diperlukan",
        "ObatScan memerlukan akses ke galeri foto untuk memilih gambar label obat.",
        [{ text: "OK" }]
      );
      return;
    }

    // Pilih gambar tanpa base64 — kompresi dilakukan secara terpisah
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 1.0,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        setIsCompressing(true);
        // Kompres gambar terlebih dahulu sebelum disimpan ke store
        const compressed = await compressImageForOcr(asset.uri);
        // Simpan base64 ke memory store — BUKAN ke router params
        setImageBase64(compressed.base64, compressed.mimeType);
        router.push({
          pathname: "/result",
          params: { imageUri: compressed.uri },
        });
      } catch (err) {
        showAlert("Error", "Gagal memproses gambar. Coba lagi.");
        console.error("[Gallery] compress error:", err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleHistoryItem = (item: ScanHistory) => {
    router.push({
      pathname: "/history/[id]",
      params: { id: item.id },
    });
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 12,
    },
    logoContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    logo: {
      width: 32,
      height: 32,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.foreground,
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.muted,
    },
    actionsCard: {
      marginHorizontal: 20,
      marginTop: 16,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    actionsTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    actionsDesc: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 16,
      lineHeight: 18,
    },
    btnRow: {
      flexDirection: "row",
      gap: 12,
    },
    primaryBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    secondaryBtn: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    secondaryBtnText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "700",
    },
    tipsCard: {
      marginHorizontal: 20,
      marginTop: 12,
      backgroundColor: `${colors.primary}08`,
      borderRadius: 14,
      padding: 16,
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    tipsContent: {
      flex: 1,
    },
    tipsTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
      marginBottom: 2,
    },
    tipsDesc: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginTop: 24,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
    },
    seeAll: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "600",
    },
    historyItem: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 10,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.02,
      shadowRadius: 4,
      elevation: 1,
    },
    historyThumb: {
      width: 50,
      height: 50,
      borderRadius: 10,
    },
    historyInfo: {
      flex: 1,
    },
    historyName: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 2,
    },
    historyMeta: {
      fontSize: 12,
      color: colors.muted,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 40,
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
    },
    emptyText: {
      fontSize: 13,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 18,
      marginTop: 8,
    },
  });

  return (
    <ScreenContainer>
      <FlatList
        data={recentHistory}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.logo}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>ObatScan</Text>
                <Text style={styles.headerSubtitle}>Halo! Sehat Selalu 👋</Text>
              </View>
            </View>

            {/* Quick Actions Panel */}
            <View style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>Pindai Label Obat</Text>
              <Text style={styles.actionsDesc}>
                Ambil foto kemasan obat atau pilih dari galeri untuk mendeteksi dosis, aturan pakai, dan info penting secara instan.
              </Text>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleOpenCamera}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="camera.fill" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Buka Kamera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryBtn, isCompressing && { opacity: 0.6 }]}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.8}
                  disabled={isCompressing}
                >
                  {isCompressing ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <IconSymbol name="photo" size={18} color={colors.primary} />
                  )}
                  <Text style={styles.secondaryBtnText}>
                    {isCompressing ? "Memproses..." : "Pilih Galeri"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Info / Tips Card */}
            <View style={styles.tipsCard}>
              <IconSymbol name="info.circle.fill" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={styles.tipsContent}>
                <Text style={styles.tipsTitle}>Tips Hasil Pindaian Akurat</Text>
                <Text style={styles.tipsDesc}>
                  Posisikan kemasan obat di area terang dan pastikan teks pada label tidak blur atau terlipat agar hasil pembacaan optimal.
                </Text>
              </View>
            </View>

            {/* Recent History Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Riwayat Pindaian</Text>
              {recentHistory.length > 0 && (
                <TouchableOpacity onPress={() => router.push("/history")}>
                  <Text style={styles.seeAll}>Lihat Semua</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.historyItem}
            onPress={() => handleHistoryItem(item)}
            activeOpacity={0.75}
          >
            <HistoryImage
              uriOrKey={item.imageUri}
              style={styles.historyThumb}
            />
            <View style={styles.historyInfo}>
              <Text style={styles.historyName} numberOfLines={1}>
                {item.result.namaObat || "Obat Tidak Diketahui"}
              </Text>
              <Text style={styles.historyMeta} numberOfLines={1}>
                {item.result.produsen || "—"}
              </Text>
              <Text style={styles.historyMeta}>
                {new Date(item.scannedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text.fill" size={32} color={colors.border} />
            <Text style={styles.emptyText}>
              Belum ada riwayat pindaian.{"\n"}Ketuk tombol di atas untuk memulai.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
