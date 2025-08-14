import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER = 'https://restaurant-pos-eufn.onrender.com';

export default function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('token');
      if (t) setToken(t);
      setLoading(false);
      if (t) fetchItems(t);
    })();
  }, []);

  async function login() {
    try {
      const res = await axios.post(`${SERVER}/api/login`, { username, password });
      await AsyncStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      fetchItems(res.data.token);
      Alert.alert('Logged in');
    } catch (e) {
      console.error(e);
      Alert.alert('Login failed');
    }
  }

  async function fetchItems(tkn) {
    try {
      const res = await axios.get(`${SERVER}/api/items`);
      setItems(res.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Could not fetch items from server. Using local demo items.');
      setItems([
        { id:1, name:'Veg Burger', description:'Demo', price:99.0 },
        { id:2, name:'Paneer Roll', description:'Demo', price:129.0 }
      ]);
    }
  }

  function addToCart(item) {
    const found = cart.find(c => c.item_id === item.id);
    if (found) {
      setCart(cart.map(c => c.item_id === item.id ? {...c, qty: c.qty + 1} : c));
    } else {
      setCart([...cart, { item_id: item.id, name: item.name, price: parseFloat(item.price), qty: 1 }]);
    }
  }

  function totalAmount() {
    return cart.reduce((s, c) => s + c.price * c.qty, 0);
  }

  async function checkout() {
    if (!token) return Alert.alert('Please login first (default admin/admin123)');
    const payload = { order_type: 'dinein', table_no: '1', items: cart.map(c=>({ item_id: c.item_id, qty: c.qty, price: c.price })) };
    try {
      const res = await axios.post(`${SERVER}/api/orders`, payload, { headers: { Authorization: 'Bearer ' + token } });
      Alert.alert('Order placed', 'ID: ' + res.data.orderId + '\nTotal: ' + res.data.total);
      setCart([]);
    } catch (e) {
      console.error(e);
      Alert.alert('Checkout failed');
    }
  }

  if (loading) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator/></View>;

  if (!token) {
    return (
      <View style={{padding:20, paddingTop:60}}>
        <Text style={{fontSize:20, marginBottom:12}}>Login</Text>
        <Text>Username</Text>
        <TextInput value={username} onChangeText={setUsername} style={{borderWidth:1, padding:8, marginBottom:8}}/>
        <Text>Password</Text>
        <TextInput secureTextEntry value={password} onChangeText={setPassword} style={{borderWidth:1, padding:8, marginBottom:8}}/>
        <Button title="Login" onPress={login}/>
        <Text style={{marginTop:12}}>Default admin account: admin / admin123</Text>
      </View>
    );
  }

  return (
    <View style={{flex:1, padding:16, paddingTop:40}}>
      <Text style={{fontSize:20, marginBottom:8}}>Menu</Text>
      <FlatList
        data={items}
        keyExtractor={i=>String(i.id)}
        renderItem={({item}) => (
          <View style={{padding:8, borderBottomWidth:1, borderColor:'#eee'}}>
            <Text style={{fontSize:16}}>{item.name} — ₹{parseFloat(item.price).toFixed(2)}</Text>
            <Text>{item.description}</Text>
            <TouchableOpacity onPress={()=>addToCart(item)} style={{marginTop:6, padding:8, backgroundColor:'#ddd', alignSelf:'flex-start'}}>
              <Text>Add</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={{padding:8, borderTopWidth:1}}>
        <Text style={{fontSize:18}}>Cart — ₹{totalAmount().toFixed(2)}</Text>
        <Button title="Checkout" onPress={checkout} disabled={cart.length===0}/>
      </View>
    </View>
  );
}
