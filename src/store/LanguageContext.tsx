import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'zh' | 'ja' | 'ko';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    title: 'Review',
    subtitle: 'Covers',
    desc: 'Public works cover stream',
    navCtrl: 'Navigation Control',
    wasdKeys: 'WASD Keys',
    moveCamera: 'Move Camera',
    dragScroll: 'Drag & Scroll',
    rotateZoom: 'Rotate & Zoom',
    posLabel: 'POS',
    fovLabel: 'FOV',
    sysStatus: 'SYSTEM STATUS: NOMINAL',
    viewLogs: 'Review bootstrap',
    previewing: 'PREVIEWING',
    destination: 'Destination',
    nodeStatus: 'Node Status',
    stable: 'Stable',
    tracking: 'Tracking...',
    resetView: 'Reset View',
    startRoute: 'Start Route',
    restartRoute: 'Restart Route',
    routeAuto: 'Automatic route motion; drag and scroll to look around.',
    controlPanel: 'Flight Controls',
    speedLabel: 'Route Speed',
    speedSlow: 'Slow',
    speedFast: 'Fast',
    cardScaleLabel: 'Image Scale',
    cardScaleSmall: 'Calm',
    cardScaleLarge: 'Large',
    routeSpreadLabel: 'Flight Span',
    routeSpreadDense: 'Near',
    routeSpreadOpen: 'Open',
    dismiss: 'Dismiss',
  },
  zh: {
    title: 'Review',
    subtitle: '作品封面',
    desc: '公开作品封面流',
    navCtrl: '导航控制',
    wasdKeys: 'WASD 键',
    moveCamera: '移动视角',
    dragScroll: '拖拽 & 滚轮',
    rotateZoom: '旋转 & 缩放',
    posLabel: '坐标',
    fovLabel: '视野',
    sysStatus: '系统状态：正常',
    viewLogs: 'Review bootstrap',
    previewing: '正在预览',
    destination: '目标地址',
    nodeStatus: '节点状态',
    stable: '稳定',
    tracking: '追踪中...',
    resetView: '重置视角',
    startRoute: '开始',
    restartRoute: '重新开始',
    routeAuto: '路线自动前进，拖拽滚轮可自由视角。',
    controlPanel: '飞行控制',
    speedLabel: '路线速度',
    speedSlow: '慢',
    speedFast: '快',
    cardScaleLabel: '画面尺寸',
    cardScaleSmall: '克制',
    cardScaleLarge: '放大',
    routeSpreadLabel: '飞行跨度',
    routeSpreadDense: '近景',
    routeSpreadOpen: '开阔',
    dismiss: '关闭',
  },
  ja: {
    title: 'Review',
    subtitle: '作品カバー',
    desc: '公開作品カバーストリーム',
    navCtrl: 'ナビゲーション制御',
    wasdKeys: 'WASDキー',
    moveCamera: 'カメラ移動',
    dragScroll: 'ドラッグ＆スクロール',
    rotateZoom: '回転＆ズーム',
    posLabel: '位置',
    fovLabel: '視野',
    sysStatus: 'システム状態: 正常',
    viewLogs: 'Review bootstrap',
    previewing: 'プレビュー中',
    destination: '目的地',
    nodeStatus: 'ノード状態',
    stable: '安定',
    tracking: '追跡中...',
    resetView: '視点リセット',
    startRoute: '開始',
    restartRoute: '再開',
    routeAuto: '自動でルートが移動します。ドラッグとスクロールで自由に視点を変更できます。',
    controlPanel: '飛行制御',
    speedLabel: 'ルート速度',
    speedSlow: '低速',
    speedFast: '高速',
    cardScaleLabel: '画像サイズ',
    cardScaleSmall: '控えめ',
    cardScaleLarge: '大きい',
    routeSpreadLabel: '飛行範囲',
    routeSpreadDense: '近景',
    routeSpreadOpen: '広い',
    dismiss: '閉じる',
  },
  ko: {
    title: 'Review',
    subtitle: '작품 표지',
    desc: '공개 작품 표지 스트림',
    navCtrl: '탐색 제어',
    wasdKeys: 'WASD 키',
    moveCamera: '카메라 이동',
    dragScroll: '드래그 & 스크롤',
    rotateZoom: '회전 & 줌',
    posLabel: '좌표',
    fovLabel: '시야',
    sysStatus: '시스템 상태: 정상',
    viewLogs: 'Review bootstrap',
    previewing: '미리보기',
    destination: '목적지',
    nodeStatus: '노드 상태',
    stable: '안정됨',
    tracking: '추적 중...',
    resetView: '시점 초기화',
    startRoute: '시작',
    restartRoute: '다시 시작',
    routeAuto: '자동으로 경로가 움직입니다. 드래그와 스크롤로 자유롭게 시점을 변경할 수 있습니다.',
    controlPanel: '비행 제어',
    speedLabel: '경로 속도',
    speedSlow: '느림',
    speedFast: '빠름',
    cardScaleLabel: '이미지 크기',
    cardScaleSmall: '차분히',
    cardScaleLarge: '크게',
    routeSpreadLabel: '비행 범위',
    routeSpreadDense: '가깝게',
    routeSpreadOpen: '넓게',
    dismiss: '닫기',
  }
};

const LanguageContext = createContext<LanguageContextType>({} as any);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('zh');

  const t = (key: string) => translations[lang][key as keyof typeof translations['en']] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
