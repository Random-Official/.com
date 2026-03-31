(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function getModal(id) {
    return typeof id === 'string' ? document.getElementById(id) : id;
  }

  function clearInlineStatusMessages() {
    ['loginStatus', 'registerStatus', 'postStatus', 'settingsStatus'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(function (modal) {
      modal.classList.remove('active');
    });
    document.body.classList.remove('modal-open');
    clearInlineStatusMessages();
  }

  function openModalSafe(id) {
    var modal = getModal(id);
    if (!modal) return false;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    return true;
  }

  function closeModalSafe(id) {
    var modal = getModal(id);
    if (!modal) return false;
    modal.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.classList.remove('modal-open');
    }
    clearInlineStatusMessages();
    return true;
  }

  function closeOpenMenusAndDropdowns(exceptTarget) {
    document.querySelectorAll('.post-menu.active').forEach(function (menu) {
      if (!exceptTarget || !menu.contains(exceptTarget)) {
        menu.classList.remove('active');
      }
    });

    document.querySelectorAll('.notifications-dropdown.active').forEach(function (dropdown) {
      var bell = document.getElementById('notificationsBellBtn');
      var keepOpen = exceptTarget && (dropdown.contains(exceptTarget) || (bell && bell.contains(exceptTarget)));
      if (!keepOpen) dropdown.classList.remove('active');
    });

    document.querySelectorAll('.search-dropdown.active').forEach(function (dropdown) {
      var searchBox = document.querySelector('.search-box');
      var keepSearch = exceptTarget && searchBox && searchBox.contains(exceptTarget);
      if (!keepSearch) dropdown.classList.remove('active');
    });
  }

  window.openModal = openModalSafe;
  window.closeModal = closeModalSafe;
  window.switchModal = function (closeId, openId) {
    closeModalSafe(closeId);
    openModalSafe(openId);
  };
  window.closeAllModals = closeAllModals;

  onReady(function () {
    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
          closeModalSafe(overlay);
        }
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeAllModals();
        closeOpenMenusAndDropdowns();
      }
    });

    document.addEventListener('click', function (event) {
      closeOpenMenusAndDropdowns(event.target);
    });

    document.querySelectorAll('[data-open-modal]').forEach(function (button) {
      button.addEventListener('click', function () {
        openModalSafe(button.getAttribute('data-open-modal'));
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach(function (button) {
      button.addEventListener('click', function () {
        closeModalSafe(button.getAttribute('data-close-modal'));
      });
    });
  });
})();
