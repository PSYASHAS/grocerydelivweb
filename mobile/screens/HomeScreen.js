/**
 * FreshCart Mobile - Home Screen (Catalog & Search)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['All', 'Fruits & Vegetables', 'Dairy & Breakfast', 'Staples & Grains', 'Snacks & Drinks', 'Household & Personal'];

export default function HomeScreen({ apiBase, cart, onAddToCart, onRemoveFromCart, onOpenCart }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = `${apiBase}/api/products?${category !== 'All' ? `category=${encodeURIComponent(category)}&` : ''}${search ? `search=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      setProducts(json.data || []);
    } catch (err) {
      console.log('Mobile product fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, search]);

  const cartCount = Object.values(cart).reduce((s, it) => s + it.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search fresh groceries..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Category Horizontal Scroll */}
      <View style={styles.categoryBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, category === item && styles.categoryChipActive]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Product Grid */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Fetching Fresh Grocery Catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const id = item.id || item._id;
            const inCartQty = cart[id]?.quantity || 0;
            return (
              <ProductCard
                product={item}
                inCartQty={inCartQty}
                onAdd={() => onAddToCart(item)}
                onRemove={() => onRemoveFromCart(id)}
              />
            );
          }}
        />
      )}

      {/* Bottom Floating Cart Bar */}
      {cartCount > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={onOpenCart}>
          <View>
            <Text style={styles.floatingCartCount}>{cartCount} items selected</Text>
            <Text style={styles.floatingCartSub}>Tap to View Basket & Checkout</Text>
          </View>
          <Text style={styles.floatingCartBtn}>View Basket ➔</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchContainer: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1e293b'
  },
  categoryBar: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 6 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4
  },
  categoryChipActive: { backgroundColor: '#10b981' },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  categoryTextActive: { color: '#fff' },
  listContent: { padding: 6, paddingBottom: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 13 },
  floatingCart: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#059669',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    elevation: 6
  },
  floatingCartCount: { color: '#fff', fontWeight: '800', fontSize: 14 },
  floatingCartSub: { color: '#a7f3d0', fontSize: 11 },
  floatingCartBtn: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
