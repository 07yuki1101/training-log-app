const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

const tanitaClientId = defineSecret("TANITA_CLIENT_ID");
const tanitaClientSecret = defineSecret("TANITA_CLIENT_SECRET");
const tanitaRedirectUri = defineSecret("TANITA_REDIRECT_URI");

// 1) 連携開始: タニタ同意画面へリダイレクト
exports.tanitaConnect = onRequest(
  {
    region: "asia-northeast1",
    secrets: [tanitaClientId, tanitaRedirectUri],
  },
  (req, res) => {
    const clientId = tanitaClientId.value();
    const redirectUri = tanitaRedirectUri.value();

    const authUrl = new URL("https://www.healthplanet.jp/oauth/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "innerscan");

    res.redirect(authUrl.toString());
  }
);

// 2) コールバック: code を受け取れたか確認
exports.tanitaCallback = onRequest(
  {
    region: "asia-northeast1",
    secrets: [tanitaClientId, tanitaClientSecret, tanitaRedirectUri],
  },
  async (req, res) => {
    const code = req.query.code;

    if (!code) {
      res.status(400).send("code がありません");
      return;
    }

    res.status(200).send(
      `callback成功: code受信OK (${String(code).slice(0, 6)}...)`
    );
  }
);
