// ==UserScript==
// @name         免费游戏一键领取助手
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  自动识别各大平台限免游戏并一键领取（Steam/Epic/GOG/Amazon/Ubisoft）
// @author       AiHuanying
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      githubusercontent.com
// ==/UserScript==

(function () {
  "use strict";

  const config = {
    version: "1.2.0",
    updateUrl: "https://raw.githubusercontent.com/yourrepo/free-claim-script/main/meta.json",
    logLimit: 100,
    platforms: []
  };

  const log = console.log.bind(console, "[领取助手]");

  function showSuccess(msg) {
    alert("[领取成功] " + msg);
  }

  function showNotice(msg) {
    alert("[提示] " + msg);
  }

  function logClaimResult(platform, title, success) {
    const history = GM_getValue("claimHistory", []);
    history.unshift({
      time: new Date().toLocaleString(),
      platform,
      title,
      success
    });
    GM_setValue("claimHistory", history.slice(0, config.logLimit));
  }

  function showHistory() {
    const history = GM_getValue("claimHistory", []);
    const formatted = history.map(e =>
      `[${e.time}] [${e.platform}] ${e.title} => ${e.success ? "成功" : "失败"}`
    ).join("\n");
    alert("【领取记录】\n\n" + (formatted || "暂无记录"));
  }

  function checkForUpdate() {
    GM_xmlhttpRequest({
      method: "GET",
      url: config.updateUrl,
      onload: res => {
        try {
          const remote = JSON.parse(res.responseText);
          if (remote.version && remote.version !== config.version) {
            if (confirm(`发现新版本 v${remote.version}，是否更新？`)) {
              window.open(remote.download, "_blank");
            }
          }
        } catch (err) {
          log("更新检查失败", err);
        }
      }
    });
  }

  function registerPlatform(platform) {
    config.platforms.push(platform);
  }

  function runPlatformMatch() {
    for (const platform of config.platforms) {
      if (platform.match()) {
        log(`匹配到平台：${platform.name}`);
        platform.handler();
        return;
      }
    }
  }

  // 启动入口
  window.addEventListener("load", () => {
    checkForUpdate();

    const menu = [
      { name: "查看领取记录", action: showHistory },
      { name: "手动执行领取", action: runPlatformMatch }
    ];

    if (typeof GM_registerMenuCommand === "function") {
      menu.forEach(item => GM_registerMenuCommand(item.name, item.action));
    }
  });
  /** 平台定义模板
   * name: 平台名
   * match(): 当前页面是否匹配平台
   * handler(): 执行领取逻辑
   */

  // ========== Steam 平台 ==========
  registerPlatform({
    name: "Steam",
    match: () => location.hostname.includes("store.steampowered.com") && /free|gratuit/i.test(document.body.innerText),
    handler: () => {
      const btn = document.querySelector(".btn_addtocart");
      if (btn && btn.innerText.includes("领取") || btn.innerText.includes("添加账户")) {
        btn.click();
        showSuccess("Steam 限免游戏已尝试添加至账户");
        logClaimResult("Steam", document.title, true);
      } else {
        showNotice("未发现可领取的 Steam 游戏");
        logClaimResult("Steam", document.title, false);
      }
    }
  });

  // ========== Epic Games ==========
  registerPlatform({
    name: "Epic",
    match: () => location.hostname.includes("epicgames.com") && location.pathname.includes("/free-games"),
    handler: () => {
      const btn = document.querySelector("button:enabled span");
      if (btn && /获取|领取|GET|Claim/i.test(btn.innerText)) {
        btn.click();
        setTimeout(() => {
          const confirm = document.querySelector("button:enabled span");
          if (confirm && /下订单|PLACE ORDER/i.test(confirm.innerText)) {
            confirm.click();
            showSuccess("Epic 限免游戏已尝试领取");
            logClaimResult("Epic", document.title, true);
          } else {
            showNotice("未检测到下订单按钮");
            logClaimResult("Epic", document.title, false);
          }
        }, 1500);
      } else {
        showNotice("未发现可领取的 Epic 游戏");
        logClaimResult("Epic", document.title, false);
      }
    }
  });

  // ========== GOG ==========
  registerPlatform({
    name: "GOG",
    match: () => location.hostname.includes("gog.com") && /free/i.test(document.body.innerText),
    handler: () => {
      const btn = document.querySelector(".giveaway-claim button");
      if (btn && /领取|Claim/i.test(btn.innerText)) {
        btn.click();
        showSuccess("GOG 限免游戏已尝试领取");
        logClaimResult("GOG", document.title, true);
      } else {
        showNotice("未发现可领取的 GOG 游戏");
        logClaimResult("GOG", document.title, false);
      }
    }
  });

  // ========== Amazon Prime Gaming ==========
  registerPlatform({
    name: "Amazon",
    match: () => location.hostname.includes("gaming.amazon.com"),
    handler: () => {
      const btn = document.querySelector("button:enabled");
      if (btn && /领取|Claim|获取/i.test(btn.innerText)) {
        btn.click();
        showSuccess("Amazon Prime 游戏已尝试领取");
        logClaimResult("Amazon", document.title, true);
      } else {
        showNotice("未发现可领取的 Amazon 游戏");
        logClaimResult("Amazon", document.title, false);
      }
    }
  });

  // ========== Ubisoft ==========
  registerPlatform({
    name: "Ubisoft",
    match: () => location.hostname.includes("ubisoft.com") && /free/i.test(document.body.innerText),
    handler: () => {
      const btn = document.querySelector("button");
      if (btn && /领取|Claim|Get/i.test(btn.innerText)) {
        btn.click();
        showSuccess("Ubisoft 游戏已尝试领取");
        logClaimResult("Ubisoft", document.title, true);
      } else {
        showNotice("未发现可领取的 Ubisoft 游戏");
        logClaimResult("Ubisoft", document.title, false);
      }
    }
  });
  // ========== 平台注册器闭合 ==========
  function registerPlatform(platform) {
    platforms.push(platform);
  }

  // ========== 自动检测并执行 ==========
  setTimeout(() => {
    const matched = platforms.find(p => p.match());
    if (matched) {
      console.log(`检测到平台：${matched.name}`);
      matched.handler();
    } else {
      console.warn("未检测到支持的游戏平台");
    }
  }, 1000);

})();
