/** 바텀시트 선택 상태 종류 */
export const mapHomeBottomSheetSelectionKind = {
  /** 아무것도 선택되지 않은 초기/빈 상태 (기본 안내 표출) */
  empty: "empty",
  /** 지도의 특정 시설물(Facility)이 선택된 상태 */
  facility: "facility",
  /** 지도의 특정 장소(Place)가 선택된 상태 */
  place: "place"
} as const;

export type MapHomeBottomSheetSelectionKind =
  (typeof mapHomeBottomSheetSelectionKind)[keyof typeof mapHomeBottomSheetSelectionKind];

/** 바텀시트 리스트에 노출되는 단일 항목 데이터 구조 */
export type MapHomeBottomSheetItem = {
  readonly description: string;
  readonly id: string;
  readonly title: string;
};

/** 시설물 또는 장소 선택 시 전달받는 상세 컨텐츠 데이터 */
export type MapHomeBottomSheetSelectionData = {
  readonly id: string;
  readonly items: readonly MapHomeBottomSheetItem[];
  readonly summary: string;
  readonly title: string;
};

/** 지도 홈 바텀시트의 상태 (Discriminated Union) */
export type MapHomeBottomSheetSelection =
  /** 1. 아무 대상도 선택되지 않은 초기 안내 상태 */
  | { readonly kind: typeof mapHomeBottomSheetSelectionKind.empty }
  /** 2. 특정 시설물이 선택된 상태 (시설물 상세 정보 바인딩) */
  | {
      readonly data: MapHomeBottomSheetSelectionData;
      readonly kind: typeof mapHomeBottomSheetSelectionKind.facility;
    }
  /** 3. 특정 장소가 선택된 상태 (장소 상세 정보 바인딩) */
  | {
      readonly data: MapHomeBottomSheetSelectionData;
      readonly kind: typeof mapHomeBottomSheetSelectionKind.place;
    };

/**
 * TOUR_API 또는 백엔드 DB에서 수신되는 장소(Place) RAW 데이터 모델입니다.
 */
export type PlaceRawData = {
  readonly id: number;
  readonly external_id: string;
  readonly source: string;
  readonly category_code: string;
  readonly name: string;
  readonly sanitized_address: string;
  readonly location_point: string;
  readonly thumbnail_url: string | null;
  readonly overview: string;
  readonly homepage: string | null;
  readonly tel: string | null;
  readonly content_type_id: string;
  readonly detail_with_tour_payload?: Record<string, string>;
  readonly detail_intro_payload?: Record<string, string>;
};

/**
 * 실사 장소 데이터 예시 (TOUR_API DB 모델 기반 9종)
 */
export const rawPlaceFixtures: readonly PlaceRawData[] = [
  {
    id: 602,
    external_id: "126398",
    source: "TOUR_API",
    category_code: "HS010200",
    name: "고창읍성",
    sanitized_address: "전북특별자치도 고창군 고창읍 모양성로 1",
    location_point: "POINT (126.7043914324 35.4302857661)",
    thumbnail_url: "https://tong.visitkorea.or.kr/cms/resource/91/4094591_image2_1.jpg",
    overview:
      "조선시대 고창현의 읍성으로서 장성 입암산성과 함께 호남 내륙을 방어하는 전초 기지의 역할을 하였다.\n고창읍성은 세 번의 전투가 이루어 졌으며, 첫 번째는 정유재란, 두 번째는 동학농민혁명, 세 번째는 6.25사변 때라고 전해지고 있다.",
    homepage: "https://www.gochang.go.kr/donghak",
    tel: null,
    content_type_id: "12",
    detail_with_tour_payload: {
      exit: "휠체어 접근 가능함(단, 흙길이므로 진입가능 구간이 적음)",
      parking: "장애인 주차장 있음(2대/신재효 판소리공원)_무장애 편의시설",
      restroom: "장애인 화장실 있음",
      route: "출입구까지 경사로가 설치되어 있음(완만함)"
    },
    detail_intro_payload: {
      infocenter: "063-560-8067",
      parking: "가능",
      restdate: "연중무휴",
      usetime: "05:00~22:00"
    }
  },
  {
    id: 3286,
    external_id: "2650992",
    source: "TOUR_API",
    category_code: "VE070200",
    name: "밀양의열기념관",
    sanitized_address: "경상남도 밀양시 노상하1길 25-12",
    location_point: "POINT (128.7509353039 35.4936063342)",
    thumbnail_url: "https://tong.visitkorea.or.kr/cms/resource/28/3507828_image2_1.jpg",
    overview:
      "2018년 3월 7일 약산 김원봉 장군의 생가터에 문을 연 밀양의열기념관은 전국 최초로 건립된 의열 독립운동 기념관이다.",
    homepage: "https://www.myfmc.or.kr/euiyeol/_Web/",
    tel: null,
    content_type_id: "14",
    detail_with_tour_payload: {
      exit: "주출입구는 경사로가 있어 휠체어 접근 가능함(수동문)",
      helpdog: "동반가능_시각장애인 편의시설",
      publictransport: "출입구까지 경사로가 설치되어 있음_무장애 편의시설"
    },
    detail_intro_payload: {
      infocenterculture: "055-351-0815",
      parkingculture: "가능(관내 주차공간 협소, 인근 공한지 주차장 이용)",
      restdateculture: "매주 월요일 (월요일이 공휴일인 경우 그 다음 평일 휴관)",
      usefee: "무료",
      usetimeculture: "09:00~17:30 (휴게시간 12:00~13:00 / 마지막 입장 16:45)"
    }
  },
  {
    id: 3435,
    external_id: "731587",
    source: "TOUR_API",
    category_code: "HS040100",
    name: "백마고지 위령비와 기념관",
    sanitized_address: "강원특별자치도 철원군 철원읍 대마1길 72",
    location_point: "POINT (127.1655698058 38.2689856439)",
    thumbnail_url: "https://tong.visitkorea.or.kr/cms/resource/01/3337801_image2_1.jpg",
    overview:
      "백마고지 전투는 한국전쟁 중 철원군 무명 고지를 놓고 벌어진 혈전으로 국군의 승리로 매듭지어진 전투를 기념하는 전적지이다.",
    homepage: "https://www.cwg.go.kr/tour/",
    tel: null,
    content_type_id: "12",
    detail_with_tour_payload: {
      restroom: "장애인 전용 화장실 있음(백마고지 휴게소, 경사로 설치됨)",
      route: "출입구까지 경사로가 설치되어 있음"
    },
    detail_intro_payload: {
      infocenter: "033-455-8436(백마고지 기념관)",
      parking: "가능",
      restdate: "연중무휴",
      usetime: "상시 개방"
    }
  },
  {
    id: 3466,
    external_id: "1103949",
    source: "TOUR_API",
    category_code: "VE050100",
    name: "백제문화단지",
    sanitized_address: "충청남도 부여군 규암면 백제문로 455",
    location_point: "POINT (126.906760402927 36.3065343564356)",
    thumbnail_url: "https://tong.visitkorea.or.kr/cms/resource/13/3578213_image2_1.jpg",
    overview:
      "충청남도 부여군에 위치한 백제문화단지는 찬란했던 백제역사문화의 우수성을 알리고자 건립한 한국 최대 규모의 역사테마파크이다.",
    homepage: "http://www.bhm.or.kr",
    tel: null,
    content_type_id: "12",
    detail_with_tour_payload: {
      elevator: "엘리베이터 있음(백제역사문화관 내)",
      exit: "주출입구는 경사로가 있어 휠체어 접근 가능함",
      parking: "장애인 주차장 있음_무장애 편의시설",
      restroom: "장애인 화장실 있음",
      route: "출입구까지 경사로가 설치되어 있음",
      stroller: "대여가능(10대)",
      wheelchair: "대여가능"
    },
    detail_intro_payload: {
      expguide: "잉어 먹이주기 체험 / 연날리기 체험 / 활쏘기 체험 등",
      infocenter: "041-408-7290",
      parking: "가능",
      restdate: "매주 월요일(월요일이 공휴일인 경우 그 다음날 휴관)",
      usetime: "09:00~18:00 (하절기 야간개장 18:00~22:00)"
    }
  },
  {
    id: 3467,
    external_id: "2536623",
    source: "TOUR_API",
    category_code: "VE070100",
    name: "백제문화체험박물관",
    sanitized_address: "충청남도 청양군 대치면 장곡길 43-24",
    location_point: "POINT (126.8457482121 36.405899801)",
    thumbnail_url: null,
    overview:
      "백제문화체험박물관은 백제시대 토기를 굽는 가마를 형상화하여 건립되었으며, 백제 가마터 및 다양한 체험을 즐길 수 있는 공간이다.",
    homepage: "http://www.cheongyang.go.kr/museum.do",
    tel: null,
    content_type_id: "14",
    detail_with_tour_payload: {
      braileblock: "건물 출입구, 계단",
      exit: "출입통로는 눌러야 열리는 자동문 형태 (휠체어/스쿠터 이동 가능)",
      parking: "장애인 전용 주차구역 주차 가능(2대)",
      restroom: "장애인 화장실 위치 : 2층 (손잡이, 호출 벨 설치됨)",
      route: "출입구까지 경사로가 설치되어 있음",
      stroller: "유아차 대여 가능(매표소, 2대)",
      wheelchair: "휠체어 대여 가능(매표소, 2대)"
    },
    detail_intro_payload: {
      infocenterculture: "041-940-4874",
      parkingculture: "가능",
      restdateculture: "매주 월요일 / 1월 1일 / 설·추석 당일",
      usefee: "일반 2,000원 / 청소년 1,500원 / 어린이 1,000원",
      usetimeculture: "09:00~18:00 (11월~2월 동절기 17:00까지)"
    }
  },
  {
    id: 3468,
    external_id: "129218",
    source: "TOUR_API",
    category_code: "HS030100",
    name: "백제불교최초도래지",
    sanitized_address: "전남광주통합특별시 영광군 법성면 백제문화로 203",
    location_point: "POINT (126.43030697353505 35.36199787665402)",
    thumbnail_url: "https://tong.visitkorea.or.kr/cms/resource/32/3582432_image2_1.jpg",
    overview:
      "인도 승려 '마라난타 존자'가 영광 법성포를 통해 백제 불교를 전파하며 시작된 유서 깊은 불교 성지 및 기념 관광 명소이다.",
    homepage: "http://tour.yeonggwang.go.kr",
    tel: null,
    content_type_id: "12",
    detail_with_tour_payload: {
      elevator: "엘리베이터 있음(마라난타존자상 뒷편)",
      exit: "주출입구는 턱이 없어 휠체어 접근 가능함",
      parking: "장애인 주차장 있음_무장애 편의시설",
      restroom: "장애인 화장실 있음(법성포구 방향 공용 주차장)",
      route: "출입구까지 턱이 없어 휠체어 접근 가능함",
      wheelchair: "대여가능"
    },
    detail_intro_payload: {
      infocenter: "061-350-5999",
      parking: "가능",
      restdate: "연중무휴",
      usetime: "엘리베이터 운영시간 09:00~17:00"
    }
  },
  {
    id: 3469,
    external_id: "130875",
    source: "TOUR_API",
    category_code: "VE070300",
    name: "백제역사문화관",
    sanitized_address: "충청남도 부여군 규암면 백제문로 455",
    location_point: "POINT (126.9084947393775 36.30757135317562)",
    thumbnail_url: "https://tong.visitkorea.or.kr/cms/resource/89/3568089_image2_1.jpg",
    overview:
      "백제문화단지 내에 건립된 전시관으로, 백제 시대의 축소 모형과 모션 그래픽, 상설 전시실을 통해 백제 역사를 배울 수 있는 종합 문화관이다.",
    homepage: "https://www.bhm.or.kr/",
    tel: null,
    content_type_id: "14",
    detail_with_tour_payload: {
      elevator: "엘리베이터 있음",
      exit: "주출입구는 단차가 없어 휠체어 접근 가능함",
      parking: "장애인 전용 주차구역 있음(36면)",
      restroom: "장애인 전용 화장실(1층)",
      route: "출입구까지 단차가 없어 휠체어 접근 가능함",
      stroller: "무료대여(10대)",
      wheelchair: "무료대여(10대)"
    },
    detail_intro_payload: {
      infocenterculture: "041-408-7290",
      restdateculture: "월요일(월요일이 공휴일인 경우 개관)",
      usefee: "성인 6,000원 / 청소년 4,500원 / 소인 3,000원",
      usetimeculture: "09:00~18:00 (11월~2월 17:00까지)"
    }
  },
  {
    id: 3470,
    external_id: "2790917",
    source: "TOUR_API",
    category_code: "VE070100",
    name: "백제왕궁박물관",
    sanitized_address: "전북특별자치도 익산시 왕궁면 궁성로 666",
    location_point: "POINT (127.0558078132 35.971557721)",
    thumbnail_url: "https://tong.visitkorea.or.kr/cms/resource/63/4078163_image2_1.jpg",
    overview:
      "유네스코 세계유산 백제 역사 유적지구인 왕궁리 유적에서 발굴된 유산을 전시하고 ICT 체험관을 갖춘 박물관이다.",
    homepage: "https://www.iksan.go.kr/wg",
    tel: null,
    content_type_id: "14",
    detail_with_tour_payload: {
      brailepromotion: "촉지안내도 있음",
      elevator: "엘리베이터 있음",
      exit: "주출입구에 휠체어가 통과 가능함",
      lactationroom: "수유실 있음",
      parking: "장애인 주차장 있음",
      restroom: "장애인용 화장실 있음",
      route: "휠체어가 올라갈 수 있는 경사로가 설치되어 있음",
      stroller: "무료 대여",
      wheelchair: "무료 대여"
    },
    detail_intro_payload: {
      infocenterculture: "063-859-4631, 4363",
      restdateculture: "1월 1일 / 매주 월요일",
      usefee: "무료",
      usetimeculture: "09:00~18:00"
    }
  },
  {
    id: 3471,
    external_id: "2917465",
    source: "TOUR_API",
    category_code: "FD010100",
    name: "백제칼국수",
    sanitized_address: "경상남도 거제시 장평로4길 24",
    location_point: "POINT (128.6144375585 34.8934135435)",
    thumbnail_url: "http://tong.visitkorea.or.kr/cms/resource/58/2917458_image2_1.jpg",
    overview:
      "한우 사골을 우려낸 육수와 자가제면 칼국수를 선보이는 경남 거제시의 장평동 칼국수 전문점이다.",
    homepage: "",
    tel: null,
    content_type_id: "39",
    detail_with_tour_payload: {
      exit: "여닫이문 출입통로가 넓어 휠체어/스쿠터 진입 용이함",
      handicapetc: "의자식 테이블 있음_무장애 편의시설",
      route: "테이블 간격이 넓어 휠체어 이용 쉬움 (내부 턱 없음)"
    },
    detail_intro_payload: {
      firstmenu: "칼국수",
      infocenterfood: "055-633-4460",
      opentimefood: "11:30~15:00 (라스트오더 14:30)",
      parkingfood: "가능(무료)",
      restdatefood: "매주 월요일~화요일",
      treatmenu: "비빔국수 / 수육"
    }
  },
  {
    id: 3472,
    external_id: "644428",
    source: "TOUR_API",
    category_code: "FD020200",
    name: "백천선어마을",
    sanitized_address: "전남광주통합특별시 여수시 공화남2길 2",
    location_point: "POINT (127.7414535793 34.7491114842)",
    thumbnail_url: null,
    overview:
      "여수 교동시장의 신선한 선어회와 두툼한 횟감을 대를 이어 정성껏 대접하는 전통 있는 맛집이다.",
    homepage: "",
    tel: null,
    content_type_id: "39",
    detail_with_tour_payload: {
      exit: "주출입구 경사로 설치 (수동문)",
      handicapetc: "의자식 테이블 있음",
      route: "출입구까지 경사로 설치됨"
    },
    detail_intro_payload: {
      firstmenu: "모듬회",
      infocenterfood: "061-663-8252",
      opentimefood: "11:00~21:00 (브레이크타임 15:00~17:00)",
      parkingfood: "가능",
      restdatefood: "명절 연휴"
    }
  }
];

/**
 * [추후 확장 및 백엔드 API 연동 가이드]
 * 백엔드 DB 또는 TOUR_API에서 가져온 RAW 장소 데이터(`PlaceRawData`)를
 * 바텀시트 Provider에서 수용할 수 있는 `MapHomeBottomSheetSelectionData` 구조로 변환합니다.
 *
 * 이 유틸리티로 생성된 객체를 `useMapHomeBottomSheet().showPlace(selectionData)`로 넘기면,
 * `MapHomeBottomSheetProvider`의 내부 상태 `selection`이 아래와 같이 업데이트됩니다:
 *
 * ```ts
 * // Provider 상태 세팅 예시:
 * {
 *   kind: "place",
 *   data: {
 *     id: "place-602",
 *     title: "고창읍성",
 *     summary: "전북특별자치도 고창군 고창읍 모양성로 1",
 *     items: [
 *       { id: "place-602-overview", title: "장소 개요", description: "조선시대 고창현의..." },
 *       { id: "place-602-exit", title: "주출입구", description: "휠체어 접근 가능함..." },
 *       { id: "place-602-parking", title: "장애인 주차장", description: "장애인 주차장 있음..." }
 *     ]
 *   }
 * }
 * ```
 */
export function transformPlaceToSelectionData(place: PlaceRawData): MapHomeBottomSheetSelectionData {
  const items: MapHomeBottomSheetItem[] = [];

  // 1. 장소 개요
  if (place.overview) {
    items.push({
      description: place.overview.trim(),
      id: `place-${String(place.id)}-overview`,
      title: "장소 개요"
    });
  }

  // 2. 무장애 편의 시설 정보 (TOUR_API payload)
  const tour = place.detail_with_tour_payload;
  if (tour) {
    if (tour.exit) {
      items.push({ description: tour.exit, id: `place-${String(place.id)}-exit`, title: "주출입구" });
    }
    if (tour.route) {
      items.push({ description: tour.route, id: `place-${String(place.id)}-route`, title: "접근로" });
    }
    if (tour.parking) {
      items.push({ description: tour.parking, id: `place-${String(place.id)}-parking`, title: "장애인 주차장" });
    }
    if (tour.restroom) {
      items.push({ description: tour.restroom, id: `place-${String(place.id)}-restroom`, title: "장애인 화장실" });
    }
    if (tour.elevator) {
      items.push({ description: tour.elevator, id: `place-${String(place.id)}-elevator`, title: "엘리베이터" });
    }
    if (tour.wheelchair) {
      items.push({ description: tour.wheelchair, id: `place-${String(place.id)}-wheelchair`, title: "휠체어 대여" });
    }
    if (tour.stroller) {
      items.push({ description: tour.stroller, id: `place-${String(place.id)}-stroller`, title: "유모차/유아차" });
    }
    if (tour.handicapetc) {
      items.push({ description: tour.handicapetc, id: `place-${String(place.id)}-handicapetc`, title: "기타 편의시설" });
    }
  }

  // 3. 운영 / 이용 정보 (TOUR_API intro payload)
  const intro = place.detail_intro_payload;
  if (intro) {
    const usetime = intro.usetime || intro.usetimeculture || intro.opentimefood;
    if (usetime) {
      items.push({
        description: usetime.replace(/<br\s*\/?>/gi, " / "),
        id: `place-${String(place.id)}-usetime`,
        title: "이용 시간"
      });
    }
    const restdate = intro.restdate || intro.restdateculture || intro.restdatefood;
    if (restdate) {
      items.push({ description: restdate, id: `place-${String(place.id)}-restdate`, title: "휴무일" });
    }
    const usefee = intro.usefee;
    if (usefee) {
      items.push({ description: usefee.replace(/<br\s*\/?>/gi, " / "), id: `place-${String(place.id)}-usefee`, title: "이용 요금" });
    }
    const infocenter = intro.infocenter || intro.infocenterculture || intro.infocenterfood;
    if (infocenter) {
      items.push({ description: infocenter, id: `place-${String(place.id)}-infocenter`, title: "문의처" });
    }
  }

  return {
    id: `place-${String(place.id)}`,
    items,
    summary: place.sanitized_address,
    title: place.name
  };
}

const DETAIL_ITEM_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function createDetailItems(prefix: string): readonly MapHomeBottomSheetItem[] {
  return DETAIL_ITEM_INDEXES.map((index) => ({
    description: "확장 상태에서만 이 목록을 스크롤할 수 있어요.",
    id: `${prefix}-${String(index)}`,
    title: `${prefix} ${String(index).padStart(2, "0")}`
  }));
}

const emptyMapHomeBottomSheetContent: MapHomeBottomSheetSelectionData = {
  id: "empty",
  items: [
    {
      description: "선택한 대상의 정보가 이 영역에 표시됩니다.",
      id: "empty-selection",
      title: "시설물이나 장소를 선택해 주세요."
    }
  ],
  summary: "시설물이나 장소를 선택하면 상세 정보를 확인할 수 있어요.",
  title: "지도를 탐색해 보세요"
};

export const mapHomeBottomSheetSelection = {
  empty: { kind: mapHomeBottomSheetSelectionKind.empty }
} as const satisfies Record<"empty", MapHomeBottomSheetSelection>;

export const mapHomeBottomSheetFixtureData = {
  facility: {
    id: "fixture-facility",
    items: createDetailItems("시설물 상세 항목"),
    summary: "선택한 시설물의 상세 정보를 확인할 수 있어요.",
    title: "시설물 정보"
  },
  place: transformPlaceToSelectionData(rawPlaceFixtures[0])
} as const satisfies Record<"facility" | "place", MapHomeBottomSheetSelectionData>;

class MapHomeBottomSheetSelectionError extends Error {
  constructor() {
    super("Unsupported home map Bottom Sheet selection.");
    this.name = "MapHomeBottomSheetSelectionError";
  }
}

function assertNever(value: never): never {
  void value;
  throw new MapHomeBottomSheetSelectionError();
}

export function getMapHomeBottomSheetSelectionData(
  selection: MapHomeBottomSheetSelection
): MapHomeBottomSheetSelectionData {
  switch (selection.kind) {
    case mapHomeBottomSheetSelectionKind.empty:
      return emptyMapHomeBottomSheetContent;
    case mapHomeBottomSheetSelectionKind.facility:
    case mapHomeBottomSheetSelectionKind.place:
      return selection.data;
    default:
      return assertNever(selection);
  }
}

export function mapHomeBottomSheetItemKey(item: MapHomeBottomSheetItem): string {
  return item.id;
}
