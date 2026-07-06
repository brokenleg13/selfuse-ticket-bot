document.addEventListener("include-html-loaded", function() {
    const fieldset = document.querySelector("fieldset");
    const ticketRow = document.getElementById("nb-ticket")
        ? document.getElementById("nb-ticket").closest(".form-row")
        : null;

    if (!fieldset || document.getElementById("customer-id")) {
        return;
    }

    const customerRow = document.createElement("div");
    customerRow.className = "form-row";
    customerRow.innerHTML = `
        <label for="customer-id">YES24 用户 ID</label>
        <input type="text" id="customer-id" name="customer-id" placeholder="YES24 idCustomer">
    `;

    if (ticketRow) {
        fieldset.insertBefore(customerRow, ticketRow);
    } else {
        fieldset.appendChild(customerRow);
    }
});
