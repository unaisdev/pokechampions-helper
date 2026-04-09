import { StyleSheet, Linking } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function InfoTabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PokeChampions Helper</Text>
      <Text style={styles.body}>
        MVP: captura del resumen de batalla, detección del nombre (OCR on-device próximamente) y datos vía
        PokéAPI.
      </Text>
      <Text style={styles.link} onPress={() => Linking.openURL('https://pokeapi.co/docs/v2')}>
        PokéAPI v2 docs
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  link: {
    fontSize: 16,
    color: '#2563eb',
    marginTop: 8,
  },
});
