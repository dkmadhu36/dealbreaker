import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { GAME_COLORS } from '@/constants/game';
import { CARDS_MAP, PROPERTY_COLORS } from '@/constants/cards';

interface ActionResponseModalProps {
  visible: boolean;
  actionType: string;
  fromPlayerName: string;
  targetProperty?: string;
  giverProperty?: string;
  targetSet?: string;
  hasJustSayNo: boolean;
  onAccept: () => void;
  onUseJustSayNo: () => void;
}

export function ActionResponseModal({
  visible,
  actionType,
  fromPlayerName,
  targetProperty,
  giverProperty,
  targetSet,
  hasJustSayNo,
  onAccept,
  onUseJustSayNo,
}: ActionResponseModalProps) {
  const getTitle = () => {
    switch (actionType) {
      case 'slyDeal': return '🎭 Sly Deal!';
      case 'forcedDeal': return '🔄 Forced Deal!';
      case 'dealBreaker': return '💥 Deal Breaker!';
      default: return 'Action Against You';
    }
  };

  const getDescription = () => {
    const propName = targetProperty ? CARDS_MAP[targetProperty]?.name : 'your property';
    const giverPropName = giverProperty ? CARDS_MAP[giverProperty]?.name : 'their property';
    
    switch (actionType) {
      case 'slyDeal':
        return `${fromPlayerName} wants to steal "${propName}" from you!`;
      case 'forcedDeal':
        return `${fromPlayerName} wants to swap "${giverPropName}" for your "${propName}"!`;
      case 'dealBreaker':
        return `${fromPlayerName} wants to steal your complete ${targetSet?.toUpperCase()} property set!`;
      default:
        return `${fromPlayerName} is using an action card against you.`;
    }
  };

  const getPropertyColor = (propertyId?: string): string => {
    if (!propertyId) return '#666';
    const card = CARDS_MAP[propertyId];
    if (!card) return '#666';
    const color = card.color || (card.colors?.[0]);
    return PROPERTY_COLORS[color as keyof typeof PROPERTY_COLORS] || '#666';
  };

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
          <View style={styles.alertIcon}>
            <Text style={styles.alertEmoji}>⚠️</Text>
          </View>

          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.description}>{getDescription()}</Text>

          {actionType === 'forcedDeal' && targetProperty && giverProperty && (
            <View style={styles.swapPreview}>
              <View style={[styles.swapCard, { borderColor: getPropertyColor(targetProperty) }]}>
                <Text style={styles.swapLabel}>You Lose</Text>
                <Text style={styles.swapCardName}>{CARDS_MAP[targetProperty]?.name}</Text>
              </View>
              <Text style={styles.swapArrow}>⇄</Text>
              <View style={[styles.swapCard, styles.swapCardGain, { borderColor: getPropertyColor(giverProperty) }]}>
                <Text style={styles.swapLabel}>You Get</Text>
                <Text style={styles.swapCardName}>{CARDS_MAP[giverProperty]?.name}</Text>
              </View>
            </View>
          )}

          {actionType === 'slyDeal' && targetProperty && (
            <View style={styles.lossPreview}>
              <View style={[styles.lossCard, { borderColor: getPropertyColor(targetProperty) }]}>
                <Text style={styles.lossLabel}>You will lose:</Text>
                <Text style={styles.lossCardName}>{CARDS_MAP[targetProperty]?.name}</Text>
              </View>
            </View>
          )}

          {actionType === 'dealBreaker' && targetSet && (
            <View style={styles.lossPreview}>
              <View style={[styles.lossCard, { borderColor: PROPERTY_COLORS[targetSet as keyof typeof PROPERTY_COLORS] || '#666' }]}>
                <Text style={styles.lossLabel}>You will lose your complete set:</Text>
                <Text style={styles.lossCardName}>{targetSet.toUpperCase()} Properties</Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            {hasJustSayNo && (
              <TouchableOpacity 
                style={[styles.button, styles.justSayNoButton]}
                onPress={onUseJustSayNo}
              >
                <Text style={styles.justSayNoText}>🛑 Use Just Say No!</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
            >
              <Text style={styles.acceptText}>
                {hasJustSayNo ? 'Accept Anyway' : 'Accept'}
              </Text>
            </TouchableOpacity>
          </View>

          {!hasJustSayNo && (
            <Text style={styles.noJSNHint}>
              You don&apos;t have a Just Say No card to block this action.
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  alertIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  swapPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  swapCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  swapCardGain: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  swapLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  swapCardName: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  swapArrow: {
    fontSize: 20,
    color: '#FFF',
  },
  lossPreview: {
    width: '100%',
    marginBottom: 24,
  },
  lossCard: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  lossLabel: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 8,
  },
  lossCardName: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  justSayNoButton: {
    backgroundColor: '#B71C1C',
  },
  justSayNoText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  acceptText: {
    color: '#AAA',
    fontSize: 16,
  },
  noJSNHint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
