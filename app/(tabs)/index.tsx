import { BattleScanScreen } from '@src/features/battle-scan/ui/BattleScanScreen';
import { TabScreenContentFrame } from '@src/shared/ui/TabScreenContentFrame';

export default function ScanTabScreen() {
  return (
    <TabScreenContentFrame>
      <BattleScanScreen />
    </TabScreenContentFrame>
  );
}
