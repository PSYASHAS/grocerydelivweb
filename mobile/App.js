/**
 * FreshCart Mobile - React Native Application Root
 * RVCE CSE Skill Lab Capstone Project
 */

import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import CartScreen from './screens/CartScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';
import InventoryScreen from './screens/InventoryScreen';

// Change to your laptop's Wi-Fi IP address when testing on a physical phone with Expo Go
// e.g., 'http://192.168.1.15:5000'
const API_BASE_URL = 'http://10.0.2.2:5000'; // Standard Android Emulator localhost mapping

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'cart' | 'tracking' | 'inventory'
  const [cart, setCart] = useState({});
  const [activeOrder, setActiveOrder] = useState(null);

  const handleAddToCart = (product) => {
    const id = product.id || product._id;
    const currentQty = cart[id]?.quantity || 0;
    if (currentQty >= product.stockQuantity) return;
    setCart(prev => ({
      ...prev,
      [id]: { product, quantity: currentQty + 1 }
    }));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: { ...existing, quantity: existing.quantity - 1 }
      };
    });
  };

  const handleOrderPlaced = (order) => {
    setActiveOrder(order);
    setCart({});
    setCurrentScreen('tracking');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Mobile Bar */}
      <View style={styles.topBar}>
        <Text style={styles.brand}>🥬 FreshCart</Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.modeBtn, currentScreen === 'inventory' && styles.modeBtnActive]}
            onPress={() => setCurrentScreen(currentScreen === 'inventory' ? 'home' : 'inventory')}
          >
            <Text style={[styles.modeBtnText, currentScreen === 'inventory' && styles.modeBtnTextActive]}>
              {currentScreen === 'inventory' ? 'Catalog' : 'Inventory'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Routing */}
      {currentScreen === 'home' && (
        <HomeScreen
          apiBase={API_BASE_URL}
          cart={cart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onOpenCart={() => setCurrentScreen('cart')}
        />
      )}

      {currentScreen === 'cart' && (
        <CartScreen
          apiBase={API_BASE_URL}
          cart={cart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onOrderPlaced={handleOrderPlaced}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'tracking' && activeOrder && (
        <OrderTrackingScreen
          apiBase={API_BASE_URL}
          order={activeOrder}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'inventory' && (
        <InventoryScreen
          apiBase={API_BASE_URL}
          onBack={() => setCurrentScreen('home')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    height: 54,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  brand: { fontSize: 18, fontWeight: '800', color: '#059669' },
  topActions: { flexDirection: 'row' },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9'
  },
  modeBtnActive: { backgroundColor: '#10b981' },
  modeBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  modeBtnTextActive: { color: '#fff' }
});
