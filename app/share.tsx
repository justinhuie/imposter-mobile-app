import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ShareScreen() {
  const bgAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bgLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 6000, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 0, duration: 6000, useNativeDriver: false }),
      ])
    );

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

  const shareApp = async () => {
    await Share.share({
      message: "Check out Imposter! A fun party game 🎉",
    });
  };

  return (
    <Animated.View style={[styles.screen, { backgroundColor: bg }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.streakLayer, { transform: [{ translateX: streakTranslateX }] }]}
      >
        <View style={[styles.streak, styles.streak1]} />
        <View style={[styles.streak, styles.streak2]} />
        <View style={[styles.streak, styles.streak3]} />
        <View style={[styles.streak, styles.streak4]} />
      </Animated.View>

      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Share with Friends</Text>

        <View style={styles.card}>
          <Text style={styles.text}>
            Invite your friends to play Imposter together.
          </Text>

          <Pressable style={styles.primary} onPress={shareApp}>
            <Text style={styles.primaryText}>Share App</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  streak1: { top: 160, left: -40, width: 220, transform: [{ rotate: "-10deg" }] },
  streak2: { top: 300, left: 40, width: 280, transform: [{ rotate: "8deg" }] },
  streak3: { top: 440, left: -10, width: 180, transform: [{ rotate: "-6deg" }] },
  streak4: { top: 580, left: 80, width: 260, transform: [{ rotate: "12deg" }] },

  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    gap: 16,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  backText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "rgba(255,255,255,0.96)",
  },

  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 16,
  },

  text: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.78)",
    lineHeight: 20,
  },

  primary: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
  },
  primaryText: {
    color: "#0B0F14",
    fontSize: 16,
    fontWeight: "900",
  },
});
