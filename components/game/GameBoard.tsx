import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import { GAME_COLORS } from '@/constants/game';
import { useGame } from '@/stores/GameContext';
import { GameCard } from '@/components/cards/GameCard';

export function GameBoard() {
  const { gameState, drawCards, isMyTurn } = useGame();
  const pulseAnim = useSharedValue(1);

  React.useEffect(() => {
    const canDraw = isMyTurn && gameState?.phase === 'draw' && !gameState?.currentTurn?.cardsDrawn;
    if (canDraw) {
      pulseAnim.value = withRepeat(
        withTiming(1.05, { duration: 800 }),
        -1,
        true
      );
    } else {
      pulseAnim.value = 1;
    }
  }, [isMyTurn, gameState?.phase, gameState?.currentTurn?.cardsDrawn, pulseAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  if (!gameState) return null;

  const canDraw = isMyTurn && gameState.phase === 'draw' && !gameState.currentTurn?.cardsDrawn;

  return (
    <View style={styles.container}>
      <View style={styles.pilesContainer}>
        {/* Draw Pile */}
        <Pressable onPress={canDraw ? drawCards : undefined}>
          <Animated.View style={[styles.pile, canDraw && animatedStyle]}>
            <View style={[styles.pileWrapper, canDraw && styles.pileWrapperActive]}>
              <GameCard cardId="" showBack size="small" />
              <View style={styles.pileCount}>
                <Text style={styles.pileCountText}>{gameState.drawPileCount}</Text>
              </View>
            </View>
            <Text style={[styles.pileLabel, canDraw && styles.pileLabelActive]}>
              {canDraw ? 'Tap to draw' : 'Draw'}
            </Text>
          </Animated.View>
        </Pressable>

        {/* Discard Pile */}
        <View style={styles.pile}>
          <View style={styles.pileWrapper}>
            {gameState.discardPile.length > 0 ? (
              <GameCard
                cardId={gameState.discardPile[gameState.discardPile.length - 1]}
                size="small"
                isPlayable={false}
              />
            ) : (
              <View style={styles.emptyPile}>
                <Text style={styles.emptyText}>Empty</Text>
              </View>
            )}
          </View>
          <Text style={styles.pileLabel}>Discard</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  pilesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  pile: {
    alignItems: 'center',
  },
  pileWrapper: {
    position: 'relative',
    borderRadius: 10,
    padding: 4,
  },
  pileWrapperActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderWidth: 1,
    borderColor: GAME_COLORS.secondary,
    borderStyle: 'dashed',
  },
  pileCount: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: GAME_COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  pileCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyPile: {
    width: 60,
    height: 84,
    backgroundColor: GAME_COLORS.surfaceLight,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 10,
  },
  pileLabel: {
    color: GAME_COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  pileLabelActive: {
    color: GAME_COLORS.secondary,
    fontWeight: '600',
  },
});
