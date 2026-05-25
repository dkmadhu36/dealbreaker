import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { GAME_COLORS } from '@/constants/game';
import { CARDS_MAP } from '@/constants/cards';

interface BankAreaProps {
  bank: string[];
  isCurrentPlayer?: boolean;
}

export function BankArea({ bank, isCurrentPlayer = false }: BankAreaProps) {
  const totalValue = bank.reduce((sum, cardId) => {
    const card = CARDS_MAP[cardId];
    return sum + (card?.value || 0);
  }, 0);

  const groupedCards = bank.reduce((acc, cardId) => {
    const card = CARDS_MAP[cardId];
    if (card) {
      const key = `${card.value}`;
      if (!acc[key]) {
        acc[key] = { value: card.value, count: 0 };
      }
      acc[key].count++;
    }
    return acc;
  }, {} as Record<string, { value: number; count: number }>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Bank</Text>
        <Text style={styles.total}>${totalValue}M</Text>
      </View>
      <View style={styles.cardsContainer}>
        {Object.entries(groupedCards)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([value, data]) => (
            <View key={value} style={styles.moneyStack}>
              <View style={[styles.moneyCard, { opacity: 0.8 + data.count * 0.05 }]}>
                <Text style={styles.moneyValue}>${data.value}M</Text>
              </View>
              {data.count > 1 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>x{data.count}</Text>
                </View>
              )}
            </View>
          ))}
        {bank.length === 0 && (
          <Text style={styles.emptyText}>Empty</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: GAME_COLORS.surfaceLight,
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: GAME_COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  total: {
    color: GAME_COLORS.money,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  moneyStack: {
    position: 'relative',
  },
  moneyCard: {
    backgroundColor: GAME_COLORS.money,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  moneyValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: GAME_COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  countText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  emptyText: {
    color: GAME_COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
