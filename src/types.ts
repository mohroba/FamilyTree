/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FamilyMember {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  relation?: string;
  avatar?: string;
  image?: string; // Base64 or URL
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
}

export type RelationType = 'فرزند' | 'همسر' | 'خواهر/برادر' | 'ریشه';

export interface FamilyTree {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  createdAt: number;
}

export interface AppState {
  currentTreeId: string;
  trees: FamilyTree[];
  darkMode: boolean;
  canvasBgColor?: string;
  canvasBgImage?: string;
}
