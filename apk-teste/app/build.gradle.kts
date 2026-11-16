plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
  namespace = "com.vozamiga.rotinateste"
  compileSdk = 34
  defaultConfig {
    // APK de TESTE: pacote diferente do app da loja (com.vozamiga), instala AO LADO dele
    applicationId = "com.vozamiga.rotinateste"
    minSdk = 24; targetSdk = 34
    versionCode = (System.getenv("VERSAO_CODIGO") ?: "148").toInt()
    versionName = System.getenv("VERSAO_NOME") ?: "14.8-teste"
  }
  // a pasta "_expo" começa com "_": por padrão o Android a ignoraria
  androidResources { ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~" }
  buildTypes { getByName("debug") { isMinifyEnabled = false } }
  compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
  kotlinOptions { jvmTarget = "17" }
}
dependencies {
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("androidx.webkit:webkit:1.11.0")
}
