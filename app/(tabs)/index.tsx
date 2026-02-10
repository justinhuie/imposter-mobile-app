import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const bgAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bgLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 6000, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 0, duration: 6000, useNativeDriver: false }),
      ])
    );

    // continuous streak motion
    streakAnim.setValue(0);
    const streakLoop = Animated.loop(
      Animated.timing(streakAnim, {
        toValue: 1000,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    bgLoop.start();
    streakLoop.start();

    return () => {
      bgLoop.stop();
      streakLoop.stop();
    };
  }, [bgAnim, streakAnim]);

  const bg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#0B0F14", "#151B22"],
  });

  const streakTranslateX = streakAnim.interpolate({
    inputRange: [0, 1000],
    outputRange: [-300, 300],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg }]}>
      {/* streaks */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.streakLayer,
          { transform: [{ translateX: streakTranslateX }] },
        ]}
      >
        <View style={[styles.streak, styles.streak1]} />
        <View style={[styles.streak, styles.streak2]} />
        <View style={[styles.streak, styles.streak3]} />
        <View style={[styles.streak, styles.streak4]} />
      </Animated.View>

      <View style={styles.topBar}>
        <Pressable onPress={() => router.push("/app-settings")} hitSlop={10}>
          <Text style={styles.link}>Settings</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>Imposter!</Text>
        <Text style={styles.subtitle}>Someone is lying.</Text>
      </View>

      <View style={styles.bottom}>
        <Pressable style={styles.primary} onPress={() => router.push("/get-started")}>
          <Text style={styles.primaryText}>Get Started</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={() => router.push("/how-to-play")}>
          <Text style={styles.secondaryText}>How to Play</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    overflow: "hidden",
  },

  streakLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },

  streak: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  streak1: { top: 120, left: -40, width: 220, transform: [{ rotate: "-10deg" }] },
  streak2: { top: 240, left: 40, width: 280, transform: [{ rotate: "8deg" }] },
  streak3: { top: 380, left: -10, width: 180, transform: [{ rotate: "-6deg" }] },
  streak4: { top: 520, left: 80, width: 260, transform: [{ rotate: "12deg" }] },

  topBar: {
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 8,
  },

  bottom: {
    paddingBottom: 10,
    gap: 12,
  },

  // 🔴 Title now red
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "#E11D48", // red (rose-600)
    letterSpacing: 0.5,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },

  link: {
    fontSize: 16,
    fontWeight: "900",
    color: "rgba(255,255,255,0.88)",
  },

  primary: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
  },
  primaryText: { color: "#0B0F14", fontSize: 18, fontWeight: "900" },

  secondary: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  secondaryText: { color: "rgba(255,255,255,0.92)", fontSize: 18, fontWeight: "900" },
});
