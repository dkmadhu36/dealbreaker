import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Alert 
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { GAME_COLORS, PaymentInfo } from '@/constants/game';
import { PROPERTY_COLORS } from '@/constants/cards';

interface PaymentModalProps {
  visible: boolean;
  paymentInfo: PaymentInfo | null;
  fromPlayerName: string;
  actionType: string;
  onPay: (cardIds: string[]) => void;
  onUseJustSayNo?: () => void;
  hasJustSayNo: boolean;
}

export function PaymentModal({ 
  visible, 
  paymentInfo, 
  fromPlayerName,
  actionType,
  onPay,
  onUseJustSayNo,
  hasJustSayNo
}: PaymentModalProps) {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const selectedValue = useMemo(() => {
    return selectedCards.reduce((total, cardId) => {
      const card = paymentInfo?.payable_cards.find(c => c.id === cardId);
      return total + (card?.value || 0);
    }, 0);
  }, [selectedCards, paymentInfo]);

  const toggleCard = (cardId: string) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handlePay = () => {
    if (!paymentInfo) return;

    if (paymentInfo.total_available === 0) {
      onPay([]);
      return;
    }

    if (selectedValue < paymentInfo.required_amount && selectedValue < paymentInfo.total_available) {
      Alert.alert(
        'Insufficient Payment',
        `You selected $${selectedValue}M but need to pay $${paymentInfo.required_amount}M.\n\n` +
        `You have $${paymentInfo.total_available}M available. ` +
        (paymentInfo.can_pay_full 
          ? 'Please select enough cards to cover the full amount.'
          : 'You must pay with all your available cards since you cannot cover the full amount.'),
        [{ text: 'OK' }]
      );
      return;
    }

    onPay(selectedCards);
    setSelectedCards([]);
  };

  const handlePayAll = () => {
    if (!paymentInfo) return;
    const allCardIds = paymentInfo.payable_cards.map(c => c.id);
    onPay(allCardIds);
    setSelectedCards([]);
  };

  if (!paymentInfo) return null;

  const getActionDescription = () => {
    switch (actionType) {
      case 'RENT': return 'is charging rent';
      case 'BIRTHDAY': return 'is celebrating their birthday';
      case 'DEBT_COLLECTOR': return 'sent a debt collector';
      default: return 'demands payment';
    }
  };

  const bankCards = paymentInfo.payable_cards.filter(c => c.source === 'bank');
  const propertyCards = paymentInfo.payable_cards.filter(c => c.source === 'property');

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
            <Text style={styles.title}>💰 Payment Required</Text>
            <Text style={styles.subtitle}>
              {fromPlayerName} {getActionDescription()}
            </Text>
          </View>

          <View style={styles.amountRow}>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Required</Text>
              <Text style={styles.amountValue}>${paymentInfo.required_amount}M</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Selected</Text>
              <Text style={[
                styles.amountValue, 
                selectedValue >= paymentInfo.required_amount && styles.amountSufficient
              ]}>
                ${selectedValue}M
              </Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Available</Text>
              <Text style={styles.amountValue}>${paymentInfo.total_available}M</Text>
            </View>
          </View>

          {paymentInfo.total_available === 0 ? (
            <View style={styles.noAssetsContainer}>
              <Text style={styles.noAssetsText}>
                You have no money or property cards on the table.
              </Text>
              <Text style={styles.noAssetsSubtext}>
                You cannot pay anything this time!
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.cardList}>
              {bankCards.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💵 Bank Cards</Text>
                  {bankCards.map(card => (
                    <TouchableOpacity
                      key={card.id}
                      style={[
                        styles.cardItem,
                        selectedCards.includes(card.id) && styles.cardSelected
                      ]}
                      onPress={() => toggleCard(card.id)}
                    >
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>{card.name}</Text>
                        <Text style={styles.cardValue}>${card.value}M</Text>
                      </View>
                      <View style={[
                        styles.checkbox,
                        selectedCards.includes(card.id) && styles.checkboxSelected
                      ]}>
                        {selectedCards.includes(card.id) && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {propertyCards.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🏠 Property Cards</Text>
                  <Text style={styles.sectionWarning}>
                    ⚠️ Properties will be transferred to the collector!
                  </Text>
                  {propertyCards.map(card => {
                    const colorCode = card.color ? PROPERTY_COLORS[card.color as keyof typeof PROPERTY_COLORS] : '#888';
                    return (
                      <TouchableOpacity
                        key={card.id}
                        style={[
                          styles.cardItem,
                          { borderLeftColor: colorCode, borderLeftWidth: 4 },
                          selectedCards.includes(card.id) && styles.cardSelected
                        ]}
                        onPress={() => toggleCard(card.id)}
                      >
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardName}>{card.name}</Text>
                          <Text style={styles.cardValue}>${card.value}M</Text>
                        </View>
                        <View style={[
                          styles.checkbox,
                          selectedCards.includes(card.id) && styles.checkboxSelected
                        ]}>
                          {selectedCards.includes(card.id) && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}

          {!paymentInfo.can_pay_full && paymentInfo.total_available > 0 && (
            <View style={styles.insufficientNote}>
              <Text style={styles.insufficientText}>
                {"💡 You don't have enough to pay the full amount. You'll need to pay what you can."}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            {hasJustSayNo && onUseJustSayNo && (
              <TouchableOpacity
                style={styles.justSayNoButton}
                onPress={onUseJustSayNo}
              >
                <Text style={styles.justSayNoText}>🚫 Just Say No!</Text>
              </TouchableOpacity>
            )}
            
            {paymentInfo.total_available > 0 && (
              <TouchableOpacity
                style={styles.payAllButton}
                onPress={handlePayAll}
              >
                <Text style={styles.payAllText}>Pay All (${paymentInfo.total_available}M)</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.payButton,
                (paymentInfo.total_available === 0 || 
                  (selectedValue >= paymentInfo.required_amount) || 
                  (selectedValue >= paymentInfo.total_available && !paymentInfo.can_pay_full)) && 
                  styles.payButtonActive
              ]}
              onPress={handlePay}
              disabled={
                paymentInfo.total_available > 0 && 
                selectedValue === 0
              }
            >
              <Text style={styles.payButtonText}>
                {paymentInfo.total_available === 0 
                  ? "Can't Pay (Continue)" 
                  : `Pay $${selectedValue}M`}
              </Text>
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
    maxHeight: '85%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  amountLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  amountSufficient: {
    color: '#4CAF50',
  },
  noAssetsContainer: {
    padding: 30,
    alignItems: 'center',
  },
  noAssetsText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  noAssetsSubtext: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '500',
  },
  cardList: {
    maxHeight: 280,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  sectionWarning: {
    fontSize: 11,
    color: '#FFA500',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    marginBottom: 8,
  },
  cardSelected: {
    backgroundColor: 'rgba(76,175,80,0.2)',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  insufficientNote: {
    backgroundColor: 'rgba(255,165,0,0.1)',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  insufficientText: {
    fontSize: 12,
    color: '#FFA500',
    textAlign: 'center',
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  justSayNoButton: {
    backgroundColor: '#9C27B0',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  justSayNoText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  payAllButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  payAllText: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '500',
  },
  payButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonActive: {
    backgroundColor: GAME_COLORS.primary,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
