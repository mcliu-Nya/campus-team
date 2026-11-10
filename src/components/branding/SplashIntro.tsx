import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions } from 'react-native';

import { colors } from '@/constants/theme';

const LOGO = require('../../../assets/splash-icon.png');

/**
 * 启动动画：logo 先淡入，随后一圈底色从屏幕正中向外扩散铺满，再整体淡出交给 App。
 * 图片用 contain 固定比例显示，不做拉伸。
 */
export function SplashIntro() {
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(true);

  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [logoScale] = useState(() => new Animated.Value(0.72));
  const [circleScale] = useState(() => new Animated.Value(0));
  const [overlayOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // 扩散圆直径取屏幕对角线，保证铺满任意比例屏幕
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(circleScale, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 260,
          delay: 120,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.18,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) setVisible(false);
    });

    return () => animation.stop();
  }, [circleScale, logoOpacity, logoScale, overlayOpacity]);

  if (!visible) return null;

  const diameter = Math.hypot(width, height) * 1.15;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity: overlayOpacity }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.circle,
          {
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            marginLeft: -diameter / 2,
            marginTop: -diameter / 2,
            transform: [{ scale: circleScale }],
          },
        ]}
      />
      <Animated.View
        style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      >
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    zIndex: 100,
  },
  circle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    backgroundColor: colors.bg,
  },
  logoWrap: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 168,
    height: 168,
  },
});
