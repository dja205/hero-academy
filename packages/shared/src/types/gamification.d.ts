export type RankName = 'Recruit' | 'Sidekick' | 'Hero' | 'Superhero';
export interface RankTier {
    name: RankName;
    minXp: number;
    maxXp: number | null;
    colour: string;
}
export interface Achievement {
    type: string;
    name: string;
    description: string;
    icon: string;
}
export interface ChildStats {
    totalMissions: number;
    totalXp: number;
    rank: RankName;
    averageScore: number;
    strongestDistrict: string | null;
    weakestDistrict: string | null;
    achievements: string[];
}
