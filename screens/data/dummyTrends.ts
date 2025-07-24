// screens/data/dummyTrendDetail.ts
export type PostDetail = TrendDetail

export type SimilarTrend = {
  trendId: number
  title: string
  tags: string[]
  analysisScore?: number
  score?: number
}

export type TrendDetail = {
  trendId: number
  title: string
  description: string
  category: string
  tags: string[]
  score: number
  likeCount: number
  commentCount: number
  viewCount: number
  snsMentions: number
  peakPeriod: string
  similarTrends: SimilarTrend[]
}

export const dummyTrendDetails: TrendDetail[] = [
  {
    trendId: 1,
    title: "제로웨이스트",
    description: "제로웨이스트는 좋습니다.",
    category: "환경",
    tags: ["#친환경", "#플라스틱제로"],
    score: 77,
    likeCount: 131,
    commentCount: 18,
    viewCount: 9823,
    snsMentions: 431,
    peakPeriod: "2024-08",
    similarTrends: [
      {
        trendId: 4,
        title: "첫 NFT 구매",
        tags: ["#친환경", "#플라스틱제로"],
        analysisScore: 80,
      },
      {
        trendId: 7,
        title: "1인 1플로깅",
        tags: ["#친환경", "#플라스틱제로"],
        score: 90,
      },
    ],
  },
  {
    trendId: 2,
    title: "비건 레시피 챌린지",
    description: "채식 기반 레시피 공유가 늘고 있어요.",
    category: "건강",
    tags: ["#비건", "#홈쿡"],
    score: 69,
    likeCount: 98,
    commentCount: 25,
    viewCount: 7281,
    snsMentions: 300,
    peakPeriod: "2024-07",
    similarTrends: [
      {
        trendId: 8,
        title: "로푸드 다이어트",
        tags: ["#비건", "#다이어트"],
        analysisScore: 72,
      },
    ],
  },
  {
    trendId: 3,
    title: "1일 1걷기",
    description: "하루에 만 보 걷는 것이 트렌드입니다.",
    category: "라이프스타일",
    tags: ["#건강", "#걷기"],
    score: 84,
    likeCount: 154,
    commentCount: 12,
    viewCount: 10923,
    snsMentions: 598,
    peakPeriod: "2024-06",
    similarTrends: [
      {
        trendId: 5,
        title: "지하철 한 정거장 걷기",
        tags: ["#출퇴근", "#건강"],
        analysisScore: 65,
      },
      {
        trendId: 9,
        title: "출근 전 산책 루틴",
        tags: ["#아침습관"],
        score: 88,
      },
    ],
  },
]
