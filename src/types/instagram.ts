export interface ProfileAnalytics {
  profile: {
    username: string;
    fullName: string;
    biography: string;
    profilePicUrl: string;
    isPrivate: boolean;
    isVerified: boolean;
  };
  statistics: {
    followers: number;
    following: number;
    posts: number;
    averageEngagement: number;
  };
  recentPosts: {
    id: string;
    imageUrl: string;
    caption: string;
    likes: number;
    comments: number;
    timestamp: number;
    engagement: number;
  }[];
  engagementOverTime: {
    timestamp: number;
    engagement: number;
  }[];
  followerGrowth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}