plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
  namespace = "com.vozamiga.rotinateste"
  compileSdk = 34
  defaultConfig {
    // APK de TESTE: pacote diferente do app da loja (com.vozamiga), instala AO LADO dele
    applicationId = System.getenv("APP_ID") ?: "com.vozamiga.rotinateste"
    minSdk = 24; targetSdk = 34
    versionCode = (System.getenv("VERSAO_CODIGO") ?: "148").toInt()
    versionName = System.getenv("VERSAO_NOME") ?: "14.8-teste"
    manifestPlaceholders["nomeApp"] = System.getenv("NOME_APP") ?: "Voz Amiga TESTE"
  }
  // a pasta "_expo" começa com "_": por padrão o Android a ignoraria
  androidResources { ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~" }
  signingConfigs {
    create("loja") {
      val ks = System.getenv("KS_FILE")
      if (ks != null) {
        storeFile = file(ks)
        storePassword = System.getenv("KS_PASS")
        keyAlias = System.getenv("KEY_ALIAS")
        keyPassword = System.getenv("KEY_PASS")
      }
    }
  }
  buildTypes {
    getByName("debug") { isMinifyEnabled = false }
    getByName("release") {
      isMinifyEnabled = false
      if (System.getenv("KS_FILE") != null) signingConfig = signingConfigs.getByName("loja")
    }
  }
  compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
  kotlinOptions { jvmTarget = "17" }
}
dependencies {
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("androidx.webkit:webkit:1.11.0")
}
