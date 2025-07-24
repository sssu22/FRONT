export type PostDetail = Experience
export type Experience = {
  id: string
  trend: string
  title: string
  date: string
  location: string
  emotion: string
  tags: string[]
  description: string
  likeCount: number
  commentCount: number
  viewCount: number
  trendScore: number
  snsMentions: number
  peakMonth: string
  comments: Comment[]
}

export type Comment = {
  commentId: string
  username: string
  content: string
  createdAt: string
  likeCount: number
}

export const dummyPosts: Experience[] = [
  {
    id: "5",
    trend: "K-POP 콘서트",
    title: "첫 K-POP 콘서트",
    date: "2023-09-10",
    location: "잠실 올림픽공원",
    emotion: "excitement",
    tags: ["#K-POP", "#콘서트", "#한류", "#문화"],
    description: "BTS 콘서트를 처음 가봤는데 정말 감동적이었다",
    likeCount: 425,
    commentCount: 3,
    viewCount: 2695,
    trendScore: 95,
    snsMentions: 95522,
    peakMonth: "2023년 9월",
    comments: [
      {
        commentId: "1",
        username: "트렌드헌터1",
        content: "저도 비슷한 경험 있어요! 정말 신선한 충격이었죠.",
        createdAt: "2025-06-29T15:12:00Z",
        likeCount: 12,
      },
      {
        commentId: "2",
        username: "kpoplover",
        content: "저는 NCT 공연 갔다왔는데 에너지가 엄청났어요!",
        createdAt: "2025-06-30T10:00:00Z",
        likeCount: 8,
      },
    ],
  },
  {
    id: "6",
    trend: "제로웨이스트",
    title: "플라스틱 없는 일주일",
    date: "2024-06-01",
    location: "우리 집",
    emotion: "surprise",
    tags: ["#제로웨이스트", "#환경", "#챌린지"],
    description: "일주일간 플라스틱 없이 살아보는 실험을 했어요.",
    likeCount: 318,
    commentCount: 2,
    viewCount: 1922,
    trendScore: 87,
    snsMentions: 40211,
    peakMonth: "2024년 6월",
    comments: [
      {
        commentId: "3",
        username: "에코지기",
        content: "정말 대단하세요! 전 하루도 힘들었어요 ㅠㅠ",
        createdAt: "2025-07-01T09:00:00Z",
        likeCount: 5,
      },
    ],
  },
  {
    id: "7",
    trend: "혼밥 챌린지",
    title: "나만의 한강 혼밥 브런치",
    date: "2024-07-12",
    location: "뚝섬 한강공원",
    emotion: "nostalgia",
    tags: ["#혼밥", "#힐링", "#도시라이프"],
    description: "혼자 한강에서 먹는 브런치가 이렇게 좋을 줄이야.",
    likeCount: 211,
    commentCount: 4,
    viewCount: 1409,
    trendScore: 72,
    snsMentions: 20511,
    peakMonth: "2024년 7월",
    comments: [
      {
        commentId: "4",
        username: "도시생활자",
        content: "저도 뚝섬 혼밥 자주 해요. 진짜 힐링 그 자체죠.",
        createdAt: "2025-07-15T08:40:00Z",
        likeCount: 3,
      },
    ],
  },
]
