# Android Development Build Kurulumu

Bu uygulama video trimming özelliği kullandığı için **development build** gerektirir. Expo Go'da çalışmaz.

## Seçenek 1: EAS Build (Önerilen - Daha Kolay)

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

### 4. Android Development Build Oluştur
```bash
eas build --profile development --platform android
```

Bu komut:
- Cloud'da build oluşturur
- APK dosyasını indirmenizi sağlar
- APK'yı Android cihazınıza yükleyebilirsiniz

### 5. APK'yı Cihaza Yükleme
1. Build tamamlandığında link alacaksınız
2. Link'i Android cihazınızda açın
3. APK'yı indirin ve yükleyin

## Seçenek 2: Lokal Build (Android Studio Gerekir)

### Gereksinimler
- Android Studio kurulu olmalı
- Android SDK kurulu olmalı
- Java JDK kurulu olmalı

### 1. Android Studio'yu Açın
Android Studio'yu açın ve SDK'ların kurulu olduğundan emin olun.

### 2. Development Build Oluştur
```bash
npx expo run:android
```

Bu komut:
- Android projesini oluşturur
- Build eder
- Emulator'da veya bağlı cihazda çalıştırır

### 3. Fiziksel Cihazda Çalıştırma
1. Android cihazınızı USB ile bilgisayara bağlayın
2. USB debugging'i açın (Ayarlar > Geliştirici Seçenekleri)
3. `npx expo run:android` komutunu çalıştırın

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

