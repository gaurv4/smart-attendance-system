import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      navigation.replace('Login');
    }, 4000);
  }, [fadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/animations/scan.json')}
        autoPlay
        loop={false}
        style={styles.lottie}
      />
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Text style={styles.logoText}>👤✓</Text>
        <Text style={styles.appName}>Attendify</Text>
        <Text style={styles.tagline}>Smart Attendance. Simplified.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D47A1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 200,
    height: 200,
    position: 'absolute',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 80,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

export default SplashScreen;
