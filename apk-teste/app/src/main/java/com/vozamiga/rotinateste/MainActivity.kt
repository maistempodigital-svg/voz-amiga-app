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
import java.util.Locale

/** Casca de TESTE: mostra o app (versão web) dentro do celular, com a voz do Android, fotos e microfone. */
class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
  private lateinit var web: WebView
  private var tts: TextToSpeech? = null
  private var ttsPronto = false
  private var arquivoCallback: ValueCallback<Array<Uri>>? = null
  private var pedidoMic: PermissionRequest? = null

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
    val loader = WebViewAssetLoader.Builder().addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this)).build()
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
  override fun onDestroy() { tts?.shutdown(); super.onDestroy() }
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
  }
}
