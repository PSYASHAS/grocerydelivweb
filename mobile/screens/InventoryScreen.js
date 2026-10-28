/**
 * FreshCart Mobile - Admin Inventory & Low Stock Screen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

export default function InventoryScreen({ apiBase, onBack }) {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);

  const loadData = async () => {
    try {
      const [statsRes, prodRes] = await Promise.all([
        fetch(`${apiBase}/api/inventory/stats`),
        fetch(`${apiBase}/api/products`)
      ]);
      const statsJson = await statsRes.json();
      const prodJson = await prodRes.json();
      setStats(statsJson.data);
      setProducts(prodJson.data || []);
    } catch (e) {
      console.log('Mobile admin load error:', e.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRestock = async (productId) => {
    try {
      const res = await fetch(`${apiBase}/api/inventory/${productId}/restock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addQuantity: 15 })
      });
      if (res.ok) {
        Alert.alert('Restocked', '+15 units added successfully!');
        loadData();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to restock item');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Warehouse Inventory</Text>
      </View>

      {/* KPI Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.totalSKUs}</Text>
            <Text style={styles.statLabel}>Total SKUs</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#f59e0b' }]}>
            <Text style={[styles.statVal, { color: '#d97706' }]}>{stats.lowStockCount}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#ef4444' }]}>
            <Text style={[styles.statVal, { color: '#dc2626' }]}>{stats.outOfStockCount}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </View>
      )}

      {/* Low Stock List */}
      <Text style={styles.subHeader}>Stock Monitoring (&lt; 10 Units)</Text>
      <FlatList
        data={products.filter(p => p.stockQuantity < 10)}
        keyExtractor={(item) => item.id || item._id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCategory}>{item.category} • {item.unit}</Text>
              <Text style={styles.itemStock}>Remaining: {item.stockQuantity} units</Text>
            </View>
            <TouchableOpacity style={styles.restockBtn} onPress={() => handleRestock(item.id || item._id)}>
              <Text style={styles.restockText}>+15 Units</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 16, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backBtn: { fontSize: 16, color: '#10b981', fontWeight: 'bold', marginRight: 16 },
  title: { fontSize: 16, fontWeight: '800' },
  statsRow: { flexDirection: 'row', padding: 10, justifyContent: 'space-between' },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 10, margin: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  subHeader: { fontSize: 13, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 8, color: '#475569' },
  itemCard: { backgroundColor: '#fff', padding: 14, marginHorizontal: 12, marginVertical: 4, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  itemName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  itemCategory: { fontSize: 11, color: '#64748b' },
  itemStock: { fontSize: 11, fontWeight: 'bold', color: '#b45309', marginTop: 2 },
  restockBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  restockText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});
