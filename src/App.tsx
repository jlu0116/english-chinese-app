/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IPhoneFrame } from './components/IPhoneFrame.tsx';
import { PaiMatchGame } from './components/PaiMatchGame.tsx';

export default function App() {
  return (
    <IPhoneFrame title="学英文">
      <PaiMatchGame />
    </IPhoneFrame>
  );
}

