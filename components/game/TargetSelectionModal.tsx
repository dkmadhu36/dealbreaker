import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Pressable
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { GAME_COLORS, PlayerState, PropertySet, RENT_VALUES } from '@/constants/game';
import { CARDS_MAP, PROPERTY_COLORS } from '@/constants/cards';

type ActionType = 'debtCollector' | 'slyDeal' | 'forcedDeal' | 'dealBreaker' | 'rent' | 'wildRent';

interface TargetSelectionModalProps {
  visible: boolean;
  actionType: ActionType;
  opponents: PlayerState[];
  myProperties?: PropertySet[];
  onSelect: (targetPlayerId: string, targetCardId?: string, myCardId?: string, targetColor?: string) => void;
  onCancel: () => void;
}

interface PropertyInfo {
  cardId: string;
  playerId: string;
  playerName: string;
  color: string;
  name: string;
  value: number;
}

export function TargetSelectionModal({
  visible,
  actionType,
  opponents,
  myProperties = [],
  onSelect,
  onCancel,
}: TargetSelectionModalProps) {
  const [selectedMyCard, setSelectedMyCard] = useState<string | null>(null);
  const [step, setStep] = useState<'selectMyCard' | 'selectTheirCard' | 'selectPlayer' | 'selectColor'>('selectMyCard');
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null);

  const getTitle = () => {
    switch (actionType) {
      case 'debtCollector': return '💰 Debt Collector';
      case 'slyDeal': return '🎭 Sly Deal - Steal a Property';
      case 'forcedDeal': return '🔄 Forced Deal - Swap Properties';
      case 'dealBreaker': return '💥 Deal Breaker';
      case 'rent': return '🏠 Collect Rent';
      case 'wildRent': return '🌈 Wild Rent';
      default: return 'Select Target';
    }
  };

  const getDescription = () => {
    switch (actionType) {
      case 'debtCollector': return 'Choose a player to collect $5M from';
      case 'slyDeal': return 'Select any property from an opponent\'s incomplete set to steal';
      case 'forcedDeal':
        if (step === 'selectMyCard') return 'Step 1: Select YOUR property to give away';
        return 'Step 2: Select opponent\'s property to take in exchange';
      case 'dealBreaker': return 'Choose a complete set to steal';
      case 'rent': return 'All opponents will pay rent';
      case 'wildRent':
        if (step === 'selectPlayer') return 'Step 1: Choose ONE player to collect rent from';
        return 'Step 2: Select which property color to charge rent for';
      default: return '';
    }
  };

  const getRequiredSetSize = (color: string): number => {
    const sizes: Record<string, number> = {
      brown: 2, darkBlue: 2, utility: 2, railroad: 4,
      lightBlue: 3, pink: 3, orange: 3, red: 3, yellow: 3, green: 3
    };
    return sizes[color] || 3;
  };

  const getAllStealableProperties = useMemo((): PropertyInfo[] => {
    const properties: PropertyInfo[] = [];
    for (const opponent of opponents) {
      for (const propSet of opponent.properties) {
        const requiredSize = getRequiredSetSize(propSet.color);
        const isComplete = propSet.cards.length >= requiredSize;
        if (!isComplete) {
          for (const cardId of propSet.cards) {
            const card = CARDS_MAP[cardId];
            if (card) {
              properties.push({
                cardId,
                playerId: opponent.id,
                playerName: opponent.name,
                color: propSet.color,
                name: card.name,
                value: card.value,
              });
            }
          }
        }
      }
    }
    return properties;
  }, [opponents]);

  const getMyStealableProperties = useMemo((): PropertyInfo[] => {
    const properties: PropertyInfo[] = [];
    for (const propSet of myProperties) {
      const requiredSize = getRequiredSetSize(propSet.color);
      const isComplete = propSet.cards.length >= requiredSize;
      if (!isComplete) {
        for (const cardId of propSet.cards) {
          const card = CARDS_MAP[cardId];
          if (card) {
            properties.push({
              cardId,
              playerId: 'me',
              playerName: 'You',
              color: propSet.color,
              name: card.name,
              value: card.value,
            });
          }
        }
      }
    }
    return properties;
  }, [myProperties]);

  const getCompleteSets = useMemo(() => {
    const sets: { playerId: string; playerName: string; color: string; cards: string[] }[] = [];
    for (const opponent of opponents) {
      for (const propSet of opponent.properties) {
        const requiredSize = getRequiredSetSize(propSet.color);
        if (propSet.cards.length >= requiredSize) {
          sets.push({
            playerId: opponent.id,
            playerName: opponent.name,
            color: propSet.color,
            cards: propSet.cards,
          });
        }
      }
    }
    return sets;
  }, [opponents]);

  const groupedOpponentProperties = useMemo(() => {
    const grouped: Record<string, PropertyInfo[]> = {};
    for (const prop of getAllStealableProperties) {
      if (!grouped[prop.playerName]) {
        grouped[prop.playerName] = [];
      }
      grouped[prop.playerName].push(prop);
    }
    return grouped;
  }, [getAllStealableProperties]);

  const myPropertyColorsWithRent = useMemo(() => {
    const colors: { color: string; cardCount: number; rentAmount: number }[] = [];
    for (const propSet of myProperties) {
      const numCards = propSet.cards.length;
      if (numCards > 0) {
        const rentValues = RENT_VALUES[propSet.color as keyof typeof RENT_VALUES] || [];
        const rentIndex = Math.min(numCards - 1, rentValues.length - 1);
        const rent = rentValues[rentIndex] || 0;
        colors.push({
          color: propSet.color,
          cardCount: numCards,
          rentAmount: rent
        });
      }
    }
    return colors.sort((a, b) => b.rentAmount - a.rentAmount);
  }, [myProperties]);

  const handlePropertySelect = (prop: PropertyInfo) => {
    if (actionType === 'slyDeal') {
      onSelect(prop.playerId, prop.cardId);
      resetAndClose();
    } else if (actionType === 'forcedDeal') {
      if (step === 'selectMyCard') {
        setSelectedMyCard(prop.cardId);
        setStep('selectTheirCard');
      } else {
        onSelect(prop.playerId, prop.cardId, selectedMyCard!);
        resetAndClose();
      }
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    if (actionType === 'debtCollector') {
      onSelect(playerId);
      resetAndClose();
    } else if (actionType === 'wildRent') {
      setSelectedOpponentId(playerId);
      setStep('selectColor');
    }
  };

  const handleWildRentColorSelect = (color: string) => {
    if (selectedOpponentId) {
      onSelect(selectedOpponentId, undefined, undefined, color);
      resetAndClose();
    }
  };

  const handleCompleteSetSelect = (playerId: string, color: string) => {
    if (actionType === 'dealBreaker') {
      onSelect(playerId, undefined, undefined, color);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setSelectedMyCard(null);
    setSelectedOpponentId(null);
    setStep('selectMyCard');
  };

  const handleCancel = () => {
    resetAndClose();
    onCancel();
  };

  const handleBack = () => {
    if (step === 'selectTheirCard') {
      setSelectedMyCard(null);
      setStep('selectMyCard');
    } else if (step === 'selectColor') {
      setSelectedOpponentId(null);
      setStep('selectPlayer');
    }
  };

  React.useEffect(() => {
    if (visible && actionType === 'wildRent') {
      setStep('selectPlayer');
    } else if (visible && actionType === 'forcedDeal') {
      setStep('selectMyCard');
    }
  }, [visible, actionType]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View 
        entering={FadeIn} 
        exiting={FadeOut}
        style={styles.overlay}
      >
        <Animated.View 
          entering={SlideInDown}
          style={styles.modal}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.description}>{getDescription()}</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {actionType === 'debtCollector' && (
              <View style={styles.playerList}>
                {opponents.map(player => (
                  <TouchableOpacity
                    key={player.id}
                    style={styles.playerCard}
                    onPress={() => handlePlayerSelect(player.id)}
                  >
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerStats}>
                        {player.bankCount || player.bank?.length || 0} bank cards
                      </Text>
                    </View>
                    <Text style={styles.selectArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {actionType === 'slyDeal' && (
              <View style={styles.propertiesContainer}>
                {getAllStealableProperties.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🏠</Text>
                    <Text style={styles.emptyText}>
                      No eligible properties to steal
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Opponents only have complete property sets
                    </Text>
                  </View>
                ) : (
                  Object.entries(groupedOpponentProperties).map(([playerName, props]) => (
                    <View key={playerName} style={styles.playerSection}>
                      <Text style={styles.playerSectionTitle}>{playerName}</Text>
                      <View style={styles.propertyGrid}>
                        {props.map(prop => (
                          <TouchableOpacity
                            key={prop.cardId}
                            style={[
                              styles.propertyCard,
                              { borderColor: PROPERTY_COLORS[prop.color as keyof typeof PROPERTY_COLORS] || '#666' }
                            ]}
                            onPress={() => handlePropertySelect(prop)}
                          >
                            <View style={[
                              styles.propertyColorBar,
                              { backgroundColor: PROPERTY_COLORS[prop.color as keyof typeof PROPERTY_COLORS] || '#666' }
                            ]} />
                            <Text style={styles.propertyName} numberOfLines={1}>{prop.name}</Text>
                            <Text style={styles.propertyValue}>${prop.value}M</Text>
                            <Text style={styles.propertyColor}>{prop.color}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {actionType === 'forcedDeal' && step === 'selectMyCard' && (
              <View style={styles.propertiesContainer}>
                {getMyStealableProperties.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🏠</Text>
                    <Text style={styles.emptyText}>
                      You have no eligible properties to trade
                    </Text>
                    <Text style={styles.emptySubtext}>
                      You need at least one property from an incomplete set
                    </Text>
                  </View>
                ) : (
                  <View style={styles.playerSection}>
                    <Text style={styles.playerSectionTitle}>Your Properties</Text>
                    <View style={styles.propertyGrid}>
                      {getMyStealableProperties.map(prop => (
                        <TouchableOpacity
                          key={prop.cardId}
                          style={[
                            styles.propertyCard,
                            { borderColor: PROPERTY_COLORS[prop.color as keyof typeof PROPERTY_COLORS] || '#666' }
                          ]}
                          onPress={() => handlePropertySelect(prop)}
                        >
                          <View style={[
                            styles.propertyColorBar,
                            { backgroundColor: PROPERTY_COLORS[prop.color as keyof typeof PROPERTY_COLORS] || '#666' }
                          ]} />
                          <Text style={styles.propertyName} numberOfLines={1}>{prop.name}</Text>
                          <Text style={styles.propertyValue}>${prop.value}M</Text>
                          <Text style={styles.propertyColor}>{prop.color}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {actionType === 'forcedDeal' && step === 'selectTheirCard' && (
              <View style={styles.propertiesContainer}>
                <Pressable style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>← Change your selection</Text>
                </Pressable>
                
                {selectedMyCard && (
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedLabel}>Giving away:</Text>
                    <Text style={styles.selectedCard}>{CARDS_MAP[selectedMyCard]?.name}</Text>
                  </View>
                )}
                
                {getAllStealableProperties.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🏠</Text>
                    <Text style={styles.emptyText}>
                      No eligible properties to take
                    </Text>
                  </View>
                ) : (
                  Object.entries(groupedOpponentProperties).map(([playerName, props]) => (
                    <View key={playerName} style={styles.playerSection}>
                      <Text style={styles.playerSectionTitle}>{playerName}</Text>
                      <View style={styles.propertyGrid}>
                        {props.map(prop => (
                          <TouchableOpacity
                            key={prop.cardId}
                            style={[
                              styles.propertyCard,
                              { borderColor: PROPERTY_COLORS[prop.color as keyof typeof PROPERTY_COLORS] || '#666' }
                            ]}
                            onPress={() => handlePropertySelect(prop)}
                          >
                            <View style={[
                              styles.propertyColorBar,
                              { backgroundColor: PROPERTY_COLORS[prop.color as keyof typeof PROPERTY_COLORS] || '#666' }
                            ]} />
                            <Text style={styles.propertyName} numberOfLines={1}>{prop.name}</Text>
                            <Text style={styles.propertyValue}>${prop.value}M</Text>
                            <Text style={styles.propertyColor}>{prop.color}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {actionType === 'dealBreaker' && (
              <View style={styles.propertiesContainer}>
                {getCompleteSets.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🏆</Text>
                    <Text style={styles.emptyText}>
                      No complete property sets to steal
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Opponents have no complete sets yet
                    </Text>
                  </View>
                ) : (
                  getCompleteSets.map((set, index) => (
                    <TouchableOpacity
                      key={`${set.playerId}-${set.color}-${index}`}
                      style={[
                        styles.completeSetCard,
                        { borderLeftColor: PROPERTY_COLORS[set.color as keyof typeof PROPERTY_COLORS] || '#666' }
                      ]}
                      onPress={() => handleCompleteSetSelect(set.playerId, set.color)}
                    >
                      <View style={styles.setHeader}>
                        <Text style={styles.setPlayerName}>{set.playerName}</Text>
                        <View style={[
                          styles.setColorBadge,
                          { backgroundColor: PROPERTY_COLORS[set.color as keyof typeof PROPERTY_COLORS] || '#666' }
                        ]}>
                          <Text style={styles.setColorText}>{set.color.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={styles.setCards}>
                        {set.cards.map(cid => CARDS_MAP[cid]?.name || cid).join(' • ')}
                      </Text>
                      <View style={styles.completeBadge}>
                        <Text style={styles.completeBadgeText}>✓ COMPLETE SET</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {actionType === 'wildRent' && step === 'selectPlayer' && (
              <View style={styles.playerList}>
                {opponents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>👥</Text>
                    <Text style={styles.emptyText}>No opponents available</Text>
                  </View>
                ) : (
                  opponents.map(player => (
                    <TouchableOpacity
                      key={player.id}
                      style={styles.playerCard}
                      onPress={() => handlePlayerSelect(player.id)}
                    >
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <Text style={styles.playerStats}>
                          {player.bankCount || player.bank?.length || 0} bank cards • {player.properties?.length || 0} sets
                        </Text>
                      </View>
                      <Text style={styles.selectArrow}>→</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {actionType === 'wildRent' && step === 'selectColor' && (
              <View style={styles.propertiesContainer}>
                <Pressable style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>← Change opponent</Text>
                </Pressable>

                {selectedOpponentId && (
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedLabel}>Charging rent to:</Text>
                    <Text style={styles.selectedCard}>
                      {opponents.find(p => p.id === selectedOpponentId)?.name}
                    </Text>
                  </View>
                )}

                {myPropertyColorsWithRent.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>🏠</Text>
                    <Text style={styles.emptyText}>You have no properties</Text>
                    <Text style={styles.emptySubtext}>
                      Wild Rent will be added to your bank
                    </Text>
                  </View>
                ) : (
                  <View style={styles.colorSelectContainer}>
                    <Text style={styles.colorSelectTitle}>Select Property Color:</Text>
                    {myPropertyColorsWithRent.map(({ color, cardCount, rentAmount }) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorSelectCard,
                          { borderLeftColor: PROPERTY_COLORS[color as keyof typeof PROPERTY_COLORS] || '#666' }
                        ]}
                        onPress={() => handleWildRentColorSelect(color)}
                      >
                        <View style={[
                          styles.colorSelectBadge,
                          { backgroundColor: PROPERTY_COLORS[color as keyof typeof PROPERTY_COLORS] || '#666' }
                        ]}>
                          <Text style={styles.colorSelectBadgeText}>{color.toUpperCase()}</Text>
                        </View>
                        <View style={styles.colorSelectInfo}>
                          <Text style={styles.colorSelectCount}>{cardCount} cards</Text>
                          <Text style={styles.colorSelectRent}>Rent: ${rentAmount}M</Text>
                        </View>
                        <Text style={styles.selectArrow}>→</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    maxHeight: 450,
  },
  playerList: {
    gap: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playerStats: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  selectArrow: {
    color: GAME_COLORS.primary,
    fontSize: 20,
  },
  propertiesContainer: {
    gap: 16,
  },
  playerSection: {
    marginBottom: 16,
  },
  playerSectionTitle: {
    color: GAME_COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  propertyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  propertyCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  propertyColorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  propertyName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  propertyValue: {
    color: GAME_COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  propertyColor: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#AAA',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  backButtonText: {
    color: GAME_COLORS.secondary,
    fontSize: 14,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  selectedLabel: {
    color: '#FFA500',
    fontSize: 13,
  },
  selectedCard: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completeSetCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  setPlayerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  setColorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  setColorText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  setCards: {
    color: '#AAA',
    fontSize: 12,
    lineHeight: 18,
  },
  completeBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completeBadgeText: {
    color: GAME_COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: '500',
  },
  colorSelectContainer: {
    gap: 10,
  },
  colorSelectTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  colorSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  colorSelectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  colorSelectBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  colorSelectInfo: {
    flex: 1,
  },
  colorSelectCount: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  colorSelectRent: {
    color: GAME_COLORS.money,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
