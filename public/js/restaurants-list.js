function buildRestaurantCard(restaurant) {
    const link = document.createElement('a');
    link.href = restaurant.page;
    link.className = 'restaurant-card';
    link.dataset.name = restaurant.name.toLowerCase();
    link.dataset.category = restaurant.category;
    link.innerHTML = `
        <div class="logo-box ${restaurant.logoClass}">${restaurant.logo}</div>
        <div class="info-box">
            <div class="info-left">
                <div class="info-title-row">
                    <h3>${restaurant.name}</h3>
                    <span class="rating">&#9733; ${restaurant.rating}</span>
                </div>
                <p class="info-details">${restaurant.details}</p>
                <p class="info-details">${restaurant.eta}</p>
            </div>
            <div class="info-right">
                <p>${restaurant.description}</p>
            </div>
        </div>
    `;
    return link;
}

function renderRestaurants() {
    const list = document.querySelector('[data-restaurant-list]');
    const empty = document.querySelector('[data-restaurants-empty]');
    const search = document.querySelector('[data-restaurant-search]');
    if (!list) return;

    const params = new URLSearchParams(window.location.search);
    const query = (search?.value || params.get('q') || '').toLowerCase().trim();
    const category = params.get('categoria');

    if (search && !search.value && query) search.value = query;

    const restaurants = window.JustDoEat.restaurants.filter((restaurant) => {
        const matchesQuery = !query || restaurant.name.toLowerCase().includes(query) || restaurant.description.toLowerCase().includes(query);
        const matchesCategory = !category || restaurant.category === category;
        return matchesQuery && matchesCategory;
    });

    list.innerHTML = '';
    restaurants.forEach((restaurant) => list.appendChild(buildRestaurantCard(restaurant)));
    if (empty) empty.hidden = restaurants.length > 0;
}

document.addEventListener('DOMContentLoaded', () => {
    const search = document.querySelector('[data-restaurant-search]');
    renderRestaurants();
    search?.addEventListener('input', renderRestaurants);
});
