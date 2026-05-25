import React from 'react';
import { View, ScrollView, StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GameCard } from '@/components/cards/GameCard';
import { GAME_COLORS } from '@/constants/game';
import { useGame } from '@/stores/GameContext';

const CARD_WIDTH = 75;
const OVERLAP_RATIO = 0.45;

export function PlayerHand() {
  const { myHand, selectedCard, selectCard, isMyTurn, gameState, discardCards } = useGame();
  const { width: screenWidth } = useWindowDimensions();
  
  const hasDrawn = gameState?.currentTurn?.cardsDrawn || false;
  const isActionPhase = gameState?.phase === 'action';
  const isDiscardPhase = gameState?.phase === 'discard';
  const canPlay = isMyTurn && isActionPhase && hasDrawn;
  const canDiscard = isMyTurn && isDiscardPhase;
  const canInteract = canPlay || canDiscard;
  
  const handExcess = myHand.length > 7 ? myHand.length - 7 : 0;

  const handleCardPress = (cardId: string) => {
    if (canDiscard) {
      if (selectedCard === cardId) {
        discardCards([cardId]);
        selectCard(null);
      } else {
        selectCard(cardId);
      }
    } else if (canPlay) {
      selectCard(selectedCard === cardId ? null : cardId);
    }
  };

  const getCardOffset = (index: number) => {
    const baseOffset = CARD_WIDTH * (1 - OVERLAP_RATIO);
    const selectedIndex = myHand.indexOf(selectedCard || '');
    
    if (selectedCard && selectedIndex !== -1) {
      if (index === selectedIndex) {
        return baseOffset * index;
      } else if (index === selectedIndex - 1 || index === selectedIndex + 1) {
        const direction = index < selectedIndex ? -8 : 8;
        return baseOffset * index + direction;
      }
    }
    return baseOffset * index;
  };

  const totalWidth = myHand.length > 0 
    ? CARD_WIDTH + (myHand.length - 1) * CARD_WIDTH * (1 - OVERLAP_RATIO) + 32
    : 0;
  const shouldCenter = totalWidth < screenWidth - 32;
  const CARD_HEIGHT = 105;
  const SELECTED_LIFT = 25;
  const SCALE_BONUS = 12;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, handExcess > 0 && styles.titleWarning]}>
            Your Hand
          </Text>
          <View style={[styles.countBadge, handExcess > 0 && styles.countBadgeWarning]}>
            <Text style={[styles.countText, handExcess > 0 && styles.countTextWarning]}>
              {myHand.length}
            </Text>
          </View>
        </View>
        {isDiscardPhase && (
          <Text style={styles.discardHint}>Tap to discard</Text>
        )}
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.handScrollView}
        contentContainerStyle={[
          styles.handContainer,
          shouldCenter && styles.handContainerCentered,
          { width: shouldCenter ? undefined : totalWidth }
        ]}
      >
        <View style={{ 
          height: CARD_HEIGHT + SELECTED_LIFT + SCALE_BONUS + 10, 
          width: totalWidth,
          paddingTop: SELECTED_LIFT + SCALE_BONUS,
        }}>
          {myHand.map((cardId, index) => (
            <AnimatedCardWrapper
              key={cardId}
              cardId={cardId}
              index={index}
              totalCards={myHand.length}
              isSelected={selectedCard === cardId}
              isPlayable={canInteract}
              offset={getCardOffset(index)}
              onPress={() => handleCardPress(cardId)}
            />
          ))}
        </View>
      </ScrollView>
      
      {isDiscardPhase && selectedCard && (
        <View style={styles.discardAction}>
          <Text style={styles.discardText}>Tap again to discard</Text>
        </View>
      )}
    </View>
  );
}

function AnimatedCardWrapper({
  cardId,
  index,
  totalCards,
  isSelected,
  isPlayable,
  offset,
  onPress,
}: {
  cardId: string;
  index: number;
  totalCards: number;
  isSelected: boolean;
  isPlayable: boolean;
  offset: number;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(offset, { damping: 15, stiffness: 150 }) },
    ],
    zIndex: isSelected ? totalCards + 1 : totalCards - index,
  }));

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <GameCard
        cardId={cardId}
        isSelected={isSelected}
        isPlayable={isPlayable}
        size="medium"
        onPress={onPress}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: GAME_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: GAME_COLORS.border,
    paddingTop: 8,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: GAME_COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  titleWarning: {
    color: '#FFA500',
  },
  countBadge: {
    backgroundColor: GAME_COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeWarning: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
  },
  countText: {
    color: GAME_COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  countTextWarning: {
    color: '#FFA500',
  },
  discardHint: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '500',
  },
  handScrollView: {
    overflow: 'visible',
  },
  handContainer: {
    paddingHorizontal: 16,
    overflow: 'visible',
  },
  handContainerCentered: {
    flex: 1,
    alignItems: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
  discardAction: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  discardText: {
    color: '#FFA500',
    fontSize: 11,
    textAlign: 'center',
  },
});
