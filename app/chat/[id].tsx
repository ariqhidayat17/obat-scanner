import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type { ScanHistory } from "@/shared/ocr-types";

const HISTORY_KEY = "obatscan_history";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function ChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<ScanHistory | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Load data obat dari AsyncStorage
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) {
          const history: ScanHistory[] = JSON.parse(raw);
          const found = history.find((h) => h.id === id);
          if (found) {
            setItem(found);
            // Pesan sambutan awal dari apoteker AI
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: `Halo! Saya AI Apoteker ObatScan 👋\n\nSaya siap membantu Anda memahami **${found.result.namaObat || "obat ini"}**. Silakan tanyakan apa saja — misalnya:\n• Apakah aman untuk ibu hamil?\n• Bolehkah diminum bersama obat lain?\n• Apa efek samping yang perlu diwaspadai?`,
                timestamp: Date.now(),
              },
            ]);
          }
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [id]);

  const chatMutation = trpc.ocr.chat.useMutation({
    onSuccess: (data) => {
      const reply: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
    },
    onError: () => {
      const errMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    },
  });

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !item || chatMutation.isPending) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Kirim riwayat chat (kecuali pesan welcome) ke backend
    const chatHistory = newMessages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    chatMutation.mutate({
      drugContext: {
        namaObat: item.result.namaObat,
        komposisi: item.result.komposisi,
        dosis: item.result.dosis,
        indikasi: item.result.indikasi,
        kontraindikasi: item.result.kontraindikasi,
        efekSamping: item.result.efekSamping,
      },
      messages: chatHistory,
    });
  }, [inputText, item, messages, chatMutation]);

  // Auto-scroll ke bawah saat pesan baru masuk
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

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
    headerInfo: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.muted,
    },
    avatarBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    messageList: {
      flex: 1,
    },
    messageListContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 12,
    },
    bubbleRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },
    bubbleRowUser: {
      flexDirection: "row-reverse",
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    bubble: {
      maxWidth: "78%",
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    bubbleAssistant: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    bubbleUser: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleText: {
      fontSize: 14,
      lineHeight: 20,
    },
    bubbleTextAssistant: {
      color: colors.foreground,
    },
    bubbleTextUser: {
      color: "#FFFFFF",
    },
    typingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    typingText: {
      fontSize: 12,
      color: colors.muted,
      fontStyle: "italic",
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    input: {
      flex: 1,
      minHeight: 42,
      maxHeight: 120,
      backgroundColor: colors.surface,
      borderRadius: 21,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      opacity: 0.4,
    },
  });

  const renderMessage = ({ item: msg }: { item: ChatMessage }) => {
    const isUser = msg.role === "user";
    return (
      <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <IconSymbol name="cross.case.fill" size={14} color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
            {msg.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="xmark" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Apoteker</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {item?.result.namaObat || "Memuat..."}
          </Text>
        </View>
        <View style={styles.avatarBadge}>
          <IconSymbol name="cross.case.fill" size={18} color="#FFFFFF" />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Typing indicator */}
        {chatMutation.isPending && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.typingText}>AI Apoteker sedang mengetik...</Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Tanyakan tentang obat ini..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || chatMutation.isPending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || chatMutation.isPending}
          >
            <IconSymbol name="arrow.up" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
