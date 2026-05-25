import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { GAME_COLORS } from '@/constants/game';

const TIMER_DURATION = 60;
const CIRCLE_SIZE = 44;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TurnTimerProps {
  isMyTurn: boolean;
  onTimeout: () => void;
  resetKey?: string;
  isPaused?: boolean;
}

export function TurnTimer({ isMyTurn, onTimeout, resetKey, isPaused = false }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCalledTimeout = useRef(false);

  const handleTimeout = useCallback(() => {
    try {
      onTimeout();
    } catch (err) {
      console.error('Error in timeout handler:', err);
    }
  }, [onTimeout]);

  useEffect(() => {
    setTimeLeft(TIMER_DURATION);
    hasCalledTimeout.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [resetKey, isMyTurn]);

  useEffect(() => {
    if (!isMyTurn || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        
        if (next <= 0 && !hasCalledTimeout.current) {
          hasCalledTimeout.current = true;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTimeout(() => handleTimeout(), 100);
          return 0;
        }
        
        return Math.max(0, next);
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMyTurn, isPaused, handleTimeout]);

  const getTimerColor = () => {
    if (timeLeft > 20) return GAME_COLORS.primary;
    if (timeLeft > 10) return '#FFA500';
    return '#FF4444';
  };

  const progress = timeLeft / TIMER_DURATION;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  if (!isMyTurn) {
    return (
      <View style={styles.container}>
        <View style={styles.circleContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <G rotation="-90" origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}>
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />
            </G>
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={styles.waitingIcon}>⏳</Text>
          </View>
        </View>
        <Text style={styles.statusText}>Waiting</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isPaused && styles.containerPaused]}>
      <View style={styles.circleContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          <G rotation="-90" origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}>
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={isPaused ? '#FFC107' : getTimerColor()}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <View style={styles.timerTextContainer}>
          {isPaused ? (
            <Text style={styles.pausedIcon}>⏸</Text>
          ) : (
            <Text style={[styles.timerText, { color: getTimerColor() }]}>
              {timeLeft}
            </Text>
          )}
        </View>
      </View>
      <Text style={[styles.statusText, timeLeft <= 10 && !isPaused && styles.statusWarning]}>
        {isPaused ? 'Paused' : 'Your turn'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  containerPaused: {
    opacity: 0.8,
  },
  circleContainer: {
    position: 'relative',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  waitingIcon: {
    fontSize: 16,
  },
  pausedIcon: {
    fontSize: 14,
    color: '#FFC107',
  },
  statusText: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: '500',
  },
  statusWarning: {
    color: '#FF4444',
  },
});
