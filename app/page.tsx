"use client";

import { ChangeEvent, CSSProperties, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type SizeOption = { size: string; dimension: string; price: string };
type FeaturedOption = { size: string; price: string };
type StickerType = "none" | "soldout" | "season" | "new" | "best";
type Product = {
  id: string;
  name: string;
  image: string;
  imageScale?: number;
  imageZoom?: number;
  imageWidth?: number;
  baseSize: string;
  basePrice: string;
  reservation: boolean;
  featuredOptions?: FeaturedOption[];
  options: SizeOption[];
  sticker?: StickerType;
  icon?: string;
};
type TypeStyle = { size: number; color: string; weight: number };
type TypeKey = "name" | "base" | "reservation" | "details" | "info" | "notice";
type StoreData = {
  id: string;
  name: string;
  title: string;
  logo: string;
  logoWidth: number;
  headerOffset: number;
  info: string;
  notice: string;
  twoTierEnabled: boolean;
  twoTierTitle: string;
  twoTierText: string;
  twoTierTitleSize: number;
  twoTierTextSize: number;
  twoTierImage: string;
  products: Product[];
  styles: Record<TypeKey, TypeStyle>;
  paper: "a4" | "a5";
};

const STORAGE_KEY = "hare-cake-menu-stores-v1";
const PUBLIC_BASE = import.meta.env.BASE_URL || "/";
const publicAsset = (name: string) => `${PUBLIC_BASE.replace(/\/?$/, "/")}${name.replace(/^\//, "")}`;
const DEFAULT_LOGO = publicAsset("harehare-logo.png");
const GITHUB_IMAGE_BASE = "https://raw.githubusercontent.com/harebakery-cmd/cake-menu/main/public/images/";

function normalizeGithubImageUrl(value: string) {
  const trimmed = value.trim();
  const blob = trimmed.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+?)(?:\?.*)?$/);
  return blob ? `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}/${blob[4]}` : trimmed;
}

function remoteImageValue(value: string) {
  return /^(data:|blob:|\/)/i.test(value) ? "" : value;
}
const stickerOptions: { value: StickerType; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "soldout", label: "SOLD OUT" },
  { value: "season", label: "시즌 상품" },
  { value: "new", label: "NEW" },
  { value: "best", label: "BEST" },
];
const iconOptions = ["", "🍓", "🥭", "🫐", "🍫", "🍒", "🌿", "⭐"];

const defaultStyles: Record<TypeKey, TypeStyle> = {
  name: { size: 15, color: "#2b2927", weight: 800 },
  base: { size: 14, color: "#514b46", weight: 500 },
  reservation: { size: 12, color: "#a64f43", weight: 800 },
  details: { size: 12, color: "#514b46", weight: 500 },
  info: { size: 11, color: "#2b2927", weight: 650 },
  notice: { size: 10, color: "#a04d43", weight: 700 },
};

const sampleProducts: Product[] = [
  {
    id: "season",
    name: "계절생크림",
    image: "",
    baseSize: "1호",
    basePrice: "29,000",
    reservation: true,
    featuredOptions: [{ size: "2호", price: "35,000" }],
    options: [
      { size: "3호", dimension: "21cm", price: "47,000" },
      { size: "4호", dimension: "24cm", price: "52,000" },
    ],
  },
  {
    id: "kirsch",
    name: "키리쉬",
    image: "",
    baseSize: "1호",
    basePrice: "28,000",
    reservation: true,
    featuredOptions: [{ size: "2호", price: "36,000" }],
    options: [
      { size: "3호", dimension: "21cm", price: "48,000" },
      { size: "4호", dimension: "24cm", price: "52,000" },
    ],
  },
  { id: "strawberry", name: "딸기밭", image: "", baseSize: "1호", basePrice: "43,000", reservation: false, options: [] },
  { id: "double", name: "쌀로만든 딸기밭", image: "", baseSize: "1호", basePrice: "39,000", reservation: false, options: [] },
  { id: "mango", name: "딸망밭", image: "", baseSize: "1호", basePrice: "43,000", reservation: false, options: [] },
  { id: "choco", name: "쇼콜라하트", image: "", baseSize: "1호", basePrice: "29,000", reservation: false, options: [] },
  { id: "blueberry", name: "블루베리", image: "", baseSize: "1호", basePrice: "32,000", reservation: false, options: [] },
];

const initialStore = (): StoreData => ({
  id: crypto.randomUUID(),
  name: "하레하레 둔산점",
  title: "하레,하레",
  logo: DEFAULT_LOGO,
  logoWidth: 150,
  headerOffset: -8,
  info: "케이크 지름 : 1호(15cm), 2호(18cm), 3호(21cm)\n딸기밭 제품은 옆면에 생크림이 안들어가서 1호 사이즈보다 조금 더 작습니다.",
  notice: "딸기 비수기에는 제철 과일로 대체되고 있습니다.",
  twoTierEnabled: true,
  twoTierTitle: "2단 케이크 예약 안내",
  twoTierText: "3일 전에 예약 가능\n케이크 다리값 7,000원 추가\n생크림·키리쉬만 주문 가능",
  twoTierTitleSize: 12,
  twoTierTextSize: 9,
  twoTierImage: "",
  products: sampleProducts,
  styles: defaultStyles,
  paper: "a4",
});

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const uid = () => crypto.randomUUID();
const processImageFile = async (file: File, callback: (data: string) => void) => {
  if (!file.type.startsWith("image/")) {
    alert("JPG, PNG 또는 WebP 사진 파일을 넣어주세요.");
    return;
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();

    const maxSide = 1200;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    sourceCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!sourceContext) throw new Error("canvas");
    sourceContext.imageSmoothingEnabled = true;
    sourceContext.imageSmoothingQuality = "high";
    sourceContext.drawImage(image, 0, 0, sourceCanvas.width, sourceCanvas.height);

    const pixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
    const cornerIndexes = [
      0,
      (sourceCanvas.width - 1) * 4,
      (sourceCanvas.height - 1) * sourceCanvas.width * 4,
      (sourceCanvas.width * sourceCanvas.height - 1) * 4,
    ];
    const hasWhiteBackground = cornerIndexes.every((index) =>
      pixels[index + 3] > 245 && pixels[index] > 245 && pixels[index + 1] > 245 && pixels[index + 2] > 245
    );
    let left = sourceCanvas.width;
    let top = sourceCanvas.height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < sourceCanvas.height; y += 1) {
      for (let x = 0; x < sourceCanvas.width; x += 1) {
        const index = (y * sourceCanvas.width + x) * 4;
        const visible = pixels[index + 3] > 12;
        const notWhite = pixels[index] < 245 || pixels[index + 1] < 245 || pixels[index + 2] < 245;
        if (visible && (!hasWhiteBackground || notWhite)) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }
    if (right < left || bottom < top) {
      left = 0;
      top = 0;
      right = sourceCanvas.width - 1;
      bottom = sourceCanvas.height - 1;
    }
    const padding = Math.round(Math.max(right - left, bottom - top) * 0.04);
    left = Math.max(0, left - padding);
    top = Math.max(0, top - padding);
    right = Math.min(sourceCanvas.width - 1, right + padding);
    bottom = Math.min(sourceCanvas.height - 1, bottom + padding);

    const cropWidth = Math.max(1, right - left + 1);
    const cropHeight = Math.max(1, bottom - top + 1);
    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(sourceCanvas, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    let quality = 0.9;
    let data = canvas.toDataURL("image/webp", quality);
    while (data.length * 0.75 > 450_000 && quality > 0.5) {
      quality -= 0.08;
      data = canvas.toDataURL("image/webp", quality);
    }
    callback(data);
  } catch {
    alert("사진을 변환하지 못했습니다. JPG, PNG 또는 WebP 파일을 선택해 주세요.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
const imageFile = async (event: ChangeEvent<HTMLInputElement>, callback: (data: string) => void) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (file) await processImageFile(file, callback);
};

export default function Home() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [activeId, setActiveId] = useState("");
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"menu" | "stores" | "type" | "print">("menu");
  const [selectedId, setSelectedId] = useState("");
  const [savedPulse, setSavedPulse] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const next = Array.isArray(parsed) && parsed.length
        ? parsed.map((item: StoreData) => ({
          ...item,
          logo: !item.logo || item.logo.endsWith("/harehare-wordmark.png") || item.logo === "/harehare-logo.png" ? DEFAULT_LOGO : item.logo,
          logoWidth: item.logoWidth || 150,
          headerOffset: Number.isFinite(item.headerOffset) ? item.headerOffset : -8,
          twoTierEnabled: item.twoTierEnabled ?? true,
          twoTierTitle: item.twoTierTitle || "2단 케이크 예약 안내",
          twoTierText: item.twoTierText || "3일 전에 예약 가능\n케이크 다리값 7,000원 추가\n생크림·키리쉬만 주문 가능",
          twoTierTitleSize: item.twoTierTitleSize || 12,
          twoTierTextSize: item.twoTierTextSize || 9,
          twoTierImage: item.twoTierImage || "",
          products: item.products.map((product, index) => {
            if (index >= 2) return product;
            const isSmallSize = (size: string) => {
              const number = Number(size.match(/\d+/)?.[0] || 0);
              return number > 0 && number < 3;
            };
            const featuredOptions = product.featuredOptions?.length
              ? product.featuredOptions
              : product.options.filter((option) => isSmallSize(option.size)).map(({ size, price }) => ({ size, price }));
            return {
              ...product,
              featuredOptions,
              options: product.options.filter((option) => !isSmallSize(option.size)),
            };
          }),
          styles: { ...defaultStyles, ...item.styles },
          }))
        : [initialStore()];
      setStores(next);
      setActiveId(next[0].id);
      setSelectedId(next[0].products[0]?.id || "");
    } catch {
      const first = initialStore();
      setStores([first]);
      setActiveId(first.id);
      setSelectedId(first.products[0].id);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !stores.length) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
    } catch {
      alert("사진 저장 공간이 부족합니다. 사용하지 않는 큰 사진을 삭제한 뒤 다시 시도해 주세요.");
    }
  }, [stores, ready]);

  const store = stores.find((item) => item.id === activeId) || stores[0];
  const product = store?.products.find((item) => item.id === selectedId) || store?.products[0];
  const secondaryCount = Math.max(0, (store?.products.length || 0) - 2);
  const columns = secondaryCount <= 4 ? Math.min(4, Math.max(2, secondaryCount)) : secondaryCount <= 9 ? 3 : 4;
  const rows = secondaryCount ? Math.ceil(secondaryCount / columns) : 0;

  const updateStore = (patch: Partial<StoreData>) => {
    setStores((current) => current.map((item) => item.id === activeId ? { ...item, ...patch } : item));
  };
  const updateProduct = (id: string, patch: Partial<Product>) => {
    updateStore({ products: store.products.map((item) => item.id === id ? { ...item, ...patch } : item) });
  };
  const saveNow = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
    setSavedPulse(true);
    window.setTimeout(() => setSavedPulse(false), 1400);
  };
  const addStore = () => {
    const next = initialStore();
    next.name = `새 점포 ${stores.length + 1}`;
    next.products = clone(store.products);
    setStores((current) => [...current, next]);
    setActiveId(next.id);
    setSelectedId(next.products[0].id);
  };
  const deleteStore = () => {
    if (stores.length === 1) return alert("점포는 한 개 이상 있어야 합니다.");
    if (!confirm(`‘${store.name}’ 점포를 삭제할까요?`)) return;
    const next = stores.filter((item) => item.id !== store.id);
    setStores(next);
    setActiveId(next[0].id);
    setSelectedId(next[0].products[0]?.id || "");
  };
  const addProduct = () => {
    const next: Product = { id: uid(), name: "새 케이크", image: "", imageScale: 0.8, baseSize: "1호", basePrice: "0", reservation: false, featuredOptions: [], options: [], sticker: "none", icon: "" };
    updateStore({ products: [...store.products, next] });
    setSelectedId(next.id);
    setTab("menu");
  };
  const removeProduct = (id: string) => {
    if (store.products.length <= 2) return alert("메인 제품 2개는 반드시 유지해야 합니다.");
    if (store.products.findIndex((item) => item.id === id) < 2) return alert("메인 제품 2개는 삭제할 수 없습니다.");
    updateStore({ products: store.products.filter((item) => item.id !== id) });
    setSelectedId(store.products[0].id);
  };
  const moveProduct = (id: string, direction: -1 | 1) => {
    const index = store.products.findIndex((item) => item.id === id);
    const target = index + direction;
    if (target < 0 || target >= store.products.length) return;
    const next = [...store.products];
    [next[index], next[target]] = [next[target], next[index]];
    updateStore({ products: next });
  };
  const exportStores = () => {
    const blob = new Blob([JSON.stringify({ version: 1, stores }, null, 2)], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `케이크-메뉴판-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };
  const importStores = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.stores) || !data.stores.length) throw new Error();
      setStores(data.stores);
      setActiveId(data.stores[0].id);
      setSelectedId(data.stores[0].products?.[0]?.id || "");
      alert(`${data.stores.length}개 점포를 불러왔습니다.`);
    } catch {
      alert("올바른 메뉴판 저장 파일이 아닙니다.");
    }
    event.target.value = "";
  };

  const pageStyle = useMemo(() => ({
    "--menu-cols": columns,
    "--name-size": `${store?.styles.name.size || 15}px`,
    "--name-color": store?.styles.name.color,
    "--name-weight": store?.styles.name.weight,
    "--base-size": `${store?.styles.base.size || 14}px`,
    "--base-color": store?.styles.base.color,
    "--base-weight": store?.styles.base.weight,
    "--reservation-size": `${store?.styles.reservation.size || 12}px`,
    "--reservation-color": store?.styles.reservation.color,
    "--reservation-weight": store?.styles.reservation.weight,
    "--details-size": `${store?.styles.details.size || 12}px`,
    "--details-color": store?.styles.details.color,
    "--details-weight": store?.styles.details.weight,
    "--info-size": `${store?.styles.info.size || 11}px`,
    "--info-color": store?.styles.info.color,
    "--info-weight": store?.styles.info.weight,
    "--notice-size": `${store?.styles.notice.size || 10}px`,
    "--notice-color": store?.styles.notice.color,
    "--notice-weight": store?.styles.notice.weight,
    "--logo-width": `${store?.logoWidth || 150}px`,
    "--header-offset": `${store?.headerOffset ?? -8}px`,
    "--tier-title-size": `${store?.twoTierTitleSize || 12}px`,
    "--tier-text-size": `${store?.twoTierTextSize || 9}px`,
  } as CSSProperties), [columns, store]);

  if (!ready || !store) return <main className="loading">메뉴판을 준비하고 있어요…</main>;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">H</span>
          <span><strong>CAKE MENU STUDIO</strong><small>점포별 메뉴판 편집기</small></span>
        </div>
        <div className="store-switcher">
          <label htmlFor="store-select">현재 점포</label>
          <select id="store-select" value={activeId} onChange={(event) => {
            setActiveId(event.target.value);
            const next = stores.find((item) => item.id === event.target.value);
            setSelectedId(next?.products[0]?.id || "");
          }}>
            {stores.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className="top-actions">
          <span className={`save-state ${savedPulse ? "show" : ""}`}>저장됨</span>
          <button className="button ghost" onClick={saveNow}>저장</button>
          <button className="button ink" onClick={() => window.print()}>인쇄하기</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="panel left-panel">
          <nav className="tabs" aria-label="편집 메뉴">
            <button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>메뉴</button>
            <button className={tab === "stores" ? "active" : ""} onClick={() => setTab("stores")}>점포 저장</button>
            <button className={tab === "type" ? "active" : ""} onClick={() => setTab("type")}>글자</button>
            <button className={tab === "print" ? "active" : ""} onClick={() => setTab("print")}>인쇄</button>
          </nav>

          {tab === "menu" && <div className="panel-body menu-panel">
            <details className="header-editor top-info-editor">
              <summary><span><b>상단 정보칸</b><small>메뉴판 왼쪽 위 안내 문구</small></span><i>편집</i></summary>
              <label className="field">기본 안내문
                <textarea rows={3} value={store.info} onChange={(event) => updateStore({ info: event.target.value })} />
              </label>
              <div className="header-style-row">
                <label>글자 크기<input type="number" min="7" max="24" value={store.styles.info.size} onChange={(event) => updateStore({ styles: { ...store.styles, info: { ...store.styles.info, size: Number(event.target.value) } } })} /></label>
                <label>색상<input type="color" value={store.styles.info.color} onChange={(event) => updateStore({ styles: { ...store.styles, info: { ...store.styles.info, color: event.target.value } } })} /></label>
              </div>
              <label className="field">강조 안내문
                <input value={store.notice} onChange={(event) => updateStore({ notice: event.target.value })} />
              </label>
              <div className="header-style-row">
                <label>글자 크기<input type="number" min="7" max="24" value={store.styles.notice.size} onChange={(event) => updateStore({ styles: { ...store.styles, notice: { ...store.styles.notice, size: Number(event.target.value) } } })} /></label>
                <label>색상<input type="color" value={store.styles.notice.color} onChange={(event) => updateStore({ styles: { ...store.styles, notice: { ...store.styles.notice, color: event.target.value } } })} /></label>
              </div>
              <label className="logo-width-control">
                <span>로고 가로 크기 <b>{store.logoWidth || 150}px</b></span>
                <input type="range" min="70" max="260" step="2" value={store.logoWidth || 150} onChange={(event) => updateStore({ logoWidth: Number(event.target.value) })} />
              </label>
              <label className="logo-width-control">
                <span>로고·정보칸 세로 위치 <b>{store.headerOffset ?? -8}px</b></span>
                <input type="range" min="-22" max="24" step="1" value={store.headerOffset ?? -8} onChange={(event) => updateStore({ headerOffset: Number(event.target.value) })} />
              </label>
              <label className="field github-image-field">GitHub 로고 이미지 주소
                <input value={remoteImageValue(store.logo)} onChange={(event) => updateStore({ logo: event.target.value })} onBlur={(event) => updateStore({ logo: normalizeGithubImageUrl(event.target.value) || DEFAULT_LOGO })} placeholder={`${GITHUB_IMAGE_BASE}logo.png`} />
                <small>공개 저장소의 이미지 주소를 넣으면 다른 PC에서도 자동 표시됩니다.</small>
              </label>
            </details>
            <details className="header-editor two-tier-editor bottom-tool">
              <summary><span><b>맨 아래 2단 케이크 안내</b><small>메인 1과 같은 크기의 독립된 칸</small></span><i>편집</i></summary>
              <label className="check-row"><input type="checkbox" checked={store.twoTierEnabled} onChange={(event) => updateStore({ twoTierEnabled: event.target.checked })} /><span>2단 케이크 안내 표시</span></label>
              <label className="field">제목<input value={store.twoTierTitle} onChange={(event) => updateStore({ twoTierTitle: event.target.value })} /></label>
              <label className="field">설명<textarea rows={4} value={store.twoTierText} onChange={(event) => updateStore({ twoTierText: event.target.value })} /></label>
              <div className="header-style-row tier-font-sizes">
                <label>제목 글자 크기<input type="number" min="8" max="28" value={store.twoTierTitleSize || 12} onChange={(event) => updateStore({ twoTierTitleSize: Number(event.target.value) })} /></label>
                <label>설명 글자 크기<input type="number" min="7" max="22" value={store.twoTierTextSize || 9} onChange={(event) => updateStore({ twoTierTextSize: Number(event.target.value) })} /></label>
              </div>
              <div className="tier-source">
                <label className={store.twoTierImage ? "active" : ""}>
                  <input type="file" accept="image/*" onChange={(event) => imageFile(event, (twoTierImage) => updateStore({ twoTierImage }))} />
                  {store.twoTierImage ? "2단 케이크 사진 바꾸기" : "2단 케이크 사진 올리기"}
                </label>
              </div>
              <label className="field github-image-field">GitHub 2단 케이크 이미지 주소
                <input value={remoteImageValue(store.twoTierImage)} onChange={(event) => updateStore({ twoTierImage: event.target.value })} onBlur={(event) => updateStore({ twoTierImage: normalizeGithubImageUrl(event.target.value) })} placeholder={`${GITHUB_IMAGE_BASE}two-tier-cake.png`} />
              </label>
            </details>
            <div className="section-heading"><span><b>상품 목록</b><small>첫 2개는 메인으로 고정됩니다</small></span><button className="mini-add" onClick={addProduct}>+ 상품</button></div>
            <div className="product-list">
              {store.products.map((item, index) => <button key={item.id} className={`product-row ${selectedId === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}>
                <span className="product-thumb">{item.image ? <img src={item.image} alt="" /> : <i>🍰</i>}</span>
                <span className="product-row-copy"><b>{item.name}</b><small>{index < 2 ? `메인 ${index + 1}` : `${item.baseSize} · ${item.basePrice}원`}</small></span>
                <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
              </button>)}
            </div>

            {product && <div className="editor">
              <div className="editor-title"><b>상품 편집</b><span>{store.products.findIndex((item) => item.id === product.id) < 2 ? "메인 상품" : "일반 상품"}</span></div>
              <label className="field">제품명<input value={product.name} onChange={(event) => updateProduct(product.id, { name: event.target.value })} /></label>
              <div className="two-fields">
                <label className="field">대표 호수<input value={product.baseSize} onChange={(event) => updateProduct(product.id, { baseSize: event.target.value })} /></label>
                <label className="field">대표 가격<input value={product.basePrice} onChange={(event) => updateProduct(product.id, { basePrice: event.target.value.replace(/[^0-9,]/g, "") })} /></label>
              </div>
              {store.products.findIndex((item) => item.id === product.id) < 2 && <div className="repeat-field"><label className="field">대표 호수 추가 <small>예약 문구 위에 표시 · 한 줄에 호수 | 가격</small>
                <textarea rows={2} value={(product.featuredOptions || []).map((option) => option.size || option.price ? `${option.size} | ${option.price}` : "").join("\n")} onChange={(event) => updateProduct(product.id, {
                  featuredOptions: event.target.value.split("\n").map((line) => {
                    const [size = "", price = ""] = line.split("|").map((part) => part.trim());
                    return { size, price };
                  }),
                })} onBlur={() => updateProduct(product.id, { featuredOptions: (product.featuredOptions || []).filter((option) => option.size || option.price) })} placeholder={"2호 | 35,000"} />
              </label><button type="button" className="inline-add" onClick={() => updateProduct(product.id, { featuredOptions: [...(product.featuredOptions || []), { size: "", price: "" }] })}>＋ 대표 호수 한 줄 추가</button></div>}
              <label
                className="upload-card"
                onDragOver={(event: DragEvent<HTMLLabelElement>) => {
                  event.preventDefault();
                  event.currentTarget.classList.add("dragging");
                }}
                onDragLeave={(event: DragEvent<HTMLLabelElement>) => event.currentTarget.classList.remove("dragging")}
                onDrop={(event: DragEvent<HTMLLabelElement>) => {
                  event.preventDefault();
                  event.currentTarget.classList.remove("dragging");
                  const file = event.dataTransfer.files?.[0];
                  if (file) void processImageFile(file, (image) => updateProduct(product.id, { image }));
                }}
              >
                <input type="file" accept="image/*" onChange={(event) => imageFile(event, (image) => updateProduct(product.id, { image }))} />
                <span className="upload-preview">{product.image ? <img src={product.image} alt={`${product.name} 미리보기`} /> : <i>＋</i>}</span>
                <span><b>{product.image ? "사진 바꾸기" : "제품 사진 올리기"}</b><small>{store.products.findIndex((item) => item.id === product.id) >= 2 ? "사진 전체 비율 유지 · 클릭 또는 드래그" : "클릭하거나 사진을 끌어놓기 · 자동 축소"}</small></span>
              </label>
              <label className="field github-image-field">GitHub 제품 이미지 주소
                <input value={remoteImageValue(product.image)} onChange={(event) => updateProduct(product.id, { image: event.target.value })} onBlur={(event) => updateProduct(product.id, { image: normalizeGithubImageUrl(event.target.value) })} placeholder={`${GITHUB_IMAGE_BASE}product-name.png`} />
                <small>GitHub의 파일 링크를 붙여 넣어도 자동으로 실제 이미지 주소로 바뀝니다.</small>
              </label>
              {store.products.findIndex((item) => item.id === product.id) >= 2 && <div className="photo-ratio-controls">
                <label className="photo-ratio-control">
                  <span>사진 크기 <b>{Math.round(getProductImageScale(product) * 100)}%</b></span>
                  <input type="range" min="0.5" max="1" step="0.05" value={getProductImageScale(product)} onChange={(event) => updateProduct(product.id, { imageScale: Number(event.target.value) })} />
                </label>
                <button type="button" onClick={() => updateProduct(product.id, { imageScale: 0.8 })}>80%로 초기화</button>
              </div>}
              <label className="check-row"><input type="checkbox" checked={product.reservation} onChange={(event) => updateProduct(product.id, { reservation: event.target.checked })} /><span>예약 주문만 가능</span></label>
              <div className="repeat-field"><label className="field">추가 규격 <small>3호부터 입력 · 개수 제한 없음 · 한 줄에 호수 | 치수 | 가격</small>
                <textarea rows={5} value={product.options.map((option) => option.size || option.dimension || option.price ? `${option.size} | ${option.dimension} | ${option.price}` : "").join("\n")} onChange={(event) => updateProduct(product.id, {
                  options: event.target.value.split("\n").map((line) => {
                      const [size = "", dimension = "", price = ""] = line.split("|").map((part) => part.trim());
                      return { size, dimension, price };
                    }).filter((option) => !option.size || Number(option.size.match(/\d+/)?.[0] || 3) >= 3),
                })} onBlur={() => updateProduct(product.id, { options: product.options.filter((option) => option.size || option.dimension || option.price) })} placeholder={"3호 | 21cm | 48,000\n4호 | 24cm | 52,000"} />
              </label><button type="button" className="inline-add" onClick={() => updateProduct(product.id, { options: [...product.options, { size: "", dimension: "", price: "" }] })}>＋ 규격 한 줄 추가</button></div>
              <details className="header-editor sticker-editor bottom-tool">
                <summary><span><b>아이콘 · 스티커</b><small>선택 상품 사진 위에 표시</small></span><i>편집</i></summary>
                <span className="picker-label">스티커</span>
                <div className="sticker-picker">
                  {stickerOptions.map((option) => <button type="button" key={option.value} className={(product.sticker || "none") === option.value ? `active ${option.value}` : option.value} onClick={() => updateProduct(product.id, { sticker: option.value })}>{option.label}</button>)}
                </div>
                <span className="picker-label">아이콘</span>
                <div className="icon-picker">
                  {iconOptions.map((icon, index) => <button type="button" key={`${icon}-${index}`} className={(product.icon || "") === icon ? "active" : ""} onClick={() => updateProduct(product.id, { icon })}>{icon || "없음"}</button>)}
                </div>
              </details>
              <div className="quick-type">
                <div className="quick-type-head">
                  <span><b>제품 글자 빠른 설정</b><small>전체 상품에 공통 적용</small></span>
                  <button type="button" onClick={() => setTab("type")}>상세 글자 설정 →</button>
                </div>
                <div className="quick-type-row">
                  <span>제품명</span>
                  <label>크기<input type="number" min="9" max="28" value={store.styles.name.size} onChange={(event) => updateStore({ styles: { ...store.styles, name: { ...store.styles.name, size: Number(event.target.value) } } })} /></label>
                  <label>색상<input type="color" value={store.styles.name.color} onChange={(event) => updateStore({ styles: { ...store.styles, name: { ...store.styles.name, color: event.target.value } } })} /></label>
                </div>
                <div className="quick-type-row">
                  <span>호수 · 가격</span>
                  <label>크기<input type="number" min="9" max="28" value={store.styles.base.size} onChange={(event) => updateStore({ styles: { ...store.styles, base: { ...store.styles.base, size: Number(event.target.value) } } })} /></label>
                  <label>색상<input type="color" value={store.styles.base.color} onChange={(event) => updateStore({ styles: { ...store.styles, base: { ...store.styles.base, color: event.target.value } } })} /></label>
                </div>
              </div>
              <div className="editor-actions">
                <button onClick={() => moveProduct(product.id, -1)}>↑ 위로</button>
                <button onClick={() => moveProduct(product.id, 1)}>↓ 아래로</button>
                <button className="danger" onClick={() => removeProduct(product.id)}>삭제</button>
              </div>
            </div>}
          </div>}

          {tab === "stores" && <div className="panel-body">
            <div className="section-heading"><span><b>점포별 저장</b><small>점포마다 메뉴가 따로 보관됩니다</small></span></div>
            <label className="field">점포명<input value={store.name} onChange={(event) => updateStore({ name: event.target.value })} /></label>
            <div className="store-list">
              {stores.map((item) => <button key={item.id} className={item.id === activeId ? "active" : ""} onClick={() => { setActiveId(item.id); setSelectedId(item.products[0]?.id || ""); }}>
                <span>{item.name}</span><small>{item.products.length}개 상품</small>
              </button>)}
            </div>
            <div className="stack-actions">
              <button className="button warm" onClick={addStore}>＋ 새 점포 만들기</button>
              <button className="button ghost" onClick={saveNow}>현재 상태 저장</button>
              <button className="button ghost" onClick={() => updateStore({ logo: DEFAULT_LOGO })}>하레하레 한글 로고 사용</button>
              <button className="button ghost" onClick={exportStores}>저장 파일 내보내기</button>
              <button className="button ghost" onClick={() => importRef.current?.click()}>저장 파일 불러오기</button>
              <button className="text-danger" onClick={deleteStore}>현재 점포 삭제</button>
            </div>
            <input ref={importRef} hidden type="file" accept=".json,application/json" onChange={importStores} />
            <p className="helper">자동 저장은 현재 브라우저에 보관됩니다. 다른 컴퓨터로 옮길 때는 저장 파일을 내보내세요.</p>
          </div>}

          {tab === "type" && <div className="panel-body">
            <div className="section-heading"><span><b>글자 스타일</b><small>기본 글꼴은 Pretendard입니다</small></span></div>
            <div className="font-family-card"><span>글꼴</span><b>Pretendard</b><small>가독성이 좋은 한국어 기본 서체</small></div>
            {([
              ["name", "제품명"],
              ["base", "대표 호수 · 가격"],
              ["reservation", "예약주문 문구"],
              ["details", "호수 · 치수 · 가격"],
              ["info", "상단 기본 안내문"],
              ["notice", "상단 강조 안내문"],
            ] as [TypeKey, string][]).map(([key, label]) => <div className="type-control" key={key}>
              <b>{label}</b>
              <div className="type-grid">
                <label>크기<input type="number" min="9" max="28" value={store.styles[key].size} onChange={(event) => updateStore({ styles: { ...store.styles, [key]: { ...store.styles[key], size: Number(event.target.value) } } })} /></label>
                <label>굵기<select value={store.styles[key].weight} onChange={(event) => updateStore({ styles: { ...store.styles, [key]: { ...store.styles[key], weight: Number(event.target.value) } } })}><option value="400">보통</option><option value="500">중간</option><option value="700">굵게</option><option value="800">아주 굵게</option></select></label>
                <label>색상<span className="color-control"><input type="color" value={store.styles[key].color} onChange={(event) => updateStore({ styles: { ...store.styles, [key]: { ...store.styles[key], color: event.target.value } } })} /><code>{store.styles[key].color}</code></span></label>
              </div>
            </div>)}
          </div>}

          {tab === "print" && <div className="panel-body">
            <div className="section-heading"><span><b>인쇄 설정</b><small>인쇄 전 미리보기를 확인하세요</small></span></div>
            <div className="paper-options">
              <button className={store.paper === "a4" ? "active" : ""} onClick={() => updateStore({ paper: "a4" })}><span className="paper-icon a4" /><b>A4</b><small>210 × 297mm</small></button>
              <button className={store.paper === "a5" ? "active" : ""} onClick={() => updateStore({ paper: "a5" })}><span className="paper-icon a5" /><b>A5 재단</b><small>146 × 208mm</small></button>
            </div>
            <div className="print-note">
              <b>{store.paper === "a4" ? "A4 실제 크기" : "A5 -2mm 재단 크기"}</b>
              <p>{store.paper === "a4" ? "A4 용지 전체에 메뉴판이 인쇄됩니다." : "가로와 세로를 각각 2mm 줄인 146 × 208mm입니다. 검은 재단선이 함께 인쇄됩니다."}</p>
            </div>
            <button className="button ink full" onClick={() => window.print()}>인쇄 미리보기 열기</button>
            <p className="helper">인쇄 창에서 배율은 100%, 여백은 없음, 배경 그래픽은 켜짐으로 설정해 주세요.</p>
          </div>}
        </aside>

        <section className="preview-stage">
          <div className="preview-toolbar">
            <span><i className="live-dot" /> 실시간 미리보기</span>
            <span>자동 배치 <b>{columns}열 × {rows}행</b></span>
            <span>{store.paper === "a4" ? "A4 · 210 × 297mm" : "A5 재단 · 146 × 208mm"}</span>
          </div>
          <div className={`print-sheet ${store.paper}`}>
            <article className={`menu-page paper-${store.paper}`} style={pageStyle}>
              <div className="crop corner-tl" /><div className="crop corner-tr" /><div className="crop corner-bl" /><div className="crop corner-br" />
              <div className="menu-border">
                <header className="menu-header">
                  <label className="logo-space">
                    <input type="file" accept="image/*" onChange={(event) => imageFile(event, (logo) => updateStore({ logo }))} />
                    {store.logo ? <img src={store.logo} alt="점포 로고" /> : <span><b>{store.title}</b><small>로고 공간 · 클릭하여 업로드</small></span>}
                  </label>
                  <textarea className="info-input" value={store.info} onChange={(event) => updateStore({ info: event.target.value })} aria-label="상단 안내 정보" />
                  <input className="notice-input" value={store.notice} onChange={(event) => updateStore({ notice: event.target.value })} aria-label="강조 안내문" />
                </header>
                <section className="product-area">
                  <div className="main-products">
                    {store.products.slice(0, 2).map((item) => <MenuProduct key={item.id} product={item} main selected={selectedId === item.id} onSelect={() => { setSelectedId(item.id); setTab("menu"); }} />)}
                  </div>
                  <div className="secondary-products">
                    {store.products.slice(2).map((item) => <MenuProduct key={item.id} product={item} selected={selectedId === item.id} onSelect={() => { setSelectedId(item.id); setTab("menu"); }} />)}
                  </div>
                  {store.twoTierEnabled && <div className="two-tier-panel">
                    <div className="two-tier-image">
                      {store.twoTierImage ? <img src={store.twoTierImage} alt="2단 케이크 안내" /> : <span>🎂<small>별도 사진 추가</small></span>}
                    </div>
                    <div className="two-tier-copy">
                      <b>{store.twoTierTitle}</b>
                      <p>{store.twoTierText}</p>
                    </div>
                  </div>}
                </section>
                <footer><span>HARE,HARE CAKE MENU</span><span>{store.name}</span></footer>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}

function getProductImageScale(product: Product) {
  const legacyScale = product.imageZoom === product.imageWidth ? product.imageZoom : undefined;
  return Math.min(1, Math.max(0.5, product.imageScale || legacyScale || 0.8));
}

function MenuProduct({ product, main = false, selected, onSelect }: { product: Product; main?: boolean; selected: boolean; onSelect: () => void }) {
  const imageScale = getProductImageScale(product);
  return <button className={`menu-product ${main ? "main-product" : ""} ${selected ? "editing" : ""}`} style={{
    "--image-scale": main ? 1 : imageScale,
  } as CSSProperties} onClick={onSelect}>
    <div className="cake-image">
      {product.image ? <img src={product.image} alt={product.name} /> : <span className="cake-placeholder"><i>🍰</i><small>사진 추가</small></span>}
      {product.icon && <span className="product-icon" aria-hidden="true">{product.icon}</span>}
      {product.sticker && product.sticker !== "none" && <span className={`product-sticker ${product.sticker}`}>{stickerOptions.find((item) => item.value === product.sticker)?.label}</span>}
    </div>
    <div className="product-copy">
      <b className="product-name">{product.name}</b>
      <span className="base-line">{product.baseSize} <strong>{product.basePrice}</strong></span>
      {main && (product.featuredOptions || []).filter((option) => option.size || option.price).map((option, index) => <span className="base-line featured-line" key={`${option.size}-${index}`}>{option.size} <strong>{option.price}</strong></span>)}
      {product.reservation && <em>*예약 주문만 가능*</em>}
      {product.options.filter((option) => option.size || option.dimension || option.price).map((option, index) => <span className="option-line" key={`${option.size}-${index}`}><b>{option.size}</b>{option.dimension && <i>({option.dimension})</i>} <strong>{option.price}</strong></span>)}
    </div>
  </button>;
}
