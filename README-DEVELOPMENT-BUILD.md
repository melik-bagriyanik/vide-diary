# Development Build Kurulumu

Bu uygulama video trimming özelliği kullandığı için **development build** gerektirir. Expo Go'da çalışmaz.

## Seçenek 1: Lokal Build (Önerilen)

### Android için

#### Gereksinimler
- Android Studio kurulu olmalı
- Android SDK kurulu olmalı
- Java JDK kurulu olmalı

#### Kurulum Adımları

1. **Android Studio'yu Açın**
   - Android Studio'yu açın ve SDK'ların kurulu olduğundan emin olun.

2. **Development Build Oluştur ve Çalıştır**
   ```bash
   npx expo run:android
   ```

   Bu komut:
   - Android projesini oluşturur
   - Build eder
   - Emulator'da veya bağlı cihazda çalıştırır

3. **Fiziksel Cihazda Çalıştırma**
   - Android cihazınızı USB ile bilgisayara bağlayın
   - USB debugging'i açın (Ayarlar > Geliştirici Seçenekleri)
   - `npx expo run:android` komutunu çalıştırın

### iOS için

#### Gereksinimler
- macOS gereklidir
- Xcode kurulu olmalı
- CocoaPods kurulu olmalı (`sudo gem install cocoapods`)

#### Kurulum Adımları

1. **Xcode'u Açın**
   - Xcode'u açın ve Command Line Tools'un kurulu olduğundan emin olun.

2. **Development Build Oluştur ve Çalıştır**
   ```bash
   npx expo run:ios
   ```

   Bu komut:
   - iOS projesini oluşturur
   - Build eder
   - Simulator'da veya bağlı cihazda çalıştırır

3. **Fiziksel Cihazda Çalıştırma**
   - iOS cihazınızı USB ile Mac'e bağlayın
   - Xcode'da cihazınızı seçin
   - `npx expo run:ios --device` komutunu çalıştırın

## Seçenek 2: EAS Build (Cloud Build)

EAS Build kullanarak cloud'da build oluşturabilirsiniz:

### 1. EAS CLI Kurulumu
```bash
npm install -g eas-cli
```

### 2. EAS'a Giriş
```bash
eas login
```

### 3. EAS Build Yapılandırması
```bash
eas build:configure
```

### 4. Development Build Oluştur

**Android için:**
```bash
eas build --profile development --platform android
```

**iOS için:**
```bash
eas build --profile development --platform ios
```

Bu komutlar:
- Cloud'da build oluşturur
- APK/IPA dosyasını indirmenizi sağlar
- Dosyayı cihazınıza yükleyebilirsiniz

### 5. Build'i Cihaza Yükleme
1. Build tamamlandığında link alacaksınız
2. Link'i cihazınızda açın
3. Dosyayı indirin ve yükleyin

## QR Kod ile Bağlanma (Development Build'de)

Development build'i yükledikten sonra:

1. `npx expo start --dev-client` komutunu çalıştırın
2. QR kodu tarayın
3. Development build uygulaması açılacak ve bağlanacak

## Notlar

- İlk build 5-10 dakika sürebilir
- Development build, Expo Go'dan farklı bir uygulamadır
- Her native module değişikliğinde yeniden build gerekir
- EAS Build ücretsiz planında aylık build limiti vardır
- Lokal build (Seçenek 1) daha hızlı ve önerilen yöntemdir

