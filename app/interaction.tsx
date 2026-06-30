import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type InteractionLevel = "aman" | "perhatian" | "berbahaya";

interface DrugParam {
  namaObat: string;
  komposisi?: string;
}

export default function InteractionScreen() {
  const colors = useColors();
  const router = useRouter();
  // drugs di-encode sebagai JSON string di params
  const { drugs: drugsParam } = useLocalSearchParams<{ drugs: string }>();

  const [drugs, setDrugs] = useState<DrugParam[]>([]);

  useEffect(() => {
    try {
      if (drugsParam) setDrugs(JSON.parse(drugsParam));
    } catch {
      // ignore
    }
  }, [drugsParam]);

  const checkMutation = trpc.ocr.checkInteraction.useMutation();

  useEffect(() => {
    if (drugs.length >= 2) {
      checkMutation.mutate({ drugs });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugs]);

  const levelColor = (level: InteractionLevel) => {
    switch (level) {
      case "aman":
        return "#22c55e";
      case "perhatian":
        return "#f59e0b";
      case "berbahaya":
        return "#ef4444";
    }
  };

  const levelIcon = (level: InteractionLevel): "checkmark.circle.fill" | "exclamationmark.triangle.fill" | "xmark.octagon.fill" => {
    switch (level) {
      case "aman":
        return "checkmark.circle.fill";
      case "perhatian":
        return "exclamationmark.triangle.fill";
      case "berbahaya":
        return "xmark.octagon.fill";
    }
  };

  const levelLabel = (level: InteractionLevel) => {
    switch (level) {
      case "aman":
        return "AMAN";
      case "perhatian":
        return "PERLU PERHATIAN";
      case "berbahaya":
        return "BERBAHAYA";
    }
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      paddingHorizontal: 40,
    },
    loadingText: {
      fontSize: 15,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 22,
    },
    // Drug list chip
    drugChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    drugChip: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    drugChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
    },
    // Overall level banner
    overallBanner: {
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    overallLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: "rgba(255,255,255,0.8)",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    overallTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#FFFFFF",
      marginTop: 2,
    },
    overallDesc: {
      fontSize: 13,
      color: "rgba(255,255,255,0.9)",
      lineHeight: 18,
      marginTop: 4,
    },
    // Interaction cards
    sectionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.muted,
      paddingHorizontal: 16,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    interactionCard: {
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    interactionCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    interactionDrugNames: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
    },
    levelBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    levelBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    interactionBody: {
      padding: 12,
      gap: 6,
    },
    interactionDesc: {
      fontSize: 13,
      color: colors.foreground,
      lineHeight: 18,
    },
    rekomendasiRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 4,
    },
    rekomendasiText: {
      fontSize: 12,
      color: colors.muted,
      flex: 1,
      lineHeight: 17,
    },
    // Catatan umum
    noteCard: {
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 24,
      borderRadius: 14,
      backgroundColor: `${colors.primary}12`,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
      padding: 14,
      flexDirection: "row",
      gap: 10,
    },
    noteText: {
      fontSize: 13,
      color: colors.foreground,
      lineHeight: 19,
      flex: 1,
    },
    emptyInteraction: {
      alignItems: "center",
      paddingVertical: 20,
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
    },
  });

  const result = checkMutation.data;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="xmark" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cek Interaksi Obat</Text>
      </View>

      {checkMutation.isPending ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Menganalisis interaksi antar {drugs.length} obat...{"\n"}Mohon tunggu sebentar.
          </Text>
        </View>
      ) : checkMutation.isError ? (
        <View style={styles.loadingContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.error ?? "#ef4444"} />
          <Text style={styles.loadingText}>
            Gagal menganalisis interaksi. Periksa koneksi internet dan coba lagi.
          </Text>
          <TouchableOpacity onPress={() => checkMutation.mutate({ drugs })}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : result ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Daftar obat yang dicek */}
          <View style={styles.drugChipsRow}>
            {drugs.map((d, i) => (
              <View key={i} style={styles.drugChip}>
                <Text style={styles.drugChipText}>{d.namaObat}</Text>
              </View>
            ))}
          </View>

          {/* Banner level keseluruhan */}
          <View style={[styles.overallBanner, { backgroundColor: levelColor(result.levelKeseluruhan) }]}>
            <IconSymbol name={levelIcon(result.levelKeseluruhan)} size={36} color="#FFFFFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.overallLabel}>Status Interaksi</Text>
              <Text style={styles.overallTitle}>{levelLabel(result.levelKeseluruhan)}</Text>
              <Text style={styles.overallDesc}>{result.ringkasan}</Text>
            </View>
          </View>

          {/* Detail interaksi */}
          {result.interaksi.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Detail Interaksi</Text>
              {result.interaksi.map((item, i) => (
                <View key={i} style={styles.interactionCard}>
                  <View style={styles.interactionCardHeader}>
                    <Text style={styles.interactionDrugNames} numberOfLines={2}>
                      {item.obat1} × {item.obat2}
                    </Text>
                    <View style={[styles.levelBadge, { backgroundColor: levelColor(item.level) }]}>
                      <IconSymbol name={levelIcon(item.level)} size={10} color="#FFFFFF" />
                      <Text style={styles.levelBadgeText}>{levelLabel(item.level)}</Text>
                    </View>
                  </View>
                  <View style={styles.interactionBody}>
                    <Text style={styles.interactionDesc}>{item.penjelasan}</Text>
                    {item.rekomendasi ? (
                      <View style={styles.rekomendasiRow}>
                        <IconSymbol name="lightbulb.fill" size={14} color={colors.primary} />
                        <Text style={styles.rekomendasiText}>{item.rekomendasi}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyInteraction}>
              <IconSymbol name="checkmark.circle.fill" size={40} color="#22c55e" />
              <Text style={styles.emptyText}>Tidak ditemukan interaksi signifikan antar obat.</Text>
            </View>
          )}

          {/* Catatan umum */}
          {result.catatanUmum ? (
            <View style={styles.noteCard}>
              <IconSymbol name="info.circle.fill" size={18} color={colors.primary} />
              <Text style={styles.noteText}>{result.catatanUmum}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </ScreenContainer>
  );
}
