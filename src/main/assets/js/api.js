(function() {
    const isAndroid = !!(window.Android && window.Android.httpRequest);
    
    // 1. Native 通信 (Android)
    const callbacks = {};
    window.onAndroidResponse = function(id, b64) {
        const cb = callbacks[id];
        if (cb) {
            try {
                const json = JSON.parse(decodeURIComponent(escape(window.atob(b64))));
                json.success ? cb.resolve(json.data) : cb.reject(json.data);
            } catch (e) { cb.reject("Error"); }
            delete callbacks[id];
        }
    };
    const call = (method, ...args) => new Promise((resolve, reject) => {
        if (!isAndroid) return reject("Browser Mode");
        const id = 'cb_' + Math.random().toString(36).substr(2, 9);
        callbacks[id] = { resolve, reject };
        window.Android[method](...args, id);
    });

    // 2. 浏览器模拟 (Browser Polyfill)
    const toastInBrowser = (msg) => {
        const d = document.createElement('div');
        d.style.cssText = "position:fixed;bottom:20%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;padding:8px 16px;border-radius:4px;font-size:14px;z-index:999;";
        d.innerText = msg;
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 2000);
    };

    // 3. 对外接口
    window.App = {
        ui: {
            toast: (msg) => isAndroid ? window.Android.showToast(msg) : toastInBrowser(msg),
            notification: (id, t, c) => isAndroid && window.Android.showNotification(id, t, c)
        },
        sys: {
            vibrate: (ms) => isAndroid ? window.Android.vibrate(ms) : navigator.vibrate?.(ms),
            copy: (t) => isAndroid ? window.Android.copyToClipboard(t) : navigator.clipboard.writeText(t)
        },
        file: {
            write: (p, c) => isAndroid ? call('writeFile', p, c) : localStorage.setItem(p,c),
            read: (p) => isAndroid ? call('readFile', p) : Promise.resolve(localStorage.getItem(p))
        },
        http: {
            get: async (url) => isAndroid ? JSON.parse(await call('httpRequest', 'GET', url, '{}', '')) : (await fetch(url)).text()
        }
    };
})();