package com.vozamiga.rotinateste

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.webkit.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.android.billingclient.api.*

/** Casca de TESTE: mostra o app (versão web) dentro do celular, com a voz do Android, fotos e microfone. */
class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
  private lateinit var web: WebView
  private var tts: TextToSpeech? = null
  private var ttsPronto = false
  private var arquivoCallback: ValueCallback<Array<Uri>>? = null
  private var pedidoMic: PermissionRequest? = null
  private var billing: BillingClient? = null
  private var produtoPedido = ""
  // webClientId do Firebase (o mesmo que o app 1.0.24 usa)
  private val WEB_CLIENT_ID = "219818609699-8aibcbol80sj75cvgj5fcsagrihameph.apps.googleusercontent.com"

  private fun js(cod: String) = runOnUiThread { web.evaluateJavascript(cod, null) }
  private fun avisarCompra(o: JSONObject) = js("window.__vozCompra && window.__vozCompra(" + JSONObject.quote(o.toString()) + ")")

  private val ouvinteCompra = PurchasesUpdatedListener { r, compras ->
    when (r.responseCode) {
      BillingClient.BillingResponseCode.OK -> compras?.forEach { c ->
        val o = JSONObject().put("produto", c.products.firstOrNull() ?: produtoPedido).put("token", c.purchaseToken)
        o.put("estado", if (c.purchaseState == Purchase.PurchaseState.PURCHASED) "comprado" else "pendente")
        avisarCompra(o)
      }
      BillingClient.BillingResponseCode.USER_CANCELED -> avisarCompra(JSONObject().put("estado", "cancelado"))
      BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> restaurar()
      else -> avisarCompra(JSONObject().put("estado", "erro").put("motivo", "codigo-" + r.responseCode))
    }
  }
  private fun conectar(depois: () -> Unit) {
    val b = billing ?: BillingClient.newBuilder(this).setListener(ouvinteCompra)
      .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()).build().also { billing = it }
    if (b.isReady) { depois(); return }
    b.startConnection(object : BillingClientStateListener {
      override fun onBillingSetupFinished(r: BillingResult) { if (r.responseCode == BillingClient.BillingResponseCode.OK) depois() else avisarCompra(JSONObject().put("estado", "erro").put("motivo", "play-indisponivel")) }
      override fun onBillingServiceDisconnected() {}
    })
  }
  /** Já tinha comprado (ex.: trocou de celular): manda de novo para o servidor conferir. */
  private fun restaurar() = conectar {
    for (tipo in listOf(BillingClient.ProductType.SUBS, BillingClient.ProductType.INAPP)) {
      billing?.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(tipo).build()) { _, lista ->
        lista.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }.forEach { c ->
          avisarCompra(JSONObject().put("estado", "comprado").put("produto", c.products.firstOrNull() ?: "").put("token", c.purchaseToken))
        }
      }
    }
  }

  private val escolherArquivo = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
    val cb = arquivoCallback; arquivoCallback = null
    cb?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(r.resultCode, r.data))
  }
  private val permissaoMic = registerForActivityResult(ActivityResultContracts.RequestPermission()) { ok ->
    val p = pedidoMic; pedidoMic = null
    if (ok) p?.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) else p?.deny()
  }

  @SuppressLint("SetJavaScriptEnabled")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    tts = TextToSpeech(this, this)
    // "/arquivos/..." = pasta de arquivos do app (fotos e áudios que o app antigo 1.0.24 guardou); o resto = o app
    val loader = WebViewAssetLoader.Builder()
      .addPathHandler("/arquivos/", WebViewAssetLoader.InternalStoragePathHandler(this, filesDir))
      .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this)).build()
    web = WebView(this)
    setContentView(web)
    web.settings.apply {
      javaScriptEnabled = true; domStorageEnabled = true; databaseEnabled = true
      mediaPlaybackRequiresUserGesture = false
      allowFileAccess = false; allowContentAccess = true
      setSupportZoom(false); textZoom = 100
    }
    web.webViewClient = object : WebViewClient() {
      override fun shouldInterceptRequest(v: WebView, req: WebResourceRequest): WebResourceResponse? = loader.shouldInterceptRequest(req.url)
      override fun shouldOverrideUrlLoading(v: WebView, req: WebResourceRequest): Boolean {
        val u = req.url
        if (u.host == "appassets.androidplatform.net") return false
        abrirFora(u.toString()); return true
      }
    }
    web.webChromeClient = object : WebChromeClient() {
      override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams): Boolean {
        arquivoCallback?.onReceiveValue(null); arquivoCallback = cb
        return try { escolherArquivo.launch(p.createIntent()); true } catch (e: Exception) { arquivoCallback = null; false }
      }
      override fun onPermissionRequest(req: PermissionRequest) {
        runOnUiThread {
          if (req.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
            if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) req.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
            else { pedidoMic = req; permissaoMic.launch(Manifest.permission.RECORD_AUDIO) }
          } else req.deny()
        }
      }
    }
    web.addJavascriptInterface(Ponte(), "AndroidTTS")
    if (savedInstanceState == null) web.loadUrl("https://appassets.androidplatform.net/index.html") else web.restoreState(savedInstanceState)
  }

  override fun onSaveInstanceState(out: Bundle) { super.onSaveInstanceState(out); web.saveState(out) }
  override fun onInit(status: Int) { ttsPronto = status == TextToSpeech.SUCCESS }
  override fun onDestroy() { tts?.shutdown(); billing?.endConnection(); super.onDestroy() }
  @Deprecated("Deprecated in Java")
  override fun onBackPressed() { if (web.canGoBack()) web.goBack() else web.evaluateJavascript("window.dispatchEvent(new Event('voltarAndroid'))", null) }

  private fun abrirFora(url: String) {
    // só https, e-mail e WhatsApp (o resto é bloqueado)
    if (!(url.startsWith("https://") || url.startsWith("mailto:") || url.startsWith("whatsapp://send"))) return
    try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (_: Exception) {}
  }

  inner class Ponte {
    private fun falar(t: String, lang: String, voz: String?, vol: Float) {
      val e = tts ?: return
      if (!ttsPronto || t.isBlank()) return
      runOnUiThread {
        try {
          e.language = Locale.forLanguageTag(lang)
          if (!voz.isNullOrBlank()) e.voices?.firstOrNull { it.name == voz }?.let { e.voice = it }
          val p = Bundle(); p.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, vol.coerceIn(0f, 1f))
          e.speak(t.take(4000), TextToSpeech.QUEUE_FLUSH, p, "fala")
        } catch (_: Exception) {}
      }
    }
    @JavascriptInterface fun speak(t: String, lang: String) = falar(t, lang, null, 1f)
    @JavascriptInterface fun speak2(t: String, lang: String, voz: String, vol: Double) = falar(t, lang, voz, vol.toFloat())
    @JavascriptInterface fun vozes(lang: String): String {
      val l = lang.take(2).lowercase()
      val arr = JSONArray()
      try { tts?.voices?.filter { it.locale.language.lowercase() == l }?.map { it.name }?.sorted()?.forEach { arr.put(it) } } catch (_: Exception) {}
      return arr.toString()
    }
    @JavascriptInterface fun abrirConfigVoz() { try { startActivity(Intent("com.android.settings.TTS_SETTINGS")) } catch (_: Exception) {} }
    @JavascriptInterface fun abrirLink(u: String) = runOnUiThread { abrirFora(u) }
    @JavascriptInterface fun compartilhar(t: String) = runOnUiThread {
      try { startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, t.take(60000)), "Compartilhar")) } catch (_: Exception) {}
    }
    @JavascriptInterface fun sair() = runOnUiThread { finish() }

    /** Login com a conta Google do celular → idToken → window.__vozGoogle(token) (o app entra no Firebase). */
    @JavascriptInterface fun entrarGoogle() = runOnUiThread {
      lifecycleScope.launch {
        try {
          val op = GetGoogleIdOption.Builder().setFilterByAuthorizedAccounts(false).setServerClientId(WEB_CLIENT_ID).setAutoSelectEnabled(false).build()
          val r = CredentialManager.create(this@MainActivity).getCredential(this@MainActivity, GetCredentialRequest.Builder().addCredentialOption(op).build())
          val tok = GoogleIdTokenCredential.createFrom(r.credential.data).idToken
          js("window.__vozGoogle && window.__vozGoogle(" + JSONObject.quote(tok) + ")")
        } catch (e: Exception) {
          js("window.__vozGoogle && window.__vozGoogle(null, " + JSONObject.quote(e.javaClass.simpleName) + ")")
        }
      }
    }
    /** Abre o pagamento do Google Play (produto do app 1.0.24). tipo = "subs" ou "inapp". */
    @JavascriptInterface fun comprar(produto: String, tipo: String) = runOnUiThread {
      produtoPedido = produto
      conectar {
        val t = if (tipo == "inapp") BillingClient.ProductType.INAPP else BillingClient.ProductType.SUBS
        val q = QueryProductDetailsParams.newBuilder().setProductList(listOf(QueryProductDetailsParams.Product.newBuilder().setProductId(produto).setProductType(t).build())).build()
        billing?.queryProductDetailsAsync(q) { r, lista ->
          val d = lista.firstOrNull()
          if (r.responseCode != BillingClient.BillingResponseCode.OK || d == null) { avisarCompra(JSONObject().put("estado", "erro").put("motivo", "produto-nao-encontrado")); return@queryProductDetailsAsync }
          val p = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d)
          d.subscriptionOfferDetails?.firstOrNull()?.offerToken?.let { p.setOfferToken(it) }
          runOnUiThread { billing?.launchBillingFlow(this@MainActivity, BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(p.build())).build()) }
        }
      }
    }
    /** Confirma a compra no Google (se o servidor ainda não confirmou). */
    @JavascriptInterface fun confirmarCompra(token: String) = conectar {
      billing?.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build()) { }
    }
    @JavascriptInterface fun restaurarCompras() = restaurar()

    /** MIGRAÇÃO: lê (sem apagar nada) o que o Voz Amiga 1.0.24 guardou no celular: chaves "vozAmiga*" do AsyncStorage. */
    @JavascriptInterface fun lerAppAntigo(): String {
      val out = org.json.JSONObject()
      try {
        val f = getDatabasePath("RKStorage")
        if (!f.exists()) return "{}"
        val db = android.database.sqlite.SQLiteDatabase.openDatabase(f.path, null, android.database.sqlite.SQLiteDatabase.OPEN_READONLY)
        db.use {
          it.rawQuery("SELECT key, value FROM catalystLocalStorage WHERE key LIKE 'vozAmiga%'", null).use { c ->
            while (c.moveToNext()) out.put(c.getString(0), c.getString(1))
          }
        }
      } catch (_: Exception) {}
      return out.toString()
    }
    /** Pasta de arquivos do app (para trocar "file:///data/user/0/com.vozamiga/files/..." por "/arquivos/..."). */
    @JavascriptInterface fun pastaArquivos(): String = filesDir.absolutePath
  }
}
