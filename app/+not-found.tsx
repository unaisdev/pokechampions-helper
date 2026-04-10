import '@src/shared/theme/unistyles-register';

import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Text, View } from '@/components/Themed';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space.xxxl,
  },
  title: {
    fontSize: theme.fontSize.hero,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: theme.fontSize.bodyLg,
    color: theme.colors.link,
  },
}));
