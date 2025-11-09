import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Animated } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import ReactNativeBiometrics from 'react-native-biometrics';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@env';
import * as Location from 'expo-location';

export default function AttendanceScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('face'); // Default to face
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animationValue] = useState(new Animated.Value(1));

  useEffect(() => {
    requestPermission();
    Speech.speak('कृपया Face, Fingerprint या Voice में से कोई तरीका चुनें।')
  }, []);

  const handleFingerprint = async () => {
    setIsProcessing(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const rnBiometrics = new ReactNativeBiometrics();
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    console.log('Biometric sensor available:', available);
    console.log('Biometry type:', biometryType);
    if (available && (biometryType === 'Biometrics' || biometryType === 'TouchID')) {
      try {
        const { success, error } = await rnBiometrics.simplePrompt({ promptMessage: 'Authenticate with fingerprint' });
        if (success) {
          Animated.timing(animationValue).stop();
          setIsProcessing(false);
          submitAttendance('fingerprint', 'fingerprint_authenticated');
        } else {
          Animated.timing(animationValue).stop();
          setIsProcessing(false);
          if (error && (error.toLowerCase().includes('enroll') || error.toLowerCase().includes('not enrolled') || error.toLowerCase().includes('no biometrics'))) {
            Alert.alert('Fingerprint not enrolled', 'Please enroll your fingerprint in device settings.');
          } else {
            Alert.alert('Authentication failed', error || 'Unknown error');
          }
        }
      } catch (error) {
        Animated.timing(animationValue).stop();
        setIsProcessing(false);
        Alert.alert('Error', `Biometric operation failed: ${error.message}`);
      }
    } else {
      Animated.timing(animationValue).stop();
      setIsProcessing(false);
      Alert.alert('Fingerprint sensor not available', 'Your device does not support fingerprint authentication.');
    }
  };

  const handleFace = async () => {
    if (!permission?.granted) {
      Alert.alert('Camera permission required');
      return;
    }
    if (cameraRef) {
      setIsProcessing(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();

      try {
        const photo = await cameraRef.takePictureAsync({ base64: true });
        Animated.timing(animationValue).stop();
        setIsProcessing(false);
        submitAttendance('face', photo.base64);
      } catch (error) {
        Animated.timing(animationValue).stop();
        setIsProcessing(false);
        Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
        console.error('Camera capture error:', error);
      }
    } else {
      Alert.alert('Camera not ready', 'Please wait for the camera to initialize.');
    }
  };

  const handleVoice = async () => {
    try {
      setIsProcessing(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1, // ✅ Use numeric constant instead of string
        playThroughEarpieceAndroid: false,
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setTimeout(async () => {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        const response = await fetch(uri);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
        Animated.timing(animationValue).stop();
        setIsProcessing(false);
        submitAttendance('voice', base64);
      }, 3000);
    } catch (err) {
      Animated.timing(animationValue).stop();
      setIsProcessing(false);
      console.error('Failed to record voice', err);
    }
  };


  const submitAttendance = async (method, biometricData) => {
    setIsLoading(true);
    const SpeechMethod = () => {
      if (method === 'fingerprint') {
      Speech.speak("आपकी उंगली छाप मिल गई है, attendance दर्ज की जा रही है")
    } else if (method === 'face') {
      Speech.speak('आपका चेहरा पहचाना गया है, attendance दर्ज की जा रही है')
    } else if (method === 'voice') {
      Speech.speak('आवाज़ पहचानी गई, attendance सफल रही')
    }
    }
    try {
      const token = await AsyncStorage.getItem('token');
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const address = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          location = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            address: address[0] ? `${address[0].name}, ${address[0].city}, ${address[0].region}, ${address[0].country}` : 'Unknown',
          };
        }
      } catch (locError) {
        console.log('Location error:', locError);
      }
      await axios.post(`${API_BASE_URL}/attendance/submit`, { method, biometricData, location }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then (
        () => SpeechMethod()
      )

      setTimeout(() => {
        Alert.alert('Success', 'Attendance submitted');
        Speech.speak('आपकी attendance सफलतापूर्वक दर्ज हो गई है। धन्यवाद!')
        navigation.navigate('Records');
      }, 5000);

    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Submission failed');
    } finally {
      setTimeout(() => {
        setIsLoading(false)
      }, 5000)
    }
  };

  if (!permission) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (!permission.granted) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  const handleSubmit = () => {
    if (selectedMethod === 'fingerprint') {
      handleFingerprint();
    } else if (selectedMethod === 'face') {
      handleFace();
    } else if (selectedMethod === 'voice') {
      handleVoice();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Attendance</Text>

      <Text style={styles.label}>Select Biometric Method:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedMethod}
          onValueChange={(itemValue) => setSelectedMethod(itemValue)}
        >
          <Picker.Item label="Face Recognition" value="face" />
          <Picker.Item label="Fingerprint" value="fingerprint" />
          <Picker.Item label="Voice Recognition" value="voice" />
        </Picker>
      </View>

      {selectedMethod === 'face' && (
        <Animated.View style={[styles.cameraContainer, { transform: [{ scale: animationValue }] }]}>
          <CameraView
            style={styles.camera}
            facing="front"
            ref={ref => setCameraRef(ref)}
          />
          {isProcessing && <Text style={styles.processingText}>Capturing...</Text>}
        </Animated.View>
      )}

      {selectedMethod === 'fingerprint' && isProcessing && (
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: animationValue }] }]}>
          <Text style={styles.icon}>👆</Text>
          <Text style={styles.processingText}>Scanning fingerprint...</Text>
        </Animated.View>
      )}

      {selectedMethod === 'voice' && isProcessing && (
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: animationValue }] }]}>
          <Text style={styles.icon}>🎤</Text>
          <Text style={styles.processingText}>Recording voice...</Text>
        </Animated.View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit Attendance</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Records')}>
        <Text style={styles.buttonText}>View Records</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 10 },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', marginBottom: 20, borderRadius: 5 },
  camera: { width: 300, height: 400, marginBottom: 20, alignSelf: 'center' },
  cameraContainer: { alignItems: 'center', marginBottom: 20 },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 100, marginBottom: 10 },
  processingText: { fontSize: 18, color: '#007bff', textAlign: 'center' },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontSize: 16 },
});
