document.addEventListener("include-html-loaded", function() {
    const concertIdInput = document.getElementById("concert-id");
    const sectionInput = document.getElementById("section");
    const fieldset = document.querySelector("fieldset");

    if (concertIdInput) {
        concertIdInput.placeholder = "Product ID, place/product, or full NOL link";
    }

    if (sectionInput) {
        sectionInput.placeholder = "Multiple areas allowed, comma separated, e.g. 004,005";
    }

    if (fieldset && !document.getElementById("areaScanIntervalMs")) {
        const settings = document.createElement("div");
        settings.className = "interpark-extra-config";
        settings.innerHTML = `
            <div class="form-section-title">Interpark Polling Settings</div>
            <div class="form-row">
                <label for="refreshIntervalMs">Interval between rounds (ms)</label>
                <input type="number" id="refreshIntervalMs" name="refreshIntervalMs" min="0" step="100" placeholder="2000">
            </div>
            <div class="form-row">
                <label for="refreshJitterMs">Random jitter per round (ms)</label>
                <input type="number" id="refreshJitterMs" name="refreshJitterMs" min="0" step="100" placeholder="600">
            </div>
            <div class="form-row">
                <label for="areaScanIntervalMs">Interval between areas (ms)</label>
                <input type="number" id="areaScanIntervalMs" name="areaScanIntervalMs" min="0" step="100" placeholder="800">
            </div>
            <div class="form-row">
                <label for="maxAreaClicksPerRefresh">Max areas scanned per round when no area is specified</label>
                <input type="number" id="maxAreaClicksPerRefresh" name="maxAreaClicksPerRefresh" min="1" step="1" placeholder="12">
            </div>
            <div class="form-row">
                <label for="maxSeatRow">Only refresh the first N seat rows</label>
                <input type="number" id="maxSeatRow" name="maxSeatRow" min="0" step="1" placeholder="0 means no filter">
            </div>
            <div class="form-row">
                <label for="bookingSessionTimeoutMinutes">Reopen booking page after timeout (minutes)</label>
                <input type="number" id="bookingSessionTimeoutMinutes" name="bookingSessionTimeoutMinutes" min="0" step="0.5" placeholder="9.5, enter 0 to disable">
            </div>
            <div class="form-section-title">Ticket Pickup Confirmation Info</div>
            <div class="form-row">
                <label for="delivery">Pickup method value</label>
                <input type="text" id="delivery" name="delivery" placeholder="Default 24000">
            </div>
            <div class="form-row">
                <label for="phoneNo">Contact phone</label>
                <input type="text" id="phoneNo" name="phoneNo" placeholder="Enter contact phone number">
            </div>
            <div class="form-row">
                <label for="mobileNo">Mobile number</label>
                <input type="text" id="mobileNo" name="mobileNo" placeholder="Enter mobile number">
            </div>
            <div class="form-row">
                <label for="snsChannel">Messenger type</label>
                <select id="snsChannel" name="snsChannel">
                    <option value="SN004">Wechat</option>
                    <option value="">Not set</option>
                </select>
            </div>
            <div class="form-row">
                <label for="snsId">Messenger ID</label>
                <input type="text" id="snsId" name="snsId" placeholder="Enter Messenger ID">
            </div>
            <div class="form-row">
                <label for="autoNext">Automatically proceed after filling confirmation info</label>
                <select id="autoNext" name="autoNext">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </div>
        `;
        fieldset.appendChild(settings);
    }
});
