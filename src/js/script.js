// Função para exibir os livros
function displayBooks(booksArray) {
  const bookShelf = document.getElementById('book-shelf');
  bookShelf.innerHTML = '';

  booksArray.forEach((book, index) => {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.dataset.index = index;

    bookCard.innerHTML = `
      <img src="${book.cover}" alt="Capa do livro ${book.title}" class="book-cover">
      <div class="book-info">
        <h3 class="book-title">${book.title}</h3>
      </div>
    `;

    bookCard.addEventListener('click', () => showBookModal(book));
    bookShelf.appendChild(bookCard);
  });
}

// Função para mostrar o modal do livro
function showBookModal(book) {
  document.getElementById('modal-title').textContent = book.title;
  document.getElementById('modal-author').textContent = book.author;
  document.getElementById('book-publisher').textContent = book.publisher;
  document.getElementById('book-year').textContent = book.year;
  document.getElementById('book-pages').textContent = book.pages;
  document.getElementById('book-genre').textContent = book.genres.join(', ');
  document.getElementById('modal-description').textContent = book.description;

  const bookCover = document.getElementById('modal-cover');
  bookCover.src = book.cover;
  bookCover.alt = `Capa do livro ${book.title}`;

  // Configurar o botão de resenha
  const reviewBtn = document.getElementById('review-btn');
  reviewBtn.onclick = () => showReviewModal(book.review);

  // Mostrar o modal
  document.getElementById('book-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Função para mostrar o modal de resenha
function showReviewModal(reviewText) {
  document.getElementById('review-modal-title').textContent = 'Resenha';
  document.getElementById('review-modal-text').textContent = reviewText;

  // Fechar o modal do livro e abrir o de resenha
  closeModal('book-modal');
  document.getElementById('review-modal').style.display = 'block';
}

// Função para fechar modais
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Função de busca
function searchBooks() {
  const searchTerm = document.getElementById('search-bar').value.toLowerCase();
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm) ||
    book.author.toLowerCase().includes(searchTerm)
  );

  if (filteredBooks.length === 0) {
    showSnackbar('Nenhum livro encontrado com esse termo de busca.');
    return;
  }

  displayBooks(filteredBooks);
}

// Função para mostrar snackbar
function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = message;
  snackbar.classList.add('show');

  setTimeout(() => {
    snackbar.classList.remove('show');
  }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Carregar livros
  displayBooks(books);

  // Configurar busca
  document.getElementById('search-bar').addEventListener('input', searchBooks);

  // Configurar botões de fechar
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', function () {
      const modal = this.closest('.modal');
      closeModal(modal.id);
    });
  });

  // Fechar modal ao clicar fora
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeModal(e.target.id);
    }
  });

  // Botão voltar ao topo
  window.addEventListener('scroll', () => {
    const backToTopBtn = document.getElementById('back-to-top');
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  document.getElementById('back-to-top').addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Mostrar modal de boas-vindas
  const welcomeModal = document.getElementById('welcomeAlert');
  welcomeModal.style.display = 'block';

  // Atualizar data de modificação
  const lastModified = new Date(document.lastModified);
  const formattedDate = lastModified.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const updateElement = document.getElementById('data-atualizacao');
  if (updateElement) {
    updateElement.textContent = `Última atualização: ${formattedDate}`;
  }

  // Relógio
  function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    const clockElement = document.getElementById('horario');
    if (clockElement) {
      clockElement.textContent = timeString;
    }
  }

  setInterval(updateClock, 1000);
  updateClock();
});

// Theme toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  // Check for saved theme preference or use preferred color scheme
  const savedTheme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  // Apply the saved theme
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Set the checkbox state
  const themeCheckbox = document.getElementById('theme-checkbox');
  if (themeCheckbox) {
    themeCheckbox.checked = savedTheme === 'dark';

    // Add event listener for theme changes
    themeCheckbox.addEventListener('change', function () {
      const newTheme = this.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      if (themeCheckbox) {
        themeCheckbox.checked = newTheme === 'dark';
      }
    }
  });
});