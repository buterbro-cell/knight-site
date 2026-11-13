package near.secra.tv;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.speech.RecognizerIntent;
import android.webkit.JavascriptInterface;
import java.util.ArrayList;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

// SECRA for Android TV: the same attested web page, full screen. No keys or wallet live in this app:
// payments go through the agent wallet in the TEE, and the owner's phone signs the 24-hour permission (QR pairing).
public class MainActivity extends Activity {
  private WebView web;
  private PermissionRequest pendingMic;

  @Override protected void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    web = new WebView(this);
    web.setBackgroundColor(0xFF0A1430);
    web.setFocusable(true); web.setFocusableInTouchMode(true);
    setContentView(web);
    web.requestFocus();   // the remote's arrows and OK go to the page
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    s.setUserAgentString(s.getUserAgentString() + " SECRA-TV/1.0");
    final String host = Uri.parse(BuildConfig.START_URL).getHost();
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        return r.getUrl().getHost() == null || !r.getUrl().getHost().equals(host);   // stay on our own site
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public void onPermissionRequest(PermissionRequest req) {
        runOnUiThread(() -> {
          boolean wantsMic = false;
          for (String r : req.getResources()) if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) wantsMic = true;
          if (!wantsMic || !host.equals(req.getOrigin().getHost())) { req.deny(); return; }
          if (hasMic()) req.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
          else { pendingMic = req; askMic(); }
        });
      }
    });
    web.addJavascriptInterface(new Object() {
      // the page asks for one spoken phrase; the TV's voice input (remote microphone) returns it as text
      @JavascriptInterface public void listen(final String lang) {
        runOnUiThread(() -> {
          try {
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang == null || lang.length() > 12 ? "en-US" : lang);
            i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            startActivityForResult(i, 7);
          } catch (Exception e) { heard(""); }
        });
      }
    }, "SecraTV");
    if (!hasMic()) askMic();
    if (state != null) web.restoreState(state); else web.loadUrl(BuildConfig.START_URL);
  }

  private void heard(String text) {
    String js = org.json.JSONObject.quote(text == null ? "" : text);
    web.evaluateJavascript("window.__tvHeard&&window.__tvHeard(" + js + ")", null);
    web.requestFocus();
  }
  @Override protected void onActivityResult(int code, int result, Intent data) {
    super.onActivityResult(code, result, data);
    if (code != 7) return;
    ArrayList<String> r = result == RESULT_OK && data != null ? data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS) : null;
    heard(r != null && !r.isEmpty() ? r.get(0) : "");
  }

  private boolean hasMic() { return Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED; }
  private void askMic() { if (Build.VERSION.SDK_INT >= 23) requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 1); }

  @Override public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
    if (pendingMic != null) {
      if (res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED) pendingMic.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
      else pendingMic.deny();
      pendingMic = null;
    }
  }

  // Back on the remote: close the open window on the page first, then go back, then leave the app
  @Override public boolean onKeyDown(int keyCode, KeyEvent e) {
    if (keyCode == KeyEvent.KEYCODE_BACK) {
      web.evaluateJavascript("(function(){var x=document.getElementById('tvX');if(x){x.click();return 1;}"
          + "var m=[].slice.call(document.querySelectorAll('.modal:not(.hidden)'));if(m.length){m[m.length-1].classList.add('hidden');return 1;}return 0;})()",
        v -> { if (!"1".equals(v)) { if (web.canGoBack()) web.goBack(); else finish(); } });
      return true;
    }
    return super.onKeyDown(keyCode, e);
  }

  @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
  @Override protected void onPause() { super.onPause(); web.onPause(); }
  @Override protected void onResume() { super.onResume(); web.onResume(); web.requestFocus(); }
}
