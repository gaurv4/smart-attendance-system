import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_BASE_URL } from '@env';

export default function RecordsScreen() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      const response = await axios.get(`${API_BASE_URL}/attendance/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.record}>
      <Text>User: {item.userId.name} ({item.userId.email})</Text>
      <Text>Method: {item.method}</Text>
      <Text>Timestamp: {new Date(item.timestamp).toLocaleString()}</Text>
      <Text>Status: {item.status}</Text>
      {item.location && (
        <View>
          <Text>Location: {item.location.address || 'Unknown'}</Text>
          {item.location.lat && item.location.lng && (
            <Text>Lat: {item.location.lat}, Lng: {item.location.lng}</Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Records</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  record: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
});
