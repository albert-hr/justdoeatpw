const storageKey = "justdoeat-products";

const defaultProducts = [
    {
        id: "hamburguer",
        name: "Hambúrguer",
        description: "Hambúrguer Clássico",
        price: "R$ 25,00",
        category: "Lanches",
        image: "images/icons/lanche_icon.png",
        active: true
    },
    {
        id: "pizza-marguerita",
        name: "Pizza Marguerita",
        description: "Molho de tomate, mussarela e manjericão",
        price: "R$ 35,00",
        category: "Comidas",
        image: "images/icons/marmita_icon.png",
        active: true,
        containImage: true
    },
    {
        id: "coca-cola",
        name: "Coca Cola - 350ml",
        description: "Refrigerante em Lata",
        price: "R$ 6,00",
        category: "Bebidas",
        image: "images/icons/bebida_icon.png",
        active: true
    },
    {
        id: "acai",
        name: "Açaí - 400ml",
        description: "Açaí 400ml, Leite Condensado, Morango e Leite em Pó",
        price: "R$ 12,00",
        category: "Bebidas",
        image: "images/icons/bebida_icon.png",
        active: true
    }
];

const state = {
    products: loadProducts(),
    selectedId: null,
    showOnlyActive: false,
    categoryFilter: new URLSearchParams(window.location.search).get("categoria") || "",
    uploadedImage: ""
};

const elements = {
    search: document.getElementById("product-search"),
    add: document.getElementById("add-product"),
    filter: document.getElementById("filter-products"),
    list: document.getElementById("products-list"),
    form: document.getElementById("product-form"),
    modal: document.getElementById("product-modal"),
    formTitle: document.getElementById("form-title"),
    productId: document.getElementById("product-id"),
    name: document.getElementById("product-name"),
    description: document.getElementById("product-description"),
    price: document.getElementById("product-price"),
    category: document.getElementById("product-category"),
    additional: document.getElementById("product-additional"),
    image: document.getElementById("product-image"),
    upload: document.getElementById("upload-image"),
    toggle: document.getElementById("status-toggle"),
    statusText: document.getElementById("status-text"),
    active: document.getElementById("product-active"),
    cancel: document.getElementById("cancel-product"),
    delete: document.getElementById("delete-product"),
    navFilters: document.querySelectorAll("[data-category-filter]")
};

function openModal() {
    elements.modal.classList.remove("hidden");
    elements.name.focus();
}

function closeModal() {
    elements.modal.classList.add("hidden");
    elements.add.focus();
}

function updateStatusText() {
    const isActive = elements.active.value === "true";
    elements.statusText.textContent = `Status: ${isActive ? "Ativo" : "Inativo"}`;
    elements.toggle.setAttribute("aria-pressed", String(isActive));
}

function loadProducts() {
    const savedProducts = localStorage.getItem(storageKey);
    return savedProducts ? JSON.parse(savedProducts) : defaultProducts;
}

function saveProducts() {
    localStorage.setItem(storageKey, JSON.stringify(state.products));
}

function normalizeText(value) {
    return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatPrice(value) {
    const numbers = value.replace(/\D/g, "");

    if (!numbers) {
        return "";
    }

    const amount = Number(numbers) / 100;
    return amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function createId() {
    return `produto-${Date.now()}`;
}

function getFilteredProducts() {
    const search = normalizeText(elements.search.value.trim());

    return state.products.filter((product) => {
        const matchesSearch = !search || normalizeText(`${product.name} ${product.description} ${product.category}`).includes(search);
        const matchesStatus = !state.showOnlyActive || product.active;
        const matchesCategory = !state.categoryFilter || normalizeText(product.category) === normalizeText(state.categoryFilter);

        return matchesSearch && matchesStatus && matchesCategory;
    });
}

function renderProducts() {
    const products = getFilteredProducts();

    if (!products.length) {
        elements.list.innerHTML = '<div class="empty-message">Nenhum produto encontrado.</div>';
        return;
    }

    elements.list.innerHTML = products.map((product) => `
        <button class="product-card${product.id === state.selectedId ? " selected" : ""}" type="button" data-product-id="${product.id}">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="${product.containImage ? "product-image-contain" : ""}">
            <div class="product-info">
                <h4>${escapeHtml(product.name)}</h4>
                <p>${escapeHtml(product.description)}</p>
            </div>
            <div class="product-value${product.active ? "" : " inactive"}">${product.active ? escapeHtml(product.price) : "Inativo"}</div>
            <div class="dots-icon" aria-hidden="true"><span></span><span></span><span></span></div>
        </button>
    `).join("");
}

function clearForm() {
    state.selectedId = null;
    state.uploadedImage = "";
    elements.formTitle.textContent = "CADASTRO DE PRODUTOS";
    elements.productId.value = "";
    elements.name.value = "";
    elements.description.value = "";
    elements.price.value = "";
    elements.category.value = "";
    elements.additional.value = "";
    elements.image.value = "";
    elements.upload.textContent = "CARREGAR";
    elements.active.value = "true";
    elements.delete.disabled = true;
    elements.toggle.classList.remove("inactive");
    updateStatusText();
    renderProducts();
    openModal();
}

function fillForm(product) {
    state.selectedId = product.id;
    state.uploadedImage = product.image;
    elements.formTitle.textContent = "EDIÇÃO DE PRODUTOS";
    elements.productId.value = product.id;
    elements.name.value = product.name;
    elements.description.value = product.description;
    elements.price.value = product.price;
    elements.category.value = product.category;
    elements.additional.value = product.additional || "";
    elements.upload.textContent = "CARREGAR";
    elements.delete.disabled = false;
    elements.active.value = String(product.active);
    elements.toggle.classList.toggle("inactive", !product.active);
    updateStatusText();
    renderProducts();
    openModal();
}

function handleSubmit(event) {
    event.preventDefault();

    const product = {
        id: elements.productId.value || createId(),
        name: elements.name.value.trim(),
        description: elements.description.value.trim(),
        price: elements.price.value.trim(),
        category: elements.category.value.trim(),
        additional: elements.additional.value.trim(),
        image: state.uploadedImage || "images/icons/marmita_icon.png",
        active: elements.active.value === "true"
    };

    if (!product.name || !product.description || !product.price || !product.category) {
        alert("Preencha nome, descrição, preço e categoria.");
        return;
    }

    const currentIndex = state.products.findIndex((item) => item.id === product.id);

    if (currentIndex >= 0) {
        state.products[currentIndex] = product;
    } else {
        state.products.push(product);
    }

    saveProducts();
    fillForm(product);
    window.JustDoEatUI.showToast(currentIndex >= 0 ? "Produto atualizado com sucesso." : "Produto adicionado com sucesso.", "success");
    closeModal();
}

function deleteSelectedProduct() {
    const product = state.products.find((item) => item.id === state.selectedId);

    if (!product) {
        alert("Selecione um produto para remover.");
        return;
    }

    const shouldDelete = confirm(`Remover o produto "${product.name}"?`);
    if (!shouldDelete) {
        return;
    }

    state.products = state.products.filter((item) => item.id !== product.id);
    saveProducts();
    clearForm();
    closeModal();
    window.JustDoEatUI.showToast("Produto removido com sucesso.", "success");
}

function handleImageUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        window.JustDoEatUI.showToast("Use uma imagem PNG, JPG ou WEBP.", "error");
        elements.image.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        window.JustDoEatUI.showToast("A imagem deve ter no máximo 2 MB.", "error");
        elements.image.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        state.uploadedImage = reader.result;
        elements.upload.textContent = "IMAGEM OK";
        window.JustDoEatUI.showToast("Imagem carregada.", "success");
    };
    reader.readAsDataURL(file);
}

function toggleStatus() {
    const isActive = elements.active.value !== "true";
    elements.active.value = String(isActive);
    elements.toggle.classList.toggle("inactive", !isActive);
    updateStatusText();
    window.JustDoEatUI.showToast(`Produto marcado como ${isActive ? "ativo" : "inativo"}.`, "info");
}

function toggleActiveFilter() {
    state.showOnlyActive = !state.showOnlyActive;
    elements.filter.classList.toggle("active", state.showOnlyActive);
    elements.filter.textContent = state.showOnlyActive ? "ATIVOS" : "FILTRAR";
    renderProducts();
}

function bindEvents() {
    elements.search.addEventListener("input", renderProducts);
    elements.add.addEventListener("click", clearForm);
    elements.filter.addEventListener("click", toggleActiveFilter);
    elements.cancel.addEventListener("click", closeModal);
    elements.delete.addEventListener("click", deleteSelectedProduct);
    elements.form.addEventListener("submit", handleSubmit);
    elements.price.addEventListener("input", () => {
        elements.price.value = formatPrice(elements.price.value);
    });
    elements.upload.addEventListener("click", () => elements.image.click());
    elements.image.addEventListener("change", handleImageUpload);
    elements.toggle.addEventListener("click", toggleStatus);
    elements.modal.addEventListener("click", (event) => {
        if (event.target === elements.modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !elements.modal.classList.contains("hidden")) closeModal();
    });

    elements.list.addEventListener("click", (event) => {
        const card = event.target.closest("[data-product-id]");
        if (!card) return;

        const product = state.products.find((item) => item.id === card.dataset.productId);
        if (product) {
            fillForm(product);
        }
    });

    elements.navFilters.forEach((link) => {
        link.addEventListener("click", (event) => {
            const category = link.dataset.categoryFilter;
            if (!category) return;

            event.preventDefault();
            state.categoryFilter = state.categoryFilter === category ? "" : category;
            renderProducts();
        });
    });
}

bindEvents();
renderProducts();
updateStatusText();
