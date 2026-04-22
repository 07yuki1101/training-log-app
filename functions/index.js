const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

const tanitaClientId     = defineSecret("TANITA_CLIENT_ID");
const tanitaClientSecret = defineSecret("TANITA_CLIENT_SECRET");
const tanitaRedirectUri  = defineSecret("TANITA_REDIRECT_URI");
const tanitaAppUrl       = defineSecret("TANITA_APP_URL");

// アクセストークンを返す（期限切れなら自動リフレッシュ）
async function getValidAccessToken(uid, clientId, clientSecret, redirectUri) {
  const tokenRef = admin.firestore().doc(`users/${uid}/tokens/tanita`);
  const snap = await tokenRef.get();
  if (!snap.exists) throw new Error("未連携");

  const {accessToken, refreshToken, expiresAt} = snap.data();

  if (expiresAt && Date.now() < expiresAt - 5 * 60 * 1000) {
    return accessToken;
  }

  // リフレッシュ
  const res = await fetch("https://www.healthplanet.jp/oauth/token", {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("トークンリフレッシュ失敗");

  await tokenRef.update({
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
  return data.access_token;
}

// 1) 連携開始 → HealthPlanet の同意画面へリダイレクト
exports.tanitaConnect = onRequest(
    {region: "asia-northeast1", secrets: [tanitaClientId, tanitaRedirectUri]},
    (req, res) => {
      const uid = req.query.uid;
      if (!uid) {
        res.status(400).send("uid が必要です");
        return;
      }

      const authUrl = new URL("https://www.healthplanet.jp/oauth/auth");
      authUrl.searchParams.set("client_id", tanitaClientId.value());
      authUrl.searchParams.set("redirect_uri", tanitaRedirectUri.value());
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "innerscan");
      authUrl.searchParams.set("state", uid);

      res.redirect(authUrl.toString());
    },
);

// 2) OAuthコールバック → トークン保存 → アプリへリダイレクト
exports.tanitaCallback = onRequest(
    {
      region: "asia-northeast1",
      secrets: [tanitaClientId, tanitaClientSecret, tanitaRedirectUri, tanitaAppUrl],
    },
    async (req, res) => {
      const {code, state: uid} = req.query;
      const appUrl = tanitaAppUrl.value();

      if (!code || !uid) {
        res.redirect(`${appUrl}?tanita=error`);
        return;
      }

      try {
        const tokenRes = await fetch("https://www.healthplanet.jp/oauth/token", {
          method: "POST",
          headers: {"Content-Type": "application/x-www-form-urlencoded"},
          body: new URLSearchParams({
            client_id: tanitaClientId.value(),
            client_secret: tanitaClientSecret.value(),
            redirect_uri: tanitaRedirectUri.value(),
            code,
            grant_type: "authorization_code",
          }),
        });
        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
          res.redirect(`${appUrl}?tanita=error`);
          return;
        }

        await admin.firestore().doc(`users/${uid}/tokens/tanita`).set({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: Date.now() + tokenData.expires_in * 1000,
          connectedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.redirect(`${appUrl}?tanita=connected`);
      } catch (err) {
        console.error("callback error:", err);
        res.redirect(`${appUrl}?tanita=error`);
      }
    },
);

// 3) データ同期 → HealthPlanet から体重取得 → Firestore へ保存
exports.tanitaSync = onRequest(
    {
      region: "asia-northeast1",
      secrets: [tanitaClientId, tanitaClientSecret, tanitaRedirectUri],
    },
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", "*");
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "GET");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
      }

      const uid = req.query.uid;
      if (!uid) {
        res.status(400).json({error: "uid が必要です"});
        return;
      }

      try {
        const accessToken = await getValidAccessToken(
            uid,
            tanitaClientId.value(),
            tanitaClientSecret.value(),
            tanitaRedirectUri.value(),
        );

        // 過去1年分を取得
        const to = new Date();
        const from = new Date(to);
        from.setFullYear(from.getFullYear() - 1);
        const fmt = (d) =>
          `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}0000`;

        const apiUrl = new URL("https://www.healthplanet.jp/status/innerscan.json");
        apiUrl.searchParams.set("access_token", accessToken);
        apiUrl.searchParams.set("date", "1"); // 測定日基準
        apiUrl.searchParams.set("from", fmt(from));
        apiUrl.searchParams.set("to", fmt(to));
        apiUrl.searchParams.set("tag", "6021"); // 体重

        const dataRes = await fetch(apiUrl.toString());
        const {data} = await dataRes.json();

        if (!data?.length) {
          res.json({synced: 0});
          return;
        }

        // 既存日付を取得して重複スキップ
        const weightsRef = admin.firestore().collection(`users/${uid}/weights`);
        const existingSnap = await weightsRef.get();
        const existingDates = new Set(existingSnap.docs.map((d) => d.data().date));

        const batch = admin.firestore().batch();
        let count = 0;

        for (const item of data) {
          // "20240101120000" → "2024-01-01"
          const raw = item.date;
          const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
          const bw = parseFloat(item.keydata);

          if (!existingDates.has(date) && !isNaN(bw)) {
            batch.set(weightsRef.doc(), {
              date,
              bw,
              source: "tanita",
              syncedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            count++;
          }
        }

        if (count > 0) await batch.commit();
        res.json({synced: count});
      } catch (err) {
        console.error("sync error:", err);
        res.status(500).json({error: err.message});
      }
    },
);
