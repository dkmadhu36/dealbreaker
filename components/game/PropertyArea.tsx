import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { GameCard } from '@/components/cards/GameCard';
import { GAME_COLORS, type PropertySet } from '@/constants/game';
import { PROPERTY_COLORS, SET_SIZES, CARDS_MAP, type PropertyColor } from '@/constants/cards';
import { useGame } from '@/stores/GameContext';

interface PropertyAreaProps {
  properties: PropertySet[];
  isCurrentPlayer?: boolean;
  playerName?: string;
}

export function PropertyArea({ properties, isCurrentPlayer = false, playerName }: PropertyAreaProps) {
  const { moveWildcard } = useGame();
  const [selectedWildcard, setSelectedWildcard] = useState<{cardId: string; fromColor: string; colors: string[]} | null>(null);

  const handleWildcardPress = (cardId: string, fromColor: string) => {
    if (!isCurrentPlayer) return;
    
    const card = CARDS_MAP[cardId];
    if (card?.type !== 'wildcard') return;
    
    const colors = card.colors || [];
    if (colors.length <= 1) return;
    
    setSelectedWildcard({ cardId, fromColor, colors });
  };

  const handleMoveWildcard = async (toColor: string) => {
    if (!selectedWildcard) return;
    await moveWildcard(selectedWildcard.cardId, selectedWildcard.fromColor, toColor);
    setSelectedWildcard(null);
  };

  return (
    <View style={styles.container}>
      {playerName && (
        <Text style={styles.playerName}>{playerName}&apos;s Properties</Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.setsContainer}>
          {properties.map((set, index) => (
            <PropertySetView 
              key={`${set.color}-${index}`} 
              set={set} 
              isCurrentPlayer={isCurrentPlayer}
              onWildcardPress={handleWildcardPress}
            />
          ))}
          {properties.length === 0 && (
            <Text style={styles.emptyText}>No properties</Text>
          )}
        </View>
      </ScrollView>
      
      <Modal
        visible={!!selectedWildcard}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWildcard(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedWildcard(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Move Wildcard</Text>
            <Text style={styles.modalSubtitle}>Select destination color:</Text>
            <View style={styles.colorOptions}>
              {selectedWildcard?.colors
                .filter(c => c !== selectedWildcard.fromColor)
                .map(color => (
                  <Pressable
                    key={color}
                    style={[styles.colorOption, { backgroundColor: PROPERTY_COLORS[color as PropertyColor] }]}
                    onPress={() => handleMoveWildcard(color)}
                  >
                    <Text style={styles.colorOptionText}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </Text>
                  </Pressable>
                ))}
            </View>
            <Pressable style={styles.cancelButton} onPress={() => setSelectedWildcard(null)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function PropertySetView({ 
  set, 
  isCurrentPlayer,
  onWildcardPress 
}: { 
  set: PropertySet; 
  isCurrentPlayer: boolean;
  onWildcardPress: (cardId: string, fromColor: string) => void;
}) {
  const requiredSize = SET_SIZES[set.color as PropertyColor] || 3;
  const isComplete = set.cards.length >= requiredSize;
  const color = PROPERTY_COLORS[set.color as PropertyColor] || '#666';
  
  const wildcards: string[] = [];
  const regularCards: string[] = [];
  
  set.cards.forEach(cardId => {
    const card = CARDS_MAP[cardId];
    if (card?.type === 'wildcard') {
      wildcards.push(cardId);
    } else {
      regularCards.push(cardId);
    }
  });

  return (
    <View style={styles.setContainer}>
      <View style={[styles.setHeader, { backgroundColor: color }]}>
        <Text style={styles.setTitle}>
          {set.color.charAt(0).toUpperCase() + set.color.slice(1)}
        </Text>
        <Text style={styles.setCount}>
          {set.cards.length}/{requiredSize}
          {isComplete && ' ✓'}
        </Text>
      </View>
      
      {wildcards.length > 0 && (
        <View style={styles.wildcardsRow}>
          {wildcards.map((cardId) => (
            <Pressable 
              key={cardId} 
              style={styles.wildcardWrapper}
              onPress={() => isCurrentPlayer && onWildcardPress(cardId, set.color)}
            >
              <GameCard cardId={cardId} size="small" isPlayable={isCurrentPlayer} />
              {isCurrentPlayer && <Text style={styles.moveHint}>Tap to move</Text>}
            </Pressable>
          ))}
        </View>
      )}
      
      <View style={styles.setCards}>
        {regularCards.slice(0, 4).map((cardId, index) => (
          <View key={cardId} style={[styles.stackedCard, { marginTop: index * 15 }]}>
            <GameCard cardId={cardId} size="small" isPlayable={false} />
          </View>
        ))}
      </View>
      {(set.house || set.hotel) && (
        <View style={styles.buildings}>
          {set.house && <Text style={styles.buildingIcon}>🏠</Text>}
          {set.hotel && <Text style={styles.buildingIcon}>🏨</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  playerName: {
    color: GAME_COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  setsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 12,
  },
  setContainer: {
    backgroundColor: GAME_COLORS.surfaceLight,
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
  },
  setHeader: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  setTitle: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  setCount: {
    color: '#FFF',
    fontSize: 9,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  wildcardsRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 4,
  },
  wildcardWrapper: {
    alignItems: 'center',
  },
  moveHint: {
    color: GAME_COLORS.accent,
    fontSize: 7,
    marginTop: 2,
    textAlign: 'center',
  },
  setCards: {
    position: 'relative',
    minHeight: 84,
  },
  stackedCard: {
    position: 'absolute',
    left: 0,
  },
  buildings: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
  },
  buildingIcon: {
    fontSize: 16,
  },
  emptyText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: GAME_COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    color: GAME_COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: GAME_COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  colorOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  colorOptionText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 14,
  },
});
