import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

import ReactNativeBiometrics from 'react-native-biometrics';
import { Audio } from 'expo-av';
import axios from 'axios';

import { API_BASE_URL } from '@env';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [step, setStep] = useState(1); // 1: form, 2: biometrics
  const [faceData, setFaceData] = useState('');
  const [voiceData, setVoiceData] = useState('');
  const [fingerprintData, setFingerprintData] = useState('gdghfghrtyrthfghhj');
  const [cameraRef, setCameraRef] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  const handleNext = () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setStep(2);
  };

  const captureFace = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync({ base64: true });
      setFaceData(photo.base64);
      Alert.alert('Success', 'Face captured');
    }
  };

  const recordVoice = async () => {
  try {
    await Audio.requestPermissionsAsync();

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1, // DO_NOT_MIX = 1
      playThroughEarpieceAndroid: false,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    setRecording(recording);
    Alert.alert('Recording started', 'Say your name clearly');

    setTimeout(async () => {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        const response = await fetch(uri);
        const blob = await response.blob();

        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });

        setVoiceData(base64);
        setRecording(null);
        Alert.alert('Success', 'Voice recorded successfully');
      } catch (err) {
        console.error('Error stopping or processing recording', err);
      }
    }, 3000);
  } catch (err) {
    console.error('Failed to record voice:', err);
    Alert.alert('Error', err.message || 'Failed to record voice');
  }
};


  const captureFingerprint = async () => {
    console.log("finger");

    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      console.log('Biometrics available:', available, biometryType);

      if (!available) {
        Alert.alert('Error', 'Fingerprint or Face ID not available on this device');
        return;
      }

      // Create biometric keys (if not already created)
      const { keysExist } = await rnBiometrics.biometricKeysExist();
      if (!keysExist) {
        await rnBiometrics.createKeys();
      }

      // Request user fingerprint scan
      const payload = `user:${email || name || 'new_user'}`;
      const { success, signature } = await rnBiometrics.createSignature({
        promptMessage: 'Scan your fingerprint to register',
        payload,
      });

      if (success) {
        setFingerprintData(signature);
        Alert.alert('Success', 'Fingerprint registered successfully');
      } else {
        Alert.alert('Cancelled', 'Fingerprint registration cancelled');
      }
    } catch (error) {
      console.error('Fingerprint error:', error);
      Alert.alert('Error', `Fingerprint registration failed: ${error.message}`);
    }
  };


  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, { name, email, password, role, faceData, voiceData, fingerprintData });
      console.log("reg res", response);

      Alert.alert('Success', 'Registration successful', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Register</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={role}
            onValueChange={(itemValue) => setRole(itemValue)}
          >
            <Picker.Item label="User" value="user" />
            <Picker.Item label="Supervisor" value="supervisor" />
          </Picker>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next: Biometrics</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Biometrics</Text>
      <CameraView
        style={styles.camera}
        facing="front"
        ref={ref => setCameraRef(ref)}
      />
      <TouchableOpacity style={styles.button} onPress={captureFace}>
        <Text style={styles.buttonText}>Capture Face</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={recordVoice}>
        <Text style={styles.buttonText}>Record Voice</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={captureFingerprint}>
        <Text style={styles.buttonText}>Register Fingerprint</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setStep(1)}>
        <Text style={styles.link}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, borderRadius: 5 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 10, color: '#007bff' },
  camera: { width: 300, height: 400, marginBottom: 20, alignSelf: 'center' },
});
