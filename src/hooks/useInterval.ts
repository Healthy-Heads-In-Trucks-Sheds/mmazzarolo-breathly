/**
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
 * distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * Copyright 2019-2021 Matteo Mazzarolo and the Breathly project contributors.
 */

import { useEffect, useRef } from "react";

export function useInterval(callback: () => void, interval: number = 1000) {
  const callbackRef = useRef<any>(null);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const tick = () => {
      callbackRef.current && callbackRef.current();
    };

    let id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval]);
}
