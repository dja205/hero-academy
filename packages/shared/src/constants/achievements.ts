import type { Achievement } from '../types/gamification';

export const ACHIEVEMENTS: Achievement[] = [
  {
    type: 'first_mission',
    name: 'First Mission',
    description: 'Complete your first mission',
    icon: '\u{1F680}',
  },
  {
    type: 'perfect_score',
    name: 'Flawless Victory',
    description: 'Score 10/10 on any mission',
    icon: '\u{2B50}',
  },
  {
    type: 'district_conqueror',
    name: 'District Conqueror',
    description: 'Complete all missions in a district',
    icon: '\u{1F3F0}',
  },
  {
    type: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a mission in under 60 seconds',
    icon: '\u{26A1}',
  },
  {
    type: 'rank_up',
    name: 'Power Up!',
    description: 'Reach Sidekick rank',
    icon: '\u{1F31F}',
  },
  {
    type: 'boss_slayer',
    name: 'Dragon Slayer',
    description: 'Defeat your first boss',
    icon: '\u{2694}\u{FE0F}',
  },
  {
    type: 'zone_conquered_mathropolis',
    name: 'Zone Conquered',
    description: 'Conquer Mathropolis by defeating the Number Dragon',
    icon: '\u{1F3C6}',
  },
];
