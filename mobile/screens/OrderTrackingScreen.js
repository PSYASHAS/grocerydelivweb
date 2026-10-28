/**
 * FreshCart Mobile - Live Delivery Tracking Screen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const STEPS = ['Placed', 'Packing', 'Out for Delivery', 'Delivered'];

export default function OrderTrackingScreen({ order, onBack, apiBase }) {
  const [currentOrder, setCurrentOrder] = useState(order);

  const refreshStatus = async () => {
    try {
      const res = await fetch(`${apiBase}/api/orders/${order.orderNumber}`);
      const json = await res.json();
      if (json.data) setCurrentOrder(json.data);
    } catch (e) {}
  };

  useEffect(() => {
    const timer = setInterval(refreshStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  const activeIndex = STEPS.indexOf(currentOrder.orderStatus);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Store</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Track Package</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.orderNum}>Order #{currentOrder.orderNumber}</Text>
        <Text style={styles.estTime}>⚡ Arriving in 15-20 mins</Text>

        {/* Progress Stepper */}
        <View style={styles.stepperContainer}>
          {STEPS.map((step, idx) => {
            const isDone = activeIndex >= idx;
            const isCurrent = currentOrder.orderStatus === step;

            return (
              <View key={step} style={styles.stepRow}>
                <View style={[styles.circle, isDone && styles.circleDone, isCurrent && styles.circleCurrent]}>
                  <Text style={[styles.circleText, isDone && styles.circleTextDone]}>{isDone ? '✓' : idx + 1}</Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text style={[styles.stepText, isDone && styles.stepTextDone]}>{step}</Text>
                  {isCurrent && <Text style={styles.stepSub}>In progress right now</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Rider & OTP Box */}
        <View style={styles.otpBox}>
          <View>
            <Text style={styles.otpLabel}>Delivery Verification PIN</Text>
            <Text style={styles.otpVal}>{currentOrder.deliveryOtp || '4920'}</Text>
          </View>
          <View style={styles.riderTag}>
            <Text style={styles.riderText}>🛵 Rider: Ramesh K.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 16, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' },
  backBtn: { fontSize: 16, color: '#10b981', fontWeight: 'bold', marginRight: 16 },
  title: { fontSize: 16, fontWeight: '800' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 2 },
  orderNum: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  estTime: { fontSize: 18, fontWeight: '800', color: '#059669', marginVertical: 6 },
  stepperContainer: { marginVertical: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  circle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  circleDone: { backgroundColor: '#10b981' },
  circleCurrent: { borderWidth: 3, borderColor: '#a7f3d0' },
  circleText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  circleTextDone: { color: '#fff' },
  stepInfo: { marginLeft: 12 },
  stepText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  stepTextDone: { color: '#1e293b', fontWeight: 'bold' },
  stepSub: { fontSize: 11, color: '#10b981', fontWeight: '600' },
  otpBox: { backgroundColor: '#ecfdf5', padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  otpLabel: { fontSize: 10, color: '#065f46', fontWeight: '700' },
  otpVal: { fontSize: 20, fontWeight: '800', color: '#065f46', letterSpacing: 2 },
  riderTag: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  riderText: { fontSize: 12, fontWeight: '700', color: '#1e293b' }
});
