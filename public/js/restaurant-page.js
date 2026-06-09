document.addEventListener('DOMContentLoaded', () => {
    const title = document.querySelector('.menu-title-area h2')?.textContent.trim() || 'Restaurante';
    const slug = document.body.dataset.restaurant || title.toLowerCase().replace(/\W+/g, '-');

    document.querySelectorAll('.product-item').forEach((product, index) => {
        const details = product.querySelector('.product-details');
        const name = product.querySelector('h4')?.textContent.trim();
        const priceText = product.querySelector('.product-price')?.textContent.trim();
        const image = product.querySelector('img')?.getAttribute('src') || 'images/icons/lanche_icon.png';

        if (!details || !name || details.querySelector('[data-add-cart]')) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-cart add-cart-button';
        button.dataset.addCart = 'true';
        button.textContent = 'Adicionar ao carrinho';
        button.addEventListener('click', () => {
            window.JustDoEat.addCartItem({
                id: `${slug}-${index}-${name}`.toLowerCase().replace(/\W+/g, '-'),
                restaurant: title,
                name,
                price: window.JustDoEat.parseCurrency(priceText),
                image
            });
        });

        details.appendChild(button);
    });
});
