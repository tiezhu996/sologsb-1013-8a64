// —— 换装时间配置（顶部可调）——
// 同一演员相邻两次上场之间默认需留 3 分钟换装；
// 个别演员换装较慢时，在下方表里按演员名（与提示中的演员写法完全一致）单独调长，单位：秒。
export const DEFAULT_COSTUME_CHANGE_SECONDS = 180;
export const COSTUME_CHANGE_OVERRIDES: Record<string, number> = {
  '说书人／周启': 240,
};

export type CueKind = '灯光' | '音响' | '道具' | '演员' | '舞台' | '字幕';

export interface Cue {
  id: string;
  kind: CueKind;
  title: string;
  duration: number;
  owner: string;
  lighting: string;
  sound: string;
  props: string[];
  cast: string[];
  notes: string;
  dependsOn: string[];
  offset: number;
}

export interface Scene {
  id: string;
  act: string;
  name: string;
  title: string;
  startTime: string;
  locked: boolean;
  cues: Cue[];
}

export interface ShowData {
  title: string;
  venue: string;
  date: string;
  scenes: Scene[];
  updatedAt: string;
}

export interface VersionSnapshot {
  id: string;
  name: string;
  createdAt: string;
  data: ShowData;
}

export interface CueDraft {
  id?: string;
  kind: CueKind;
  title: string;
  duration: number;
  owner: string;
  lighting: string;
  sound: string;
  props: string;
  cast: string;
  notes: string;
  dependsOn: string;
}

export interface CueIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  detail: string;
  icon?: string;
  sceneId?: string;
  cueId?: string;
}

export interface VersionDiff {
  id: string;
  changed: boolean;
  label: string;
  before: string;
  after: string;
}

export const CUE_KINDS: CueKind[] = ['灯光', '音响', '道具', '演员', '舞台', '字幕'];
export const OWNERS = ['李岚', '周启', '陈默', '赵一帆', '孙禾', '待指定'];
