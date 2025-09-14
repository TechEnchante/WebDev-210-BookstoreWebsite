//Storing Data with Web Storage
//Features: Subscribe alert and validation, Gallery cart with sessionStorage (Add / View / Clear / Process),
//Contact form alert with localStorage persistence of custom order info.
//View Cart modal now has its own Clear Cart and Process Order buttons and improved layout.

(function () {
  "use strict";

  function showAlert(msg) {
    window.alert(msg);
  }

  //Helpers for Web Storage
  //Cart stored in sessionStorage as JSON array of { name }
  const CART_KEY = "cartItems";

  function getCartItems() {
    try {
      const raw = sessionStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setCartItems(items) {
    sessionStorage.setItem(CART_KEY, JSON.stringify(items || []));
  }

  function clearCartItems() {
    sessionStorage.removeItem(CART_KEY);
  }

  //Small helper to safely read common form fields
  function getFieldValue(form, selectorList) {
    for (const sel of selectorList) {
      const el = form.querySelector(sel);
      if (el && typeof el.value !== "undefined") return el.value.trim();
    }
    return "";
  }

  //Subscribe alert (footer on every page)
  function wireSubscribe() {
    const subscribeForms = Array.from(
      document.querySelectorAll("footer form, .site-footer form")
    ).filter((f) => {
      const label = (f.getAttribute("aria-label") || "").toLowerCase();
      if (label.includes("subscribe")) return true;
      const btn = f.querySelector('button, [type="submit"], [role="button"]');
      return !!(btn && /subscribe/i.test(btn.textContent || btn.value || ""));
    });

    subscribeForms.forEach((form) => {
      const btn = form.querySelector(
        'button, input[type="submit"], [role="button"]'
      );
      if (!btn) return;
      btn.addEventListener("click", (e) => {
        e.preventDefault();

        //Validation: require a valid email if present
        const emailInput = form.querySelector('input[type="email"]');
        if (emailInput) {
          if (!emailInput.checkValidity()) {
            emailInput.reportValidity();
            return;
          }
          const value = emailInput.value.trim();
          const simpleEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!simpleEmail.test(value)) {
            alert("Please enter a valid email address");
            emailInput.focus();
            return;
          }
        }

        showAlert("Thank you for subscribing.");
      });
    });
  }

  //Gallery page: Add to Cart / View Cart / Clear Cart / Process Order (sessionStorage-backed)
  function wireGalleryCart() {
    const addButtons = Array.from(
      document.querySelectorAll('button, [role="button"]')
    ).filter((b) => /add to cart/i.test(b.textContent || b.value || ""));
    if (addButtons.length === 0) return; //not on gallery page

    //Helper: derive product name from button context
    function getProductNameFromButton(btn) {
      const product =
        btn.closest(".product") || btn.closest("[data-product], article");
      if (product) {
        const h4 = product.querySelector("h4, .title, .product-title");
        if (h4 && h4.textContent) return h4.textContent.trim();
      }
      return "Item";
    }

    //Modal creation for View Cart (now with footer actions)
    let modal,
      modalContent,
      modalBody,
      modalFooter,
      btnModalClear,
      btnModalProcess;
    function ensureCartModal() {
      if (modal) return;
      modal = document.createElement("div");
      modal.className = "cart-modal-backdrop";
      Object.assign(modal.style, {
        position: "fixed",
        inset: "0",
        background: "rgba(0,0,0,0.4)",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "9999",
      });

      modalContent = document.createElement("div");
      modalContent.className = "cart-modal";
      Object.assign(modalContent.style, {
        background: "var(--parchment, #fff)",
        maxWidth: "560px",
        width: "92%",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        padding: "1rem 1.25rem",
        fontFamily: "inherit",
        color: "var(--bookish-black, #131C26)",
      });

      const header = document.createElement("div");
      Object.assign(header.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: ".75rem",
      });
      const title = document.createElement("h3");
      title.textContent = "Your Cart";
      title.style.margin = "0";
      title.style.fontSize = "1.15rem";
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.textContent = "Close";
      closeBtn.className = "btn btn-secondary";
      closeBtn.style.marginLeft = "1rem";
      closeBtn.addEventListener("click", closeCartModal);
      header.appendChild(title);
      header.appendChild(closeBtn);

      modalBody = document.createElement("div");
      modalBody.className = "cart-body";
      modalBody.style.marginTop = "0.75rem";

      //Footer with inline actions
      modalFooter = document.createElement("div");
      Object.assign(modalFooter.style, {
        marginTop: "1rem",
        display: "flex",
        justifyContent: "space-between",
        gap: ".5rem",
        flexWrap: "wrap",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        paddingTop: ".85rem",
      });

      const leftGroup = document.createElement("div");
      const rightGroup = document.createElement("div");
      Object.assign(leftGroup.style, {
        display: "flex",
        gap: ".5rem",
        flexWrap: "wrap",
      });
      Object.assign(rightGroup.style, {
        display: "flex",
        gap: ".5rem",
        flexWrap: "wrap",
      });

      btnModalClear = document.createElement("button");
      btnModalClear.type = "button";
      btnModalClear.className = "btn btn-secondary";
      btnModalClear.textContent = "Clear Cart";

      btnModalProcess = document.createElement("button");
      btnModalProcess.type = "button";
      btnModalProcess.className = "btn btn-primary";
      btnModalProcess.textContent = "Process Order";

      leftGroup.appendChild(btnModalClear);
      rightGroup.appendChild(btnModalProcess);

      modalFooter.appendChild(leftGroup);
      modalFooter.appendChild(rightGroup);

      modalContent.appendChild(header);
      modalContent.appendChild(modalBody);
      modalContent.appendChild(modalFooter);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeCartModal();
      });

      //Wire modal buttons
      btnModalClear.addEventListener("click", () => {
        const items = getCartItems();
        if (items.length > 0) {
          clearCartItems();
          renderCartBody(); //live update modal
          showAlert("Cart cleared");
        } else {
          showAlert("No items to clear.");
        }
      });

      btnModalProcess.addEventListener("click", () => {
        const items = getCartItems();
        if (items.length > 0) {
          clearCartItems();
          renderCartBody(); //live update modal
          showAlert("Thank you for your order");
        } else {
          showAlert("Cart is empty.");
        }
      });
    }

    function renderCartBody() {
      const body = modalBody || document.createElement("div");
      body.innerHTML = "";
      const items = getCartItems();
      if (items.length === 0) {
        const p = document.createElement("p");
        p.textContent = "Cart is empty.";
        body.appendChild(p);
      } else {
        const counts = {};
        for (const it of items) {
          counts[it.name] = (counts[it.name] || 0) + 1;
        }
        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        const thead = document.createElement("thead");
        const trh = document.createElement("tr");
        const thItem = document.createElement("th");
        const thQty = document.createElement("th");
        thItem.textContent = "Item";
        thQty.textContent = "Qty";
        [thItem, thQty].forEach((th) => {
          th.style.textAlign = "left";
          th.style.padding = ".4rem .2rem";
          th.style.borderBottom = "1px solid rgba(0,0,0,0.06)";
        });
        trh.appendChild(thItem);
        trh.appendChild(thQty);
        thead.appendChild(trh);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        for (const [name, qty] of Object.entries(counts)) {
          const tr = document.createElement("tr");
          const tdName = document.createElement("td");
          const tdQty = document.createElement("td");
          tdName.textContent = name;
          tdQty.textContent = String(qty);
          [tdName, tdQty].forEach((td) => {
            td.style.padding = ".45rem .2rem";
            td.style.borderBottom = "1px solid rgba(0,0,0,0.04)";
          });
          tr.appendChild(tdName);
          tr.appendChild(tdQty);
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        body.appendChild(table);
      }
    }

    function openCartModal() {
      ensureCartModal();
      renderCartBody();
      modal.style.display = "flex";
    }
    function closeCartModal() {
      if (modal) modal.style.display = "none";
    }

    //Wire "Add to Cart" buttons to sessionStorage
    addButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = getProductNameFromButton(btn);
        const items = getCartItems();
        items.push({ name });
        setCartItems(items);
        showAlert("Item added to the cart");
      });
    });

    //Create a toolbar only if a control is missing. Do not duplicate existing buttons.
    function ensureCartToolbar() {
      const existingClear = document.querySelector("#clear-cart, .clear-cart");
      const existingProcess = document.querySelector(
        "#process-order, .process-order"
      );
      const existingView = document.querySelector("#view-cart, .view-cart");

      const needView = !existingView;
      const needClear = !existingClear;
      const needProcess = !existingProcess;
      if (!(needView || needClear || needProcess)) return;

      const toolbar = document.createElement("div");
      toolbar.className = "cart-toolbar";
      toolbar.style.display = "flex";
      toolbar.style.gap = "0.5rem";
      toolbar.style.margin = "1rem 0";
      toolbar.style.flexWrap = "wrap";

      if (needView) {
        const viewBtn = document.createElement("button");
        viewBtn.id = "view-cart";
        viewBtn.className = "btn btn-secondary";
        viewBtn.type = "button";
        viewBtn.textContent = "View Cart";
        toolbar.appendChild(viewBtn);
      }
      if (needClear) {
        const clearBtn = document.createElement("button");
        clearBtn.id = "clear-cart";
        clearBtn.className = "btn btn-secondary";
        clearBtn.type = "button";
        clearBtn.textContent = "Clear Cart";
        toolbar.appendChild(clearBtn);
      }
      if (needProcess) {
        const processBtn = document.createElement("button");
        processBtn.id = "process-order";
        processBtn.className = "btn btn-primary";
        processBtn.type = "button";
        processBtn.textContent = "Process Order";
        toolbar.appendChild(processBtn);
      }

      const main = document.querySelector("main") || document.body;
      const productGrid = document.querySelector(
        ".product-grid, .products, .gallery-grid"
      );
      if (main && productGrid) {
        main.insertBefore(toolbar, productGrid);
      } else if (main && main.firstElementChild) {
        main.insertBefore(toolbar, main.firstElementChild.nextSibling);
      } else {
        document.body.insertBefore(toolbar, document.body.firstChild);
      }
    }

    ensureCartToolbar();

    const viewBtn = document.querySelector("#view-cart, .view-cart");
    const clearBtn = document.querySelector("#clear-cart, .clear-cart");
    const processBtn = document.querySelector("#process-order, .process-order");

    if (viewBtn) {
      viewBtn.addEventListener("click", () => {
        openCartModal();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const items = getCartItems();
        if (items.length > 0) {
          clearCartItems();
          showAlert("Cart cleared");
        } else {
          showAlert("No items to clear.");
        }
      });
    }

    if (processBtn) {
      processBtn.addEventListener("click", () => {
        const items = getCartItems();
        if (items.length > 0) {
          clearCartItems();
          showAlert("Thank you for your order");
        } else {
          showAlert("Cart is empty.");
        }
      });
    }
  }

  //About or Contact page: show alert on form submit and save to localStorage
  function wireContactForm() {
    const selectors = [
      "form#contact-form",
      "section#contact form",
      'form[aria-label*="contact" i]',
      "main form",
    ];

    let form;
    for (const sel of selectors) {
      const candidate = document.querySelector(sel);
      if (candidate) {
        form = candidate;
        break;
      }
    }
    if (!form) return;

    const label = (form.getAttribute("aria-label") || "").toLowerCase();
    if (label.includes("subscribe")) return;

    function persistCustomOrder() {
      //Try common field names and ids
      const name = getFieldValue(form, [
        '[name="name"]',
        "#name",
        'input[name="fullname"]',
        'input[name="customer"]',
      ]);
      const email = getFieldValue(form, [
        '[name="email"]',
        "#email",
        'input[type="email"]',
      ]);
      const message = getFieldValue(form, [
        '[name="message"]',
        "#message",
        'textarea[name="message"]',
        "textarea",
      ]);
      const orderData = { name, email, message, timestamp: Date.now() };
      try {
        localStorage.setItem("customOrder", JSON.stringify(orderData));
      } catch {
        //Ignore storage failures for this exercise
      }
      return { name };
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      //Validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      //Save and personalise alert with the full name as typed
      const { name } = persistCustomOrder();
      const fullName = (name || "").trim();
      showAlert(
        fullName
          ? `Thank you for your message, ${fullName}`
          : "Thank you for your message"
      );
    });

    const submitBtn = form.querySelector(
      'button[type="submit"], input[type="submit"], button:not([type]), .btn-primary'
    );
    if (submitBtn) {
      submitBtn.addEventListener("click", (e) => {
        if (!form.contains(e.currentTarget)) return;
        e.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const { name } = persistCustomOrder();
        const fullName = (name || "").trim();
        showAlert(
          fullName
            ? `Thank you for your message, ${fullName}`
            : "Thank you for your message"
        );
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireSubscribe();
    wireGalleryCart();
    wireContactForm();
  });
})();
