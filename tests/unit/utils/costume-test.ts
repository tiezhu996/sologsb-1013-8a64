import { module, test } from 'qunit';
import {
  DEFAULT_COSTUME_CHANGE_MINUTES,
  costumeChangeSeconds,
  findCostumeBreaches,
  normalizeCostumeChange,
} from 'stage-cue-editor/utils/costume';
import type { Cue, Scene } from 'stage-cue-editor/models/show';

function cue(
  id: string,
  cast: string[],
  offset: number,
  duration: number,
): Cue {
  return {
    id,
    kind: '演员',
    title: `提示${id}`,
    duration,
    owner: '',
    lighting: '',
    sound: '',
    props: [],
    cast,
    notes: '',
    dependsOn: [],
    offset,
  };
}

function scene(id: string, startTime: string, cues: Cue[]): Scene {
  return {
    id,
    act: '第一幕',
    name: id,
    title: id,
    startTime,
    locked: false,
    cues,
  };
}

module('Unit | Utility | costume', function () {
  test('默认三分钟：同一位演员相邻提示间隔不足时报出人名与差额', function (assert) {
    const scenes = [
      scene('S1', '19:30', [
        cue('a', ['甲'], 0, 60),
        cue('b', ['甲'], 120, 60),
      ]),
    ];
    const breaches = findCostumeBreaches(scenes, normalizeCostumeChange(null));
    assert.strictEqual(breaches.length, 1, '间隔 60 秒小于 180 秒，报出一条');
    assert.strictEqual(breaches[0]?.actor, '甲');
    assert.strictEqual(breaches[0]?.gapSeconds, 60);
    assert.strictEqual(breaches[0]?.requiredSeconds, 180);
    assert.strictEqual(breaches[0]?.missingSeconds, 120, '还差 120 秒');
    assert.strictEqual(breaches[0]?.nextCueId, 'b');
  });

  test('间隔达到换装时间则不报问题', function (assert) {
    const scenes = [
      scene('S1', '19:30', [
        cue('a', ['甲'], 0, 60),
        cue('b', ['甲'], 240, 60),
      ]),
    ];
    assert.strictEqual(
      findCostumeBreaches(scenes, normalizeCostumeChange(null)).length,
      0,
      '间隔 180 秒刚好够用',
    );
  });

  test('跨场次按各场开场时间换算间隔', function (assert) {
    const tight = [
      scene('S1', '19:30', [cue('a', ['甲'], 0, 90)]),
      scene('S2', '19:33', [cue('b', ['甲'], 30, 60)]),
    ];
    const breaches = findCostumeBreaches(tight, normalizeCostumeChange(null));
    assert.strictEqual(breaches.length, 1, 'S1 结束到 S2 上场只隔 120 秒');
    assert.strictEqual(breaches[0]?.gapSeconds, 120);
    assert.strictEqual(breaches[0]?.missingSeconds, 60);

    const relaxed = [
      scene('S1', '19:30', [cue('a', ['甲'], 0, 90)]),
      scene('S2', '19:36', [cue('b', ['甲'], 30, 60)]),
    ];
    assert.strictEqual(
      findCostumeBreaches(relaxed, normalizeCostumeChange(null)).length,
      0,
      '第二场开场延后后间隔足够',
    );
  });

  test('个别演员可以单独调长换装时间', function (assert) {
    const scenes = [
      scene('S1', '19:30', [
        cue('a', ['甲', '乙'], 0, 60),
        cue('b', ['甲', '乙'], 300, 60),
      ]),
    ];
    const config = normalizeCostumeChange({
      defaultMinutes: 3,
      overrides: { 甲: 5 },
    });
    assert.strictEqual(costumeChangeSeconds(config, '甲'), 300);
    assert.strictEqual(
      costumeChangeSeconds(config, '乙'),
      DEFAULT_COSTUME_CHANGE_MINUTES * 60,
    );
    const breaches = findCostumeBreaches(scenes, config);
    assert.strictEqual(
      breaches.length,
      1,
      '间隔 240 秒只卡住调长到 5 分钟的甲',
    );
    assert.strictEqual(breaches[0]?.actor, '甲');
    assert.strictEqual(breaches[0]?.missingSeconds, 60);
  });

  test('检查只读数据，不改动任何提示时间', function (assert) {
    const scenes = [
      scene('S1', '19:30', [
        cue('a', ['甲'], 0, 60),
        cue('b', ['甲'], 120, 60),
      ]),
    ];
    const snapshot = JSON.stringify(scenes);
    findCostumeBreaches(scenes, normalizeCostumeChange(null));
    assert.strictEqual(
      JSON.stringify(scenes),
      snapshot,
      '提示的 offset 与时长保持原样',
    );
  });

  test('normalizeCostumeChange 为旧数据补齐默认配置', function (assert) {
    assert.deepEqual(normalizeCostumeChange(null), {
      defaultMinutes: 3,
      overrides: {},
    });
    assert.deepEqual(normalizeCostumeChange({ overrides: { 甲: 4 } }), {
      defaultMinutes: 3,
      overrides: { 甲: 4 },
    });
    assert.strictEqual(costumeChangeSeconds(undefined, '甲'), 180);
  });
});
