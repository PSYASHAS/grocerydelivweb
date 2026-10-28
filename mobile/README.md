# 📱 FreshCart Mobile - React Native Application

A companion mobile application for **FreshCart Grocery Delivery**, built with **React Native** and **Expo**. It directly consumes the same Node.js REST API backend.

---

## 🚀 Quick Setup & Run

### 1. Prerequisites
- Node.js installed on your machine
- Expo CLI or `npx expo`
- [Expo Go app](https://expo.dev/go) installed on your Android or iOS phone (available on Google Play Store / Apple App Store)

### 2. Configure Backend API URL
Open `mobile/App.js` and set `API_BASE_URL`:
- **For Android Emulator**: `http://10.0.2.2:5000`
- **For iOS Simulator**: `http://localhost:5000`
- **For Physical Phone (Expo Go)**: `http://<YOUR_COMPUTER_LOCAL_IP>:5000` (e.g. `http://192.168.1.15:5000` — find via `ipconfig` on Windows)

### 3. Start Expo Development Server
```bash
cd mobile
npm install
npx expo start
```

### 4. Open on Device
- Scan the displayed QR Code with the **Expo Go** app on Android or the Camera app on iOS.
- Or press `a` for Android Emulator / `i` for iOS Simulator.

---

## 📱 Mobile Screens Included
1. **Catalog & Search (`HomeScreen.js`)**: Horizontal category filtering, instant keyword search, 2-column native grocery grid with stock tags.
2. **Basket & Checkout (`CartScreen.js`)**: Native quantity steppers, free delivery threshold calculation, delivery details form.
3. **Live Order Tracking (`OrderTrackingScreen.js`)**: Visual 4-step delivery progress indicator with delivery partner details and verification PIN.
4. **Warehouse Manager (`InventoryScreen.js`)**: Real-time low-stock alerts and 1-tap restocking button.
