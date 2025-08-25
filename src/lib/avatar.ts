import { createAvatar } from '@dicebear/core';
import * as collection from '@dicebear/collection';

// 모든 사용 가능한 아바타 스타일들
export const avatarStyles = {
  // 캐릭터 기반 스타일
  adventurer: collection.adventurer,
  adventurerNeutral: collection.adventurerNeutral,
  avataaars: collection.avataaars,
  avataaarsNeutral: collection.avataaarsNeutral,
  bigEars: collection.bigEars,
  bigEarsNeutral: collection.bigEarsNeutral,
  bigSmile: collection.bigSmile,
  bottts: collection.bottts,
  botttsNeutral: collection.botttsNeutral,
  croodles: collection.croodles,
  croodlesNeutral: collection.croodlesNeutral,
  dylan: collection.dylan,
  funEmoji: collection.funEmoji,
  lorelei: collection.lorelei,
  loreleiNeutral: collection.loreleiNeutral,
  micah: collection.micah,
  miniavs: collection.miniavs,
  notionists: collection.notionists,
  notionistsNeutral: collection.notionistsNeutral,
  openPeeps: collection.openPeeps,
  personas: collection.personas,
  pixelArt: collection.pixelArt,
  pixelArtNeutral: collection.pixelArtNeutral,
  
  // 추상 & 패턴 기반 스타일
  glass: collection.glass,
  icons: collection.icons,
  identicon: collection.identicon,
  initials: collection.initials,
  rings: collection.rings,
  shapes: collection.shapes,
  thumbs: collection.thumbs,
} as const;

export type AvatarStyle = keyof typeof avatarStyles;

// 기본 색상 팔레트 (shadcn 테마와 어울리는 색상)
const colorPalettes = {
  pastel: ['#fbbf24', '#fb923c', '#f87171', '#e879f9', '#c084fc', '#a78bfa', '#818cf8', '#60a5fa', '#38bdf8', '#22d3ee'],
  vibrant: ['#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6'],
  muted: ['#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937'],
  monochrome: ['#000000', '#171717', '#262626', '#404040', '#525252', '#737373', '#a3a3a3', '#d4d4d4']
};

interface GenerateAvatarOptions {
  seed: string;           // 유저 ID나 이메일 등 고유 값
  style?: AvatarStyle;    // 아바타 스타일
  size?: number;          // 크기 (픽셀)
  backgroundColor?: string[]; // 배경색 배열
}

/**
 * 랜덤 아바타 URL 생성
 */
export function generateAvatarUrl({
  seed,
  style = 'notionists',  // 기본값: Notion 스타일 (깔끔함)
  size = 128,
  backgroundColor = colorPalettes.pastel
}: GenerateAvatarOptions): string {
  const avatar = createAvatar(avatarStyles[style], {
    seed,
    size,
    backgroundColor,
    // 스타일별 추가 옵션
    ...(style === 'initials' ? {
      fontSize: 42,
      fontWeight: 600,
    } : {}),
    ...(style === 'lorelei' || style === 'notionists' ? {
      backgroundColor: colorPalettes.pastel,
      flip: Math.random() > 0.5,
    } : {})
  });

  return avatar.toDataUri();
}

/**
 * 사용자 이름으로부터 이니셜 아바타 생성
 */
export function generateInitialsAvatar(name: string, size: number = 128): string {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatar = createAvatar(avatarStyles.initials, {
    seed: name,
    size,
    backgroundColor: colorPalettes.pastel,
    fontSize: size * 0.4,
    fontWeight: 600,
    chars: initials
  });

  return avatar.toDataUri();
}

/**
 * 인기 있는 스타일 목록 (추천 스타일)
 */
export const popularStyles: AvatarStyle[] = [
  'notionists',
  'lorelei', 
  'openPeeps',
  'avataaars',
  'bottts',
  'micah',
  'bigSmile',
  'personas',
  'adventurer',
  'miniavs',
  'funEmoji',
  'pixelArt',
];

/**
 * 모든 스타일 목록 가져오기
 */
export function getAllStyles(): AvatarStyle[] {
  return Object.keys(avatarStyles) as AvatarStyle[];
}

/**
 * 랜덤 스타일 선택
 */
export function getRandomStyle(): AvatarStyle {
  const styles = popularStyles;
  return styles[Math.floor(Math.random() * styles.length)];
}

/**
 * 사용자 ID 기반으로 일관된 아바타 생성
 */
export function generateUserAvatar(userId: string, style?: AvatarStyle): string {
  return generateAvatarUrl({
    seed: userId,
    style: style || getRandomStyle(),
    size: 256,
    backgroundColor: colorPalettes.pastel
  });
}