/**
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * Copyright 2019-2021 Matteo Mazzarolo and the Breathly project contributors.
 */

import React, { FC, useState } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";
import { deviceWidth } from "../../config/constants";
import { useOnMount } from "../../hooks/useOnMount";
import { animate } from "../../utils/animate";
import {
  interpolateScale,
  interpolateTranslateY,
} from "../../utils/interpolate";
import { loopAnimations } from "../../utils/loopAnimations";
import { ExerciseCircleDots } from "./ExerciseCircleDots";
import { playSound } from "../../services/sound";
import { ButtonAnimator } from "../ButtonAnimator/ButtonAnimator";
import { Step } from "../../types/Step";

export type Props = {
  styles?: typeof defaultStyles;
  steps: Step[];
  vibrationEnabled: boolean;
  elapsedTime: number;
  minimumElapsedTime: number;
  onClosePress: (isBreathingDone: boolean) => void;
};

const circleSize = deviceWidth * 0.8;
const fadeInAnimDuration = 400;

export const ExerciseCircle: FC<Props> = ({
  styles = defaultStyles,
  steps,
  elapsedTime,
  minimumElapsedTime,
  onClosePress,
}) => {
  const [showUpAnimVal] = useState(new Animated.Value(0));
  const [scaleAnimVal] = useState(new Animated.Value(0));
  const [textAnimVal] = useState(new Animated.Value(1));
  const [circleMinAnimVal] = useState(new Animated.Value(0));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const activeSteps = steps.filter((x) => !x.skipped);
  const currentStep = activeSteps[currentStepIndex];

  const animateStep = (toValue: number, duration: number) => {
    const textDuration = fadeInAnimDuration;
    return Animated.stagger(duration - textDuration, [
      Animated.parallel([
        animate(scaleAnimVal, {
          toValue: toValue,
          duration: duration,
        }),
        animate(textAnimVal, {
          toValue: 1,
          duration: textDuration,
        }),
      ]),
      animate(textAnimVal, {
        toValue: 0,
        duration: textDuration,
      }),
    ]);
  };

  const showCircleMinAnimation = animate(circleMinAnimVal, {
    toValue: 1,
    duration: fadeInAnimDuration,
  });

  const hideCircleMinAnimation = animate(circleMinAnimVal, {
    toValue: 0,
    duration: fadeInAnimDuration,
  });

  const showUpAnimation = animate(showUpAnimVal, {
    toValue: 1,
    duration: fadeInAnimDuration,
  });

  const onStepStart = (stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
    const step = activeSteps[stepIndex];
    if (step.id === "exhale") {
      playSound("lauraBreatheOut");
      showCircleMinAnimation.start();
    } else if (step.id === "inhale") {
      playSound("lauraBreatheIn");

      hideCircleMinAnimation.start();
    } else if (step.id === "afterExhale") {
      playSound("lauraHold");

      hideCircleMinAnimation.start();
    } else if (step.id === "afterInhale") {
      playSound("lauraHold");
    }
    // if (vibrationEnabled) {
    //   if (Platform.OS === "ios") {
    //     ReactNativeHaptic.generate("impactHeavy");
    //     setTimeout(() => ReactNativeHaptic.generate("impactHeavy"), 100);
    //   } else if (Platform.OS === "android") {
    //     Vibration.vibrate(200);
    //   }
    // }
  };

  const startAnimationSteps = () => {
    const createStepAnimations = () =>
      activeSteps.map((x) =>
        animateStep(
          x.id === "inhale" || x.id === "afterInhale" ? 1 : 0,
          x.duration
        )
      );
    const stopLoop = loopAnimations(createStepAnimations, onStepStart);
    return stopLoop;
  };

  useOnMount(() => {
    let cleanUpAnimationsSteps: () => void;
    showUpAnimation.start(({ finished }) => {
      if (finished) {
        cleanUpAnimationsSteps = startAnimationSteps();
      }
    });
    return () => {
      cleanUpAnimationsSteps && cleanUpAnimationsSteps();
      showUpAnimation.stop();
      showCircleMinAnimation.stop();
      hideCircleMinAnimation.stop();
    };
  });

  const containerAnimatedStyle = {
    opacity: showUpAnimVal.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };

  const circleAnimatedStyle: Animated.AnimatedProps<ViewStyle> = {
    transform: [
      interpolateScale(scaleAnimVal, {
        inputRange: [0, 1],
        outputRange: [0.6, 1],
      }),
    ],
  };

  const contentAnimatedStyle: Animated.AnimatedProps<ViewStyle> = {
    opacity: textAnimVal.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      interpolateScale(scaleAnimVal, {
        inputRange: [0, 1],
        outputRange: [1, 1.3],
      }),
      interpolateTranslateY(textAnimVal, {
        inputRange: [0, 1],
        outputRange: [-8, 0],
      }),
    ],
  };

  const circleMinAnimatedStyle = {
    opacity: circleMinAnimVal.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };

  return (
    <>
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <Animated.View style={[styles.circle, circleAnimatedStyle]} />
        <Animated.View style={[styles.circleMin, circleMinAnimatedStyle]} />
        <Animated.View style={styles.circleMax} />
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          <Animated.Text style={styles.text}>{currentStep.label}</Animated.Text>
          <ExerciseCircleDots
            visible={currentStep.showDots}
            numberOfDots={3}
            totalDuration={currentStep.duration}
          />
        </Animated.View>
      </Animated.View>
      <ButtonAnimator
        visible={true}
        onClosePress={() => {
          const isBreathingDone = elapsedTime * 1000 >= minimumElapsedTime;
          onClosePress(isBreathingDone);
        }}
      />
    </>
  );
};

export const defaultStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "white",
    borderWidth: StyleSheet.hairlineWidth,
  },
  circleMin: {
    position: "absolute",
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    transform: [{ scale: 0.6 }],
  },
  circleMax: {
    position: "absolute",
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  content: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: Math.floor(24),
    textAlign: "center",
    color: "white",
  },
});
