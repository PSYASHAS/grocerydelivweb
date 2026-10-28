/**
 * FreshCart Mobile - Cart & Checkout Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';

export default function CartScreen({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onOrderPlaced,
  onBack,
  apiBase
}) {
  const [name, setName] = useState('Yashas');
  const [phone, setPhone] = useState('9876543210');
  const [address, setAddress] = useState('RVCE Campus, Mysuru Road, Bengaluru');
  const [paymentMode, setPaymentMode] = useState('COD');
  const [submitting, setSubmitting] = useState(false);

  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((acc, it) => {
    const price = it.product.discountPrice || it.product.price;
    return acc + price * it.quantity;
  }, 0);

  const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      Alert.alert('Empty Cart', 'Please add items before placing order.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customer: {
          name,
          phone,
          address: { street: address, city: 'Bengaluru', pincode: '560059' }
        },
        paymentMethod: paymentMode,
        items: cartItems.map(it => ({
          productId: it.product.id || it.product._id,
          name: it.product.name,
          quantity: it.quantity
        }))
      };

      const res = await fetch(`${apiBase}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      Alert.alert('Order Placed!', `Your tracking code is: ${data.data.orderNumber}`);
      onOrderPlaced(data.data);
    } catch (err) {
      Alert.alert('Checkout Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review Grocery Basket</Text>
      </View>

      {/* Cart Items List */}
      <View style={styles.section}>
        {cartItems.map(({ product, quantity }) => {
          const id = product.id || product._id;
          const price = product.discountPrice || product.price;

          return (
            <View key={id} style={styles.cartItem}>
              <Image source={{ uri: product.image }} style={styles.itemImg} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{product.name}</Text>
                <Text style={styles.itemUnit}>{product.unit}</Text>
                <Text style={styles.itemPrice}>₹{price * quantity}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => onRemoveFromCart(id)} style={styles.stepperBtn}>
                  <Text style={styles.stepperText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperQty}>{quantity}</Text>
                <TouchableOpacity onPress={() => onAddToCart(product)} style={styles.stepperBtn}>
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Delivery Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Customer Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={[styles.input, { height: 60 }]}
          placeholder="Address, Building, Landmark"
          multiline
          value={address}
          onChangeText={setAddress}
        />
      </View>

      {/* Bill Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill Breakdown</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Item Total</Text>
          <Text style={styles.rowVal}>₹{subtotal}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Delivery Partner Fee</Text>
          <Text style={styles.rowVal}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</Text>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>To Pay</Text>
          <Text style={styles.totalVal}>₹{grandTotal}</Text>
        </View>
      </View>

      {/* Place Order CTA */}
      <TouchableOpacity
        style={[styles.checkoutBtn, submitting && { opacity: 0.6 }]}
        disabled={submitting}
        onPress={handlePlaceOrder}
      >
        <Text style={styles.checkoutBtnText}>
          {submitting ? 'Placing Order...' : `Pay ₹${grandTotal} & Place Order`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 16, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { fontSize: 16, color: '#10b981', fontWeight: 'bold', marginRight: 16 },
  title: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  section: { backgroundColor: '#fff', padding: 16, marginTop: 10, borderRadius: 8, marginHorizontal: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10, color: '#1e293b' },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemImg: { width: 50, height: 50, borderRadius: 6, backgroundColor: '#f8fafc' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  itemUnit: { fontSize: 11, color: '#64748b' },
  itemPrice: { fontSize: 13, fontWeight: '800', color: '#059669', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', borderRadius: 6, padding: 2 },
  stepperBtn: { width: 22, height: 22, backgroundColor: '#fff', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  stepperText: { fontWeight: 'bold', color: '#065f46' },
  stepperQty: { paddingHorizontal: 8, fontWeight: 'bold', color: '#065f46' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  rowLabel: { fontSize: 13, color: '#64748b' },
  rowVal: { fontSize: 13, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 8, marginTop: 8 },
  totalLabel: { fontSize: 15, fontWeight: 'bold' },
  totalVal: { fontSize: 16, fontWeight: '800', color: '#059669' },
  checkoutBtn: { backgroundColor: '#10b981', margin: 16, padding: 16, borderRadius: 10, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});
