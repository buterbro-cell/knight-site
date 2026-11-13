# SECRA for Android TV — ready-to-install APK

`secra-tv.apk` opens the live SECRA deployment on Phala Cloud in TV mode. It was built by GitHub Actions
(`.github/workflows/tv-apk.yml`) from commit `39c684a` of this repository; the same file is in the
[`tv-latest`](https://github.com/buterbro-cell/knight-site/releases/tag/tv-latest) release. Check it:

```bash
sha256sum -c SHA256SUMS
```

Install: copy it to a USB stick, allow installs from unknown sources on the TV, open the file with a file
manager. The app is signed with a debug key (sideload build, not a store release).

What is inside: one Java file (`android/app/src/main/java/near/secra/tv/MainActivity.java`) — a full-screen
WebView that stays on our host, passes the remote's keys to the page and asks the TV's voice input for one
phrase when the microphone button is pressed. No wallet, keys or user data live in the app.
