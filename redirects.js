body {
    background-color: #FFFFFF;
    margin: 0;
    padding: 0;
    font-family: 'Roboto', sans-serif;
}

.header-menu {
    border-bottom: 4px solid #000;
    padding: 15px 0;
    background-color: #fff;
}

.header-menu .container {
    display: flex;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.header-menu .logo-pequena {
    width: 60px;
    height: auto;
}

.header-menu nav {
    flex: 1;
    display: flex;
    justify-content: center;
}

.header-menu nav ul {
    display: flex;
    gap: 50px;
    list-style: none;
    margin: 0;
    padding: 0;
}

.header-menu nav a {
    font-family: 'Archivo Black', sans-serif;
    color: #000;
    text-decoration: none;
    font-size: 1.1rem;
    text-transform: capitalize;
}

.header-right .cart-icon {
    width: 28px;
    height: 28px;
    cursor: pointer;
}

.restaurant-page {
    max-width: 1000px;
    margin: 30px auto 60px auto;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.restaurant-page .page-return {
    align-self: flex-start;
}

.restaurant-logo-circle {
    width: 100px;
    height: 100px;
    background-color: #E60000;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Archivo Black', sans-serif;
    color: #FFC72C;
    font-size: 3.5rem;
    margin-bottom: 20px;
    z-index: 2;
    position: relative;
}

body[data-restaurant="burgerking"] .restaurant-logo-circle {
    background-color: #F4EBE1;
    color: #D72300;
    font-size: 1.4rem;
}

body[data-restaurant="starbucks"] .restaurant-logo-circle {
    background-color: #006241;
    color: #FFFFFF;
    font-size: 1rem;
}

body[data-restaurant="outback"] .restaurant-logo-circle {
    background-color: #F4EBE1;
    color: #8C1D11;
    font-size: 1.1rem;
}

body[data-restaurant="habibs"] .restaurant-logo-circle {
    background-color: #E60000;
    color: #FFFFFF;
    font-size: 1.1rem;
}

.menu-container {
    background-color: #d1d1d1;
    border: 1px solid #999;
    border-radius: 40px;
    width: 100%;
    padding: 60px 40px 30px 40px;
    box-shadow: 2px 2px 15px rgba(0,0,0,0.2);
    box-sizing: border-box;
    margin-top: -70px;
}

.menu-header-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid transparent;
    margin-bottom: 25px;
}

.menu-title-area h2 {
    font-family: 'Archivo Black', sans-serif;
    font-size: 1.6rem;
    margin: 0 0 5px 0;
    color: #000;
}

.menu-rating {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.85rem;
    color: #777;
    font-weight: bold;
}

.menu-rating .star {
    color: #FFC72C;
    font-size: 1.1rem;
}

.rating-score {
    color: #000;
}

.menu-actions {
    display: flex;
    gap: 15px;
    align-items: center;
}

.menu-actions svg {
    width: 24px;
    height: 24px;
    cursor: pointer;
}

.category-title {
    font-family: 'Archivo Black', sans-serif;
    font-size: 1.4rem;
    margin: 0 0 20px 0;
    color: #000;
}

.product-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.product-item {
    display: flex;
    gap: 15px;
    align-items: stretch;
}

.product-image-box {
    width: 180px;
    background-color: #e2e2e2;
    border-radius: 15px;
    border: 1px solid #999;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    padding: 10px;
}

.product-image-box img {
    width: 100%;
    height: auto;
    object-fit: contain;
}

.product-details {
    flex: 1;
    background-color: #FFFFFF;
    border-radius: 15px;
    padding: 15px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
}

.product-details h4 {
    margin: 0 0 5px 0;
    font-family: 'Archivo Black', sans-serif;
    font-size: 1rem;
    text-align: center;
    color: #000;
}

.product-details p {
    margin: 0 0 15px 0;
    font-size: 0.8rem;
    color: #888;
    font-weight: 700;
    line-height: 1.3;
    text-align: center;
}

.product-price {
    font-family: 'Archivo Black', sans-serif;
    font-size: 1.1rem;
    color: #000;
    margin: 0;
    text-align: left;
}

.add-cart-button {
    align-self: flex-start;
    border-radius: 20px;
    font-size: 0.85rem;
    margin-top: 12px;
    padding: 10px 16px;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 30px;
}

.page-btn {
    background-color: #A33A3A;
    color: #FFF;
    font-family: 'Archivo Black', sans-serif;
    font-size: 1rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 1px 1px 5px rgba(0,0,0,0.3);
}

@media (max-width: 768px) {
    .product-item {
        flex-direction: column;
    }

    .product-image-box {
        width: 100%;
        height: 150px;
    }

    .header-menu nav ul {
        gap: 15px;
        flex-wrap: wrap;
        justify-content: center;
    }

    .menu-header-info {
        flex-direction: column;
        gap: 15px;
    }

    .menu-actions {
        align-self: flex-end;
    }
}
