:root {
    --cor-primaria: #E60000; 
    --cor-primaria-hover: #c00000;
    --cor-texto: #333;
    --cor-fundo: #FFFFFF;
    --cor-fundo-escuro: #333;
    --cor-cinza-claro: #f4f4f4;
    --cor-cinza-medio: #D8D6D6;
    --cor-borda: #ddd;
}

body {
    font-family: 'Roboto', sans-serif;
    margin: 0;
    background-color: var(--cor-fundo); 
    color: var(--cor-texto);
    animation: pageFadeIn 0.22s ease-out;
}

@keyframes pageFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
    }
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    background-color: var(--cor-fundo);
    padding: 10px 0;
    border-bottom: 1px solid var(--cor-borda);
}
header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}
header .logo {
    height: 60px;
}
header nav ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    gap: 25px;
}
header nav a {
    text-decoration: none;
    color: var(--cor-texto);
    font-weight: 500;
}
.header-actions {
    display: flex;
    align-items: center;
    gap: 15px;
}
.header-actions form {
    margin: 0;
}
.search-form input {
    border: 1px solid #ccc;
    border-radius: 20px;
    padding: 8px 15px;
}
footer {
    background-color: var(--cor-fundo-escuro);
    color: #fff;
    padding: 50px 20px 20px 20px;
}
footer .container {
    display: grid;
    grid-template-columns: auto 1fr 1fr 1fr;
    gap: 50px;
    align-items: start;
}
.footer-logo img {
    max-width: 120px;
}
footer h4 {
    font-size: 1.2em;
    margin-top: 0;
    margin-bottom: 20px;
    color: #fff;
}
footer ul {
    list-style: none;
    padding: 0;
    margin: 0;
}
footer ul li {
    margin-bottom: 12px;
}
footer a {
    color: #ccc;
    text-decoration: none;
    transition: color 0.3s;
}
footer a:hover {
    color: #fff;
}
.footer-social img {
    height: 30px;
    margin-right: 15px;
    opacity: 0.8;
    transition: opacity 0.3s;
}
.footer-social img:hover {
    opacity: 1;
}
.copyright {
    text-align: center;
    padding: 30px 20px;
    margin-top: 40px;
    font-size: 0.9em;
    color: #aaa;
    border-top: 1px solid #555;
    width: 100%;
    box-sizing: border-box;
}
.copyright p {
    margin: 0;
    padding: 0;
    line-height: 1.5;
    white-space: normal !important;
    overflow-wrap: break-word !important;
    word-wrap: break-word !important;
}

.btn {
    display: inline-block;
    padding: 10px 24px;
    font-weight: bold;
    text-align: center;
    text-decoration: none;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
}
.btn-primary {
    background-color: var(--cor-primaria);
    color: #ffffff;
}
.btn-primary:hover {
    background-color: var(--cor-primaria-hover);
    transform: translateY(-2px);
}
.btn-secondary {
    background-color: #fff;
    color: #000;
    border-color: #ccc;
}
.btn-secondary:hover {
    background-color: var(--cor-cinza-claro);
}
.btn-danger {
    background-color: #dc3545;
    color: white;
}
.btn-danger:hover {
    background-color: #c82333;
}
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
    outline: 3px solid #111;
    outline-offset: 3px;
    box-shadow: 0 0 0 5px rgba(230, 0, 0, 0.25);
}
.toast-region {
    position: fixed;
    right: 20px;
    top: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: min(360px, calc(100vw - 40px));
}
.toast {
    background-color: #1f2933;
    border-left: 5px solid var(--cor-primaria);
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.24);
    color: #fff;
    font-weight: 700;
    line-height: 1.4;
    padding: 14px 16px;
}
.toast.success { border-left-color: #1f9d55; }
.toast.error { border-left-color: #dc3545; }
.toast.info { border-left-color: #2f80ed; }
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
.page-return {
    margin: 0 0 20px 0;
}
.page-return a {
    color: var(--cor-texto);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    text-decoration: none;
}
.page-return a:hover {
    color: var(--cor-primaria);
}
.table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    font-size: 0.9rem;
}
.table th, .table td {
    border: 1px solid var(--cor-borda);
    padding: 12px;
    text-align: left;
}
.table th {
    background-color: var(--cor-cinza-claro);
    font-weight: bold;
}

main {
    padding: 40px 0;
}

.categorias {
  padding: 20px;
}

.categorias h2 {
  font-size: 1.8em;
  margin-bottom: 30px;
  text-align: left;
}

.categoria-boxes {
  display: flex;
  justify-content: center;
  gap: 50px;
  flex-wrap: wrap;
}

.categoria {
  background-color: var(--cor-primaria);
  border-radius: 25px;
  padding: 20px;
  width: 250px;
  box-sizing: border-box;
  text-align: center;
  transition: transform 0.3s;
}
.categoria:hover {
  transform: scale(1.05);
}
.categoria img {
  max-width: 120px;
  height: auto;
  margin-top: -25px;
}
.categoria p {
  color: var(--cor-texto);
  background-color: #E09797;
  font-weight: bold;
  border-radius: 10px;
  padding: 8px 5px;
  margin-top: 5px;
}

.cta-section {
    background-color: var(--cor-cinza-medio);
    display: flex;
    align-items: center; 
    gap: 40px; 
    padding: 50px;
    flex-wrap: wrap;
    margin-top: 40px;
}
.cta-text {
    flex: 1;
    min-width: 300px;
}
.cta-text h2 {
    font-size: 2.5rem;
    line-height: 1.2;
    margin-bottom: 20px;
}
.cta-section img {
    max-width: 40%;
    min-width: 300px;
}

.cta-section .btn-primary {
    padding: 15px 40px; 
    font-size: 1.2rem;  
    text-transform: uppercase; 
    border-radius: 8px; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
}

.dashboard, .admin-page {
    max-width: 900px;
    margin: 40px auto;
    padding: 0 20px;
}
.dashboard h1, .dashboard p, .dashboard h3, .admin-page h2 {
    color: var(--cor-texto);
}
.dashboard h3, .admin-page h2 {
    border-bottom: 2px solid var(--cor-cinza-claro);
    padding-bottom: 10px;
    margin: 40px 0 20px 0;
}
.dashboard-menu ul {
    list-style: none;
    padding: 0;
}
.dashboard-menu li {
    margin-bottom: 15px;
}
.dashboard-menu a {
    display: block;
    background-color: var(--cor-cinza-claro);
    color: var(--cor-texto);
    padding: 16px 25px;
    border-radius: 8px;
    border-left: 5px solid var(--cor-primaria);
    text-decoration: none;
    font-size: 1.1rem;
    font-weight: 500;
    transition: all 0.3s ease;
}
.dashboard-menu a:hover {
    background-color: var(--cor-primaria);
    color: #FFFFFF;
    transform: translateX(5px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
    header .container {
        flex-direction: column;
        gap: 15px;
    }
    footer .container {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 480px) {
    footer .container {
        grid-template-columns: 1fr;
        text-align: center;
    }

    .footer-logo {
        margin: 0 auto 20px auto;
    }
}
