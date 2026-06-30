import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Alert,
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
      Alert.alert(
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
        Alert.alert("Error", "Gagal memproses gambar. Coba lagi.");
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
      gap: 10,
    },
    logoContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      overflow: "hidden",
    },
    logo: {
      width: 40,
      height: 40,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.muted,
    },
    heroCard: {
      marginHorizontal: 20,
      marginTop: 16,
      borderRadius: 20,
      padding: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      gap: 16,
    },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#FFFFFF",
      textAlign: "center",
    },
    heroDesc: {
      fontSize: 14,
      color: "rgba(255,255,255,0.85)",
      textAlign: "center",
      lineHeight: 20,
    },
    scanBtn: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    scanBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primary,
    },
    galleryBtn: {
      marginHorizontal: 20,
      marginTop: 12,
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    galleryBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.primary,
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
      fontSize: 16,
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
    },
    historyThumb: {
      width: 56,
      height: 56,
      borderRadius: 10,
      backgroundColor: colors.border,
    },
    historyInfo: {
      flex: 1,
    },
    historyName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 2,
    },
    historyMeta: {
      fontSize: 12,
      color: colors.muted,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 32,
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 20,
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
                <Text style={styles.headerSubtitle}>OCR Label Obat</Text>
              </View>
            </View>

            {/* Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <IconSymbol name="camera.fill" size={36} color="#FFFFFF" />
              </View>
              <Text style={styles.heroTitle}>Scan Label Obat</Text>
              <Text style={styles.heroDesc}>
                Arahkan kamera ke label obat untuk membaca informasi seperti nama, dosis, komposisi, dan tanggal kadaluarsa secara otomatis.
              </Text>
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={handleOpenCamera}
                activeOpacity={0.85}
              >
                <IconSymbol name="camera.fill" size={20} color={colors.primary} />
                <Text style={styles.scanBtnText}>Buka Kamera</Text>
              </TouchableOpacity>
            </View>

            {/* Gallery Button */}
            <TouchableOpacity
              style={[styles.galleryBtn, isCompressing && { opacity: 0.6 }]}
              onPress={handlePickFromGallery}
              activeOpacity={0.8}
              disabled={isCompressing}
            >
              {isCompressing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <IconSymbol name="photo" size={20} color={colors.primary} />
              )}
              <Text style={styles.galleryBtnText}>
                {isCompressing ? "Memproses..." : "Pilih dari Galeri"}
              </Text>
            </TouchableOpacity>

            {/* Recent History Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Riwayat Terbaru</Text>
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
            <IconSymbol name="doc.text.fill" size={40} color={colors.border} />
            <Text style={styles.emptyText}>
              Belum ada riwayat scan.{"\n"}Mulai dengan memotret label obat.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
