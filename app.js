import { booksData } from './data/books.js';

// ---------------------------------------------------------------------------
// Mapa por id
// ---------------------------------------------------------------------------
const booksById = Object.fromEntries(booksData.map(b => [b.id, b]));

// Favoritos em memória (inicializa a partir do status)
const favorites = new Set(
    booksData.filter(b => b.status === 'favorito').map(b => b.id)
);

let state = {
    selectedBookId: booksData[0]?.id ?? null,
    activeTab: 'overview',
    currentFilter: 'all',
    searchQuery: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function safe(value, fallback = '—') {
    return (value === undefined || value === null || value === '') ? fallback : value;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setHref(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.href = value;
}

// Deriva uma categoria a partir do genre/tags para o filtro de pills
function categoryFromBook(book) {
    const haystack = [
        book.genre || '',
        ...(Array.isArray(book.tags) ? book.tags : []),
    ].join(' ').toLowerCase();

    if (/fantasia|infantojuvenil|infantil|juvenil/.test(haystack)) return 'infantojuvenil';
    if (/filosofia|autoajuda|não-ficção|nao-ficcao|educação|educacao|divulgação|divulgacao/.test(haystack)) return 'filosofia';
    if (/brasileira/.test(haystack)) return 'brasileira';
    if (/ficção|ficcao|sci-fi|científica|cientifica|distopia|suspense|terror|horror/.test(haystack)) return 'ficcao';
    return 'outros';
}

// Formata a data de leitura ("Lido em Julho") — usa o ano como fallback
function reviewMeta(book) {
    return safe(book.collection, safe(book.publisher)) + (book.year ? ` • ${book.year}` : '');
}

// ---------------------------------------------------------------------------
// Render: grade de livros (gera os cards dinamicamente)
// ---------------------------------------------------------------------------
function renderBooksGrid() {
    const grid = document.getElementById('booksGrid');
    if (!grid) return;

    // Atualiza o data-category de cada card (necessário para o filtro)
    grid.innerHTML = booksData.map(book => {
        const category = categoryFromBook(book);
        const statusBadge = {
            favorito: '<div class="absolute top-2 right-2 z-20 bg-secondary text-on-secondary px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase shadow-xs">Favorito</div>',
            lendo: '<div class="absolute top-2 right-2 z-20 bg-tertiary-fixed text-tertiary px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase shadow-xs">Lendo</div>',
            lido: '<div class="absolute top-2 right-2 z-20 bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase shadow-xs">Lido</div>',
        }[book.status] || '';

        const isActive = book.id === state.selectedBookId;
        const activeRing = isActive ? 'ring-2 ring-primary ring-offset-2 shadow-[0_4px_12px_rgba(26,17,11,0.08)]' : 'shadow-xs';

        return `
            <article
                class="book-card ${isActive ? 'active' : ''} group cursor-pointer flex flex-col bg-surface-cream rounded-lg overflow-hidden ${activeRing} hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative select-none"
                data-key="${escapeHtml(book.id)}"
                data-category="${category}"
                onclick="selectBook('${escapeHtml(book.id)}')"
            >
                ${statusBadge}
                <div class="relative w-full aspect-[1/1.42] bg-surface-container-high overflow-hidden flex items-center justify-center">
                    <div class="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-book-spine-shadow/40 via-book-spine-shadow/15 to-transparent z-10 pointer-events-none"></div>
                    <div class="absolute left-0.5 top-0 bottom-0 w-0.5 bg-white/20 z-10 pointer-events-none"></div>
                    <img
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt="Capa de ${escapeHtml(book.title)}"
                        src="${escapeHtml(book.coverUrl)}"
                        loading="lazy"
                        onerror="this.style.opacity='0.2'; this.alt='Capa indisponível';"
                    >
                    ${isActive ? '<div class="active-badge absolute bottom-2 right-2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">visibility</span> No Studio</div>' : ''}
                </div>
                <div class="p-2.5 flex-1 flex flex-col justify-between bg-surface-cream">
                    <div>
                        <div class="flex items-center justify-between text-xs mb-1">
                            <div class="flex items-center text-amber-600 font-semibold text-[10px]">
                                <span>★★★★★</span>
                                <span class="ml-1 text-ink-muted">${safe(book.rating, '—')}</span>
                            </div>
                            <span class="font-label-caps text-[10px] text-ink-muted">${safe(book.year)}</span>
                        </div>
                        <h3 class="font-headline-sm text-sm text-ink-charcoal group-hover:text-primary transition-colors line-clamp-1">${escapeHtml(book.title)}</h3>
                        <p class="font-body-sm text-xs text-ink-muted truncate">${escapeHtml(book.author)}</p>
                    </div>
                    <div class="mt-2 pt-1.5 border-t border-border-warm flex items-center justify-between text-[10px]">
                        <span class="text-primary font-semibold truncate">${escapeHtml(safe(book.publisher))}</span>
                        <span class="text-ink-muted">${book.pages ? book.pages + ' págs' : '—'}</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    applyFilters();
}

// ---------------------------------------------------------------------------
// Render: painel direito
// ---------------------------------------------------------------------------
function renderThemes(book) {
    const container = document.getElementById('studioThemesList');
    if (!container) return;
    const tags = Array.isArray(book.tags) ? book.tags : [];
    if (tags.length === 0) {
        container.innerHTML = '<span class="text-ink-muted text-xs italic">Sem temáticas cadastradas.</span>';
        return;
    }
    container.innerHTML = tags
        .map(t => `<span class="bg-surface-cream text-ink-charcoal px-2.5 py-1 rounded border border-border-warm/60">${escapeHtml(t)}</span>`)
        .join('');
}

function renderReaderPane(book) {
    if (!book) return;

    setText('studioBookTitle', safe(book.title));
    setText('studioBookAuthor', safe(book.author));
    setText('studioBookCollection', safe(book.collection, safe(book.publisher)));
    setText('studioMetaYear', safe(book.year));
    setText('studioMetaPages', book.pages ? `${book.pages} Páginas` : '—');
    setText('studioMetaGenre', safe(book.genre));
    setText('studioBookScore', safe(book.rating));

    const cover = document.getElementById('studioBookCover');
    if (cover) {
        cover.src = safe(book.coverUrl, '');
        cover.alt = safe(book.title);
        cover.onerror = () => { cover.style.opacity = '0.2'; cover.alt = 'Capa indisponível'; };
    }

    setText('studioSynopsisP1', safe(book.synopsis1, safe(book.synopsis)));
    setText('studioSynopsisP2', safe(book.synopsis2, ''));

    // Citação: se vazia, esconde o bloco inteiro
    const quoteText = document.getElementById('studioQuoteText');
    const quoteAuthor = document.getElementById('studioQuoteAuthor');
    if (quoteText) {
        const block = quoteText.closest('.bg-surface-cream');
        if (book.quote && book.quote.trim()) {
            if (block) block.style.display = '';
            quoteText.textContent = `“${book.quote}”`;
            if (quoteAuthor) quoteAuthor.textContent = safe(book.quoteAuthor, '');
        } else {
            if (block) block.style.display = 'none';
        }
    }

    const statusLabel = { lido: 'Lido', favorito: 'Favorito', lendo: 'Lendo' }[book.status] || safe(book.status);
    setText('readerStatusBadge', statusLabel);

    const favBtn = document.getElementById('readerFavBtn');
    if (favBtn) {
        const isFav = favorites.has(book.id);
        favBtn.innerHTML = isFav
            ? '<span class="material-symbols-outlined text-[18px] text-tertiary" style="font-variation-settings: \'FILL\' 1;">star</span>'
            : '<span class="material-symbols-outlined text-[18px] text-ink-muted">star</span>';
        favBtn.title = isFav ? 'Remover dos favoritos' : 'Favoritar este livro';
    }

    renderThemes(book);

    // Aba "Minha Resenha"
    const reviewBody = document.getElementById('studioReviewBody');
    if (reviewBody) {
        const review = safe(book.review, '');
        const isPlaceholder = !review || /não criada no momento/i.test(review);
        reviewBody.innerHTML = isPlaceholder
            ? '<p class="text-ink-muted italic">Resenha ainda não escrita.</p>'
            : review.split(/\n\n+/).map(p => `<p>${escapeHtml(p)}</p>`).join('');
    }
    setText('studioReviewQuote', book.quote ? `“${book.quote}”` : '—');
    setText('studioReviewMeta', reviewMeta(book));

    // Toolbar inferior
    setHref('studioLinkSkoob', book.links?.skoob);
    setHref('studioLinkGoodreads', book.links?.goodreads);
    setHref('studioLinkPublisher', book.links?.publisher);
}

// ---------------------------------------------------------------------------
// Destaque do card ativo
// ---------------------------------------------------------------------------
function highlightActiveCard(bookId) {
    document.querySelectorAll('.book-card').forEach(card => {
        const isTarget = card.dataset.key === bookId;
        card.classList.toggle('ring-2', isTarget);
        card.classList.toggle('ring-primary', isTarget);
        card.classList.toggle('ring-offset-2', isTarget);
        card.classList.toggle('shadow-md', isTarget);
        card.classList.toggle('shadow-xs', !isTarget);

        let badge = card.querySelector('.active-badge');
        if (isTarget && !badge) {
            badge = document.createElement('div');
            badge.className = 'active-badge absolute bottom-2 right-2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1';
            badge.innerHTML = '<span class="material-symbols-outlined text-[12px]">visibility</span> No Studio';
            const aspectEl = card.querySelector('.aspect-\\[1\\/1\\.42\\]');
            if (aspectEl) aspectEl.appendChild(badge);
        } else if (!isTarget && badge) {
            badge.remove();
        }
    });
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------
function selectBook(bookId) {
    const book = booksById[bookId];
    if (!book) {
        console.warn(`[app.js] Livro não encontrado: "${bookId}".`);
        return;
    }
    state.selectedBookId = bookId;
    renderReaderPane(book);

    // Re-renderiza a grade para refletir o "No Studio" e o ring
    renderBooksGrid();

    if (window.innerWidth < 1024) {
        document.getElementById('readerStudioPane')?.scrollIntoView({ behavior: 'smooth' });
    }
}

function switchStudioTab(tab) {
    state.activeTab = tab;
    const overviewBtn = document.getElementById('tabBtnOverview');
    const reviewBtn = document.getElementById('tabBtnReview');
    const overviewContent = document.getElementById('tabContentOverview');
    const reviewContent = document.getElementById('tabContentReview');

    const activeCls = 'flex-1 py-1.5 px-3 rounded-md font-label-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 bg-surface-parchment text-primary shadow-xs';
    const inactiveCls = 'flex-1 py-1.5 px-3 rounded-md font-label-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 text-ink-muted hover:text-ink-charcoal';

    if (tab === 'overview') {
        overviewContent?.classList.remove('hidden');
        reviewContent?.classList.add('hidden');
        if (overviewBtn) overviewBtn.className = activeCls;
        if (reviewBtn) reviewBtn.className = inactiveCls;
    } else {
        overviewContent?.classList.add('hidden');
        reviewContent?.classList.remove('hidden');
        if (reviewBtn) reviewBtn.className = activeCls;
        if (overviewBtn) overviewBtn.className = inactiveCls;
    }
}

function filterShelf(category, btn) {
    state.currentFilter = category;
    document.querySelectorAll('.category-pill').forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary');
        b.classList.add('bg-surface-cream', 'text-ink-charcoal');
    });
    if (btn) {
        btn.classList.remove('bg-surface-cream', 'text-ink-charcoal');
        btn.classList.add('bg-primary', 'text-on-primary');
    }
    applyFilters();
}

function toggleReaderFavorite() {
    const id = state.selectedBookId;
    if (!id) return;
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    const book = booksById[id];
    if (book) renderReaderPane(book);
    renderBooksGrid();
}

function shareBookInfo() {
    const label = document.getElementById('shareBtnLabel');
    const original = label?.textContent ?? 'Compartilhar';
    navigator.clipboard.writeText(window.location.href).catch(() => { });
    if (label) {
        label.textContent = 'Link Copiado!';
        setTimeout(() => { label.textContent = original; }, 2000);
    }
}

// ---------------------------------------------------------------------------
// Filtros + busca
// ---------------------------------------------------------------------------
function applyFilters() {
    const q = state.searchQuery.trim().toLowerCase();
    document.querySelectorAll('.book-card').forEach(card => {
        const key = card.dataset.key;
        const book = booksById[key];
        const matchCategory = state.currentFilter === 'all' || card.dataset.category === state.currentFilter;
        const matchSearch = !q || (book && (
            (book.title || '').toLowerCase().includes(q) ||
            (book.author || '').toLowerCase().includes(q) ||
            (book.publisher || '').toLowerCase().includes(q) ||
            (book.genre || '').toLowerCase().includes(q) ||
            (Array.isArray(book.tags) && book.tags.some(t => t.toLowerCase().includes(q)))
        ));
        card.classList.toggle('hidden', !(matchCategory && matchSearch));
    });
}

function initSearch() {
    const input = document.querySelector('input[type="search"]');
    if (!input) return;
    input.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        applyFilters();
    });
}

// ---------------------------------------------------------------------------
// Contadores dinâmicos
// ---------------------------------------------------------------------------
function updateCounters() {
    const total = booksData.length;
    const totalReviews = booksData.filter(b => b.review && !/não criada no momento/i.test(b.review)).length;

    document.querySelectorAll('span').forEach(span => {
        const txt = span.textContent.trim();
        if (txt.endsWith('Obras')) span.innerHTML = `<span class="material-symbols-outlined text-[16px] text-primary">library_books</span> ${total} Obras`;
        if (txt.endsWith('Resenhas')) span.innerHTML = `<span class="material-symbols-outlined text-[16px] text-secondary">history_edu</span> ${totalReviews} Resenhas`;
    });

    const counts = { all: 0, infantojuvenil: 0, filosofia: 0, brasileira: 0, ficcao: 0, outros: 0 };
    document.querySelectorAll('.book-card').forEach(card => {
        counts.all++;
        const cat = card.dataset.category;
        if (cat && counts[cat] !== undefined) counts[cat]++;
    });

    document.querySelectorAll('.category-pill').forEach(pill => {
        const onclickAttr = pill.getAttribute('onclick') || '';
        const match = onclickAttr.match(/filterShelf\('([^']+)'/);
        if (!match) return;
        const cat = match[1];
        const badge = pill.querySelector('span:last-child');
        if (badge && counts[cat] !== undefined) badge.textContent = counts[cat];
    });
}

// ---------------------------------------------------------------------------
// Expõe no escopo global
// ---------------------------------------------------------------------------
window.selectBook = selectBook;
window.switchStudioTab = switchStudioTab;
window.filterShelf = filterShelf;
window.toggleReaderFavorite = toggleReaderFavorite;
window.shareBookInfo = shareBookInfo;

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
renderBooksGrid();
initSearch();
updateCounters();
if (state.selectedBookId) {
    selectBook(state.selectedBookId);
} else {
    console.error('[app.js] booksData está vazio.');
}