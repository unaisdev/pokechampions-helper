import { useEffect, useRef, type ReactNode } from 'react';
import {
  InteractionManager,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const TAB_SWITCH_MS = 280;
/** Peek post-carga: recorre hasta la pestaña rival (p=1) sin cambiar la selección real. */
const PEEK_TO_RIVAL_MS = 420;
const PEEK_HOLD_ON_RIVAL_MS = 140;
const PEEK_RETURN_MS = 450;
/** Margen tras el commit de React para que columnas / pastilla tengan medidas antes del peek. */
const PEEK_AFTER_LAYOUT_MS = 520;

/** Entrada de la barra de pestañas (Nuestro equipo / Rival) desde abajo. */
const TAB_BAR_ENTER_MS = 400;
const TAB_BAR_ENTER_OFFSET_PX = 36;

/** Espacio entre las dos zonas de pestaña dentro de la pista medida. */
const TAB_SELECTION_GAP = 8;
const SELECTION_PILL_HEIGHT = 44;

function clamp01(v: number) {
  'worklet';
  return Math.min(1, Math.max(0, v));
}

const AnimatedText = Animated.createAnimatedComponent(Text);

type CompactTeamMobileShellProps = {
  contentWidth: number;
  tab: 'ours' | 'rival';
  onTabChange: (tab: 'ours' | 'rival') => void;
  /** Incrementado en BattleScanScreen al pasar de carga → listo (solo móvil / compacto). */
  peekSignal: number;
  oursLabel: string;
  rivalLabel: string;
  oursColumn: ReactNode;
  rivalColumn: ReactNode;
  tabBarPaddingBottom: number;
  scrollContentStyle: StyleProp<ViewStyle>;
  leadingScrollContent: ReactNode;
  trailingScrollContent: ReactNode;
  /** Se incrementa al pulsar «Probar» para desplazar el scroll hasta la zona de equipos. */
  scrollToTeamsRequestId: number;
};

export function CompactTeamMobileShell({
  contentWidth,
  tab,
  onTabChange,
  peekSignal,
  oursLabel,
  rivalLabel,
  oursColumn,
  rivalColumn,
  tabBarPaddingBottom,
  scrollContentStyle,
  leadingScrollContent,
  trailingScrollContent,
  scrollToTeamsRequestId,
}: CompactTeamMobileShellProps) {
  const { theme } = useUnistyles();
  const scrollRef = useRef<ScrollView>(null);
  const lastHandledScrollToTeamsRef = useRef(0);
  const tabTarget = useSharedValue(tab === 'ours' ? 0 : 1);
  const peekNudge = useSharedValue(0);
  const tabRowInnerWidth = useSharedValue(0);
  const tabBarReveal = useSharedValue(0);
  const rivalTabReveal = useSharedValue(0);

  const onTeamsScrollAreaLayout = (e: LayoutChangeEvent) => {
    if (scrollToTeamsRequestId <= lastHandledScrollToTeamsRef.current) {
      return;
    }
    lastHandledScrollToTeamsRef.current = scrollToTeamsRequestId;
    const y = e.nativeEvent.layout.y;
    InteractionManager.runAfterInteractions(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  };

  useEffect(() => {
    peekNudge.value = 0;
    tabTarget.value = withTiming(tab === 'ours' ? 0 : 1, {
      duration: TAB_SWITCH_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [tab]);

  useEffect(() => {
    tabBarReveal.value = 0;
    rivalTabReveal.value = 0;
    const easing = Easing.out(Easing.cubic);
    tabBarReveal.value = withTiming(1, { duration: TAB_BAR_ENTER_MS, easing });
    rivalTabReveal.value = withDelay(
      72,
      withTiming(1, { duration: TAB_BAR_ENTER_MS - 40, easing }),
    );
  }, [scrollToTeamsRequestId]);

  useEffect(() => {
    if (peekSignal < 1) {
      return;
    }
    const timer = setTimeout(() => {
      peekNudge.value = withSequence(
        withTiming(1, {
          duration: PEEK_TO_RIVAL_MS,
          easing: Easing.out(Easing.cubic),
        }),
        withDelay(
          PEEK_HOLD_ON_RIVAL_MS,
          withTiming(0, {
            duration: PEEK_RETURN_MS,
            easing: Easing.inOut(Easing.cubic),
          }),
        ),
      );
    }, PEEK_AFTER_LAYOUT_MS);
    return () => clearTimeout(timer);
  }, [peekSignal]);

  const slideStyle = useAnimatedStyle(() => {
    const p = clamp01(tabTarget.value + peekNudge.value);
    return {
      transform: [{ translateX: -p * contentWidth }],
    };
  }, [contentWidth]);

  const selectionPillStyle = useAnimatedStyle(() => {
    const p = clamp01(tabTarget.value + peekNudge.value);
    const w = tabRowInnerWidth.value;
    if (w <= 0) {
      return { opacity: 0 };
    }
    const pillW = (w - TAB_SELECTION_GAP) / 2;
    const tx = p * (pillW + TAB_SELECTION_GAP);
    return {
      opacity: 1,
      width: pillW,
      height: SELECTION_PILL_HEIGHT,
      transform: [{ translateX: tx }],
      backgroundColor: interpolateColor(p, [0, 1], [theme.colors.tabPillOurs, theme.colors.tabPillRival]),
    };
  }, [theme]);

  const oursLabelStyle = useAnimatedStyle(() => {
    const p = clamp01(tabTarget.value + peekNudge.value);
    return {
      color: interpolateColor(p, [0, 1], [theme.colors.oursAccent, theme.colors.tabLabelMuted]),
    };
  }, [theme]);

  const rivalLabelStyle = useAnimatedStyle(() => {
    const p = clamp01(tabTarget.value + peekNudge.value);
    return {
      color: interpolateColor(p, [0, 1], [theme.colors.tabLabelMuted, theme.colors.rivalAccent]),
    };
  }, [theme]);

  const tabBarEntranceStyle = useAnimatedStyle(() => {
    const t = tabBarReveal.value;
    return {
      opacity: t,
      transform: [{ translateY: (1 - t) * TAB_BAR_ENTER_OFFSET_PX }],
    };
  });

  const oursTabEntranceStyle = useAnimatedStyle(() => {
    const t = tabBarReveal.value;
    const slide = TAB_BAR_ENTER_OFFSET_PX * 0.5;
    return {
      opacity: t,
      transform: [{ translateY: (1 - t) * slide }],
    };
  });

  const rivalTabEntranceStyle = useAnimatedStyle(() => {
    const t = rivalTabReveal.value;
    const slide = TAB_BAR_ENTER_OFFSET_PX * 0.5;
    return {
      opacity: t,
      transform: [{ translateY: (1 - t) * slide }],
    };
  });

  return (
    <View style={styles.screenFill}>
      <ScrollView
        ref={scrollRef}
        style={styles.flex1}
        contentContainerStyle={scrollContentStyle}
        keyboardShouldPersistTaps="handled"
      >
        {leadingScrollContent}
        <View
          style={[styles.clip, { width: contentWidth }]}
          onLayout={onTeamsScrollAreaLayout}
        >
          <Animated.View style={[styles.row, { width: contentWidth * 2 }, slideStyle]}>
            <View style={[styles.columnSlot, { width: contentWidth }]}>{oursColumn}</View>
            <View style={[styles.columnSlot, { width: contentWidth }]}>{rivalColumn}</View>
          </Animated.View>
        </View>
        {trailingScrollContent}
      </ScrollView>

      <Animated.View
        style={[
          styles.teamTabBar,
          { paddingBottom: tabBarPaddingBottom },
          tabBarEntranceStyle,
        ]}
        accessibilityRole="tablist"
      >
        <View style={styles.tabBarPad}>
          <View
            style={styles.selectionTrack}
            onLayout={(e) => {
              tabRowInnerWidth.value = e.nativeEvent.layout.width;
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.selectionPill, selectionPillStyle]}
            />
            <View style={styles.tabsOverlay}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === 'ours' }}
                accessibilityLabel={oursLabel}
                onPress={() => onTabChange('ours')}
                style={styles.teamTabPressable}
              >
                <Animated.View style={[styles.teamTab, oursTabEntranceStyle]}>
                  <AnimatedText style={[styles.teamTabLabel, oursLabelStyle]} numberOfLines={1}>
                    {oursLabel}
                  </AnimatedText>
                </Animated.View>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === 'rival' }}
                accessibilityLabel={rivalLabel}
                onPress={() => onTabChange('rival')}
                style={styles.teamTabPressable}
              >
                <Animated.View style={[styles.teamTab, rivalTabEntranceStyle]}>
                  <AnimatedText style={[styles.teamTabLabel, rivalLabelStyle]} numberOfLines={1}>
                    {rivalLabel}
                  </AnimatedText>
                </Animated.View>
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screenFill: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  clip: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  columnSlot: {
    overflow: 'hidden',
  },
  teamTabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  tabBarPad: {
    paddingHorizontal: theme.space.sm,
    paddingTop: theme.space.sm,
  },
  selectionTrack: {
    height: SELECTION_PILL_HEIGHT,
    position: 'relative',
  },
  selectionPill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: theme.radius.lg,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadowStrong,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  tabsOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  teamTabPressable: {
    flex: 1,
  },
  teamTab: {
    flex: 1,
    paddingVertical: theme.space.mdLg,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  teamTabLabel: {
    fontSize: theme.fontSize.bodyLg,
    fontWeight: '800',
    textAlign: 'center',
  },
}));
