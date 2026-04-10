import { View } from 'react-native';

import { BattleScanScreen } from '@src/features/battle-scan/ui/BattleScanScreen';

export default function ScanTabScreen() {
  return (
    <View style={{ flex: 1 }}>
      <BattleScanScreen />
    </View>
  );
}
