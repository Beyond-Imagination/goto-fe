#!/usr/bin/env python3
"""
지도 홈 화면 마커 PNG를 생성하는 스크립트.

이슈유형(ObstacleIssueType) 카탈로그 하나를 여러 "마커 모양(shape)"이 공유하는 구조다 —
카탈로그를 한 곳에 두는 이유는 중간 줌 원형 배지와 가까운 줌 pin이 같은 이슈유형·같은
글리프 소스를 가리키게 해서, 두 모양의 아이콘이 서로 다른 그림으로 어긋나는 일을 막기
위해서다. 지금은 "pin" shape만 실제로 굽는다 — 기존 커밋된 원형 배지 PNG
(src/assets/icons/markers/{key}_{high,low}.png)는 이 스크립트 없이 만들어졌고 정확한
합성 파라미터(링 두께, 반투명 배경 알파, 아이콘 스케일)를 모르는 채로 재생성하면 이미
앱에 박힌 이미지와 미묘하게 달라질 위험이 있어 일부러 건드리지 않는다. 나중에 원형 배지도
이 스크립트로 관리하고 싶다면 CIRCLE 관련 렌더 함수를 채우고 SHAPES에 등록하면 된다.

컬러 규칙: pin은 카테고리와 무관하게 단일 배색이다 — 몸통 회색(#999999) + 테두리·아이콘
주황(#ED782F). 이 주황은 기존 중간 줌 배지의 ISSUE_TYPE_MARKER_COLOR.high와 동일한 값이라
새 토큰을 만들지 않고 그대로 재사용한다
(src/screens/home/obstacleSeverityStyle.ts:ISSUE_TYPE_MARKER_COLOR 참고).

실행:
  python3 -m venv scripts/.venv
  scripts/.venv/bin/pip install -r scripts/requirements.txt
  scripts/.venv/bin/python scripts/gen_marker_icons.py
"""

from __future__ import annotations

import io
import math
from dataclasses import dataclass
from pathlib import Path

import cairosvg
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
ASSETS_ICONS = REPO_ROOT / "src" / "assets" / "icons"
MARKERS_DIR = ASSETS_ICONS / "markers"

# 기존 중간 줌 배지(obstacleSeverityStyle.ts)와 동일한 주황. pin 테두리·아이콘 색으로 재사용.
PIN_ACCENT_COLOR = "#ED782F"
PIN_BODY_COLOR = "#FFFFFF"

# 최종 PNG 해상도. 실측 마커 표시 크기(약 48~56pt)에 3배수 여유를 둔 고해상도로 구워
# NaverMapMarkerOverlay가 로컬 리소스 이미지에서 width/height prop을 무시하고 원본
# 해상도로 그리는 경우에도(issueTypeMarkerIcons.ts 주석 참고) 흐려지지 않게 한다.
PIN_OUTPUT_WIDTH = 240
PIN_OUTPUT_HEIGHT = 276
# cairosvg 렌더 시 곡선이 매끈하게 나오도록 이 배수로 그렸다가 최종 해상도로 downscale.
SUPERSAMPLE = 2


@dataclass(frozen=True)
class IssueTypeGlyph:
    """이슈유형 하나의 글리프 소스. raster는 tintColor로 재색하는 기존 alpha-mask PNG,
    vector는 앱의 Icon 컴포넌트(react-native-svg)에서 그대로 옮겨온 단색 SVG 조각이다."""

    key: str  # ObstacleIssueType
    raster: str | None = None  # src/assets/icons/<raster>.png (alpha mask, RGB는 무시)
    vector: tuple[str, float, float] | None = None  # (svg 내부 마크업, viewBox width, height)


# src/screens/home/issueTypeMarkerIcons.ts의 ISSUE_TYPE_MARKER_ICON과 동일한 7종.
# vector 두 개(HIGH_CURB, SIDEWALK_DAMAGE)는 src/components/icons/Icon{HighCurb,DamagedPavement}.tsx의
# <Svg> 내부를 그대로 옮긴 것 — 그 tsx가 진짜 소스이고 여기 문자열은 그 사본이니, 원본 아이콘이
# 바뀌면 이 문자열도 같이 고쳐야 한다.
ISSUE_TYPE_GLYPHS: list[IssueTypeGlyph] = [
    IssueTypeGlyph(key="construction", raster="construction"),
    IssueTypeGlyph(
        key="high_curb",
        vector=(
            """
            <rect y="9" width="10" height="11" rx="1" fill="{color}"/>
            <path d="M14.5 10V20M17 17.5L14.5 20L12 17.5" stroke="{color}"
                  stroke-width="1.5" stroke-linecap="round" fill="none"/>
            <path d="M14.5 12.5V2.5M17 5L14.5 2.5L12 5" stroke="{color}"
                  stroke-width="1.5" stroke-linecap="round" fill="none"/>
            """,
            20,
            22,
        ),
    ),
    IssueTypeGlyph(key="long_walking_distance", raster="long_distance"),
    IssueTypeGlyph(key="narrow_passage", raster="narrow_path"),
    IssueTypeGlyph(
        key="sidewalk_damage",
        vector=(
            """
            <path d="M18 0C19.1046 0 20 0.895431 20 2V6.60449L18.6787 5.19434L13.0898 11.4209
                     L7.15137 5.19922L1.28516 11.4941L0.00976562 10.4648V14.1133L1.40918 15.3145
                     L7.1748 9.12695L13.1504 15.3877L18.7666 9.13086L20 10.4502V18
                     C20 19.1046 19.1046 20 18 20H2C0.895431 20 0 19.1046 0 18V2
                     C0 0.895431 0.895431 0 2 0H18Z" fill="{color}"/>
            """,
            20,
            20,
        ),
    ),
    IssueTypeGlyph(key="stairs", raster="stairs"),
    IssueTypeGlyph(key="steep_slope", raster="steep_slope"),
]


def _pin_outline_path(cx: float, cy: float, r: float, tip_y: float) -> str:
    """원형 머리 + 아래로 뾰족한 꼬리를 가진 표준 "지도 핀" 실루엣 한 덩어리를 그리는
    SVG path d 문자열. 꼬리 끝(tip)에서 원에 그은 두 접선 + 원의 큰 호로 구성한다 —
    이렇게 만들어야 머리/꼬리가 이어지는 부분에 테두리 선이 겹쳐 그려지지 않는다."""
    d = math.hypot(cx - cx, tip_y - cy)  # 원 중심 -> tip 거리 (수직이라 |tip_y - cy|)
    d = abs(tip_y - cy)
    # 접선 길이/각도 (원 중심-접점 반지름은 접선과 직각)
    alpha = math.acos(r / d)
    base_angle = math.pi / 2  # 원 중심에서 tip 방향(정아래) 각도
    a1 = base_angle - alpha
    a2 = base_angle + alpha
    p1 = (cx + r * math.cos(a1), cy + r * math.sin(a1))
    p2 = (cx + r * math.cos(a2), cy + r * math.sin(a2))
    tip = (cx, tip_y)
    return (
        f"M {tip[0]:.2f},{tip[1]:.2f} "
        f"L {p1[0]:.2f},{p1[1]:.2f} "
        f"A {r:.2f},{r:.2f} 0 1 0 {p2[0]:.2f},{p2[1]:.2f} "
        f"Z"
    )


def _render_svg(svg: str, width: int, height: int) -> Image.Image:
    png_bytes = cairosvg.svg2png(
        bytestring=svg.encode("utf-8"),
        output_width=width,
        output_height=height,
        background_color=None,
    )
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")


def _tint_raster_mask(name: str, color_hex: str) -> Image.Image:
    """src/assets/icons/<name>.png는 alpha만 의미 있는 검정 마스크(런타임엔 RN tintColor로
    재색). 같은 방식으로 alpha를 유지한 채 RGB만 목표 색으로 바꾼다."""
    mask = Image.open(ASSETS_ICONS / f"{name}.png").convert("RGBA")
    r, g, b = tuple(int(color_hex.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4))
    solid = Image.new("RGBA", mask.size, (r, g, b, 255))
    solid.putalpha(mask.getchannel("A"))
    return solid


def _glyph_image(glyph: IssueTypeGlyph, color_hex: str, render_size: int) -> Image.Image:
    """카테고리 글리프를 정사각 캔버스에 꽉 채운(콘텐츠 bbox 기준 크롭 후 패딩) 투명 PNG로
    반환한다 — raster/vector 두 소스가 이후 파이프라인에서 똑같이 취급되게 하기 위함."""
    if glyph.raster is not None:
        img = _tint_raster_mask(glyph.raster, color_hex)
    else:
        assert glyph.vector is not None
        markup, vb_w, vb_h = glyph.vector
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w} {vb_h}">'
            f"{markup.format(color=color_hex)}</svg>"
        )
        # 벡터는 원본 비율 그대로, 넉넉한 해상도로 렌더 후 아래에서 정사각 캔버스에 맞춘다.
        scale = render_size / max(vb_w, vb_h)
        img = _render_svg(svg, round(vb_w * scale), round(vb_h * scale))

    bbox = img.getbbox()
    if bbox is not None:
        img = img.crop(bbox)

    canvas = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    img.thumbnail((render_size, render_size), Image.LANCZOS)
    offset = ((render_size - img.width) // 2, (render_size - img.height) // 2)
    canvas.paste(img, offset, img)
    return canvas


def make_pin(glyph: IssueTypeGlyph) -> Image.Image:
    render_w = PIN_OUTPUT_WIDTH * SUPERSAMPLE
    render_h = PIN_OUTPUT_HEIGHT * SUPERSAMPLE

    cx = render_w / 2
    r = render_w * 0.42
    cy = r + render_w * 0.06
    tip_y = render_h - render_w * 0.04
    stroke_w = render_w * 0.045

    outline_svg = f"""
    <svg xmlns="http://www.w3.org/2000/svg" width="{render_w}" height="{render_h}">
      <path d="{_pin_outline_path(cx, cy, r, tip_y)}"
            fill="{PIN_BODY_COLOR}" stroke="{PIN_ACCENT_COLOR}" stroke-width="{stroke_w}"
            stroke-linejoin="round"/>
    </svg>
    """
    pin = _render_svg(outline_svg, render_w, render_h)

    glyph_size = round(r * 1.15)
    glyph_img = _glyph_image(glyph, PIN_ACCENT_COLOR, glyph_size)
    # 원형 머리의 시각 중심(cy)에 맞추되, 두꺼운 아이콘 하단부가 꼬리 쪽으로 살짝 치우쳐
    # 보이는 걸 막기 위해 살짝(반지름의 4%) 위로 올려 배치한다.
    gx = round(cx - glyph_img.width / 2)
    gy = round(cy - glyph_img.height / 2 - r * 0.04)
    pin.alpha_composite(glyph_img, (gx, gy))

    return pin.resize((PIN_OUTPUT_WIDTH, PIN_OUTPUT_HEIGHT), Image.LANCZOS)


def main() -> None:
    MARKERS_DIR.mkdir(parents=True, exist_ok=True)
    for glyph in ISSUE_TYPE_GLYPHS:
        pin = make_pin(glyph)
        out_path = MARKERS_DIR / f"pin_{glyph.key}.png"
        pin.save(out_path)
        print(f"wrote {out_path.relative_to(REPO_ROOT)} ({pin.width}x{pin.height})")


if __name__ == "__main__":
    main()
