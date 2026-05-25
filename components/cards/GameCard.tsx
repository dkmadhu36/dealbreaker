import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CARDS_MAP, PROPERTY_COLORS, ACTION_CARD_COLORS, ACTION_CARD_ICONS, type Card, type PropertyColor } from '@/constants/cards';
import { GAME_COLORS } from '@/constants/game';

interface GameCardProps {
  cardId: string;
  isSelected?: boolean;
  isPlayable?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  onLongPress?: () => void;
  showBack?: boolean;
}

const CARD_SIZES = {
  small: { width: 60, height: 84 },
  medium: { width: 75, height: 105 },
  large: { width: 110, height: 154 },
};

export function GameCard({
  cardId,
  isSelected = false,
  isPlayable = true,
  size = 'medium',
  onPress,
  onLongPress,
  showBack = false,
}: GameCardProps) {
  const card = CARDS_MAP[cardId];
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.1);
      translateY.value = withSpring(-20);
    } else {
      scale.value = withSpring(1);
      translateY.value = withSpring(0);
    }
  }, [isSelected, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.1 : 1);
  };

  const dimensions = CARD_SIZES[size];

  if (showBack || !card) {
    return (
      <Animated.View style={[styles.cardBack, dimensions, animatedStyle]}>
        <View style={styles.cardBackInner}>
          <Text style={styles.cardBackText}>M</Text>
          <Text style={styles.cardBackSubtext}>DEAL</Text>
        </View>
      </Animated.View>
    );
  }

  const getCardColor = () => {
    if (card.type === 'property' && card.color) {
      return PROPERTY_COLORS[card.color as PropertyColor];
    }
    if (card.type === 'wildcard' && card.colors && card.colors.length <= 2) {
      return PROPERTY_COLORS[card.colors[0] as PropertyColor];
    }
    if (card.type === 'action' && card.actionType) {
      return ACTION_CARD_COLORS[card.actionType];
    }
    if (card.type === 'rent') {
      return '#673AB7';
    }
    if (card.type === 'money') {
      return GAME_COLORS.money;
    }
    return GAME_COLORS.surfaceLight;
  };

  const renderCardContent = () => {
    switch (card.type) {
      case 'property':
        return <PropertyCardContent card={card} size={size} />;
      case 'action':
        return <ActionCardContent card={card} size={size} />;
      case 'money':
        return <MoneyCardContent card={card} size={size} />;
      case 'rent':
        return <RentCardContent card={card} size={size} />;
      case 'wildcard':
        return <WildcardContent card={card} size={size} />;
      default:
        return <Text style={styles.actionName}>{card.name}</Text>;
    }
  };

  const is2ColorWildcard = card.type === 'wildcard' && card.colors && card.colors.length === 2;

  const renderHeader = () => {
    if (is2ColorWildcard && card.colors) {
      const color1 = PROPERTY_COLORS[card.colors[0] as PropertyColor];
      const color2 = PROPERTY_COLORS[card.colors[1] as PropertyColor];
      return (
        <View style={styles.splitHeader}>
          <View style={[styles.splitHeaderHalf, { backgroundColor: color1 }]} />
          <View style={[styles.splitHeaderHalf, { backgroundColor: color2 }]} />
          <View style={styles.splitHeaderOverlay}>
            <Text style={styles.cardValue}>${card.value}M</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.cardHeader, { backgroundColor: getCardColor() }]}>
        <Text style={styles.cardValue}>${card.value}M</Text>
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!isPlayable}
    >
      <Animated.View
        style={[
          styles.card,
          dimensions,
          { opacity: isPlayable ? 1 : 0.5 },
          isSelected && styles.cardSelected,
          animatedStyle,
        ]}
      >
        {renderHeader()}
        <View style={styles.cardBody}>{renderCardContent()}</View>
      </Animated.View>
    </Pressable>
  );
}

function PropertyCardContent({ card, size }: { card: Card; size: string }) {
  const isSmall = size === 'small';
  return (
    <View style={styles.propertyContent}>
      <Text style={[styles.propertyName, isSmall && styles.smallText]} numberOfLines={2}>
        {card.name}
      </Text>
      {!isSmall && card.rentValues && (
        <View style={styles.rentInfo}>
          <Text style={styles.rentLabel}>Rent:</Text>
          {card.rentValues.map((rent, i) => (
            <Text key={i} style={styles.rentValue}>
              {i + 1}: ${rent}M
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function ActionCardContent({ card, size }: { card: Card; size: string }) {
  const isSmall = size === 'small';
  const icon = card.actionType ? ACTION_CARD_ICONS[card.actionType] : '⚡';
  return (
    <View style={styles.actionContent}>
      <Text style={[styles.actionIcon, isSmall && { fontSize: 20 }]}>{icon}</Text>
      <Text style={[styles.actionName, isSmall && styles.smallText]} numberOfLines={2}>
        {card.name}
      </Text>
    </View>
  );
}

function MoneyCardContent({ card, size }: { card: Card; size: string }) {
  const isSmall = size === 'small';
  return (
    <View style={styles.moneyContent}>
      <Text style={[styles.moneyValue, isSmall && { fontSize: 18 }]}>
        ${card.value}M
      </Text>
      <Text style={[styles.moneyLabel, isSmall && styles.smallText]}>MILLION</Text>
    </View>
  );
}

function RentCardContent({ card, size }: { card: Card; size: string }) {
  const isSmall = size === 'small';
  const colors = card.colors || [];
  const isWildRent = colors.length > 2;
  
  if (isWildRent) {
    return (
      <View style={styles.rentContent}>
        <Text style={[styles.wildRentIcon, isSmall && { fontSize: 14 }]}>🌈</Text>
        <Text style={[styles.wildRentTitle, isSmall && styles.smallText]}>WILD</Text>
        {!isSmall && (
          <>
            <View style={styles.wildRentColorGrid}>
              {colors.slice(0, 10).map((color, i) => (
                <View
                  key={i}
                  style={[styles.wildRentColorSquare, { backgroundColor: PROPERTY_COLORS[color as PropertyColor] }]}
                />
              ))}
            </View>
            <Text style={styles.wildRentHint}>Any Color</Text>
          </>
        )}
      </View>
    );
  }
  
  return (
    <View style={styles.rentContent}>
      <Text style={[styles.rentIcon, isSmall && { fontSize: 20 }]}>💵</Text>
      <Text style={[styles.rentTitle, isSmall && styles.smallText]}>RENT</Text>
      {!isSmall && colors.length <= 2 && (
        <View style={styles.rentColors}>
          {colors.map((color, i) => (
            <View
              key={i}
              style={[styles.colorDot, { backgroundColor: PROPERTY_COLORS[color as PropertyColor] }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function WildcardContent({ card, size }: { card: Card; size: string }) {
  const isSmall = size === 'small';
  const colors = card.colors || [];
  const isMultiColor = colors.length > 2;
  const is2Color = colors.length === 2;

  return (
    <View style={styles.wildcardContent}>
      <Text style={[styles.wildcardIcon, isSmall && { fontSize: 16 }]}>
        {isMultiColor ? '🌈' : '⇄'}
      </Text>
      <Text style={[styles.wildcardTitle, isSmall && styles.smallText]}>WILD</Text>
      {!isSmall && is2Color && (
        <View style={styles.wildcardColorBar}>
          <View style={[styles.colorHalf, { backgroundColor: PROPERTY_COLORS[colors[0] as PropertyColor] }]} />
          <View style={[styles.colorHalf, { backgroundColor: PROPERTY_COLORS[colors[1] as PropertyColor] }]} />
        </View>
      )}
      {!isSmall && isMultiColor && (
        <Text style={styles.wildcardSubtext}>10 Colors</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GAME_COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: GAME_COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  cardSelected: {
    borderColor: GAME_COLORS.accent,
    borderWidth: 2,
    shadowColor: GAME_COLORS.accent,
    shadowOpacity: 0.4,
  },
  cardHeader: {
    height: '22%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 5,
  },
  splitHeader: {
    flexDirection: 'row',
    height: '22%',
    position: 'relative',
    overflow: 'hidden',
  },
  splitHeaderHalf: {
    flex: 1,
    height: '100%',
  },
  splitHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 5,
  },
  cardValue: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 9,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardBody: {
    flex: 1,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    backgroundColor: GAME_COLORS.cardBack,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2A4A6F',
  },
  cardBackInner: {
    alignItems: 'center',
  },
  cardBackText: {
    color: GAME_COLORS.accent,
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardBackSubtext: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '600',
    marginTop: -2,
  },
  propertyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyName: {
    color: GAME_COLORS.text,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 10,
  },
  rentInfo: {
    marginTop: 3,
  },
  rentLabel: {
    color: GAME_COLORS.textSecondary,
    fontSize: 7,
    textAlign: 'center',
  },
  rentValue: {
    color: GAME_COLORS.text,
    fontSize: 6,
    textAlign: 'center',
  },
  actionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 22,
  },
  actionName: {
    color: GAME_COLORS.text,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  moneyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moneyValue: {
    color: GAME_COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  moneyLabel: {
    color: GAME_COLORS.textSecondary,
    fontSize: 7,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  rentContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rentIcon: {
    fontSize: 22,
  },
  rentTitle: {
    color: GAME_COLORS.text,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  rentColors: {
    flexDirection: 'row',
    marginTop: 3,
    gap: 2,
  },
  wildRentIcon: {
    fontSize: 16,
  },
  wildRentTitle: {
    color: GAME_COLORS.text,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  wildRentColorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 3,
    gap: 2,
    maxWidth: 55,
  },
  wildRentColorSquare: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  wildRentHint: {
    color: GAME_COLORS.textSecondary,
    fontSize: 6,
    marginTop: 2,
  },
  wildcardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wildcardIcon: {
    fontSize: 22,
  },
  wildcardTitle: {
    color: GAME_COLORS.text,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  wildcardColors: {
    flexDirection: 'row',
    marginTop: 3,
    gap: 2,
  },
  wildcardColorBar: {
    flexDirection: 'row',
    width: '80%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  colorHalf: {
    flex: 1,
    height: '100%',
  },
  wildcardSubtext: {
    color: GAME_COLORS.textSecondary,
    fontSize: 8,
    marginTop: 2,
  },
  colorDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  smallText: {
    fontSize: 6,
  },
});
