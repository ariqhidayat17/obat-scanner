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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { getImageBase64, clearImageBase64 } from "@/lib/image-store";
import { getApiBaseUrl } from "@/constants/oauth";
import { saveHistoryImage } from "@/lib/image-persistence";
import type { OcrResult, ScanHistory } from "@/shared/ocr-types";
import { ReminderModal } from "@/components/reminder-modal";
import { scheduleReminder } from "@/lib/reminder";

const HISTORY_KEY = "obatscan_history";

interface OcrField {
  label: string;
  key: keyof OcrResult;
}

const OCR_FIELDS: OcrField[] = [
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

// ─── Komponen animasi loading premium (pulse skeleton) ─────────────────────

function PulseBox({
  width,
  height,
  borderRadius = 8,
  style,
}: Readonly<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}>) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#D1D5DB",
        },
        animStyle,
        style,
      ]}
    />
  );
}

function LoadingSkeleton({ colors }: Readonly<{ colors: ReturnType<typeof useColors> }>) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      {/* Skeleton untuk nama obat */}
      <View
        style={{
          borderRadius: 16,
          backgroundColor: colors.primary,
          padding: 16,
          marginBottom: 12,
          gap: 10,
        }}
      >
        <PulseBox
          width={80}
          height={10}
          borderRadius={5}
          style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
        />
        <PulseBox
          width="70%"
          height={22}
          borderRadius={6}
          style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
        />
      </View>

      {/* Skeleton untuk field detail */}
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 10,
            gap: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <PulseBox width={90} height={9} borderRadius={4} />
          <PulseBox width="85%" height={13} borderRadius={4} />
          {i % 2 === 0 && <PulseBox width="60%" height={13} borderRadius={4} />}
        </View>
      ))}

      <View style={{ alignItems: "center", paddingVertical: 16, gap: 8 }}>
        <PulseBox width={36} height={36} borderRadius={18} />
        <PulseBox width={180} height={13} borderRadius={6} />
        <PulseBox width={140} height={11} borderRadius={5} />
      </View>
    </View>
  );
}

// ─── Layar Utama ─────────────────────────────────────────────────────────────

export default function ResultScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri: string }>();

  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  // Simpan S3 imageUrl dari respons server untuk persistensi riwayat
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isReminderVisible, setIsReminderVisible] = useState(false);

  const scanMutation = trpc.ocr.scan.useMutation({
    onSuccess: (data) => {
      setOcrResult({ ...data.data, isLabelObat: Boolean(data.data.isLabelObat) });
      // Simpan URL S3 permanen jika berhasil upload ke storage
      if (data.imageUrl?.startsWith("/")) {
        setServerImageUrl(`${getApiBaseUrl()}${data.imageUrl}`);
      }
    },
    onError: (err) => {
      Alert.alert(
        "Gagal Memproses",
        `Terjadi kesalahan saat membaca label obat: ${err.message}`,
        [
          { text: "Coba Lagi", onPress: () => runScan() },
          { text: "Kembali", onPress: () => router.back() },
        ]
      );
    },
  });

  const runScan = () => {
    // Ambil base64 dari memory store — bukan dari router params
    const pending = getImageBase64();
    if (!pending?.base64) {
      Alert.alert("Error", "Data gambar tidak tersedia.", [
        { text: "Kembali", onPress: () => router.back() },
      ]);
      return;
    }
    scanMutation.mutate({
      imageBase64: pending.base64,
      mimeType: pending.mimeType,
    });
  };

  useEffect(() => {
    runScan();
    return () => {
      // Bersihkan memory store setelah selesai diproses atau saat meninggalkan layar
      clearImageBase64();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveToHistory = async () => {
    if (!ocrResult || !params.imageUri) return null;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const entryId = Date.now().toString();
    
    try {
      // Pindahkan/simpan ke folder permanen (IndexedDB di web, documentDirectory di native)
      const persistentImageUri = await saveHistoryImage(
        entryId,
        serverImageUrl ?? params.imageUri
      );

      const newEntry: ScanHistory = {
        id: entryId,
        imageUri: persistentImageUri,
        result: ocrResult,
        scannedAt: new Date().toISOString(),
      };

      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: ScanHistory[] = raw ? JSON.parse(raw) : [];
      history.unshift(newEntry);
      const trimmed = history.slice(0, 50);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
      setIsSaved(true);
      setSavedId(entryId);
      Alert.alert("Tersimpan", "Hasil scan berhasil disimpan ke riwayat.");
      return entryId;
    } catch (err) {
      console.error("[saveToHistory] Gagal menyimpan:", err);
      Alert.alert("Gagal", "Tidak dapat menyimpan ke riwayat.");
      return null;
    }
  };

  const saveSilently = async (): Promise<string | null> => {
    if (!ocrResult || !params.imageUri) return null;
    if (savedId) return savedId;

    const entryId = Date.now().toString();
    
    try {
      const persistentImageUri = await saveHistoryImage(
        entryId,
        serverImageUrl ?? params.imageUri
      );

      const newEntry: ScanHistory = {
        id: entryId,
        imageUri: persistentImageUri,
        result: ocrResult,
        scannedAt: new Date().toISOString(),
      };

      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: ScanHistory[] = raw ? JSON.parse(raw) : [];
      history.unshift(newEntry);
      const trimmed = history.slice(0, 50);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
      setIsSaved(true);
      setSavedId(entryId);
      return entryId;
    } catch (err) {
      console.error("[saveSilently] Gagal menyimpan:", err);
      return null;
    }
  };

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

  const handleCopyText = async () => {
    if (!ocrResult) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const text = [
      ocrResult.namaObat && `Nama Obat: ${ocrResult.namaObat}`,
      ocrResult.komposisi && `Komposisi: ${ocrResult.komposisi}`,
      ocrResult.dosis && `Dosis: ${ocrResult.dosis}`,
      ocrResult.indikasi && `Indikasi: ${ocrResult.indikasi}`,
      ocrResult.tanggalKadaluarsa && `Kadaluarsa: ${ocrResult.tanggalKadaluarsa}`,
      ocrResult.nomorRegistrasi && `No. Registrasi: ${ocrResult.nomorRegistrasi}`,
      ocrResult.produsen && `Produsen: ${ocrResult.produsen}`,
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
      fontSize: 12,
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
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginHorizontal: 16,
      marginBottom: 24,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    actionBtnPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    actionBtnTextPrimary: {
      color: "#FFFFFF",
    },
    scanAgainBtn: {
      marginHorizontal: 16,
      marginBottom: 12,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    scanAgainText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.muted,
    },
  });

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="xmark" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hasil Scan</Text>
        {ocrResult && (
          <TouchableOpacity onPress={handleCopyText}>
            <IconSymbol name="doc.on.doc" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Thumbnail Gambar (selalu tampil dari URI lokal dulu saat loading) */}
        {params.imageUri ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: params.imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {/* Animasi Loading Skeleton Premium */}
        {scanMutation.isPending && <LoadingSkeleton colors={colors} />}

        {/* ─── Peringatan: Bukan Label Obat ────────────────────────────── */}
        {ocrResult && !ocrResult.isLabelObat && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <View
              style={{
                backgroundColor: "#FFF7ED",
                borderWidth: 1.5,
                borderColor: "#FB923C",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "#FFEDD5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol
                  name="exclamationmark.triangle.fill"
                  size={28}
                  color="#EA580C"
                />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#9A3412",
                  textAlign: "center",
                }}
              >
                Bukan Label Obat
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#C2410C",
                  textAlign: "center",
                  lineHeight: 21,
                  paddingHorizontal: 8,
                }}
              >
                Peringatan: Objek yang terdeteksi bukan label obat. Silakan
                unggah gambar label obat yang valid.
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 4,
                  backgroundColor: "#EA580C",
                  paddingHorizontal: 28,
                  paddingVertical: 13,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
                onPress={() => router.back()}
              >
                <IconSymbol name="camera.fill" size={18} color="#FFFFFF" />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Scan Ulang
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hasil OCR */}
        {ocrResult?.isLabelObat && (
          <>
            <View style={styles.resultCard}>
              <View style={styles.namaObatCard}>
                <Text style={styles.namaObatLabel}>Nama Obat</Text>
                <Text style={styles.namaObatValue}>
                  {ocrResult.namaObat || "Tidak Terdeteksi"}
                </Text>
              </View>

              {OCR_FIELDS.filter(
                (f) => ocrResult[f.key]
              ).map((field, index, arr) => (
                <View
                  key={field.key}
                  style={[
                    styles.fieldRow,
                    index === arr.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={styles.fieldValue}>{ocrResult[field.key]}</Text>
                </View>
              ))}
            </View>

            {/* Raw Text */}
            {ocrResult.rawText ? (
              <View style={styles.rawTextCard}>
                <Text style={styles.rawTextTitle}>Teks Mentah (Raw OCR)</Text>
                <Text style={styles.rawText}>{ocrResult.rawText}</Text>
              </View>
            ) : null}

            {/* Primary AI Actions */}
            <View style={styles.primaryActionRow}>
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={async () => {
                  const id = await saveSilently();
                  if (id) {
                    router.push(`/chat/${id}`);
                  } else {
                    Alert.alert("Gagal", "Tidak dapat memulai chat.");
                  }
                }}
              >
                <IconSymbol name="message.fill" size={18} color="#FFFFFF" />
                <Text style={styles.chatBtnText}>Tanya Apoteker AI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reminderBtn}
                onPress={async () => {
                  const id = await saveSilently();
                  if (id) {
                    setIsReminderVisible(true);
                  } else {
                    Alert.alert("Gagal", "Tidak dapat memasang pengingat.");
                  }
                }}
              >
                <IconSymbol name="bell.fill" size={18} color={colors.primary} />
                <Text style={styles.reminderBtnText}>Pengingat</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCopyText}>
                <IconSymbol name="doc.on.doc" size={18} color={colors.primary} />
                <Text style={styles.actionBtnText}>Salin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.actionBtnPrimary,
                  isSaved && { opacity: 0.6 },
                ]}
                onPress={handleSaveToHistory}
                disabled={isSaved}
              >
                <IconSymbol
                  name={isSaved ? "checkmark.circle.fill" : "clock.fill"}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>
                  {isSaved ? "Tersimpan" : "Simpan"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scan Again */}
            <TouchableOpacity
              style={styles.scanAgainBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.scanAgainText}>Scan Ulang</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {ocrResult && (
        <ReminderModal
          visible={isReminderVisible}
          onClose={() => setIsReminderVisible(false)}
          namaObat={ocrResult.namaObat || "Obat"}
          dosisDefault={ocrResult.dosis || "1 Tablet"}
          onSchedule={handleScheduleReminder}
        />
      )}
    </ScreenContainer>
  );
}
