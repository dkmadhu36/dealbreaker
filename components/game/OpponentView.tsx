import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { GAME_COLORS, type PlayerState, type PropertySet } from '@/constants/game';
import { CARDS_MAP, PROPERTY_COLORS } from '@/constants/cards';

interface OpponentViewProps {
  opponents: PlayerState[];
  currentPlayerId?: string;
}

export function OpponentView({ opponents, currentPlayerId }: OpponentViewProps) {
  const [selectedOpponent, setSelectedOpponent] = useState<PlayerState | null>(null);

  return (
    <>
      <ScrollView 
        style={styles.container} 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {opponents.map((opponent) => (
          <OpponentCard
            key={opponent.id}
            player={opponent}
            isCurrentTurn={opponent.id === currentPlayerId}
            onPress={() => setSelectedOpponent(opponent)}
          />
        ))}
      </ScrollView>

      <OpponentDetailModal
        visible={selectedOpponent !== null}
        player={selectedOpponent}
        onClose={() => setSelectedOpponent(null)}
      />
    </>
  );
}

function OpponentCard({ 
  player, 
  isCurrentTurn, 
  onPress 
}: { 
  player: PlayerState; 
  isCurrentTurn: boolean;
  onPress: () => void;
}) {
  const handCount = typeof player.hand === 'number' ? player.hand : player.hand.length;
  const bankCount = player.bankCount ?? player.bank.length;

  const completeSets = player.properties.filter((set) => {
    const required = { brown: 2, darkBlue: 2, utility: 2, railroad: 4 }[set.color] || 3;
    return set.cards.length >= required;
  }).length;

  return (
    <TouchableOpacity 
      style={[styles.opponentCard, isCurrentTurn && styles.currentTurn]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with name and turn indicator */}
      <View style={styles.opponentHeader}>
        <View style={[styles.connectionDot, player.isConnected && styles.connected]} />
        <Text style={[styles.opponentName, isCurrentTurn && styles.opponentNameActive]} numberOfLines={1}>
          {player.name}
        </Text>
        {isCurrentTurn && <Text style={styles.turnBadge}>⚡</Text>}
      </View>

      {/* Inline stats */}
      <View style={styles.statsRow}>
        <Text style={styles.statItem}>🃏{handCount}</Text>
        <Text style={styles.statDivider}>·</Text>
        <Text style={styles.statItem}>💰{bankCount}</Text>
        <Text style={styles.statDivider}>·</Text>
        <Text style={[styles.statItem, completeSets >= 3 && styles.statWin]}>🏠{completeSets}/3</Text>
      </View>

      {/* Property color dots */}
      <View style={styles.propertiesRow}>
        {player.properties.slice(0, 6).map((set, index) => {
          const required = { brown: 2, darkBlue: 2, utility: 2, railroad: 4 }[set.color] || 3;
          const isComplete = set.cards.length >= required;
          return (
            <View
              key={`${set.color}-${index}`}
              style={[
                styles.propertyDot,
                { backgroundColor: PROPERTY_COLORS[set.color as keyof typeof PROPERTY_COLORS] || '#666' },
                isComplete && styles.propertyDotComplete,
              ]}
            />
          );
        })}
        {player.properties.length > 6 && (
          <Text style={styles.moreText}>+{player.properties.length - 6}</Text>
        )}
        {player.properties.length === 0 && (
          <Text style={styles.noProps}>No props</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function OpponentDetailModal({ 
  visible, 
  player, 
  onClose 
}: { 
  visible: boolean; 
  player: PlayerState | null; 
  onClose: () => void;
}) {
  if (!player) return null;

  const handCount = typeof player.hand === 'number' ? player.hand : player.hand.length;
  const bankCount = player.bankCount ?? player.bank.length;

  const getRequiredSetSize = (color: string): number => {
    const sizes: Record<string, number> = {
      brown: 2, darkBlue: 2, utility: 2, railroad: 4,
      lightBlue: 3, pink: 3, orange: 3, red: 3, yellow: 3, green: 3
    };
    return sizes[color] || 3;
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View 
        entering={FadeIn} 
        exiting={FadeOut}
        style={styles.modalOverlay}
      >
        <Animated.View 
          entering={SlideInDown}
          style={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{player.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.playerStats}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxIcon}>🃏</Text>
              <Text style={styles.statBoxValue}>{handCount}</Text>
              <Text style={styles.statBoxLabel}>Cards in hand</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxIcon}>💰</Text>
              <Text style={styles.statBoxValue}>{bankCount}</Text>
              <Text style={styles.statBoxLabel}>Bank cards</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxIcon}>🏠</Text>
              <Text style={styles.statBoxValue}>
                {player.properties.filter(s => s.cards.length >= getRequiredSetSize(s.color)).length}/3
              </Text>
              <Text style={styles.statBoxLabel}>Complete sets</Text>
            </View>
          </View>

          <ScrollView style={styles.propertiesSection}>
            <Text style={styles.sectionTitle}>Property Sets</Text>
            
            {player.properties.length === 0 ? (
              <Text style={styles.emptyText}>No properties yet</Text>
            ) : (
              player.properties.map((set, index) => (
                <PropertySetCard 
                  key={`${set.color}-${index}`} 
                  propertySet={set}
                  getRequiredSetSize={getRequiredSetSize}
                />
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function PropertySetCard({ 
  propertySet, 
  getRequiredSetSize 
}: { 
  propertySet: PropertySet;
  getRequiredSetSize: (color: string) => number;
}) {
  const requiredSize = getRequiredSetSize(propertySet.color);
  const isComplete = propertySet.cards.length >= requiredSize;
  const colorHex = PROPERTY_COLORS[propertySet.color as keyof typeof PROPERTY_COLORS] || '#666';

  return (
    <View style={[styles.propertySetCard, { borderLeftColor: colorHex }]}>
      <View style={styles.propertySetHeader}>
        <Text style={[styles.propertySetTitle, { color: colorHex }]}>
          {propertySet.color.toUpperCase()}
        </Text>
        <View style={styles.propertySetBadges}>
          {isComplete && (
            <View style={[styles.completeBadge, { backgroundColor: colorHex }]}>
              <Text style={styles.completeBadgeText}>Complete!</Text>
            </View>
          )}
          {propertySet.house && <Text style={styles.buildingBadge}>🏠</Text>}
          {propertySet.hotel && <Text style={styles.buildingBadge}>🏨</Text>}
        </View>
      </View>
      <Text style={styles.propertyCount}>
        {propertySet.cards.length}/{requiredSize} cards needed
      </Text>
      <View style={styles.propertyCardsList}>
        {propertySet.cards.map((cardId) => {
          const card = CARDS_MAP[cardId];
          return (
            <View key={cardId} style={styles.propertyCardItem}>
              <Text style={styles.propertyCardName}>{card?.name || cardId}</Text>
              <Text style={styles.propertyCardValue}>${card?.value || 0}M</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 90,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
  },
  opponentCard: {
    backgroundColor: GAME_COLORS.surfaceLight,
    borderRadius: 10,
    padding: 8,
    minWidth: 110,
    maxWidth: 130,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  currentTurn: {
    borderColor: GAME_COLORS.accent,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    shadowColor: GAME_COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  opponentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GAME_COLORS.danger,
  },
  connected: {
    backgroundColor: GAME_COLORS.primary,
  },
  opponentName: {
    color: GAME_COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  opponentNameActive: {
    color: GAME_COLORS.accent,
  },
  turnBadge: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  statItem: {
    color: GAME_COLORS.textSecondary,
    fontSize: 10,
  },
  statDivider: {
    color: GAME_COLORS.border,
    fontSize: 10,
  },
  statWin: {
    color: GAME_COLORS.primary,
    fontWeight: '600',
  },
  propertiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  propertyDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  propertyDotComplete: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  moreText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 9,
  },
  noProps: {
    color: GAME_COLORS.textSecondary,
    fontSize: 9,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#AAA',
    fontSize: 20,
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statBoxIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statBoxLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  propertiesSection: {
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
  propertySetCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  propertySetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  propertySetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  propertySetBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  completeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  buildingBadge: {
    fontSize: 14,
  },
  propertyCount: {
    color: '#888',
    fontSize: 11,
    marginBottom: 8,
  },
  propertyCardsList: {
    gap: 4,
  },
  propertyCardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  propertyCardName: {
    color: '#FFF',
    fontSize: 12,
  },
  propertyCardValue: {
    color: '#4CAF50',
    fontSize: 12,
  },
  doneButton: {
    backgroundColor: GAME_COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  doneText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
