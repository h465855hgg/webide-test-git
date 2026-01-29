document.getElementById('btn').onclick = function() {
    document.getElementById('log').innerText = '时间: ' + new Date().toLocaleTimeString();
};