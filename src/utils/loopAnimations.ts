/**
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * Copyright 2019-2021 Matteo Mazzarolo and the Breathly project contributors.
 */

import { Animated } from "react-native";

// Since loops using the native driver cannot contain Animated.sequence
// we create a custom function that goes trough them
export const loopAnimations = (
  createAnimations: () => Animated.CompositeAnimation[],
  onStepStart: (stepIndex: number) => void
) => {
  let animations = createAnimations();
  let currentAnimationIndex = 0;
  const animateStep = () => {
    animations[currentAnimationIndex].start(({ finished }) => {
      if (!finished) return;
      currentAnimationIndex++;
      if (currentAnimationIndex >= animations.length) {
        currentAnimationIndex = 0;
        animations = createAnimations();
      }
      onStepStart(currentAnimationIndex);
      animateStep();
    });
  };
  onStepStart(currentAnimationIndex);
  animateStep();
  const stopLoop = () => {
    animations.forEach((animation) => animation.stop());
  };
  return stopLoop;
};
