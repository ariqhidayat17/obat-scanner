import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { setImageBase64 } from "@/lib/image-store";
import { compressImageForOcr } from "@/lib/image-utils";

export default function CameraScreen() {
  const colors = useColors();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [isTaking, setIsTaking] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  if (Platform.OS === "web") {
    const handlePickFromGallery = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Izin Diperlukan: ObatScan memerlukan akses ke galeri foto.");
        return;
      }

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
          const compressed = await compressImageForOcr(asset.uri);
          setImageBase64(compressed.base64, compressed.mimeType);
          router.replace({
            pathname: "/result",
            params: { imageUri: compressed.uri },
          });
        } catch (err) {
          alert("Gagal memproses gambar. Coba lagi.");
          console.error("[Web Gallery] compress error:", err);
        } finally {
          setIsCompressing(false);
        }
      }
    };

    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background, padding: 32 }]}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.primary + "15",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16
        }}>
          <IconSymbol name="camera.fill" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.permissionTitle, { color: colors.foreground, fontSize: 22, fontWeight: "800" }]}>
          Kamera Tidak Didukung di Web
        </Text>
        <Text style={[styles.permissionDesc, { color: colors.muted, maxWidth: 320, lineHeight: 22, marginBottom: 12 }]}>
          Expo Camera tidak didukung penuh di browser web. Silakan pilih atau unggah foto label obat dari galeri Anda.
        </Text>
        
        <TouchableOpacity
          style={[styles.permissionBtn, { backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 32 }]}
          onPress={handlePickFromGallery}
          disabled={isCompressing}
        >
          {isCompressing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <IconSymbol name="photo" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.permissionBtnText}>
            {isCompressing ? "Memproses..." : "Pilih dari Galeri"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.backBtn, { marginTop: 8 }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backBtnText, { color: colors.muted, fontWeight: "600" }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <IconSymbol name="camera.fill" size={56} color={colors.muted} />
        <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
          Izin Kamera Diperlukan
        </Text>
        <Text style={[styles.permissionDesc, { color: colors.muted }]}>
          ObatScan memerlukan akses kamera untuk memotret label obat.
        </Text>
        <TouchableOpacity
          style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Izinkan Akses Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={[styles.backBtnText, { color: colors.muted }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTakePicture = async () => {
    if (isTaking || !cameraRef.current) return;
    setIsTaking(true);

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Ambil foto tanpa base64 — kompresi dan konversi dilakukan secara terpisah
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        base64: false,
        exif: false,
      });

      if (photo) {
        // Kompres gambar untuk menghemat bandwidth secara signifikan
        const compressed = await compressImageForOcr(photo.uri);
        // Simpan base64 ke memory store — BUKAN ke router params
        setImageBase64(compressed.base64, compressed.mimeType);
        router.push({
          pathname: "/result",
          params: { imageUri: compressed.uri },
        });
      }
    } catch (err) {
      console.error("Error taking picture:", err);
    } finally {
      setIsTaking(false);
    }
  };

  const toggleFacing = () => {
    setFacing((cur) => (cur === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((cur) => (cur === "off" ? "on" : "off"));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => router.back()}
          >
            <IconSymbol name="xmark" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Scan Label Obat</Text>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={toggleFlash}
          >
            <IconSymbol
              name={flash === "on" ? "bolt.fill" : "bolt.slash.fill"}
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Frame Overlay */}
        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.frameHint}>
            Posisikan label obat di dalam bingkai
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.flipBtn}
            onPress={toggleFacing}
          >
            <IconSymbol name="arrow.triangle.2.circlepath.camera" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shutterOuter, isTaking && styles.shutterTaking]}
            onPress={handleTakePicture}
            disabled={isTaking}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          <View style={{ width: 52 }} />
        </View>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  permissionDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  permissionBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  permissionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  backBtn: {
    padding: 12,
  },
  backBtnText: {
    fontSize: 15,
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  frameContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  frame: {
    width: 280,
    height: 180,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#FFFFFF",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },
  frameHint: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bottomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === "ios" ? 50 : 36,
    paddingTop: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  flipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterTaking: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },
});
