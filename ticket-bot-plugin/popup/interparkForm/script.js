document.addEventListener("include-html-loaded", function() {
    const concertIdInput = document.getElementById("concert-id");
    const sectionInput = document.getElementById("section");
    const fieldset = document.querySelector("fieldset");

    if (concertIdInput) {
        concertIdInput.placeholder = "Product ID、place/product 或完整 NOL 链接";
    }

    if (sectionInput) {
        sectionInput.placeholder = "可填多个区域，逗号分隔，如 004,005";
    }

    if (fieldset && !document.getElementById("areaScanIntervalMs")) {
        const settings = document.createElement("div");
        settings.className = "interpark-extra-config";
        settings.innerHTML = `
            <div class="form-section-title">Interpark 轮询设置</div>
            <div class="form-row">
                <label for="refreshIntervalMs">每轮间隔（毫秒）</label>
                <input type="number" id="refreshIntervalMs" name="refreshIntervalMs" min="0" step="100" placeholder="2000">
            </div>
            <div class="form-row">
                <label for="refreshJitterMs">每轮随机抖动（毫秒）</label>
                <input type="number" id="refreshJitterMs" name="refreshJitterMs" min="0" step="100" placeholder="600">
            </div>
            <div class="form-row">
                <label for="areaScanIntervalMs">区域间隔（毫秒）</label>
                <input type="number" id="areaScanIntervalMs" name="areaScanIntervalMs" min="0" step="100" placeholder="800">
            </div>
            <div class="form-row">
                <label for="maxAreaClicksPerRefresh">无指定区域时每轮最多扫描区域数</label>
                <input type="number" id="maxAreaClicksPerRefresh" name="maxAreaClicksPerRefresh" min="1" step="1" placeholder="12">
            </div>
            <div class="form-row">
                <label for="maxSeatRow">只刷前几排座位</label>
                <input type="number" id="maxSeatRow" name="maxSeatRow" min="0" step="1" placeholder="0 表示不过滤">
            </div>
            <div class="form-row">
                <label for="bookingSessionTimeoutMinutes">订购页超时重开（分钟）</label>
                <input type="number" id="bookingSessionTimeoutMinutes" name="bookingSessionTimeoutMinutes" min="0" step="0.5" placeholder="9.5，填 0 表示禁用">
            </div>
            <div class="form-section-title">取票确认信息</div>
            <div class="form-row">
                <label for="delivery">取票方式值</label>
                <input type="text" id="delivery" name="delivery" placeholder="默认 24000">
            </div>
            <div class="form-row">
                <label for="phoneNo">联系电话</label>
                <input type="text" id="phoneNo" name="phoneNo" placeholder="请输入联系电话">
            </div>
            <div class="form-row">
                <label for="mobileNo">手机号</label>
                <input type="text" id="mobileNo" name="mobileNo" placeholder="请输入手机号">
            </div>
            <div class="form-row">
                <label for="snsChannel">Messenger 类型</label>
                <select id="snsChannel" name="snsChannel">
                    <option value="SN004">Wechat</option>
                    <option value="">不填写</option>
                </select>
            </div>
            <div class="form-row">
                <label for="snsId">Messenger ID</label>
                <input type="text" id="snsId" name="snsId" placeholder="请输入 Messenger ID">
            </div>
            <div class="form-row">
                <label for="autoNext">填写确认信息后自动下一步</label>
                <select id="autoNext" name="autoNext">
                    <option value="true">是</option>
                    <option value="false">否</option>
                </select>
            </div>
        `;
        fieldset.appendChild(settings);
    }
});
