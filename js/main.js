/* ==========================================
   王仁民 · 自然健康博客 — 交互脚本
   ========================================== */

(function () {
  'use strict';

  // --- Mobile menu toggle ---
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      toggle.classList.toggle('active');
    });
    // Close menu when clicking a nav link (mobile)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('active');
      });
    });
  }

  // --- Category filter ---
  var categoryCards = document.querySelectorAll('.category-card');
  var articleCards = document.querySelectorAll('.article-card');

  if (categoryCards.length && articleCards.length) {
    // Category name mapping: category-card data-category -> article tag text
    var catMap = {
      daily:    '日常保健',
      diet:     '饮食营养',
      exercise: '运动健康',
      mind:     '心理健康',
      family:    '家庭健康',
      emergency: '急救知识'
    };

    categoryCards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        var cat = this.getAttribute('data-category');
        var label = catMap[cat] || '';

        // Highlight active category
        categoryCards.forEach(function (c) { c.style.opacity = '0.5'; });
        this.style.opacity = '1';

        // Filter articles
        var found = false;
        articleCards.forEach(function (article) {
          var tag = article.querySelector('.article-category');
          if (!tag) return;
          if (label && tag.textContent.trim() === label) {
            article.style.display = '';
            found = true;
          } else {
            article.style.display = 'none';
          }
        });

        // If nothing matched, show all and reset
        if (!found) {
          articleCards.forEach(function (a) { a.style.display = ''; });
          categoryCards.forEach(function (c) { c.style.opacity = '1'; });
        }

        // Scroll to articles
        document.getElementById('articles').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // --- Subscribe form ---
  var subscribeForms = document.querySelectorAll('form[name="subscribe"]');
  subscribeForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailInput = form.querySelector('input[name="email"]');
      if (!emailInput || !emailInput.value.trim()) return;

      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn ? btn.textContent : '';
      if (btn) { btn.textContent = '提交中...'; btn.disabled = true; }

      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value.trim() })
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) {
          window.location.href = '/thanks.html';
        } else {
          if (btn) { btn.textContent = originalText; btn.disabled = false; }
          alert(data.message || '订阅失败，请稍后再试');
        }
      })
      .catch(function () {
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
        alert('网络错误，请稍后再试');
      });
    });
  });

  // --- Smooth scroll for anchor links (polyfill for older browsers) ---
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      var target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --- Search ---
  var searchToggle = document.getElementById('searchToggle');
  var searchBar = document.getElementById('searchBar');
  var searchInput = document.getElementById('searchInput');
  var searchClose = document.getElementById('searchClose');
  var searchResults = document.getElementById('searchResults');

  // Article data for search
  var articleData = [
    {title:'洗手这件小事，你做对了吗？',excerpt:'最简单、最有效的防病方法，就长在你胳膊上。一双没洗干净的手上，能携带几十万甚至上百万个细菌。',url:'article-wash-hands.html',category:'日常保健',date:'2026-05-20'},
    {title:'脖子又酸又僵？久坐族护颈小技巧',excerpt:'低头15度颈椎负重约12公斤。颈椎的磨损不可逆，只能预防和延缓。',url:'article-neck-care.html',category:'日常保健',date:'2026-05-19'},
    {title:'你每天吃的盐，可能远超想象',excerpt:'大多数中国人日均盐摄入量在10克以上，远超5克标准。问题就出在隐形盐上。',url:'article-salt-intake.html',category:'饮食营养',date:'2026-05-18'},
    {title:'睡不着别慌，试试这些不用吃药的方法',excerpt:'越是着急我怎么还睡不着，就越是睡不着。调整生活方式，很多情况下不需要吃药。',url:'article-sleep-tips.html',category:'心理健康',date:'2026-05-17'},
    {title:'感冒高发季，预防比吃药更重要',excerpt:'真正打败病毒的是你自己的免疫系统。预防做得好，一年能省下不少吃药和跑医院的麻烦。',url:'article-cold-prevention.html',category:'日常保健',date:'2026-05-16'},
    {title:'天天刷牙还蛀牙？你可能从第一步就错了',excerpt:'牙刷只能清洁牙齿表面约60%的面积。牙缝恰恰是蛀牙和牙周病的高发区。',url:'article-oral-health.html',category:'日常保健',date:'2026-05-15'},
    {title:'喝水这件小事，你真的喝对了吗？',excerpt:'每天喝够水、喝对水，是最不费钱的养生方式。白开水是最好的选择。',url:'article-drink-water.html',category:'饮食营养',date:'2026-05-14'},
    {title:'中老年人日常保养，记住温恒度三个字',excerpt:'核心原则六个字：温和、持之以恒、有度。饮食、运动、作息、心态协调好。',url:'article-elderly-care.html',category:'家庭健康',date:'2026-05-13'},
    {title:'屏幕时代的护眼指南',excerpt:'屏幕可以换，眼睛换不了。记住20-20-20法则，每用眼20分钟，抬头看远处20秒。',url:'article-eye-care.html',category:'日常保健',date:'2026-05-12'},
    {title:'运动健身，这些注意事项比动作本身更重要',excerpt:'运动不当，效果不但打折扣，还可能伤到自己。核心原则：循序渐进、科学适度、安全第一。',url:'article-exercise-tips.html',category:'运动健康',date:'2026-05-11'},
    {title:'急性心肌梗死的胸痛识别与早期预警',excerpt:'急性心梗的预后取决于缺血总时间。胸痛六大核心特征，早期识别是降低死亡率的关键环节。',url:'article-heart-attack.html',category:'急救知识',date:'2026-05-21'}
  ];

  if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', function () {
      searchBar.classList.toggle('open');
      if (searchBar.classList.contains('open')) {
        searchInput.focus();
      } else {
        clearSearch();
      }
    });
  }
  if (searchClose) {
    searchClose.addEventListener('click', function () {
      searchBar.classList.remove('open');
      clearSearch();
    });
  }

  function clearSearch() {
    if (searchInput) searchInput.value = '';
    if (searchResults) {
      searchResults.classList.remove('open');
      searchResults.innerHTML = '';
    }
  }

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', function () {
      var query = this.value.trim().toLowerCase();
      if (!query) {
        searchResults.classList.remove('open');
        searchResults.innerHTML = '';
        return;
      }

      var matches = articleData.filter(function (a) {
        return a.title.indexOf(query) !== -1 ||
               a.excerpt.indexOf(query) !== -1 ||
               a.category.indexOf(query) !== -1;
      });

      if (matches.length === 0) {
        searchResults.classList.add('open');
        searchResults.innerHTML = '<div class="search-no-results">未找到相关文章，试试其他关键词</div>';
        return;
      }

      searchResults.classList.add('open');
      searchResults.innerHTML = matches.map(function (a) {
        return (
          '<a href="' + a.url + '" class="result-item">' +
          '<h4>' + a.title + ' <span style="font-size:.75rem;color:var(--green);font-weight:400;">' + a.category + '</span></h4>' +
          '<p>' + a.excerpt + '</p>' +
          '</a>'
        );
      }).join('');
    });

    // Close search on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchBar.classList.remove('open');
        clearSearch();
      }
    });
  }

  // --- Fade-in on scroll ---
  var observerOptions = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
  var fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.article-card, .category-card').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    fadeObserver.observe(el);
  });

  // Trigger initial visibility for elements already in view
  setTimeout(function () {
    document.querySelectorAll('.article-card, .category-card').forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }
    });
  }, 100);

  // --- Page view counter ---
  var viewCountEls = document.querySelectorAll('.view-count');
  viewCountEls.forEach(function (el) {
    var pagePath = window.location.pathname.replace(/\.html$/, '').replace(/\//g, '-') || 'home';
    var cleanPath = pagePath.replace(/^-/, '');
    var counterKey = 'wangrenmin-' + cleanPath.replace(/[^a-zA-Z0-9-]/g, '').substring(0, 40);
    fetch('https://api.counterapi.dev/v1/wangrenmin/' + encodeURIComponent(counterKey) + '/up')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        el.textContent = (data && data.count) ? data.count : 0;
      })
      .catch(function () {
        el.textContent = '';
      });
  });

  // --- Share buttons ---
  document.querySelectorAll('.share-link.wechat').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          alert('链接已复制，请粘贴到微信中分享');
        });
      } else {
        prompt('复制链接分享到微信：', url);
      }
    });
  });

  document.querySelectorAll('.share-link.weibo').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var title = encodeURIComponent(document.title);
      var url = encodeURIComponent(window.location.href);
      window.open('https://service.weibo.com/share/share.php?title=' + title + '&url=' + url, '_blank');
    });
  });

  document.querySelectorAll('.share-link.copy').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          var orig = btn.textContent;
          btn.textContent = '已复制 ✓';
          setTimeout(function () { btn.textContent = orig; }, 2000);
        });
      } else {
        prompt('复制链接：', url);
      }
    });
  });

})();
