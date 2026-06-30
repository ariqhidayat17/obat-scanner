import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { loadHistoryImage, deleteHistoryImage } from "@/lib/image-persistence";
import type { ScanHistory, OcrResult } from "@/shared/ocr-types";
import { ReminderModal } from "@/components/reminder-modal";
import { scheduleReminder } from "@/lib/reminder";

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

const OCR_FIELDS: { label: string; key: keyof OcrResult }[] = [
  { label: "Komposisi", key: "komposisi" },
  { label: "Dosis & Aturan Pakai", key: "dosis" },
  { label: "Indikasi", key: "indikasi" },
  { label: "Kontraindikasi", key: "kontraindikasi" },
  { label: "Efek Samping", key: "efekSamping" },
  { label: "Tanggal Kadaluarsa", key: "tanggalKadaluarsa" },
  { label: "No. Registrasi BPOM", key: "nomorRegistrasi" },
  { label: "Produsen", key: "produsen" },
  { label: "Cara Penyimpanan", key: "penyimpanan" },
  { label: "Berat Bersih", key: "beratBersih" },
  { label: "HET", key: "hargaEceranTertinggi" },
];

export default function HistoryDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ScanHistory | null>(null);
  const [isReminderVisible, setIsReminderVisible] = useState(false);

  const handleScheduleReminder = async (sched: any) => {
    try {
      const ids = await scheduleReminder(sched);
      if (ids.length > 0) {
        Alert.alert(
          "Pengingat Dipasang",
          `Berhasil memasang ${ids.length} pengingat untuk obat ${sched.namaObat}.`
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Gagal", "Gagal memasang pengingat.");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) {
          const history: ScanHistory[] = JSON.parse(raw);
          const found = history.find((h) => h.id === id);
          setItem(found ?? null);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [id]);

  const handleDelete = () => {
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
            const raw = await AsyncStorage.getItem(HISTORY_KEY);
            if (raw) {
              const history: ScanHistory[] = JSON.parse(raw);
              const found = history.find((h) => h.id === id);
              if (found) {
                await deleteHistoryImage(found.imageUri);
              }
              const updated = history.filter((h) => h.id !== id);
              await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
            }
            router.back();
          },
        },
      ]
    );
  };

  const handleCopyText = async () => {
    if (!item) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const r = item.result;
    const text = [
      r.namaObat && `Nama Obat: ${r.namaObat}`,
      r.komposisi && `Komposisi: ${r.komposisi}`,
      r.dosis && `Dosis: ${r.dosis}`,
      r.indikasi && `Indikasi: ${r.indikasi}`,
      r.tanggalKadaluarsa && `Kadaluarsa: ${r.tanggalKadaluarsa}`,
      r.nomorRegistrasi && `No. Registrasi: ${r.nomorRegistrasi}`,
      r.produsen && `Produsen: ${r.produsen}`,
    ]
      .filter(Boolean)
      .join("\n");
    await Clipboard.setStringAsync(text);
    Alert.alert("Disalin", "Informasi obat telah disalin ke clipboard.");
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
    deleteBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.error}18`,
      alignItems: "center",
      justifyContent: "center",
    },
    imageContainer: {
      margin: 16,
      borderRadius: 16,
      overflow: "hidden",
      height: 200,
      backgroundColor: colors.surface,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    dateText: {
      fontSize: 12,
      color: colors.muted,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    resultCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    namaObatCard: {
      padding: 16,
      backgroundColor: colors.primary,
    },
    namaObatLabel: {
      fontSize: 11,
      color: "rgba(255,255,255,0.75)",
      fontWeight: "600",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    namaObatValue: {
      fontSize: 22,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    fieldRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    fieldLabel: {
      fontSize: 11,
      color: colors.muted,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    fieldValue: {
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 20,
    },
    rawTextCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    rawTextTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.muted,
      marginBottom: 8,
    },
    rawText: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 18,
    },
    primaryActionRow: {
      flexDirection: "row",
      gap: 10,
      marginHorizontal: 16,
      marginBottom: 10,
    },
    chatBtn: {
      flex: 1.3,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.primary,
    },
    chatBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    reminderBtn: {
      flex: 0.9,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}12`,
    },
    reminderBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
    },
    copyBtn: {
      marginHorizontal: 16,
      marginBottom: 24,
      paddingVertical: 14,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    copyBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.primary,
    },
    notFoundContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    notFoundText: {
      fontSize: 16,
      color: colors.muted,
    },
  });

  if (!item) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <IconSymbol name="xmark" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Riwayat</Text>
        </View>
        <View style={styles.notFoundContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={40} color={colors.warning} />
          <Text style={styles.notFoundText}>Riwayat tidak ditemukan</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="xmark" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Riwayat</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <IconSymbol name="trash" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <HistoryImage
            uriOrKey={item.imageUri}
            style={styles.image}
          />
        </View>

        <Text style={styles.dateText}>
          Discan pada:{" "}
          {new Date(item.scannedAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        {/* Results */}
        <View style={styles.resultCard}>
          <View style={styles.namaObatCard}>
            <Text style={styles.namaObatLabel}>Nama Obat</Text>
            <Text style={styles.namaObatValue}>
              {item.result.namaObat || "Tidak Terdeteksi"}
            </Text>
          </View>

          {OCR_FIELDS.filter((f) => item.result[f.key]).map((field, index, arr) => (
            <View
              key={field.key}
              style={[
                styles.fieldRow,
                index === arr.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldValue}>{item.result[field.key]}</Text>
            </View>
          ))}
        </View>

        {item.result.rawText ? (
          <View style={styles.rawTextCard}>
            <Text style={styles.rawTextTitle}>Teks Mentah (Raw OCR)</Text>
            <Text style={styles.rawText}>{item.result.rawText}</Text>
          </View>
        ) : null}

        {/* Primary AI Actions */}
        <View style={styles.primaryActionRow}>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <IconSymbol name="message.fill" size={18} color="#FFFFFF" />
            <Text style={styles.chatBtnText}>Tanya Apoteker AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reminderBtn}
            onPress={() => setIsReminderVisible(true)}
          >
            <IconSymbol name="bell.fill" size={18} color={colors.primary} />
            <Text style={styles.reminderBtnText}>Pengingat</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyText}>
          <IconSymbol name="doc.on.doc" size={18} color={colors.primary} />
          <Text style={styles.copyBtnText}>Salin Informasi Obat</Text>
        </TouchableOpacity>
      </ScrollView>

      <ReminderModal
        visible={isReminderVisible}
        onClose={() => setIsReminderVisible(false)}
        namaObat={item.result.namaObat || "Obat"}
        dosisDefault={item.result.dosis || "1 Tablet"}
        onSchedule={handleScheduleReminder}
      />
    </ScreenContainer>
  );
}
