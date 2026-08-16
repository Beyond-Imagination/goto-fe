import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import type { Coord } from "@mj-studio/react-native-naver-map";

// 실내에서는 위성 신호가 약해져 accuracy가 수십~수백 m로 나오는 게 정상이다. "정확하지 않으면
// 숨긴다"가 아니라 "부정확해도 보여주되 명백한 튐만 걸러낸다"는 방향으로 설계했다:
// - ACCURACY_REJECT_METERS: 이보다 나쁜 fix는 신뢰할 수 없는 값으로 보고 아예 버린다.
// - MAX_WALK_SPEED_MPS: 직전 fix 대비 도보로 불가능한 속도로 이동했다면 위성 오차로 보고 버린다.
// - SMOOTHING_ALPHA: 남은 fix는 이동평균으로 완만하게 이어서 점이 순간적으로 튀어 보이지 않게 한다.
const ACCURACY_REJECT_METERS = 150;
const MAX_WALK_SPEED_MPS = 3;
const SMOOTHING_ALPHA = 0.3;

export type LiveLocation = { position: Coord; accuracyMeters: number };

export function useLiveLocation(enabled: boolean): LiveLocation | null {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const lastAcceptedRef = useRef<{ coord: Coord; timestamp: number } | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLocation(null);
      lastAcceptedRef.current = null;
      return;
    }

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || status !== "granted") {
        return;
      }

      subscription = await Location.watchPositionAsync(
        // Balanced는 GPS 신호가 약할 때 WiFi/기지국 기반 위치로도 fallback해서, 실내에서
        // fix 자체가 안 잡히는 상황을 줄여준다 (Highest/BestForNavigation은 GPS만 고집한다).
        { accuracy: Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 3 },
        (fix) => {
          const accuracyMeters = fix.coords.accuracy ?? ACCURACY_REJECT_METERS;
          if (accuracyMeters > ACCURACY_REJECT_METERS) {
            return;
          }

          const coord: Coord = { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
          const last = lastAcceptedRef.current;
          if (last) {
            const elapsedSeconds = (fix.timestamp - last.timestamp) / 1000;
            if (elapsedSeconds > 0 && haversineMeters(last.coord, coord) / elapsedSeconds > MAX_WALK_SPEED_MPS) {
              return;
            }
          }
          lastAcceptedRef.current = { coord, timestamp: fix.timestamp };

          setLocation((prev) => ({
            position: prev ? smooth(prev.position, coord, SMOOTHING_ALPHA) : coord,
            accuracyMeters
          }));
        }
      );
    }

    start();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  return location;
}

function smooth(prev: Coord, next: Coord, alpha: number): Coord {
  return {
    latitude: prev.latitude + (next.latitude - prev.latitude) * alpha,
    longitude: prev.longitude + (next.longitude - prev.longitude) * alpha
  };
}

function haversineMeters(a: Coord, b: Coord): number {
  const earthRadiusMeters = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}
