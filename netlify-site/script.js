(function () {
      "use strict";

      const COMMON_PASSWORDS = new Set([
        "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567",
        "letmein", "trustno1", "dragon", "baseball", "iloveyou", "master", "sunshine",
        "ashley", "bailey", "shadow", "superman", "qazwsx", "michael", "football", "password1"
      ]);

      const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

      const el = {
        password: document.getElementById("password"),
        toggle: document.getElementById("toggle-visibility"),
        eye: document.getElementById("eye-icon"),
        meter: document.getElementById("meter"),
        strengthLabel: document.getElementById("strength-label"),
        terminal: document.getElementById("terminal"),
        crackTime: document.getElementById("crack-time"),
        entropyRing: document.getElementById("entropy-ring"),
        entropyLedText: document.getElementById("entropy-led-text"),
        entropyLabel: document.getElementById("entropy-label"),
        suggestionsWrap: document.getElementById("suggestions-wrap"),
        suggestionsList: document.getElementById("suggestions-list"),
        btnGen: document.getElementById("btn-generate"),
        btnCopy: document.getElementById("btn-copy"),
        boot: document.getElementById("boot"),
        bootText: document.getElementById("boot-text"),
        app: document.getElementById("app"),
        flash: document.getElementById("flash-layer"),
        particles: document.getElementById("particles"),
        canvas: document.getElementById("matrix-canvas")
      };

      let audioCtx = null;
      let lastFortress = false;
      let typewriterToken = 0;

      function ensureAudio() {
        if (!audioCtx) {
          try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          } catch (e) {
            audioCtx = null;
          }
        }
        if (audioCtx && audioCtx.state === "suspended") {
          audioCtx.resume().catch(function () {});
        }
      }

      function playKeyClick() {
        if (!audioCtx) return;
        var t = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(880 + Math.random() * 120, t);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.035);
      }

      function log2(x) {
        return Math.log(x) / Math.LN2;
      }

      function charsetSize(pw) {
        var u = /[A-Z]/.test(pw);
        var l = /[a-z]/.test(pw);
        var d = /[0-9]/.test(pw);
        var s = SPECIAL_RE.test(pw);
        var size = 0;
        if (u) size += 26;
        if (l) size += 26;
        if (d) size += 10;
        if (s) size += 33;
        return Math.max(size, 2);
      }

      function computeEntropyBits(pw) {
        if (!pw || !pw.length) return 0;
        var pool = charsetSize(pw);
        return pw.length * log2(pool);
      }

      function formatSciYears(seconds) {
        var years = seconds / (365.25 * 24 * 3600);
        if (years >= 1e15) {
          var exp = Math.floor(Math.log10(years));
          var mant = years / Math.pow(10, exp);
          return mant.toFixed(1) + " × 10^" + exp + " years";
        }
        if (years >= 1e9) return (years / 1e9).toFixed(2) + " billion years";
        if (years >= 1e6) return (years / 1e6).toFixed(2) + " million years";
        if (years >= 1e3) return (years / 1e3).toFixed(2) + " thousand years";
        if (years >= 1) return years.toFixed(1) + " years";
        var days = seconds / 86400;
        if (days >= 1) return days.toFixed(2) + " days";
        var hrs = seconds / 3600;
        if (hrs >= 1) return hrs.toFixed(2) + " hours";
        var min = seconds / 60;
        if (min >= 1) return min.toFixed(2) + " minutes";
        return seconds.toFixed(3) + " seconds";
      }

      function estimateCrackSeconds(entropyBits) {
        var guesses = Math.pow(2, entropyBits);
        var rate = 1e10;
        return guesses / (2 * rate);
      }

      function hasSequential(pw) {
        var lower = pw.toLowerCase();
        for (var i = 0; i < lower.length - 2; i++) {
          var a = lower.charCodeAt(i);
          var b = lower.charCodeAt(i + 1);
          var c = lower.charCodeAt(i + 2);
          if (b === a + 1 && c === b + 1) return true;
          if (b === a - 1 && c === b - 1) return true;
        }
        return false;
      }

      function keyboardWalk(pw) {
        var walks = ["qwerty", "asdf", "zxcv", "1234", "qwer"];
        var p = pw.toLowerCase();
        for (var i = 0; i < walks.length; i++) {
          if (p.indexOf(walks[i]) !== -1) return true;
        }
        return false;
      }

      function repeatedPattern(pw) {
        return /(.)\1{2,}/.test(pw);
      }

      function dictionaryHit(pw) {
        return COMMON_PASSWORDS.has(pw.toLowerCase());
      }

      function scorePassword(pw) {
        if (!pw || !pw.length) return 0;
        var len = pw.length;
        var hasU = /[A-Z]/.test(pw);
        var hasL = /[a-z]/.test(pw);
        var hasD = /[0-9]/.test(pw);
        var hasS = SPECIAL_RE.test(pw);
        var types = (hasU ? 1 : 0) + (hasL ? 1 : 0) + (hasD ? 1 : 0) + (hasS ? 1 : 0);
        var score = 0;
        if (len >= 8) score++;
        if (len >= 12) score++;
        if (types >= 3) score++;
        if (types >= 4) score++;
        if (len >= 16 && types >= 3) score++;
        score = Math.min(5, Math.max(0, score));
        if (dictionaryHit(pw)) score = Math.min(score, 1);
        if (len > 0 && len < 6) score = Math.min(score, 1);
        if (len > 0 && score < 1) score = 1;
        return score;
      }

      function strengthMeta(segmentCount) {
        var map = [
          { label: "⚠ CRITICAL", className: "critical", color: "var(--critical)" },
          { label: "⚠ WEAK", className: "weak", color: "var(--weak)" },
          { label: "⚡ MODERATE", className: "moderate", color: "var(--moderate)" },
          { label: "✔ STRONG", className: "strong", color: "var(--strong)" },
          { label: "✔ FORTRESS", className: "fortress", color: "var(--fortress)" }
        ];
        var idx = Math.max(0, Math.min(4, segmentCount - 1));
        return map[idx];
      }

      function updateMeter(level, meta) {
        var segs = el.meter.querySelectorAll(".segment");
        var segClass = meta ? meta.className : "";
        for (var i = 0; i < segs.length; i++) {
          var s = segs[i];
          s.className = "segment";
          if (i < level && meta) {
            s.classList.add("filled", "pulse", segClass);
          }
        }
        el.meter.setAttribute("aria-valuenow", String(level));
        if (level === 0) {
          el.strengthLabel.textContent = "⚠ AWAITING INPUT";
          el.strengthLabel.style.color = "var(--text-dim)";
          el.strengthLabel.style.textShadow = "none";
        } else {
          el.strengthLabel.textContent = meta.label;
          el.strengthLabel.style.color = meta.color;
          el.strengthLabel.style.textShadow = "0 0 12px currentColor";
        }
      }

      function crackColor(seconds) {
        if (seconds < 1) return "var(--critical)";
        if (seconds < 86400) return "var(--weak)";
        if (seconds < 31536000 * 10) return "var(--moderate)";
        if (seconds < 31536000 * 1e6) return "var(--strong)";
        return "var(--fortress)";
      }

      function unicodeSuperscript(n) {
        var digits = "⁰¹²³⁴⁵⁶⁷⁸⁹";
        var s = String(Math.round(n));
        var out = "";
        for (var i = 0; i < s.length; i++) {
          out += digits[+s[i]] || s[i];
        }
        return out;
      }

      function formatCrackDisplay(seconds) {
        var years = seconds / (365.25 * 24 * 3600);
        if (years >= 1e6) {
          var exp = Math.floor(Math.log10(years));
          var mant = years / Math.pow(10, exp);
          return mant.toFixed(1) + " × 10" + unicodeSuperscript(exp) + " years";
        }
        return formatSciYears(seconds);
      }

      function setEntropyUI(bits) {
        var max = 128;
        var frac = Math.min(1, bits / max);
        var circumference = 2 * Math.PI * 28;
        el.entropyRing.style.strokeDasharray = String(circumference);
        el.entropyRing.style.strokeDashoffset = String(circumference * (1 - frac));
        el.entropyRing.style.stroke =
          bits < 28 ? "var(--critical)" : bits < 50 ? "var(--weak)" : bits < 70 ? "var(--moderate)" : bits < 90 ? "var(--strong)" : "var(--fortress)";
        el.entropyLedText.textContent = bits.toFixed(0);
        el.entropyLabel.textContent = "ENTROPY: " + bits.toFixed(1) + " bits";
      }

      function buildSuggestions(pw, analysis) {
        var tips = [];
        if (!pw) return tips;
        if (pw.length < 12) tips.push("> SUGGESTION: Use at least 12 characters for a stronger base.");
        if (!/[A-Z]/.test(pw)) tips.push("> SUGGESTION: Add uppercase letters (A-Z).");
        if (!/[a-z]/.test(pw)) tips.push("> SUGGESTION: Add lowercase letters (a-z).");
        if (!/[0-9]/.test(pw)) tips.push("> SUGGESTION: Mix in numeric characters (0-9).");
        if (!SPECIAL_RE.test(pw)) tips.push("> SUGGESTION: Add special characters (!@#$%^&*).");
        if (analysis.dict) tips.push("> SUGGESTION: Avoid common passwords and predictable words.");
        if (analysis.pattern) tips.push("> SUGGESTION: Break sequential or keyboard patterns.");
        if (tips.length > 4) tips = tips.slice(0, 4);
        return tips;
      }

      function typewriterLine(element, fullText, speed, done) {
        var i = 0;
        function step() {
          if (i <= fullText.length) {
            element.textContent = fullText.slice(0, i);
            i++;
            setTimeout(step, speed);
          } else if (done) done();
        }
        step();
      }

      function runTerminalLines(lines, token) {
        el.terminal.innerHTML = "";
        var idx = 0;
        function next() {
          if (token !== typewriterToken) return;
          if (idx >= lines.length) {
            el.terminal.scrollTop = el.terminal.scrollHeight;
            return;
          }
          var item = lines[idx];
          var text = typeof item === "string" ? item : item.text;
          var cls = typeof item === "string" ? "" : item.cls || "";
          var div = document.createElement("div");
          div.className = "term-line" + (cls ? " " + cls : "");
          el.terminal.appendChild(div);
          typewriterLine(div, text, 2, function () {
            el.terminal.scrollTop = el.terminal.scrollHeight;
            idx++;
            setTimeout(next, 40);
          });
        }
        next();
      }

      function analyze(pw) {
        var len = pw.length;
        var hasU = /[A-Z]/.test(pw);
        var hasL = /[a-z]/.test(pw);
        var hasD = /[0-9]/.test(pw);
        var hasS = SPECIAL_RE.test(pw);
        var dict = dictionaryHit(pw);
        var pattern = hasSequential(pw) || keyboardWalk(pw) || repeatedPattern(pw);
        return { len: len, hasU: hasU, hasL: hasL, hasD: hasD, hasS: hasS, dict: dict, pattern: pattern };
      }

      function padScan(label) {
        var max = 28;
        var dots = Math.max(1, max - label.length);
        return ".".repeat(Math.min(dots, 24));
      }

      function lineCls(ok, fail, warn) {
        if (warn) return "warn";
        if (fail) return "fail";
        if (ok) return "pass";
        return "";
      }

      function buildScanLines(pw, a) {
        if (!pw) {
          return [{ text: "> [SCAN] Awaiting secure channel input........ IDLE", cls: "" }];
        }
        var rows = [];
        var lenOk = a.len >= 8;
        rows.push({
          text: "> [SCAN] Checking length" + padScan("len") + " " + (lenOk ? "✔ PASS (" + a.len + " chars)" : "✗ SHORT (" + a.len + " chars)"),
          cls: lineCls(lenOk, !lenOk, false)
        });
        rows.push({
          text: "> [SCAN] Uppercase letters" + padScan("up") + " " + (a.hasU ? "✔ DETECTED" : "✗ MISSING"),
          cls: lineCls(a.hasU, !a.hasU, false)
        });
        rows.push({
          text: "> [SCAN] Lowercase letters" + padScan("lo") + " " + (a.hasL ? "✔ DETECTED" : "✗ MISSING"),
          cls: lineCls(a.hasL, !a.hasL, false)
        });
        rows.push({
          text: "> [SCAN] Numeric characters" + padScan("num") + " " + (a.hasD ? "✔ DETECTED" : "✗ MISSING"),
          cls: lineCls(a.hasD, !a.hasD, false)
        });
        rows.push({
          text: "> [SCAN] Special symbols" + padScan("sym") + " " + (a.hasS ? "✔ DETECTED" : "✗ MISSING"),
          cls: lineCls(a.hasS, !a.hasS, false)
        });
        var dictFail = a.dict;
        rows.push({
          text: "> [SCAN] Dictionary attack check" + padScan("dict") + " " + (dictFail ? "✗ FOUND" : "✔ NOT FOUND"),
          cls: lineCls(!dictFail, dictFail, false)
        });
        rows.push({
          text: "> [SCAN] Common pattern check" + padScan("pat") + " " + (a.pattern ? "⚠ WARNING" : "✔ CLEAR"),
          cls: lineCls(!a.pattern, false, a.pattern)
        });
        return rows;
      }

      function triggerFortressFX() {
        el.flash.innerHTML = '<div class="flash-fortress"></div>';
        setTimeout(function () {
          el.flash.innerHTML = "";
        }, 700);
        var rect = el.app.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 3;
        for (var i = 0; i < 36; i++) {
          var p = document.createElement("div");
          p.className = "particle";
          var ang = (Math.PI * 2 * i) / 36;
          var dist = 80 + Math.random() * 120;
          p.style.left = cx + "px";
          p.style.top = cy + "px";
          p.style.setProperty("--tx", Math.cos(ang) * dist + "px");
          p.style.setProperty("--ty", Math.sin(ang) * dist + "px");
          el.particles.appendChild(p);
          setTimeout(function (node) {
            return function () {
              if (node.parentNode) node.parentNode.removeChild(node);
            };
          }(p), 850);
        }
      }

      function refresh() {
        var pw = el.password.value;
        var a = analyze(pw);
        var level = scorePassword(pw);
        var meta = level === 0 ? null : strengthMeta(level);
        updateMeter(level, meta);

        var bits = computeEntropyBits(pw);
        var crackSec = pw ? estimateCrackSeconds(bits) : Infinity;
        if (a.dict) crackSec = Math.min(crackSec, 0.001);
        if (!pw) {
          el.crackTime.textContent = "EST. CRACK TIME: —";
          el.crackTime.style.color = "var(--text-dim)";
        } else {
          el.crackTime.textContent = "EST. CRACK TIME: " + (crackSec === Infinity ? "—" : formatCrackDisplay(crackSec));
          el.crackTime.style.color = crackColor(crackSec === Infinity ? 1e30 : crackSec);
        }
        setEntropyUI(bits);

        var lines = buildScanLines(pw, a);
        typewriterToken++;
        runTerminalLines(lines, typewriterToken);

        var tips = buildSuggestions(pw, a);
        if (tips.length && pw && level < 5) {
          el.suggestionsWrap.style.display = "block";
          el.suggestionsList.innerHTML = "";
          tips.forEach(function (t) {
            var li = document.createElement("li");
            li.textContent = t;
            el.suggestionsList.appendChild(li);
          });
        } else {
          el.suggestionsWrap.style.display = "none";
        }

        if (pw && level === 5 && !lastFortress) {
          triggerFortressFX();
        }
        lastFortress = pw && level === 5;
      }

      el.password.addEventListener("input", function () {
        ensureAudio();
        refresh();
      });
      el.password.addEventListener("keydown", function () {
        ensureAudio();
        playKeyClick();
      });

      el.toggle.addEventListener("click", function () {
        var hidden = el.password.type === "password";
        el.password.type = hidden ? "text" : "password";
        el.toggle.setAttribute("aria-label", hidden ? "Hide password" : "Show password");
        el.eye.textContent = hidden ? "🙈" : "👁";
      });

      function randBelow(max) {
        var crypto = window.crypto || window.msCrypto;
        if (!crypto || !crypto.getRandomValues || max <= 0) {
          return Math.floor(Math.random() * max);
        }
        var buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] % max;
      }

      function shuffleString(str) {
        var a = str.split("");
        for (var i = a.length - 1; i > 0; i--) {
          var j = randBelow(i + 1);
          var t = a[i];
          a[i] = a[j];
          a[j] = t;
        }
        return a.join("");
      }

      function randomStrong() {
        var upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        var lower = "abcdefghijkmnopqrstuvwxyz";
        var num = "23456789";
        var sym = "!@#$%^&*-_=+?";
        var all = upper + lower + num + sym;
        var len = 18;
        var out = "";
        out += upper[randBelow(upper.length)];
        out += lower[randBelow(lower.length)];
        out += num[randBelow(num.length)];
        out += sym[randBelow(sym.length)];
        for (var i = out.length; i < len; i++) {
          out += all[randBelow(all.length)];
        }
        return shuffleString(out);
      }

      function typeIntoInput(str, i, done) {
        if (i > str.length) {
          if (done) done();
          return;
        }
        el.password.value = str.slice(0, i);
        refresh();
        ensureAudio();
        playKeyClick();
        setTimeout(function () {
          typeIntoInput(str, i + 1, done);
        }, 28 + Math.random() * 22);
      }

      el.btnGen.addEventListener("click", function () {
        var s = randomStrong();
        el.password.value = "";
        refresh();
        typeIntoInput(s, 1, function () {
          el.password.dispatchEvent(new Event("input"));
        });
      });

      el.btnCopy.addEventListener("click", function () {
        var v = el.password.value;
        if (!v) return;
        var defaultBtnText = el.btnCopy.textContent;
        function flashCopied() {
          el.btnCopy.classList.add("copied-flash");
          el.btnCopy.textContent = "COPIED ✔";
          setTimeout(function () {
            el.btnCopy.classList.remove("copied-flash");
            el.btnCopy.textContent = defaultBtnText;
          }, 900);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(v).then(flashCopied).catch(function () {
            el.btnCopy.textContent = "COPY BLOCKED";
            setTimeout(function () {
              el.btnCopy.textContent = defaultBtnText;
            }, 1200);
          });
        } else {
          el.password.select();
          document.execCommand("copy");
          flashCopied();
        }
      });

      function matrixRain() {
        var c = el.canvas;
        var ctx = c.getContext("2d");
        var W, H, fontSize, columns, drops;

        function resize() {
          W = c.width = window.innerWidth;
          H = c.height = window.innerHeight;
          fontSize = 14;
          columns = Math.floor(W / fontSize);
          drops = [];
          for (var i = 0; i < columns; i++) drops[i] = Math.random() * -50;
        }
        resize();
        window.addEventListener("resize", resize);

        var chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789ABCDEF";
        function draw() {
          ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "#00ff41";
          ctx.font = fontSize + "px Fira Code, monospace";
          for (var i = 0; i < drops.length; i++) {
            var ch = chars[Math.floor(Math.random() * chars.length)];
            var x = i * fontSize;
            var y = drops[i] * fontSize;
            ctx.fillStyle = Math.random() > 0.96 ? "#00f5ff" : "#00ff41";
            ctx.fillText(ch, x, y);
            if (y > H && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
          }
          requestAnimationFrame(draw);
        }
        draw();
      }

      function bootSequence() {
        var lines = [
          "> INITIALIZING SYSTEM...",
          "> LOADING ENCRYPTION MODULES...",
          "> CALIBRATING ENTROPY SENSORS...",
          "> NEURAL HASH ROUTINES... OK",
          "> ACCESS GRANTED"
        ];
        el.bootText.innerHTML = "";
        var delay = 0;
        lines.forEach(function (line, idx) {
          delay += idx === 0 ? 100 : 380 + Math.random() * 220;
          setTimeout(function () {
            var d = document.createElement("div");
            d.className = "boot-line";
            d.textContent = line;
            el.bootText.appendChild(d);
          }, delay);
        });
        setTimeout(function () {
          el.boot.classList.add("done");
          el.app.classList.remove("hidden-until-boot");
          el.app.classList.add("visible");
          el.password.focus();
        }, delay + 700);
      }

      matrixRain();
      bootSequence();
      refresh();
    })();
