import { toPng } from "html-to-image";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// DOM要素を高解像度のPNG(data URL)に変換する。
// フォント・アイコンの読み込みが間に合わず白抜けするケースがあるため、
// 2フレーム分待ってからキャプチャする。
// シェアカードのブランドアイコンはSVGで自己完結させているため、
// Webフォント（Google Fonts）の埋め込みは行わない（オフライン/低速回線でも
// 共有処理が固まらないようにするため）。
async function captureNodeAsPng(node, { pixelRatio = 3, backgroundColor } = {}) {
  if (!node) throw new Error("シェア対象の要素が見つかりません");

  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );

  return withTimeout(
    toPng(node, {
      pixelRatio,
      cacheBust: true,
      backgroundColor,
      skipFonts: true,
    }),
    15000,
    "画像の生成がタイムアウトしました"
  );
}

function dataUrlToBase64(dataUrl) {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

// ネイティブ（iOS）: 一時ファイルに書き出してから共有シートを開く
async function shareViaCapacitor(dataUrl, fileName, title, text) {
  const base64 = dataUrlToBase64(dataUrl);
  const written = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });

  try {
    await Share.share({
      title,
      text,
      files: [written.uri],
      dialogTitle: title,
    });
  } finally {
    Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
  }
}

// Web: Web Share API（ファイル対応時）→ 非対応ならダウンロードにフォールバック
async function shareViaWeb(dataUrl, fileName, title, text) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], fileName, { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title, text });
    return;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function shareCardAsImage(
  node,
  { fileName = "training-log-share.png", title = "Training Log", text = "" } = {}
) {
  const dataUrl = await captureNodeAsPng(node);

  if (Capacitor.isNativePlatform()) {
    await shareViaCapacitor(dataUrl, fileName, title, text);
  } else {
    await shareViaWeb(dataUrl, fileName, title, text);
  }
}
