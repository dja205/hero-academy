export interface AvatarConfig {
  costume: 1 | 2 | 3;
  mask: 1 | 2;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  heroName: string;
  avatarConfig: AvatarConfig;
  xp: number;
  rank: string;
  createdAt: string;
}
