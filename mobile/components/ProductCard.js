/**
 * FreshCart Mobile - React Native Product Card Component
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function ProductCard({ product, inCartQty, onAdd, onRemove }) {
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;
  const price = product.discountPrice || product.price;

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        {product.discountPrice && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
            </Text>
          </View>
        )}
        <View style={[
          styles.stockTag,
          isOutOfStock ? styles.outOfStockTag : isLowStock ? styles.lowStockTag : styles.inStockTag
        ]}>
          <Text style={[
            styles.stockText,
            isOutOfStock ? styles.outOfStockText : isLowStock ? styles.lowStockText : styles.inStockText
          ]}>
            {isOutOfStock ? 'Sold Out' : isLowStock ? `${product.stockQuantity} Left` : 'In Stock'}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>₹{price}</Text>
            {product.discountPrice && (
              <Text style={styles.originalPrice}>₹{product.price}</Text>
            )}
          </View>

          {isOutOfStock ? (
            <View style={styles.disabledBtn}>
              <Text style={styles.disabledBtnText}>Unavailable</Text>
            </View>
          ) : inCartQty > 0 ? (
            <View style={styles.stepper}>
              <TouchableOpacity onPress={onRemove} style={styles.stepperBtn}>
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperQty}>{inCartQty}</Text>
              <TouchableOpacity onPress={onAdd} style={styles.stepperBtn}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#f1f5f9',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  stockTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  inStockTag: { backgroundColor: '#d1fae5' },
  lowStockTag: { backgroundColor: '#fef3c7' },
  outOfStockTag: { backgroundColor: '#fee2e2' },
  stockText: { fontSize: 9, fontWeight: '700' },
  inStockText: { color: '#065f46' },
  lowStockText: { color: '#92400e' },
  outOfStockText: { color: '#b91c1c' },
  details: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between'
  },
  category: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700'
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginVertical: 2
  },
  unit: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  originalPrice: {
    fontSize: 10,
    color: '#94a3b8',
    textDecorationLine: 'line-through'
  },
  addBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 6,
    padding: 2
  },
  stepperBtn: {
    backgroundColor: '#fff',
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepperBtnText: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 12
  },
  stepperQty: {
    paddingHorizontal: 6,
    fontWeight: '700',
    color: '#065f46',
    fontSize: 12
  },
  disabledBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  disabledBtnText: {
    color: '#94a3b8',
    fontSize: 10
  }
});
