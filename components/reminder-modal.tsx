import { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { ReminderSchedule } from "@/lib/reminder";

interface ReminderModalProps {
  visible: boolean;
  onClose: () => void;
  namaObat: string;
  dosisDefault?: string;
  onSchedule: (schedule: ReminderSchedule) => void;
}

export function ReminderModal({
  visible,
  onClose,
  namaObat,
  dosisDefault = "1 Tablet",
  onSchedule,
}: ReminderModalProps) {
  const colors = useColors();

  const [dosis, setDosis] = useState(dosisDefault);
  const [frequency, setFrequency] = useState<1 | 2 | 3>(1);
  const [startHour, setStartHour] = useState<number>(8); // Default 08:00
  const [duration, setDuration] = useState<number>(7); // Default 7 hari

  const durations = [3, 5, 7, 14, 30];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleSubmit = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSchedule({
      namaObat,
      dosis,
      frequencyPerDay: frequency,
      startHour,
      durationDays: duration,
    });
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: Platform.OS === "ios" ? 40 : 24,
      maxHeight: "85%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.foreground,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    section: {
      marginBottom: 18,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.muted,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    freqRow: {
      flexDirection: "row",
      gap: 8,
    },
    freqCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    freqCardActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}10`,
    },
    freqText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.muted,
    },
    freqTextActive: {
      color: colors.primary,
      fontWeight: "700",
    },
    hoursScroll: {
      flexDirection: "row",
      paddingVertical: 4,
    },
    hourPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      marginRight: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    hourPillActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    hourText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
    },
    hourTextActive: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    durationRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    durationPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    durationPillActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}10`,
    },
    durationText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.muted,
    },
    durationTextActive: {
      color: colors.primary,
      fontWeight: "700",
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
    },
    submitBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.sheetContainer}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Pasang Pengingat Minum</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <IconSymbol name="xmark" size={16} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Dosis Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Aturan Dosis</Text>
                  <TextInput
                    style={styles.input}
                    value={dosis}
                    onChangeText={setDosis}
                    placeholder="misal: 1 Tablet, 2 Sendok Teh"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                {/* Frekuensi Per Hari */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Frekuensi Sehari</Text>
                  <View style={styles.freqRow}>
                    {([1, 2, 3] as const).map((f) => (
                      <TouchableOpacity
                        key={f}
                        style={[
                          styles.freqCard,
                          frequency === f && styles.freqCardActive,
                        ]}
                        onPress={async () => {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setFrequency(f);
                        }}
                      >
                        <Text
                          style={[
                            styles.freqText,
                            frequency === f && styles.freqTextActive,
                          ]}
                        >
                          {f}x Sehari
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Jam Pertama Mulai */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    Jam Pertama Minum (WIB)
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hoursScroll}
                  >
                    {hours.map((h) => {
                      const label = `${String(h).padStart(2, "0")}:00`;
                      const isActive = startHour === h;
                      return (
                        <TouchableOpacity
                          key={h}
                          style={[
                            styles.hourPill,
                            isActive && styles.hourPillActive,
                          ]}
                          onPress={async () => {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setStartHour(h);
                          }}
                        >
                          <Text
                            style={[
                              styles.hourText,
                              isActive && styles.hourTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Durasi Hari */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Durasi Pengingat</Text>
                  <View style={styles.durationRow}>
                    {durations.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.durationPill,
                          duration === d && styles.durationPillActive,
                        ]}
                        onPress={async () => {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setDuration(d);
                        }}
                      >
                        <Text
                          style={[
                            styles.durationText,
                            duration === d && styles.durationTextActive,
                          ]}
                        >
                          {d} Hari
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Submit */}
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <IconSymbol name="bell.fill" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Jadwalkan Notifikasi</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
