import type { CostumeChangeConfig, Scene } from 'stage-cue-editor/models/show';

export const DEFAULT_COSTUME_CHANGE_MINUTES = 3;

export interface CostumeBreach {
  actor: string;
  previousCueId: string;
  previousTitle: string;
  previousSceneLabel: string;
  nextCueId: string;
  nextTitle: string;
  nextSceneId: string;
  nextSceneLabel: string;
  gapSeconds: number;
  requiredSeconds: number;
  missingSeconds: number;
}

export function startSeconds(value: string): number {
  const [hour = '0', minute = '0'] = value.split(':');
  return Number(hour) * 3600 + Number(minute) * 60;
}

export function normalizeCostumeChange(
  config?: Partial<CostumeChangeConfig> | null,
): CostumeChangeConfig {
  return {
    defaultMinutes:
      config?.defaultMinutes && config.defaultMinutes > 0
        ? config.defaultMinutes
        : DEFAULT_COSTUME_CHANGE_MINUTES,
    overrides: { ...(config?.overrides ?? {}) },
  };
}

export function costumeChangeSeconds(
  config: CostumeChangeConfig | undefined,
  actor: string,
): number {
  const minutes =
    config?.overrides?.[actor] ??
    config?.defaultMinutes ??
    DEFAULT_COSTUME_CHANGE_MINUTES;
  return Math.max(0, minutes) * 60;
}

/**
 * 找出每位演员相邻两次上场之间换装时间不足的位置。
 * 跨场次按各场开场时间换算成绝对秒数比较；只读数据，不改动任何提示时间。
 */
export function findCostumeBreaches(
  scenes: Scene[],
  config: CostumeChangeConfig | undefined,
): CostumeBreach[] {
  const appearances = scenes
    .flatMap((scene) =>
      scene.cues.map((item) => ({
        scene,
        item,
        start: startSeconds(scene.startTime) + item.offset,
      })),
    )
    .sort((a, b) => a.start - b.start);
  const lastUse = new Map<
    string,
    { end: number; cueId: string; title: string; sceneLabel: string }
  >();
  const breaches: CostumeBreach[] = [];
  appearances.forEach(({ scene, item, start }) => {
    const sceneLabel = `${scene.act} ${scene.name}`;
    item.cast.forEach((actor) => {
      const required = costumeChangeSeconds(config, actor);
      const end = start + item.duration;
      const previous = lastUse.get(actor);
      if (previous && required > 0) {
        const gap = start - previous.end;
        if (gap < required) {
          breaches.push({
            actor,
            previousCueId: previous.cueId,
            previousTitle: previous.title,
            previousSceneLabel: previous.sceneLabel,
            nextCueId: item.id,
            nextTitle: item.title,
            nextSceneId: scene.id,
            nextSceneLabel: sceneLabel,
            gapSeconds: gap,
            requiredSeconds: required,
            missingSeconds: required - gap,
          });
        }
      }
      if (!previous || end >= previous.end) {
        lastUse.set(actor, {
          end,
          cueId: item.id,
          title: item.title,
          sceneLabel,
        });
      }
    });
  });
  return breaches;
}
